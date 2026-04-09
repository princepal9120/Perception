"""
Deep Research Chains for iterative research with RAG.
Implements extraction, verification, gap analysis, and synthesis chains.
"""

import json
import logging
from typing import Any

from langchain_core.output_parsers import JsonOutputParser, StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field

from app.services.provider_factory import create_chat_model

logger = logging.getLogger(__name__)


# ============================================
# Pydantic Models for Structured Output
# ============================================


class Claim(BaseModel):
    """A factual claim extracted from documents."""

    claim: str = Field(description="The factual claim")
    source: str = Field(description="Source document name")
    confidence: str = Field(description="high, medium, or low")


class ClaimVerification(BaseModel):
    """Verification result for a claim."""

    claim: str = Field(description="The original claim")
    verified: bool = Field(description="Whether the claim is verified")
    confidence: str = Field(description="Confidence level: high, medium, low")
    supporting_sources: list[str] = Field(description="List of supporting source names")
    notes: str = Field(description="Additional notes about verification")


class ResearchGap(BaseModel):
    """A gap identified in the research."""

    gap_description: str = Field(description="Description of the knowledge gap")
    suggested_query: str = Field(description="Suggested search query to fill this gap")
    priority: str = Field(description="high, medium, or low")


class ResearchReport(BaseModel):
    """Final structured research report."""

    topic: str
    depth: int
    iterations: int
    report: dict[str, Any] = Field(description="The complete research report structure")


# ============================================
# Chain Definitions
# ============================================


