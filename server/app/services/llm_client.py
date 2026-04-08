"""
LLM client for integrating with existing LangGraph chatbot.
Wraps the LangGraph graph and provides chat streaming functionality.
"""
import json
import logging
from typing import AsyncGenerator, Optional
from uuid import uuid4
from langchain_core.messages import HumanMessage, AIMessageChunk, ToolMessage
from fastapi import HTTPException
from app.prompts.prompt_library import get_prompt
from app.core.runtime_provider_config import RuntimeProviderConfig


logger = logging.getLogger(__name__)


class LLMClient:
    """Client for interacting with LangGraph chatbot."""
    
    def __init__(self, graph):
        """
        Initialize LLM client with LangGraph graph.
        
        Args:
            graph: Compiled LangGraph StateGraph
        """
        self.graph = graph
    
    def serialize_ai_message_chunk(self, chunk) -> str:
        """
        Serialize an AI message chunk to string.
        
        Args:
            chunk: Message chunk from LangGraph
            
        Returns:
            Serialized content string
        """
        if isinstance(chunk, AIMessageChunk):
            return chunk.content
        return str(chunk)
    
    async def stream_chat_response(
        self,
        message: str,
        checkpoint_id: Optional[str] = None,
        document_context: Optional[dict] = None,
        chat_id: Optional[int] = None,
        runtime_provider_config: Optional[RuntimeProviderConfig] = None,
    ) -> AsyncGenerator[str, None]:
        """
        Stream chat responses from LangGraph.
        
        Args:
            message: User message
            checkpoint_id: Optional checkpoint ID for continuing conversation
            document_context: Optional document context information
            chat_id: Optional chat ID for tool context
            
        Yields:
            Server-Sent Events formatted strings
        """
        if not self.graph:
            raise HTTPException(
                status_code=500,
                detail="LangGraph not initialized"
            )
        
        try:
            # Determine if new conversation or continuing
            is_new = checkpoint_id is None
            
            if is_new:
                # Generate new checkpoint ID
                new_checkpoint_id = str(uuid4())
                config = {
                    "configurable": {
                        "thread_id": new_checkpoint_id,
                        "chat_id": chat_id,
                    }
                }
                
                # Send checkpoint ID to client
                yield f'data: {{"type":"checkpoint","checkpoint_id":"{new_checkpoint_id}"}}\n\n'
                
                logger.info(f"Starting new chat with checkpoint: {new_checkpoint_id}")
            else:
                # Use existing checkpoint
                config = {
                    "configurable": {
                        "thread_id": checkpoint_id,
                        "chat_id": chat_id,
                    }
                }
                logger.info(f"Continuing chat with checkpoint: {checkpoint_id}")
            
            # Prepare enhanced message with document context
            enhanced_content = message
            retrieved_context = ""
            
            # Automatically retrieve document context if documents are available
            if document_context and document_context.get('has_documents') and chat_id:
                doc_names = document_context.get('document_names', [])
                doc_list = ', '.join(doc_names) if doc_names else 'unknown documents'
                doc_count = document_context.get('document_count', 0)
                
                logger.info(f"Chat has {doc_count} documents: {doc_list}")
                
                try:
                    from app.services.ingestion_service import ChatIngestor
                    
                    session_id = f"chat_{chat_id}"
                    logger.info(f"Attempting to retrieve context from documents for session: {session_id}")
                    
                    # Initialize ingestor with existing session
                    ingestor = ChatIngestor(
                        session_id=session_id,
                        use_session_dirs=True
                    )
                    
                    # Get retriever (passing empty list to load existing index)
                    logger.info("Building retriever...")
                    retriever = ingestor.built_retriver([])
                    logger.info("Retriever built successfully")
                    
                    # Search for relevant context
                    logger.info(f"Searching for: '{message[:100]}...'")
                    docs = await retriever.ainvoke(message)
                    logger.info(f"✅ Retrieved {len(docs)} relevant chunks from documents")
                    
                    # FALLBACK LOGIC: If no results found, try a broader query
                    if not docs or len(docs) == 0:
                        logger.warning("❌ Initial search returned 0 results. Attempting fallback with broad query...")
                        fallback_query = "summary introduction abstract main points"
                        docs = await retriever.ainvoke(fallback_query)
                        if docs:
                            logger.info(f"✅ Fallback retrieval found {len(docs)} chunks")
                    
                    # Format retrieved context
                    if docs and len(docs) > 0:
                        context_parts = []
                        for i, doc in enumerate(docs[:5], 1):  # Limit to top 5 results
                            source = doc.metadata.get("source", "unknown")
                            page = doc.metadata.get("page", "N/A")
                            content = doc.page_content[:500]  # Limit content length
                            context_parts.append(f"[Document {i} - {source}, Page {page}]:\n{content}")
                            logger.info(f"  Doc {i}: {source} (Page {page}) - {len(doc.page_content)} chars")
                        
                        retrieved_context = "\n\n".join(context_parts)
                        
                        # Use prompt from library
                        prompt_fn = get_prompt("document_context_prompt")
                        enhanced_content = prompt_fn(message, doc_count, doc_list, retrieved_context)
                        
                        logger.info(f"✅ Injected {len(retrieved_context)} characters of context into prompt")
                    else:
                        # No results found, but still inform AI about documents
                        logger.warning(f"❌ Retriever returned 0 chunks for query")
                        
                        # Use prompt from library
                        prompt_fn = get_prompt("no_results_context_prompt")
                        enhanced_content = prompt_fn(message, doc_count, doc_list)
                        
                except Exception as e:
                    logger.error(f"❌ FAILED to retrieve document context: {type(e).__name__}: {str(e)}")
                    logger.error(f"Error details:", exc_info=True)
                    
                    # ALWAYS inform AI about documents even if retrieval fails
                    # Use prompt from library
                    prompt_fn = get_prompt("retrieval_error_context_prompt")
                    enhanced_content = prompt_fn(message, doc_count, doc_list)
            
            # Stream events from graph
            graph_input = {"messages": [HumanMessage(content=enhanced_content)]}
            if runtime_provider_config is not None:
                graph_input["runtime_provider_config"] = runtime_provider_config.model_dump(mode="json")

            events = self.graph.astream_events(
                graph_input,
                version="v2",
                config=config
            )
            
            async for event in events:
                event_type = event["event"]
                
                # Handle chat model streaming
                if event_type == "on_chat_model_stream":
                    chunk = self.serialize_ai_message_chunk(event["data"]["chunk"])
                    # Escape special characters for JSON
                    safe = chunk.replace('"', '\\"').replace("\n", "\\n").replace("\r", "")
                    yield f'data: {{"type":"content","content":"{safe}"}}\n\n'
                
                # Handle tool output
                elif event_type == "on_tool_end":
                    tool_output = event["data"]["output"]
                    tool_name = event.get("name", "unknown_tool")
                    
                    # Send tool completion event
                    yield f'data: {{"type":"tool_output","output":{json.dumps(tool_output)},"tool_name":"{tool_name}"}}\n\n'
                    
                    # Extract URLs from search tool results
                    if ("search" in tool_name.lower() or "tavily" in tool_name.lower()) and tool_output:
                        urls = []
                        try:
                            # Tavily tool returns a list of dicts with 'url' keys
                            if isinstance(tool_output, list):
                                urls = [item.get("url", "") for item in tool_output if isinstance(item, dict) and "url" in item]
                            elif isinstance(tool_output, dict):
                                # Single result
                                if "url" in tool_output:
                                    urls = [tool_output["url"]]
                                # Or results array
                                elif "results" in tool_output:
                                    results = tool_output["results"]
                                    if isinstance(results, list):
                                        urls = [item.get("url", "") for item in results if isinstance(item, dict) and "url" in item]
                            
                            # Filter out empty URLs and send
                            urls = [url for url in urls if url]
                            if urls:
                                yield f'data: {{"type":"search_results","urls":{json.dumps(urls)}}}\n\n'
                        except Exception as e:
                            logger.error(f"Failed to extract URLs from tool output: {e}")
                
                # Handle tool start (for search and other tool notifications)
                elif event_type == "on_tool_start":
                    tool_name = event.get("name", "")
                    tool_input = event["data"].get("input", {})
                    
                    # Notify client about tool execution
                    if "search" in tool_name.lower() or "tavily" in tool_name.lower():
                        query = ""
                        if isinstance(tool_input, dict):
                            query = tool_input.get("query", "")
                        elif isinstance(tool_input, str):
                            query = tool_input
                        
                        if query:
                            # Escape query for JSON
                            safe_query = query.replace('"', '\\"').replace("\\n", " ")
                            yield f'data: {{"type":"search_start","query":"{safe_query}"}}\n\n'
                    else:
                        # Generic tool execution notification
                        safe_tool_name = tool_name.replace('"', '\\"')
                        yield f'data: {{"type":"tool_start","tool_name":"{safe_tool_name}"}}\n\n'
            
            # Send completion event
            yield f'data: {{"type":"end"}}\n\n'
            
        except Exception as e:
            logger.error(f"Error in stream_chat_response: {e}")
            error_msg = str(e).replace('"', '\\"')
            yield f'data: {{"type":"error","message":"{error_msg}"}}\n\n'
    
    async def get_chat_history(self, checkpoint_id: str) -> list:
        """
        Get chat history for a checkpoint.
        
        Args:
            checkpoint_id: Checkpoint ID
            
        Returns:
            List of serialized messages
        """
        if not self.graph or not hasattr(self.graph, 'checkpointer'):
            return []
        
        try:
            # Get state from checkpointer
            from langgraph.checkpoint.base import CheckpointTuple
            
            config = {"configurable": {"thread_id": checkpoint_id}}
            
            # Try to get the checkpoint
            state = await self.graph.checkpointer.aget(config)
            
            if not state or not state.values:
                return []
            
            messages = state.values.get("messages", [])
            
            # Serialize messages
            serializable_messages = []
            for msg in messages:
                if isinstance(msg, HumanMessage):
                    serializable_messages.append({
                        "type": "human",
                        "content": msg.content
                    })
                elif isinstance(msg, AIMessageChunk):
                    serializable_messages.append({
                        "type": "ai",
                        "content": msg.content
                    })
                elif isinstance(msg, ToolMessage):
                    serializable_messages.append({
                        "type": "tool",
                        "content": msg.content,
                        "tool_name": msg.name
                    })
                else:
                    serializable_messages.append({
                        "type": "unknown",
                        "content": str(msg)
                    })
            
            return serializable_messages
            
        except Exception as e:
            logger.error(f"Error getting chat history for {checkpoint_id}: {e}")
            return []
