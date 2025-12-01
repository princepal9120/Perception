import { create } from 'zustand';
import { mcpApi, MCPServer, MCPTool } from '@/lib/mcp-api';

interface MCPState {
    servers: MCPServer[];
    tools: MCPTool[];
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchServers: () => Promise<void>;
    fetchTools: () => Promise<void>;
    connectServer: (serverName: string) => Promise<void>;
    executeTool: (server: string, tool: string, args: any) => Promise<any>;
}

export const useMCPStore = create<MCPState>((set, get) => ({
    servers: [],
    tools: [],
    isLoading: false,
    error: null,

    fetchServers: async () => {
        set({ isLoading: true, error: null });
        try {
            const data = await mcpApi.getServers();
            set({ servers: data.servers, isLoading: false });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    fetchTools: async () => {
        set({ isLoading: true, error: null });
        try {
            const data = await mcpApi.getTools();
            set({ tools: data.tools, isLoading: false });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    connectServer: async (serverName: string) => {
        set({ isLoading: true, error: null });
        try {
            await mcpApi.connectServer(serverName);
            // Refresh state
            await get().fetchServers();
            await get().fetchTools();
            set({ isLoading: false });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    executeTool: async (server: string, tool: string, args: any) => {
        set({ isLoading: true, error: null });
        try {
            const result = await mcpApi.executeTool(server, tool, args);
            set({ isLoading: false });
            return result;
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    }
}));
