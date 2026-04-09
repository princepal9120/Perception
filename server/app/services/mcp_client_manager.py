import logging
import os
from contextlib import AsyncExitStack
from typing import Any

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

from app.models.mcp_schemas import MCPServerConfig, MCPServerStatus, MCPServerType, MCPToolResult, MCPToolSchema

logger = logging.getLogger(__name__)


class MCPClientManager:
    """
    Manages connections to multiple MCP servers and handles tool execution.
    """

    def __init__(self):
        self.servers: dict[str, MCPServerConfig] = {}
        self.sessions: dict[str, ClientSession] = {}
        self.exit_stack = AsyncExitStack()
        self.tools_cache: dict[str, list[MCPToolSchema]] = {}

    async def load_config(self, configs: list[MCPServerConfig]):
        """Load server configurations"""
        for config in configs:
            self.servers[config.name] = config

    async def connect_server(self, server_name: str) -> bool:
        """Connect to a specific MCP server"""
        if server_name not in self.servers:
            logger.error(f"Server {server_name} not found in config")
            return False

        config = self.servers[server_name]

        try:
            if config.type == MCPServerType.STDIO:
                server_params = StdioServerParameters(
                    command=config.command[0], args=config.command[1:] + config.args, env={**os.environ, **config.env}
                )

                # Create connection context
                stdio_transport = await self.exit_stack.enter_async_context(stdio_client(server_params))
                stdio, write = stdio_transport

                # Create session
                session = await self.exit_stack.enter_async_context(ClientSession(stdio, write))
                await session.initialize()

                self.sessions[server_name] = session
                logger.info(f"Connected to MCP server: {server_name}")

                # Cache tools immediately
                await self.refresh_tools(server_name)
                return True

            elif config.type == MCPServerType.SSE:
                # TODO: Implement SSE client
                logger.warning(f"SSE transport not yet implemented for {server_name}")
                return False

        except Exception as e:
            logger.error(f"Failed to connect to MCP server {server_name}: {str(e)}")
            return False

    async def connect_all(self):
        """Connect to all enabled servers"""
        for name, _config in self.servers.items():
            if config.enabled and name not in self.sessions:
                await self.connect_server(name)

    async def refresh_tools(self, server_name: str):
        """Fetch and cache tools for a server"""
        if server_name not in self.sessions:
            return

        try:
            session = self.sessions[server_name]
            result = await session.list_tools()

            tools = []
            for tool in result.tools:
                tools.append(
                    MCPToolSchema(
                        name=tool.name,
                        description=tool.description or "",
                        input_schema=tool.inputSchema,
                        server=server_name,
                    )
                )

            self.tools_cache[server_name] = tools
            logger.info(f"Loaded {len(tools)} tools from {server_name}")

        except Exception as e:
            logger.error(f"Failed to list tools for {server_name}: {str(e)}")

    async def list_all_tools(self) -> list[MCPToolSchema]:
        """List all available tools from all connected servers"""
        all_tools = []
        for server_tools in self.tools_cache.values():
            all_tools.extend(server_tools)
        return all_tools

    async def get_server_status(self) -> list[MCPServerStatus]:
        """Get status of all servers"""
        statuses = []
        for name, config in self.servers.items():
            connected = name in self.sessions
            tools_count = len(self.tools_cache.get(name, []))
            statuses.append(MCPServerStatus(name=name, connected=connected, tools_count=tools_count))
        return statuses

    async def get_langchain_tools(self):
        """Convert all MCP tools to LangChain compatible tools"""
        from langchain_core.tools import StructuredTool

        lc_tools = []
        all_tools = await self.list_all_tools()

        for tool in all_tools:

            async def _create_tool_func(tool_name=tool.name, server_name=tool.server, **kwargs):
                result = await self.execute_tool(server_name, tool_name, kwargs)
                if result.success:
                    return result.result
                else:
                    return f"Error: {result.error}"

            # Create a closure for the tool execution
            # We need to capture tool_name and server_name
            def make_func(t_name, s_name):
                async def func(**kwargs):
                    return await self.execute_tool(s_name, t_name, kwargs)

                return func

            lc_tool = StructuredTool.from_function(
                func=None,
                coroutine=make_func(tool.name, tool.server),
                name=tool.name,
                description=tool.description,
                # TODO: Convert JSON schema to Pydantic model or args_schema
                # For now, we rely on the LLM to infer args from description/name if schema conversion is hard
                # Or we can pass the raw schema if the LLM supports it
            )
            lc_tools.append(lc_tool)

        return lc_tools

    async def execute_tool(self, server_name: str, tool_name: str, arguments: dict[str, Any]) -> MCPToolResult:
        """Execute a tool on a specific server"""
        if server_name not in self.sessions:
            return MCPToolResult(
                success=False, server=server_name, tool=tool_name, error=f"Server {server_name} not connected"
            )

        try:
            session = self.sessions[server_name]
            result = await session.call_tool(tool_name, arguments)

            # Process result
            # MCP returns a list of content items (text, image, etc.)
            # For now, we'll just concatenate text content
            output = ""
            for content in result.content:
                if content.type == "text":
                    output += content.text
                elif content.type == "image":
                    output += "[Image content]"
                elif content.type == "resource":
                    output += f"[Resource: {content.uri}]"

            return MCPToolResult(success=True, server=server_name, tool=tool_name, result=output)

        except Exception as e:
            logger.error(f"Tool execution failed: {str(e)}")
            return MCPToolResult(success=False, server=server_name, tool=tool_name, error=str(e))

    async def cleanup(self):
        """Close all connections"""
        await self.exit_stack.aclose()
        self.sessions.clear()
        self.tools_cache.clear()


# Global instance
mcp_manager = MCPClientManager()
