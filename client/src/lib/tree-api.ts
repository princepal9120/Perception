/**
 * API client for conversation tree operations
 */
import axios from 'axios';
import type {
    ConversationTreeStructure,
    ConversationNode,
    TreeStatistics,
    MessageSendRequest,
    BranchCreateRequest,
    CompareNodesRequest,
} from '../types/tree';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// Get auth token from localStorage
const getAuthToken = () => {
    const token = localStorage.getItem('perception_auth_token');
    return token;
};

// Axios instance with auth
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
    const token = getAuthToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const treeApi = {
    /**
     * Initialize a conversation tree for a chat
     */
    async initializeTree(chatId: number) {
        const response = await apiClient.post(`/tree/chats/${chatId}/init`);
        return response.data;
    },

    /**
     * Get complete tree structure
     */
    async getTreeStructure(chatId: number): Promise<ConversationTreeStructure> {
        const response = await apiClient.get(`/tree/chats/${chatId}`);
        return response.data;
    },

    /**
     * Get tree statistics
     */
    async getTreeStatistics(chatId: number): Promise<TreeStatistics> {
        const response = await apiClient.get(`/tree/chats/${chatId}/stats`);
        return response.data;
    },

    /**
     * Get a specific node
     */
    async getNode(nodeId: string): Promise<ConversationNode> {
        const response = await apiClient.get(`/tree/nodes/${nodeId}`);
        return response.data;
    },

    /**
     * Get node lineage (path from root)
     */
    async getNodeLineage(nodeId: string) {
        const response = await apiClient.get(`/tree/nodes/${nodeId}/lineage`);
        return response.data;
    },

    /**
     * Get node children
     */
    async getNodeChildren(nodeId: string) {
        const response = await apiClient.get(`/tree/nodes/${nodeId}/children`);
        return response.data;
    },

    /**
     * Fork a node (create sibling)
     */
    async forkNode(nodeId: string, branchName?: string) {
        const response = await apiClient.post(`/tree/nodes/${nodeId}/fork`, {
            node_id: nodeId,
            branch_name: branchName,
        } as BranchCreateRequest);
        return response.data;
    },

    /**
     * Set active node
     */
    async setActiveNode(chatId: number, nodeId: string) {
        const response = await apiClient.post(`/tree/chats/${chatId}/active-node`, {
            node_id: nodeId,
        });
        return response.data;
    },

    /**
     * Send message with streaming
     */
    async sendMessage(
        chatId: number,
        request: MessageSendRequest,
        onEvent: (event: any) => void
    ) {
        const token = getAuthToken();
        const eventSource = new EventSource(
            `${API_BASE_URL}/tree/chats/${chatId}/send?node_id=${request.node_id}&message=${encodeURIComponent(request.message)}&regenerate=${request.regenerate || false}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            } as any
        );

        return new Promise((resolve, reject) => {
            eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    onEvent(data);

                    if (data.type === 'complete') {
                        eventSource.close();
                        resolve(data);
                    } else if (data.type === 'error') {
                        eventSource.close();
                        reject(new Error(data.data?.error || 'Unknown error'));
                    }
                } catch (error) {
                    console.error('Error parsing SSE event:', error);
                }
            };

            eventSource.onerror = (error) => {
                console.error('SSE error:', error);
                eventSource.close();
                reject(error);
            };
        });
    },

    /**
     * Regenerate response
     */
    async regenerateResponse(
        chatId: number,
        nodeId: string,
        onEvent: (event: any) => void
    ) {
        const token = getAuthToken();
        const eventSource = new EventSource(
            `${API_BASE_URL}/tree/nodes/${nodeId}/regenerate?chat_id=${chatId}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            } as any
        );

        return new Promise((resolve, reject) => {
            eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    onEvent(data);

                    if (data.type === 'complete') {
                        eventSource.close();
                        resolve(data);
                    } else if (data.type === 'error') {
                        eventSource.close();
                        reject(new Error(data.data?.error || 'Unknown error'));
                    }
                } catch (error) {
                    console.error('Error parsing SSE event:', error);
                }
            };

            eventSource.onerror = (error) => {
                console.error('SSE error:', error);
                eventSource.close();
                reject(error);
            };
        });
    },

    /**
     * Compare nodes
     */
    async compareNodes(nodeIds: string[]) {
        const response = await apiClient.post(`/tree/nodes/compare`, {
            node_ids: nodeIds,
        } as CompareNodesRequest);
        return response.data;
    },

    /**
     * Migrate linear chat to tree
     */
    async migrateToTree(chatId: number) {
        const response = await apiClient.post(`/tree/migrate`, {
            chat_id: chatId,
            preserve_messages: true,
        });
        return response.data;
    },

    /**
     * Get node context (for debugging)
     */
    async getNodeContext(nodeId: string) {
        const response = await apiClient.get(`/tree/nodes/${nodeId}/context`);
        return response.data;
    },
};
