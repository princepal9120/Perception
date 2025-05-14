from typing import TypedDict, Optional, Annotated
from langchain_core.messages import HumanMessage, AIMessage, AIMessageChunk, ToolMessage
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain_groq import ChatGroq
from langgraph.graph import add_messages, StateGraph, END
from fastapi import FastAPI, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
import json
from pydantic import BaseModel
from uuid import uuid4
from dotenv import load_dotenv
from langgraph.checkpoint.memory import MemorySaver


load_dotenv()
app = FastAPI()
# intialize memory saver for checkpointing
memory = MemorySaver()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class State(TypedDict):
    messages: Annotated[list, add_messages]


search_tools = TavilySearchResults(
    max_results=4,
)
tools = [search_tools]

llm = ChatGroq(model="meta-llama/llama-4-scout-17b-16e-instruct")
llm_with_tools = llm.bind_tools(tools=tools)


async def model(state: State):
    result = await llm_with_tools.ainvoke(state["messages"])
    return {
        "messages": [result],
    }


async def tools_router(state: State):
    last_message = state["messages"][-1]

    if hasattr(last_message, "tool_calls") and len(last_message.tool_calls) > 0:
        return "tool_node"
    else:
        return END


async def tool_node(state):
    """Custome tool node that handles tools calls fromthe LLM."""
    tool_calls = state["messages"][-1].tool_calls

    # intialize list to store tool messages
    tool_messages = []

    # process each tool call
    for tool_call in tool_calls:
        tool_name = tool_call["name"]
        tool_args = tool_call["args"]
        tool_id = tool_call["id"]

        # handle the search tool
        if tool_name == "tavily_search_results_json":
            # execute the search toolwith the provided arguments
            search_results = await search_tools.ainvoke(tool_args)

            # create a ToolMessage for this result
            tool_message = ToolMessage(
                content=str(search_results),
                tool_call_id=tool_id,
                name=tool_name,
            )

            # append the tool message to the list
            tool_messages.append(tool_message)

    # add the tool messages to the state
    return {"messages": tool_messages}

graph_builder=StateGraph(State)

graph_builder.add_node("model", model)
graph_builder.add_node("tool_node", tool_node)  
graph_builder.set_entry_point("model")

graph_builder.add_conditional_edges("model", tools_router)
graph_builder.add_edge( "tool_node","model")

#we provide the memory saver as a checkpoint

graph=graph_builder.compile(checkpointer=memory)

config={
    "configurable": {
        "thread_id": 2
    }
}

response =  graph.ainvoke({
    "messages": [HumanMessage(content="Hello")],
}, config=config)

print(response)