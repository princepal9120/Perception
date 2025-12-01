import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export interface MCPTool {
    name: string;
    description: string;
    input_schema: any;
    server: string;
}

export interface MCPServer {
    name: string;
    connected: boolean;
    tools_count: number;
    error?: string;
}

export interface MCPToolResult {
    success: boolean;
    result?: any;
    error?: string;
    server: string;
    tool: string;
}

export const mcpApi = {
    /**
     * List all configured MCP servers
     */
    getServers: async (): Promise<{ servers: MCPServer[], total_tools: number }> => {
        const response = await axios.get(`${API_BASE_URL}/mcp/servers`);
        return response.data;
    },

    /**
     * List all available tools from connected servers
     */
    getTools: async (): Promise<{ tools: MCPTool[], servers: string[], total_count: number }> => {
        const response = await axios.get(`${API_BASE_URL}/mcp/tools`);
        return response.data;
    },

    /**
     * Execute a specific MCP tool
     */
    executeTool: async (server: string, tool: string, args: any): Promise<MCPToolResult> => {
        const response = await axios.post(`${API_BASE_URL}/mcp/execute`, {
            server,
            tool,
            arguments: args
        });
        return response.data;
    },

    /**
     * Connect to a specific server
     */
    connectServer: async (serverName: string): Promise<any> => {
        const response = await axios.post(`${API_BASE_URL}/mcp/connect/${serverName}`);
        return response.data;
    },

    /**
     * Refresh tools for a server
     */
    refreshTools: async (serverName: string): Promise<any> => {
        const response = await axios.post(`${API_BASE_URL}/mcp/refresh/${serverName}`);
        return response.data;
    }
};
