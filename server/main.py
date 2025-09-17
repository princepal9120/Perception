# app.py
from typing import TypedDict, Annotated, Optional
from fastapi import FastAPI, Query
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from uuid import uuid4
import json
import sqlite3

# LangGraph / LangChain
from langgraph.graph import StateGraph, END, add_messages
from langgraph.checkpoint.sqlite import SqliteSaver
from langchain_core.messages import HumanMessage, AIMessageChunk, ToolMessage, BaseMessage
from langchain_groq import ChatGroq

# Import tools from tools.py
from tools import tools, tavily_tool, duck_tool, calculator, get_stock_price

load_dotenv()

# -------------------
# 1. State
# -------------------
class ChatState(TypedDict):
    messages: Annotated[list[BaseMessage], add_messages]

# -------------------
# 2. LLM
# -------------------
llm = ChatGroq(model="meta-llama/llama-4-scout-17b-16e-instruct")
llm_with_tools = llm.bind_tools(tools)

# -------------------
# 3. Nodes
# -------------------
async def chat_node(state: ChatState):
    result = await llm_with_tools.ainvoke(state["messages"])
    return {"messages": [result]}

async def tools_router(state: ChatState):
    last = state["messages"][-1]
    if hasattr(last, "tool_calls") and last.tool_calls:
        return "tool_node"
    return END

async def tool_node(state: ChatState):
    tool_calls = state["messages"][-1].tool_calls
    tool_messages = []
    for call in tool_calls:
        tool_name = call["name"]
        tool_args = call["args"]
        tool_id = call["id"]

        # Use the correct tool
        if tool_name == "tavily_search_results_json":
            result = await tavily_tool.ainvoke(tool_args)
        elif tool_name == "DuckDuckGoSearchRun":
            result = await duck_tool.ainvoke(tool_args)
        elif tool_name == "calculator":
            result = calculator.invoke(tool_args)
        elif tool_name == "get_stock_price":
            result = get_stock_price.invoke(tool_args)
        else:
            result = {"error": f"Unknown tool {tool_name}"}

        tool_messages.append(
            ToolMessage(content=str(result), tool_call_id=tool_id, name=tool_name)
        )

    return {"messages": tool_messages}

# -------------------
# 4. Checkpointer
# -------------------
conn = sqlite3.connect("chatbot.db", check_same_thread=False)
checkpointer = SqliteSaver(conn=conn)

# -------------------
# 5. Graph
# -------------------
graph_builder = StateGraph(ChatState)
graph_builder.add_node("chat_node", chat_node)
graph_builder.add_node("tool_node", tool_node)
graph_builder.set_entry_point("chat_node")
graph_builder.add_conditional_edges("chat_node", tools_router)
graph_builder.add_edge("tool_node", "chat_node")

graph = graph_builder.compile(checkpointer=checkpointer)

# -------------------
# 6. FastAPI App
# -------------------
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def serialise_ai_message_chunk(chunk):
    if isinstance(chunk, AIMessageChunk):
        return chunk.content
    return str(chunk)

async def generate_chat_responses(message: str, checkpoint_id: Optional[str] = None):
    is_new = checkpoint_id is None
    if is_new:
        new_checkpoint_id = str(uuid4())
        config = {"configurable": {"thread_id": new_checkpoint_id}}
        events = graph.astream_events(
            {"messages": [HumanMessage(content=message)]}, version="v2", config=config
        )
        yield f'data: {{"type":"checkpoint","checkpoint_id":"{new_checkpoint_id}"}}\n\n'
    else:
        config = {"configurable": {"thread_id": checkpoint_id}}
        events = graph.astream_events(
            {"messages": [HumanMessage(content=message)]}, version="v2", config=config
        )

    async for event in events:
        etype = event["event"]

        if etype == "on_chat_model_stream":
            chunk = serialise_ai_message_chunk(event["data"]["chunk"])
            safe = chunk.replace("'", "\\'").replace("\n", "\\n")
            yield f'data: {{"type":"content","content":"{safe}"}}\n\n'

        elif etype == "on_tool_end":
            tool_output = event["data"]["output"]
            yield f'data: {{"type":"tool_output","output":{json.dumps(tool_output)}}}\n\n'

    yield f'data: {{"type":"end"}}\n\n'

@app.get("/chat_stream/{message}")
async def chat_stream(message: str, checkpoint_id: Optional[str] = Query(None)):
    return StreamingResponse(
        generate_chat_responses(message, checkpoint_id),
        media_type="text/event-stream"
    )


print(generate_chat_responses("Hello, today new"))
