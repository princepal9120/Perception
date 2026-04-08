/**
 * Zustand store for conversation tree state management
 */
import { create } from 'zustand';
import type {
    ConversationTreeStructure,
    TreeNodeData,
    ConversationNode,
    TreeStatistics,
    TreeStreamEvent,
    TreeWorkflowSyncState,
} from '../types/tree';
import { treeApi } from '../lib/tree-api';

const getErrorMessage = (error: unknown, fallback: string): string => {
    if (error instanceof Error && error.message) {
        return error.message;
    }

    if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof error.response === 'object' &&
        error.response !== null &&
        'data' in error.response &&
        typeof error.response.data === 'object' &&
        error.response.data !== null &&
        'detail' in error.response.data &&
        typeof error.response.data.detail === 'string'
    ) {
        return error.response.data.detail;
    }

    return fallback;
};

interface TreeState {
    // Current tree data
    currentChatId: number | null;
    treeStructure: ConversationTreeStructure | null;
    activeNodeId: string | null;
    statistics: TreeStatistics | null;

    // UI state
    isLoading: boolean;
    error: string | null;
    isTreeView: boolean; // Toggle between linear and tree view

    // Streaming state
    streamingNodeId: string | null;
    streamingContent: string;
    isStreaming: boolean;

    // Workflow Sync State
    workflowSyncState: {
        status: 'draft' | 'updated';
        change_summary: string;
        linked_nodes: string[];
        last_updated: number;
    } | null;

    // Node cache
    nodeCache: Map<string, ConversationNode>;

    // Actions
    setCurrentChatId: (chatId: number) => void;
    loadTree: (chatId: number) => Promise<void>;
    loadStatistics: (chatId: number) => Promise<void>;
    setActiveNode: (nodeId: string) => Promise<void>;
    forkNode: (nodeId: string, branchName?: string) => Promise<void>;
    sendMessage: (nodeId: string, message: string, regenerate?: boolean) => Promise<void>;
    regenerateResponse: (nodeId: string) => Promise<void>;
    toggleTreeView: () => void;
    clearError: () => void;
    reset: () => void;
    setWorkflowSync: (syncState: TreeWorkflowSyncState | null) => void;

    // Helper methods
    getNodeById: (nodeId: string) => TreeNodeData | null;
    getNodeChildren: (nodeId: string) => TreeNodeData[];
    getActiveLineage: () => TreeNodeData[];
}

