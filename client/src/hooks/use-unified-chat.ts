/**
 * Unified Chat Hook - Integrates regular chat with tree structure
 * Automatically creates tree nodes when tree view is active
 */
import { useCallback } from 'react';
import { useChat } from './use-chat';
import { useTreeStore } from '@/store/treeStore';
import { useChatStore } from '@/store/chatStore';

interface UseUnifiedChatOptions {
    isTreeViewOpen?: boolean;
}

export const useUnifiedChat = (options: UseUnifiedChatOptions = {}) => {
    const { isTreeViewOpen = false } = options;
    const regularChat = useChat();
    const treeStore = useTreeStore();
    const chatStore = useChatStore();

    /**
     * Send message - uses tree API if tree view is open, otherwise regular chat
     */
    const sendMessage = useCallback(async (content: string) => {
        if (!regularChat.currentChat) {
            console.error('[UnifiedChat] No current chat');
            return;
        }

        if (isTreeViewOpen) {
            // Use tree API
            console.log('[UnifiedChat] Sending via tree API');

            // Get active node or root
            const activeNode = treeStore.activeNodeId || treeStore.treeStructure?.tree_metadata.root_node_id;

            if (!activeNode) {
                console.error('[UnifiedChat] No active node in tree');
                // Fall back to regular chat
                await chatStore.sendMessage(content);
                return;
            }

            // Send via tree
            await treeStore.sendMessage(activeNode, content, false);
        } else {
            // Use regular chat API
            console.log('[UnifiedChat] Sending via regular chat API');
            await chatStore.sendMessage(content);
        }
    }, [isTreeViewOpen, regularChat.currentChat, treeStore, chatStore]);

    /**
     * Regenerate last message
     */
    const regenerateMessage = useCallback(async () => {
        if (!regularChat.currentChat) return;

        if (isTreeViewOpen && treeStore.activeNodeId) {
            // Regenerate in tree
            await treeStore.regenerateResponse(treeStore.activeNodeId);
        } else {
            // For regular chat, we'd need to implement this
            console.warn('[UnifiedChat] Regenerate not implemented for regular chat');
        }
    }, [isTreeViewOpen, regularChat.currentChat, treeStore]);

    /**
     * Fork conversation at a specific message
     */
    const forkMessage = useCallback(async (nodeId: string, branchName?: string) => {
        if (!regularChat.currentChat) return;

        if (isTreeViewOpen) {
            await treeStore.forkNode(nodeId, branchName);
        } else {
            console.warn('[UnifiedChat] Fork only available in tree view');
        }
    }, [isTreeViewOpen, regularChat.currentChat, treeStore]);

    return {
        ...regularChat,
        sendMessage,
        regenerateMessage,
        forkMessage,
        isTreeMode: isTreeViewOpen,
        treeStore,
    };
};
