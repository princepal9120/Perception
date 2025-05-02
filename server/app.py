

from typing import TypedDict ,Optional ,Annotated
from langchain_core.messages import HumanMessage, AIMessage, AIMessageChunk ,ToolMessage
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain_groq import ChatGroq
from langgraph.graph import add_messages, StateGraph, END
from fastapi import FastAPI, HTTPException, status ,Query
from fastapi.middleware.cors import CORSMiddleware
import json
from pydantic import BaseModel
from uuid import uuid4
from dotenv import load_dotenv
from langgraph.checkpoint.memory import MemorySaver


load_dotenv()
app = FastAPI()
#intialize memory saver for checkpointing
memory =MemorySaver()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class State(TypedDict):
    messages: Annotated[list,add_messages]


search_tools=TavilySearchResults(
    max_results=4,
)
tools=[search_tools]

llm =ChatGroq(model='meta-llama/llama-4-scout-17b-16e-instruct')    
llm_with_tools=llm.bind_tools(tools=tools)

async def model(state:State):
    result= await llm_with_tools.ainvoke(state['messages'])
    return {
        "messages": [result],
    }


async def tools_router(state:State):
    last_message= state["messages"][-1]

    if(hasattr(last_message,'tool_calls') and len(last_message.tool_calls)>0):
        return "tool_node"
    else:
        return END
    
async def tool_node(state):
    """Custome tool node that handles tools calls fromthe LLM."""    