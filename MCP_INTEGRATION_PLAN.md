# 🚀 MCP Integration Implementation Plan

## Phase 1: Backend Infrastructure (Days 1-2)

### 1.1 Async Conversion
- [ ] Convert `llm_client.py` to async
- [ ] Update vector DB operations to async
- [ ] Convert LangGraph nodes to async
- [ ] Update FastAPI endpoints to async
- [ ] Implement async streaming (SSE)

### 1.2 MCP Client Manager
```python
# server/app/services/mcp_client_manager.py
class MCPClientManager:
    - async def load_server(config: MCPServerConfig)
    - async def connect_all()
    - async def list_all_tools() -> List[MCPTool]
    - async def execute_tool(server: str, tool: str, params: dict)
    - async def disconnect_all()
```

### 1.3 Dependencies
```bash
pip install mcp langchain-mcp-adapters mcp-client
```

## Phase 2: LangGraph MCP Integration (Days 3-4)

### 2.1 New Graph Nodes
- `mcp_router` - Routes to MCP or native tools
- `mcp_executor` - Executes MCP tool calls
- `mcp_result_processor` - Processes MCP responses

### 2.2 Workflow
```
START → llm → tool_router → [mcp_executor | native_tool] → llm → update_tree → END
```

### 2.3 Tool Discovery
- Auto-discover tools on startup
- Register with LangChain ToolRegistry
- Expose via `/mcp/tools` endpoint

## Phase 3: FastAPI Endpoints (Day 5)

### 3.1 New Routes
```python
# server/app/routes/mcp_routes.py
GET  /api/v1/mcp/servers          # List all MCP servers
GET  /api/v1/mcp/tools             # List all available tools
POST /api/v1/mcp/execute           # Execute MCP tool
GET  /api/v1/mcp/status            # Server health status
```

### 3.2 Integration Points
- Update `/chat/send` to use MCP tools
- Update `/events/workflow` for MCP streaming
- Update tree nodes to include MCP metadata

## Phase 4: Frontend (Days 6-7)

### 4.1 MCP Tool Explorer
```tsx
// client/src/components/mcp/MCPToolExplorer.tsx
- Display all servers and their tools
- Show tool schemas
- Filter and search tools
```

### 4.2 Chat Integration
- Display MCP tool calls in chat
- Show streaming MCP results
- Add MCP nodes to conversation tree

### 4.3 UI Components
- `MCPServerCard.tsx` - Server status card
- `MCPToolCard.tsx` - Individual tool card
- `MCPExecutionLog.tsx` - Tool execution logs

## Phase 5: Testing & Refinement (Day 8)

### 5.1 Test Scenarios
- ✅ Perplexity search
- ✅ GitHub issue creation
- ✅ Gmail send
- ✅ Local calculator
- ✅ Multi-server workflow
- ✅ Branching with MCP nodes

## File Structure

```
server/
├── app/
│   ├── services/
│   │   ├── mcp_client_manager.py      # NEW
│   │   ├── mcp_tool_registry.py       # NEW
│   │   └── llm_client.py              # MODIFY (async)
│   ├── routes/
│   │   ├── mcp_routes.py              # NEW
│   │   └── chat_routes.py             # MODIFY
│   ├── models/
│   │   └── mcp_schemas.py             # NEW
│   └── config/
│       └── mcp_servers.yaml           # NEW
│
client/
├── src/
│   ├── components/
│   │   └── mcp/
│   │       ├── MCPToolExplorer.tsx    # NEW
│   │       ├── MCPServerCard.tsx      # NEW
│   │       └── MCPExecutionLog.tsx    # NEW
│   ├── lib/
│   │   └── mcp-api.ts                 # NEW
│   └── store/
│       └── mcpStore.ts                # NEW
```

## MCP Server Configurations

### Perplexity MCP
```yaml
name: perplexity
command: ["npx", "-y", "@perplexity/mcp-server"]
env:
  PERPLEXITY_API_KEY: ${PERPLEXITY_API_KEY}
```

### GitHub MCP
```yaml
name: github
command: ["npx", "-y", "@modelcontextprotocol/server-github"]
env:
  GITHUB_TOKEN: ${GITHUB_TOKEN}
```

### Gmail MCP
```yaml
name: gmail
command: ["npx", "-y", "@modelcontextprotocol/server-gmail"]
env:
  GMAIL_CREDENTIALS: ${GMAIL_CREDENTIALS}
```

### Local Calculator
```yaml
name: calculator
command: ["python3", "mcp_servers/calculator_server.py"]
```

## Success Criteria

- [ ] All MCP servers connect successfully
- [ ] Tools auto-discovered and registered
- [ ] LLM can invoke MCP tools
- [ ] Frontend displays all tools
- [ ] Streaming works for MCP calls
- [ ] MCP nodes appear in conversation tree
- [ ] Branching works with MCP
- [ ] Error handling for server failures
- [ ] Graceful degradation if MCP unavailable

## Next Steps

1. Install MCP dependencies
2. Create MCPClientManager
3. Implement async LLM client
4. Create MCP routes
5. Build frontend components
6. Test with real MCP servers