class DeepResearchChains:
    """Collection of chains for deep research mode."""

    def __init__(self, llm: Any | None = None):
        """
        Initialize research chains.

        Args:
            llm: Optional chat model instance. If not provided, creates default.
        """
        self.llm = llm or create_chat_model(temperature=0.3)

        # Initialize chains
        self._init_extraction_chain()
        self._init_verification_chain()
        self._init_gap_chain()
        self._init_synthesis_chain()

    def _init_extraction_chain(self):
        """Initialize claim extraction chain."""
        extraction_prompt = ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    """You are a research analyst extracting factual claims from documents.
Extract 3-5 key factual claims from the provided documents.
Each claim should be:
- Specific and verifiable
- Backed by the document content
- Relevant to the research topic

Return a JSON array of claims with this structure:
[
  {{"claim": "...", "source": "document_name", "confidence": "high|medium|low"}}
]""",
                ),
                (
                    "human",
                    """Topic: {topic}

Documents:
{documents}

Extract key factual claims as JSON array:""",
                ),
            ]
        )

        self.extraction_chain = extraction_prompt | self.llm | JsonOutputParser()

    def _init_verification_chain(self):
        """Initialize claim verification chain."""
        verification_prompt = ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    """You are a fact-checker verifying research claims against source documents.
For each claim, determine:
- Is it supported by the documents?
- What is the confidence level?
- Which sources support it?

Return a JSON array of verification results:
[
  {{
    "claim": "...",
    "verified": true|false,
    "confidence": "high|medium|low",
    "supporting_sources": ["source1", "source2"],
    "notes": "explanation"
  }}
]""",
                ),
                (
                    "human",
                    """Claims to verify:
{claims}

Available documents:
{documents}

Verify each claim and return JSON array:""",
                ),
            ]
        )

        self.verification_chain = verification_prompt | self.llm | JsonOutputParser()

    def _init_gap_chain(self):
        """Initialize gap analysis chain."""
        gap_prompt = ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    """You are a research strategist identifying knowledge gaps.
Based on verified claims and the research topic, identify 2-4 gaps that need more investigation.
Each gap should suggest a specific search query to fill it.

Return a JSON array:
[
  {{
    "gap_description": "...",
    "suggested_query": "...",
    "priority": "high|medium|low"
  }}
]""",
                ),
                (
                    "human",
                    """Topic: {topic}
Current iteration: {iteration}/{max_iterations}
Depth level: {depth}

Verified claims so far:
{verified_claims}

Identify knowledge gaps and suggest queries as JSON array:""",
                ),
            ]
        )

        self.gap_chain = gap_prompt | self.llm | JsonOutputParser()

    def _init_synthesis_chain(self):
        """Initialize final synthesis chain."""
        synthesis_prompt = ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    """You are Perception Deep Research Engine.
You generate high-quality evidence-backed research reports using iterative deepening.

You must produce a structured JSON report containing:

{{
  "topic": "<topic>",
  "depth": <1-5>,
  "iterations": <1-10>,
  "report": {{
    "executive_summary": "2-3 paragraph high-level overview",
    "background": "Context and foundational information",
    "key_findings": ["finding 1", "finding 2", "finding 3", ...],
    "technical_details": "In-depth technical analysis",
    "opportunities_risks": "Opportunities and risks identified",
    "applications": "Practical applications and use cases",
    "references": ["source1", "source2", ...],
    "research_log": [
      {{
        "iteration": 1,
        "focus": "...",
        "findings": "...",
        "gaps_identified": "..."
      }},
      ...
    ]
  }}
}}

Rules:
- Use evidence-backed reasoning
- Be technical and precise
- No fluff or filler content
- Cite sources in references
- Always return valid JSON
- Depth level {depth} means: 1=basic, 2=intermediate, 3=advanced, 4=expert, 5=research-grade""",
                ),
                (
                    "human",
                    """Topic: {topic}
Depth: {depth}
Iterations completed: {iterations}

All verified claims:
{all_verified_claims}

Research log from iterations:
{research_log}

Generate the final structured JSON research report:""",
                ),
            ]
        )

        self.synthesis_chain = synthesis_prompt | self.llm | StrOutputParser()

    # ============================================
    # Chain Execution Methods
    # ============================================

    async def extract_claims(self, topic: str, documents: str) -> list[dict[str, Any]]:
        """
        Extract factual claims from documents.

        Args:
            topic: Research topic
            documents: Retrieved document content

        Returns:
            List of extracted claims
        """
        try:
            result = await self.extraction_chain.ainvoke({"topic": topic, "documents": documents})

            # Ensure result is a list
            if isinstance(result, list):
                return result
            return []

        except Exception as e:
            logger.error(f"Claim extraction failed: {e}")
            return []

    async def verify_claims(self, claims: list[dict[str, Any]], documents: str) -> list[dict[str, Any]]:
        """
        Verify claims against documents.

        Args:
            claims: List of claims to verify
            documents: Source documents

        Returns:
            List of verification results
        """
        try:
            claims_str = json.dumps(claims, indent=2)
            result = await self.verification_chain.ainvoke({"claims": claims_str, "documents": documents})

            if isinstance(result, list):
                return result
            return []

        except Exception as e:
            logger.error(f"Claim verification failed: {e}")
            return []

    async def identify_gaps(
        self, topic: str, verified_claims: list[dict[str, Any]], iteration: int, max_iterations: int, depth: int
    ) -> list[dict[str, Any]]:
        """
        Identify research gaps and suggest queries.

        Args:
            topic: Research topic
            verified_claims: Claims verified so far
            iteration: Current iteration number
            max_iterations: Total iterations
            depth: Research depth level

        Returns:
            List of identified gaps with suggested queries
        """
        try:
            claims_str = json.dumps(verified_claims, indent=2)
            result = await self.gap_chain.ainvoke(
                {
                    "topic": topic,
                    "verified_claims": claims_str,
                    "iteration": iteration,
                    "max_iterations": max_iterations,
                    "depth": depth,
                }
            )

            if isinstance(result, list):
                return result
            return []

        except Exception as e:
            logger.error(f"Gap analysis failed: {e}")
            return []

    async def synthesize_report(
        self,
        topic: str,
        depth: int,
        iterations: int,
        all_verified_claims: list[dict[str, Any]],
        research_log: list[dict[str, Any]],
    ) -> dict[str, Any]:
        """
        Synthesize final research report.

        Args:
            topic: Research topic
            depth: Research depth level
            iterations: Number of iterations completed
            all_verified_claims: All verified claims
            research_log: Log of all iterations

        Returns:
            Structured research report
        """
        try:
            claims_str = json.dumps(all_verified_claims, indent=2)
            log_str = json.dumps(research_log, indent=2)

            result = await self.synthesis_chain.ainvoke(
                {
                    "topic": topic,
                    "depth": depth,
                    "iterations": iterations,
                    "all_verified_claims": claims_str,
                    "research_log": log_str,
                }
            )

            # Parse JSON response
            try:
                report = json.loads(result)
                return report
            except json.JSONDecodeError:
                # If LLM didn't return valid JSON, wrap the response
                logger.warning("Synthesis didn't return valid JSON, wrapping response")
                return {
                    "topic": topic,
                    "depth": depth,
                    "iterations": iterations,
                    "report": {
                        "executive_summary": result[:500],
                        "background": "Error parsing full report",
                        "key_findings": [],
                        "technical_details": result,
                        "opportunities_risks": "",
                        "applications": "",
                        "references": [],
                        "research_log": research_log,
                    },
                }

        except Exception as e:
            logger.error(f"Report synthesis failed: {e}")
            return {
                "topic": topic,
                "depth": depth,
                "iterations": iterations,
                "report": {
                    "executive_summary": f"Error generating report: {str(e)}",
                    "background": "",
                    "key_findings": [],
                    "technical_details": "",
                    "opportunities_risks": "",
                    "applications": "",
                    "references": [],
                    "research_log": research_log,
                },
            }
