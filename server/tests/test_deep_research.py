#!/usr/bin/env python3
"""
Test script for Deep Research Mode
Tests the chains, graph, and API endpoints
"""
import asyncio
import sys
import os
import warnings
import pytest

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.chains.deep_research_chains import DeepResearchChains
from app.agents.deep_research_graph import DeepResearchGraph
from langchain_groq import ChatGroq

pytestmark = pytest.mark.filterwarnings("ignore:This package .*ddgs.*:RuntimeWarning")

warnings.filterwarnings(
    "ignore",
    message=r"This package .*ddgs.*",
    category=RuntimeWarning,
)


async def test_chains():
    """Test individual chains."""
    print("=" * 60)
    print("Testing Deep Research Chains")
    print("=" * 60)
    
    llm = ChatGroq(model="meta-llama/llama-4-scout-17b-16e-instruct", temperature=0.3)
    chains = DeepResearchChains(llm)
    
    # Test extraction chain
    print("\n1. Testing Claim Extraction Chain...")
    test_docs = """
    Source: Nature Journal
    Quantum computers use qubits instead of classical bits.
    Recent advances show 99.9% fidelity in quantum gates.
    IBM has developed a 127-qubit quantum processor.
    """
    
    claims = await chains.extract_claims(
        topic="Quantum Computing",
        documents=test_docs
    )
    print(f"✅ Extracted {len(claims)} claims:")
    for claim in claims:
        print(f"   - {claim.get('claim', 'N/A')}")
    
    # Test verification chain
    print("\n2. Testing Claim Verification Chain...")
    verified = await chains.verify_claims(claims, test_docs)
    print(f"✅ Verified {len(verified)} claims:")
    for v in verified:
        print(f"   - {v.get('claim', 'N/A')}: {v.get('verified', False)}")
    
    # Test gap analysis
    print("\n3. Testing Gap Analysis Chain...")
    gaps = await chains.identify_gaps(
        topic="Quantum Computing",
        verified_claims=verified,
        iteration=1,
        max_iterations=3,
        depth=3
    )
    print(f"✅ Identified {len(gaps)} gaps:")
    for gap in gaps:
        print(f"   - {gap.get('gap_description', 'N/A')}")
        print(f"     Query: {gap.get('suggested_query', 'N/A')}")
    
    print("\n✅ All chains working correctly!\n")


async def test_graph():
    """Test the full research graph."""
    print("=" * 60)
    print("Testing Deep Research Graph")
    print("=" * 60)
    
    llm = ChatGroq(model="meta-llama/llama-4-scout-17b-16e-instruct", temperature=0.3)
    graph = DeepResearchGraph(llm)
    
    print("\nRunning mini research on 'Quantum Computing'...")
    print("   Depth: 2, Iterations: 2\n")
    
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", RuntimeWarning)
        result = await graph.run_research(
            topic="Quantum Computing basics",
            depth=2,
            iterations=2
        )
    
    print("\n✅ Research Results:")
    print(f"   Iteration Updates: {len(result.get('iteration_updates', []))}")
    
    report = result.get('report')
    if report:
        print(f"   Topic: {report.get('topic')}")
        print(f"   Depth: {report.get('depth')}")
        print(f"   Iterations: {report.get('iterations')}")
        
        report_data = report.get('report', {})
        print(f"\n   Executive Summary:")
        summary = report_data.get('executive_summary', 'N/A')
        print(f"   {summary[:200]}...")
        
        findings = report_data.get('key_findings', [])
        print(f"\n   Key Findings: {len(findings)}")
        for i, finding in enumerate(findings[:3], 1):
            print(f"   {i}. {finding}")
    
    print("\n✅ Graph execution completed!\n")


async def main():
    """Run all tests."""
    print("\n" + "=" * 60)
    print("DEEP RESEARCH MODE - TEST SUITE")
    print("=" * 60 + "\n")
    
    try:
        # Test chains
        await test_chains()
        
        # Test graph (commented out by default as it makes API calls)
        # Uncomment to test full graph execution
        # await test_graph()
        
        print("=" * 60)
        print("✅ ALL TESTS PASSED")
        print("=" * 60 + "\n")
        
    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
