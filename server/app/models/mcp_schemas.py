"""
MCP (Model Context Protocol) Server Configuration Schema
"""
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from enum import Enum


class MCPServerType(str, Enum):
    """Types of MCP servers"""
    STDIO = "stdio"  # Standard I/O communication
    HTTP = "http"    # HTTP-based MCP server
    SSE = "sse"      # Server-Sent Events


class MCPServerConfig(BaseModel):
    """Configuration for an MCP server"""
    name: str = Field(..., description="Unique name for the MCP server")
    type: MCPServerType = Field(default=MCPServerType.STDIO, description="Server communication type")
    command: List[str] = Field(..., description="Command to start the server")
    args: List[str] = Field(default_factory=list, description="Additional arguments")
    env: Dict[str, str] = Field(default_factory=dict, description="Environment variables")
    enabled: bool = Field(default=True, description="Whether server is enabled")
    timeout: int = Field(default=30, description="Connection timeout in seconds")
    
    class Config:
        use_enum_values = True


class MCPToolSchema(BaseModel):
    """Schema for an MCP tool"""
    name: str
    description: str
    input_schema: Dict[str, Any]
    server: str  # Which MCP server provides this tool


class MCPToolCall(BaseModel):
    """Request to execute an MCP tool"""
    server: str = Field(..., description="MCP server name")
    tool: str = Field(..., description="Tool name")
    arguments: Dict[str, Any] = Field(default_factory=dict, description="Tool arguments")


class MCPToolResult(BaseModel):
    """Result from MCP tool execution"""
    success: bool
    result: Any = None
    error: Optional[str] = None
    execution_time: float = 0.0
    server: str
    tool: str


class MCPServerStatus(BaseModel):
    """Status of an MCP server"""
    name: str
    connected: bool
    tools_count: int = 0
    error: Optional[str] = None
    last_ping: Optional[str] = None


class MCPServersListResponse(BaseModel):
    """Response listing all MCP servers"""
    servers: List[MCPServerStatus]
    total_tools: int


class MCPToolsListResponse(BaseModel):
    """Response listing all available MCP tools"""
    tools: List[MCPToolSchema]
    servers: List[str]
    total_count: int
