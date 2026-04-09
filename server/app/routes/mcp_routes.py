import logging

from fastapi import APIRouter, HTTPException

from app.models.mcp_schemas import MCPServersListResponse, MCPToolCall, MCPToolResult, MCPToolsListResponse
from app.services.mcp_client_manager import mcp_manager

router = APIRouter(prefix="/mcp", tags=["mcp"])
logger = logging.getLogger(__name__)


@router.get("/servers", response_model=MCPServersListResponse)
async def list_servers():
    """List all configured MCP servers and their status"""
    statuses = await mcp_manager.get_server_status()
    total_tools = sum(s.tools_count for s in statuses)
    return MCPServersListResponse(servers=statuses, total_tools=total_tools)


@router.get("/tools", response_model=MCPToolsListResponse)
async def list_tools():
    """List all available tools from connected servers"""
    tools = await mcp_manager.list_all_tools()
    servers = list(set(t.server for t in tools))
    return MCPToolsListResponse(tools=tools, servers=servers, total_count=len(tools))


@router.post("/execute", response_model=MCPToolResult)
async def execute_tool(call: MCPToolCall):
    """Execute a specific MCP tool"""
    result = await mcp_manager.execute_tool(server_name=call.server, tool_name=call.tool, arguments=call.arguments)

    if not result.success:
        raise HTTPException(status_code=500, detail=result.error)

    return result


@router.post("/connect/{server_name}")
async def connect_server(server_name: str):
    """Manually connect to a specific server"""
    success = await mcp_manager.connect_server(server_name)
    if not success:
        raise HTTPException(status_code=400, detail=f"Failed to connect to {server_name}")
    return {"status": "connected", "server": server_name}


@router.post("/refresh/{server_name}")
async def refresh_tools(server_name: str):
    """Refresh tools for a specific server"""
    await mcp_manager.refresh_tools(server_name)
    return {"status": "refreshed", "server": server_name}