export const useTreeStore = create<TreeState>((set, get) => ({
    // Initial state
    currentChatId: null,
    treeStructure: null,
    activeNodeId: null,
    statistics: null,
    isLoading: false,
    error: null,
    isTreeView: false,
    streamingNodeId: null,
    streamingContent: '',
    isStreaming: false,
    workflowSyncState: null,
    nodeCache: new Map(),

    // Actions
    setCurrentChatId: (chatId) => {
        set({ currentChatId: chatId });
    },

    setWorkflowSync: (syncState) => {
        set({ workflowSyncState: syncState });
    },

    loadTree: async (chatId) => {
        set({ isLoading: true, error: null });
        try {
            const structure = await treeApi.getTreeStructure(chatId);
            set({
                treeStructure: structure,
                activeNodeId: structure.tree_metadata.active_node_id,
                currentChatId: chatId,
                isLoading: false,
            });
        } catch (error: unknown) {
            // If tree doesn't exist, try to migrate existing chat or initialize
            if (
                typeof error === 'object' &&
                error !== null &&
                'response' in error &&
                typeof error.response === 'object' &&
                error.response !== null &&
                'status' in error.response &&
                error.response.status === 404
            ) {
                try {
                    // Use migrateToTree to preserve existing messages
                    await treeApi.migrateToTree(chatId);
                    const structure = await treeApi.getTreeStructure(chatId);
                    set({
                        treeStructure: structure,
                        activeNodeId: structure.tree_metadata.active_node_id,
                        currentChatId: chatId,
                        isLoading: false,
                    });
                } catch (initError: unknown) {
                    set({
                        error: getErrorMessage(initError, 'Failed to initialize tree'),
                        isLoading: false,
                    });
                }
            } else {
                set({
                    error: getErrorMessage(error, 'Failed to load tree'),
                    isLoading: false,
                });
            }
        }
    },

    loadStatistics: async (chatId) => {
        try {
            const stats = await treeApi.getTreeStatistics(chatId);
            set({ statistics: stats });
        } catch (error: unknown) {
            console.error('Failed to load statistics:', error);
        }
    },

    setActiveNode: async (nodeId) => {
        const { currentChatId } = get();
        if (!currentChatId) return;

        try {
            await treeApi.setActiveNode(currentChatId, nodeId);
            set({ activeNodeId: nodeId });

            // Reload tree to update active states
            await get().loadTree(currentChatId);
        } catch (error: unknown) {
            set({ error: getErrorMessage(error, 'Failed to set active node') });
        }
    },

    forkNode: async (nodeId, branchName) => {
        const { currentChatId } = get();
        if (!currentChatId) return;

        set({ isLoading: true, error: null });
        try {
            await treeApi.forkNode(nodeId, branchName);

            // Reload tree
            await get().loadTree(currentChatId);
            set({ isLoading: false });
        } catch (error: unknown) {
            set({
                error: getErrorMessage(error, 'Failed to fork node'),
                isLoading: false,
            });
        }
    },

    sendMessage: async (nodeId, message, regenerate = false) => {
        const { currentChatId } = get();
        if (!currentChatId) return;

        set({
            isStreaming: true,
            streamingNodeId: nodeId,
            streamingContent: '',
            error: null,
        });

        try {
            await treeApi.sendMessage(
                currentChatId,
                { node_id: nodeId, message, regenerate },
                (event: TreeStreamEvent) => {
                    // Handle new strict schema
                    if (event.node) {
                        // Content update
                        if (event.node.ai_response) {
                            // If it's a partial update (streaming), it might just have the chunk
                            // But our backend sends the ACCUMULATED response or chunks? 
                            // The backend change I made:
                            // yield { node: { ..., ai_response: current_response }, ... }
                            // So it sends the FULL accumulated response so far if I look at "current_response = "".join(chunks)"
                            // Wait, I see "current_response" in the backend code.

                            set({ streamingContent: event.node.ai_response });
                        }
                    }

                    // Handle generic workflow sync updates
                    if (event.workflow_sync) {
                        set({
                            workflowSyncState: {
                                ...event.workflow_sync,
                                last_updated: Date.now()
                            }
                        });
                    }

                    // Handle completion/sync
                    if (event.workflow_sync?.status === 'updated' && event.node?.type && !event.node.branch_of) {
                        // This looks like a completion of a normal node or final update
                        // Check change_summary to be sure? 
                        // The backend sends "AI response completed" as change_summary
                        if (event.workflow_sync.change_summary === 'AI response completed') {
                            set({
                                isStreaming: false,
                                streamingNodeId: null,
                                streamingContent: '',
                            });
                            // Reload tree
                            get().loadTree(currentChatId);
                        }
                    }

                    if (event.workflow_sync?.change_summary?.startsWith('Error')) {
                        set({
                            error: event.workflow_sync.change_summary,
                            isStreaming: false,
                            streamingNodeId: null,
                        });
                    }
                }
            );
        } catch (error: unknown) {
            set({
                error: getErrorMessage(error, 'Failed to send message'),
                isStreaming: false,
                streamingNodeId: null,
            });
        }
    },

    regenerateResponse: async (nodeId) => {
        const { currentChatId } = get();
        if (!currentChatId) return;

        set({
            isStreaming: true,
            streamingNodeId: nodeId,
            streamingContent: '',
            error: null,
        });

        try {
            await treeApi.regenerateResponse(currentChatId, nodeId, (event: TreeStreamEvent) => {
                // Handle new strict schema
                if (event.node) {
                    if (event.node.ai_response) {
                        set({ streamingContent: event.node.ai_response });
                    }
                }

                // Handle generic workflow sync updates
                if (event.workflow_sync) {
                    set({
                        workflowSyncState: {
                            ...event.workflow_sync,
                            last_updated: Date.now()
                        }
                    });
                }

                if (event.workflow_sync?.status === 'updated' && event.workflow_sync.change_summary === 'AI response completed') {
                    set({
                        isStreaming: false,
                        streamingNodeId: null,
                        streamingContent: '',
                    });
                    get().loadTree(currentChatId);
                }

                if (event.workflow_sync?.change_summary?.startsWith('Error')) {
                    set({
                        error: event.workflow_sync.change_summary,
                        isStreaming: false,
                        streamingNodeId: null,
                    });
                }
            });
        } catch (error: unknown) {
            set({
                error: getErrorMessage(error, 'Failed to regenerate response'),
                isStreaming: false,
                streamingNodeId: null,
            });
        }
    },

    toggleTreeView: () => {
        set((state) => ({ isTreeView: !state.isTreeView }));
    },

    clearError: () => {
        set({ error: null });
    },

    reset: () => {
        set({
            currentChatId: null,
            treeStructure: null,
            activeNodeId: null,
            statistics: null,
            isLoading: false,
            error: null,
            streamingNodeId: null,
            streamingContent: '',
            isStreaming: false,
            nodeCache: new Map(),
        });
    },

    // Helper methods
    getNodeById: (nodeId) => {
        const { treeStructure } = get();
        if (!treeStructure) return null;
        return treeStructure.nodes.find((n) => n.id === nodeId) || null;
    },

    getNodeChildren: (nodeId) => {
        const { treeStructure } = get();
        if (!treeStructure) return [];

        const childIds = treeStructure.adjacency_list[nodeId] || [];
        return treeStructure.nodes.filter((n) => childIds.includes(n.id));
    },

    getActiveLineage: () => {
        const { treeStructure, activeNodeId } = get();
        if (!treeStructure || !activeNodeId) return [];

        const lineage: TreeNodeData[] = [];
        let currentId: string | null = activeNodeId;

        while (currentId) {
            const node = treeStructure.nodes.find((n) => n.id === currentId);
            if (!node) break;

            lineage.unshift(node);
            currentId = node.parent_id;
        }

        return lineage;
    },
}));
