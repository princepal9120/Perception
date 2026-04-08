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
import AuthService from './auth-service';
import { getRuntimeConfigHeaders } from './runtime-config';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// Axios instance with auth
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
    const token = AuthService.getAccessToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    Object.assign(config.headers, getRuntimeConfigHeaders());
    return config;
});

// Handle 401 responses - attempt token refresh, then logout if that fails
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If we get a 401 and haven't already retried
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            // Try to refresh the token using AuthService
            const newToken = await AuthService.refreshAccessToken();

            if (newToken) {
                // Update the request with new token and retry
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return apiClient(originalRequest);
            }
            // If refresh failed, AuthService already handles redirect
        }

        return Promise.reject(error);
    }
);

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
     * Send message with streaming (fetch-based SSE for proper auth)
     */
    async sendMessage(
        chatId: number,
        request: MessageSendRequest,
        onEvent: (event: unknown) => void
    ): Promise<{ cancel: () => void }> {
        const token = AuthService.getAccessToken();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 min timeout

        const response = await fetch(
            `${API_BASE_URL}/tree/chats/${chatId}/send`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    ...getRuntimeConfigHeaders(),
                },
                body: JSON.stringify({
                    node_id: request.node_id,
                    message: request.message,
                    regenerate: request.regenerate || false,
                }),
                signal: controller.signal,
            }
        );

        if (!response.ok) {
            clearTimeout(timeoutId);
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        if (!response.body) {
            clearTimeout(timeoutId);
            throw new Error('No response body');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        const processStream = async () => {
            try {
                while (true) {
                    const { done, value } = await reader.read();

                    if (done) {
                        // Process any remaining buffer
                        if (buffer.trim()) {
                            const lines = buffer.split('\n');
                            for (const line of lines) {
                                if (line.startsWith('data: ')) {
                                    try {
                                        const data = JSON.parse(line.slice(6));
                                        onEvent(data);
                                    } catch { /* ignore parse errors for incomplete data */ }
                                }
                            }
                        }
                        break;
                    }

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            try {
                                const data = JSON.parse(line.slice(6));
                                onEvent(data);

                                if (data.type === 'complete' || data.type === 'error') {
                                    clearTimeout(timeoutId);
                                    return;
                                }
                            } catch {
                                // Ignore parse errors for incomplete JSON
                            }
                        }
                    }
                }
            } catch (error) {
                if ((error as Error).name !== 'AbortError') {
                    console.error('Stream error:', error);
                }
            } finally {
                clearTimeout(timeoutId);
            }
        };

        processStream();

        return {
            cancel: () => {
                clearTimeout(timeoutId);
                controller.abort();
            },
        };
    },

    /**
     * Regenerate response (fetch-based SSE for proper auth)
     */
    async regenerateResponse(
        chatId: number,
        nodeId: string,
        onEvent: (event: unknown) => void
    ): Promise<{ cancel: () => void }> {
        const token = AuthService.getAccessToken();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 min timeout

        const response = await fetch(
            `${API_BASE_URL}/tree/nodes/${nodeId}/regenerate`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    ...getRuntimeConfigHeaders(),
                },
                body: JSON.stringify({ chat_id: chatId }),
                signal: controller.signal,
            }
        );

        if (!response.ok) {
            clearTimeout(timeoutId);
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        if (!response.body) {
            clearTimeout(timeoutId);
            throw new Error('No response body');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        const processStream = async () => {
            try {
                while (true) {
                    const { done, value } = await reader.read();

                    if (done) {
                        if (buffer.trim()) {
                            const lines = buffer.split('\n');
                            for (const line of lines) {
                                if (line.startsWith('data: ')) {
                                    try {
                                        const data = JSON.parse(line.slice(6));
                                        onEvent(data);
                                    } catch { /* ignore */ }
                                }
                            }
                        }
                        break;
                    }

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            try {
                                const data = JSON.parse(line.slice(6));
                                onEvent(data);

                                if (data.type === 'complete' || data.type === 'error') {
                                    clearTimeout(timeoutId);
                                    return;
                                }
                            } catch {
                                // Ignore parse errors
                            }
                        }
                    }
                }
            } catch (error) {
                if ((error as Error).name !== 'AbortError') {
                    console.error('Stream error:', error);
                }
            } finally {
                clearTimeout(timeoutId);
            }
        };

        processStream();

        return {
            cancel: () => {
                clearTimeout(timeoutId);
                controller.abort();
            },
        };
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
