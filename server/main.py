# app.py
from typing import TypedDict, Annotated, Optional
from fastapi import FastAPI, Query
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from uuid import uuid4
import json
import os
from contextlib import asynccontextmanager

# LangGraph / LangChain
from langgraph.graph import StateGraph, END, add_messages
from langgraph.checkpoint.postgres import PostgresSaver
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
# 3. PostgreSQL Connection and Checkpointer (MOVED UP)
# -------------------
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://neondb_owner:npg_E6bDXzO7MKqu@ep-young-art-ads98otc-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require")

# We'll initialize the saver in the lifespan function
saver = None

# -------------------
# 4. Nodes
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
# 5. Graph (MOVED AFTER SAVER DEFINITION)
# -------------------
# We'll compile the graph in the lifespan function after saver is initialized
graph_builder = StateGraph(ChatState)
graph_builder.add_node("chat_node", chat_node)
graph_builder.add_node("tool_node", tool_node)
graph_builder.set_entry_point("chat_node")
graph_builder.add_conditional_edges("chat_node", tools_router)
graph_builder.add_edge("tool_node", "chat_node")

# Graph will be compiled in lifespan
graph = None

# -------------------
# 6. Lifespan Context Manager
# -------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    global saver, graph
    # --- Startup logic ---
    print("🔄 Connecting to Neon PostgreSQL…")
    try:
        # Initialize PostgresSaver with context manager
        async with PostgresSaver.from_conn_string(DATABASE_URL) as postgres_saver:
            await postgres_saver.setup()
            saver = postgres_saver
            print("✅ PostgreSQL tables set up successfully")
            
            # Compile graph with the initialized saver
            graph = graph_builder.compile(checkpointer=saver)
            print("✅ Graph compiled with PostgreSQL checkpointer")
            
            yield
            
    except Exception as e:
        print(f"❌ Failed to setup PostgreSQL: {e}")
        print("⚠️  Using in-memory checkpointer as fallback")
        # Fallback to in-memory checkpointer
        from langgraph.checkpoint.memory import MemorySaver
        saver = MemorySaver()
        graph = graph_builder.compile(checkpointer=saver)
        print("✅ Graph compiled with in-memory checkpointer")
        yield
    finally:
        # --- Shutdown logic ---
        print("👋 Application shutting down")

# -------------------
# 7. FastAPI App
# -------------------
app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# REMOVED: Duplicate startup event handler (already handled by lifespan)

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

# REMOVED: Duplicate shutdown event handler (already handled by lifespan)

if __name__ == "__main__":
    print("Application started with Neon PostgreSQL backend")