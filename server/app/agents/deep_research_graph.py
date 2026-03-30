"""
Deep Research LangGraph Agent.
Implements iterative research with RAG, claim extraction, verification, and synthesis.
"""
import logging
from typing import TypedDict, Annotated, List, Dict, Any, Optional
from langgraph.graph import StateGraph, END
from langchain_core.messages import HumanMessage, AIMessage
from langchain_groq import ChatGroq
from app.chains.deep_research_chains import DeepResearchChains
from app.services.ingestion_service import ChatIngestor
from app.utils.model_loader import ModelLoader
import json

logger = logging.getLogger(__name__)


# ============================================
# State Definition
# ============================================

class DeepResearchState(TypedDict):
    """State for deep research graph."""
    # Input parameters
    topic: str
    depth: int  # 1-5
    iterations: int  # 1-10
    
    # Iteration tracking
    current_iteration: int
    
    # Research data
    all_verified_claims: List[Dict[str, Any]]
    research_log: List[Dict[str, Any]]
    current_documents: str
    current_queries: List[str]
    
    # Output
    final_report: Optional[Dict[str, Any]]
    
    # Streaming updates
    iteration_updates: List[Dict[str, Any]]


# ============================================
# Deep Research Graph
# ============================================

class DeepResearchGraph:
    """LangGraph-based deep research agent."""
    
    def __init__(self, llm: Optional[ChatGroq] = None):
        """
        Initialize deep research graph.
        
        Args:
            llm: Optional ChatGroq instance
        """
        self.llm = llm or ChatGroq(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            temperature=0.3
        )
        
        # Initialize chains
        self.chains = DeepResearchChains(self.llm)
        
        # Build graph
        self.graph = self._build_graph()
    
    def _build_graph(self) -> StateGraph:
        """Build the research graph."""
        # Create graph
        graph_builder = StateGraph(DeepResearchState)
        
        # Add nodes
        graph_builder.add_node("input_node", self.input_node)
        graph_builder.add_node("retriever_node", self.retriever_node)
        graph_builder.add_node("extract_claims_node", self.extract_claims_node)
        graph_builder.add_node("verify_claims_node", self.verify_claims_node)
        graph_builder.add_node("gap_analysis_node", self.gap_analysis_node)
        graph_builder.add_node("iteration_controller_node", self.iteration_controller_node)
        graph_builder.add_node("final_synthesis_node", self.final_synthesis_node)
        graph_builder.add_node("output_node", self.output_node)
        
        # Define edges
        graph_builder.set_entry_point("input_node")
        graph_builder.add_edge("input_node", "retriever_node")
        graph_builder.add_edge("retriever_node", "extract_claims_node")
        graph_builder.add_edge("extract_claims_node", "verify_claims_node")
        graph_builder.add_edge("verify_claims_node", "gap_analysis_node")
        graph_builder.add_edge("gap_analysis_node", "iteration_controller_node")
        
        # Conditional edge from iteration controller
        graph_builder.add_conditional_edges(
            "iteration_controller_node",
            self.should_continue_research,
            {
                "continue": "retriever_node",
                "finish": "final_synthesis_node"
            }
        )
        
        graph_builder.add_edge("final_synthesis_node", "output_node")
        graph_builder.add_edge("output_node", END)
        
        return graph_builder.compile()
    
    # ============================================
    # Node Implementations
    # ============================================
    
    async def input_node(self, state: DeepResearchState) -> DeepResearchState:
        """Initialize research state."""
        logger.info(f"Starting deep research: {state['topic']}")
        
        # Initialize iteration tracking
        state["current_iteration"] = 0
        state["all_verified_claims"] = []
        state["research_log"] = []
        state["iteration_updates"] = []
        
        # Generate initial queries based on topic and depth
        initial_queries = self._generate_initial_queries(state["topic"], state["depth"])
        state["current_queries"] = initial_queries
        
        return state
    
    async def retriever_node(self, state: DeepResearchState) -> DeepResearchState:
        """Retrieve documents using RAG."""
        iteration_num = state['current_iteration'] + 1
        logger.info(f"Retrieving documents (iteration {iteration_num})")
        
        # Add progress update: Starting search
        state["iteration_updates"].append({
            "type": "progress",
            "step": "searching",
            "iteration": iteration_num,
            "message": f"Searching the web for relevant information...",
            "status": "in_progress"
        })
        
        try:
            # Use existing retriever infrastructure
            # For deep research, we'll use web search tools
            from tools import tavily_tool
            
            # Retrieve for each query
            all_docs = []
            sources = []
            for idx, query in enumerate(state["current_queries"][:3], 1):  # Limit to 3 queries per iteration
                logger.info(f"  Searching: {query}")
                
                # Update progress for each query
                state["iteration_updates"].append({
                    "type": "progress",
                    "step": "searching",
                    "iteration": iteration_num,
                    "message": f"Query {idx}/3: {query[:60]}...",
                    "status": "in_progress"
                })
                
                try:
                    results = await tavily_tool.ainvoke({"query": query})
                    
                    # Format results as documents
                    if isinstance(results, list):
                        for result in results[:5]:  # Top 5 per query
                            if isinstance(result, dict):
                                content = result.get("content", "")
                                url = result.get("url", "unknown")
                                all_docs.append(f"Source: {url}\n{content}\n")
                                if url not in sources:
                                    sources.append(url)
                    
                except Exception as e:
                    logger.error(f"Search failed for query '{query}': {e}")
            
            # Combine documents
            state["current_documents"] = "\n\n---\n\n".join(all_docs) if all_docs else "No documents retrieved"
            
            # Add completion update
            state["iteration_updates"].append({
                "type": "progress",
                "step": "searching",
                "iteration": iteration_num,
                "message": f"Found {len(all_docs)} sources across {len(sources)} websites",
                "status": "completed",
                "data": {"source_count": len(all_docs), "website_count": len(sources)}
            })
            
            logger.info(f"✅ Retrieved {len(all_docs)} document chunks")
            
        except Exception as e:
            logger.error(f"Retrieval failed: {e}")
            state["current_documents"] = f"Retrieval error: {str(e)}"
            state["iteration_updates"].append({
                "type": "progress",
                "step": "searching",
                "iteration": iteration_num,
                "message": f"Search failed: {str(e)}",
                "status": "error"
            })
        
        return state
    
    async def extract_claims_node(self, state: DeepResearchState) -> DeepResearchState:
        """Extract factual claims from documents."""
        iteration_num = state['current_iteration'] + 1
        logger.info("Extracting claims from documents")
        
        # Add progress update: Starting extraction
        state["iteration_updates"].append({
            "type": "progress",
            "step": "extracting",
            "iteration": iteration_num,
            "message": "Extracting key claims and facts from sources...",
            "status": "in_progress"
        })
        
        claims = await self.chains.extract_claims(
            topic=state["topic"],
            documents=state["current_documents"]
        )
        
        # Store claims in state for verification
        state["current_claims"] = claims
        
        # Add completion update
        state["iteration_updates"].append({
            "type": "progress",
            "step": "extracting",
            "iteration": iteration_num,
            "message": f"Extracted {len(claims)} factual claims",
            "status": "completed",
            "data": {"claim_count": len(claims)}
        })
        
        logger.info(f"✅ Extracted {len(claims)} claims")
        return state
    
    async def verify_claims_node(self, state: DeepResearchState) -> DeepResearchState:
        """Verify extracted claims."""
        iteration_num = state['current_iteration'] + 1
        logger.info("Verifying claims")
        
        # Add progress update: Starting verification
        state["iteration_updates"].append({
            "type": "progress",
            "step": "verifying",
            "iteration": iteration_num,
            "message": "Verifying claims against sources...",
            "status": "in_progress"
        })
        
        verified = await self.chains.verify_claims(
            claims=state.get("current_claims", []),
            documents=state["current_documents"]
        )
        
        # Add to all verified claims
        state["all_verified_claims"].extend(verified)
        
        # Add completion update
        state["iteration_updates"].append({
            "type": "progress",
            "step": "verifying",
            "iteration": iteration_num,
            "message": f"Verified {len(verified)} claims with evidence",
            "status": "completed",
            "data": {"verified_count": len(verified)}
        })
        
        logger.info(f"✅ Verified {len(verified)} claims")
        return state
    
    async def gap_analysis_node(self, state: DeepResearchState) -> DeepResearchState:
        """Identify knowledge gaps and generate new queries."""
        iteration_num = state['current_iteration'] + 1
        logger.info("Analyzing knowledge gaps")
        
        # Add progress update: Starting gap analysis
        state["iteration_updates"].append({
            "type": "progress",
            "step": "analyzing",
            "iteration": iteration_num,
            "message": "Analyzing gaps in current knowledge...",
            "status": "in_progress"
        })
        
        gaps = await self.chains.identify_gaps(
            topic=state["topic"],
            verified_claims=state["all_verified_claims"],
            iteration=state["current_iteration"] + 1,
            max_iterations=state["iterations"],
            depth=state["depth"]
        )
        
        # Log this iteration
        iteration_log = {
            "iteration": state["current_iteration"] + 1,
            "focus": ", ".join(state["current_queries"][:3]),
            "findings": f"Verified {len(state.get('current_claims', []))} claims",
            "gaps_identified": ", ".join([g.get("gap_description", "") for g in gaps[:3]])
        }
        state["research_log"].append(iteration_log)
        
        # Generate new queries from gaps
        new_queries = [gap.get("suggested_query", "") for gap in gaps if gap.get("suggested_query")]
        state["current_queries"] = new_queries
        
        # Add completion update
        state["iteration_updates"].append({
            "type": "progress",
            "step": "analyzing",
            "iteration": iteration_num,
            "message": f"Identified {len(gaps)} knowledge gaps for deeper investigation",
            "status": "completed",
            "data": {"gap_count": len(gaps), "new_query_count": len(new_queries)}
        })
        
        # Create iteration update for streaming
        iteration_update = {
            "type": "iteration",
            "iteration": state["current_iteration"] + 1,
            "notes": f"Completed iteration {state['current_iteration'] + 1}. Found {len(state.get('current_claims', []))} claims. Identified {len(gaps)} gaps."
        }
        state["iteration_updates"].append(iteration_update)
        
        logger.info(f"✅ Identified {len(gaps)} knowledge gaps")
        return state
    
    async def iteration_controller_node(self, state: DeepResearchState) -> DeepResearchState:
        """Control iteration flow."""
        state["current_iteration"] += 1
        logger.info(f"Iteration {state['current_iteration']}/{state['iterations']} complete")
        return state
    
    def should_continue_research(self, state: DeepResearchState) -> str:
        """Decide whether to continue research or finish."""
        if state["current_iteration"] >= state["iterations"]:
            logger.info("✅ Reached max iterations, finishing research")
            return "finish"
        
        if not state["current_queries"]:
            logger.info("✅ No more queries, finishing research")
            return "finish"
        
        logger.info("Continuing to next iteration")
        return "continue"
    
    async def final_synthesis_node(self, state: DeepResearchState) -> DeepResearchState:
        """Synthesize final research report."""
        logger.info("Synthesizing final research report")
        
        # Add progress update: Starting synthesis
        state["iteration_updates"].append({
            "type": "progress",
            "step": "synthesizing",
            "iteration": state["current_iteration"],
            "message": "Synthesizing comprehensive research report...",
            "status": "in_progress"
        })
        
        report = await self.chains.synthesize_report(
            topic=state["topic"],
            depth=state["depth"],
            iterations=state["current_iteration"],
            all_verified_claims=state["all_verified_claims"],
            research_log=state["research_log"]
        )
        
        state["final_report"] = report
        
        # Add completion update
        state["iteration_updates"].append({
            "type": "progress",
            "step": "synthesizing",
            "iteration": state["current_iteration"],
            "message": "Research report complete!",
            "status": "completed"
        })
        
        logger.info("✅ Final report synthesized")
        return state
    
    async def output_node(self, state: DeepResearchState) -> DeepResearchState:
        """Prepare final output."""
        logger.info("✅ Deep research complete")
        return state
    
    # ============================================
    # Helper Methods
    # ============================================
    
    def _generate_initial_queries(self, topic: str, depth: int) -> List[str]:
        """
        Generate initial search queries based on topic and depth.
        
        Args:
            topic: Research topic
            depth: Depth level (1-5)
            
        Returns:
            List of initial queries
        """
        base_queries = [
            f"{topic} overview",
            f"{topic} latest research",
            f"{topic} technical details"
        ]
        
        if depth >= 3:
            base_queries.extend([
                f"{topic} academic papers",
                f"{topic} case studies"
            ])
        
        if depth >= 4:
            base_queries.extend([
                f"{topic} arxiv papers",
                f"{topic} research methodology"
            ])
        
        if depth == 5:
            base_queries.extend([
                f"{topic} cutting edge research",
                f"{topic} future directions"
            ])
        
        return base_queries[:5]  # Limit to 5 initial queries
    
    # ============================================
    # Main Execution Method
    # ============================================
    
    async def run_research(
        self,
        topic: str,
        depth: int = 3,
        iterations: int = 3
    ) -> Dict[str, Any]:
        """
        Run deep research.
        
        Args:
            topic: Research topic
            depth: Research depth (1-5)
            iterations: Number of iterations (1-10)
            
        Returns:
            Research report and iteration updates
        """
        # Validate inputs
        depth = max(1, min(5, depth))
        iterations = max(1, min(10, iterations))
        
        # Initialize state
        initial_state = {
            "topic": topic,
            "depth": depth,
            "iterations": iterations,
            "current_iteration": 0,
            "all_verified_claims": [],
            "research_log": [],
            "current_documents": "",
            "current_queries": [],
            "final_report": None,
            "iteration_updates": []
        }
        
        # Run graph
        final_state = await self.graph.ainvoke(initial_state)
        
        return {
            "report": final_state.get("final_report"),
            "iteration_updates": final_state.get("iteration_updates", [])
        }
