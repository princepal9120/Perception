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
        chat_id: Optional[int] = None
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
                        "chat_id": chat_id
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
                        "chat_id": chat_id
                    }
                }
                logger.info(f"Continuing chat with checkpoint: {checkpoint_id}")
            
            # Prepare enhanced message with document context
            enhanced_content = message
            if document_context and document_context.get('has_documents'):
                doc_names = document_context.get('document_names', [])
                if doc_names:
                    doc_list = ', '.join(doc_names)
                    enhanced_content = f"{message}\n\nContext: The user has uploaded the following documents: {doc_list}. Please consider these documents in your response."
            
            # Stream events from graph
            events = self.graph.astream_events(
                {"messages": [HumanMessage(content=enhanced_content)]},
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
                    yield f'data: {{"type":"tool_output","output":{json.dumps(tool_output)}}}\n\n'
                
                # Handle tool start (for search notifications)
                elif event_type == "on_tool_start":
                    tool_name = event.get("name", "")
                    tool_input = event["data"].get("input", {})
                    
                    # Notify client about search operations
                    if "search" in tool_name.lower():
                        query = ""
                        if isinstance(tool_input, dict):
                            query = tool_input.get("query", "")
                        elif isinstance(tool_input, str):
                            query = tool_input
                        
                        if query:
                            yield f'data: {{"type":"search_start","query":"{query}"}}\n\n'
            
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
