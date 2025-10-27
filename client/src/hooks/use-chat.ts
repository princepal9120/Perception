// src/hooks/use-chat.ts

import { useCallback } from "react";
import { useChatStore } from "@/store/chatStore";
import { toast } from "sonner";

/**
 * Custom hook for chat functionality
 * Provides a clean interface for components to interact with chat features
 */
export const useChat = () => {
  const {
    conversations,
    currentConversationId,
    isStreaming,
    streamingMessage,
    streamingSearchInfo,
    checkpointId,
    sendMessage,
    stopStreaming,
    createNewConversation,
    selectConversation,
    deleteConversation,
  } = useChatStore();

  // Get current conversation
  const currentConversation = conversations.find(
    (c) => c.id === currentConversationId
  );

  // Get current messages
  const messages = currentConversation?.messages || [];

  /**
   * Send a message
   */
  const handleSendMessage = useCallback(
    async (message: string) => {
      if (!message.trim()) {
        toast.error("Please enter a message");
        return;
      }

      if (isStreaming) {
        toast.warning("Please wait for the current response to complete");
        return;
      }

      try {
        await sendMessage(message);
      } catch (error) {
        console.error("Failed to send message:", error);
        toast.error("Failed to send message. Please try again.");
      }
    },
    [sendMessage, isStreaming]
  );

  /**
   * Stop the current streaming response
   */
  const handleStopStreaming = useCallback(() => {
    stopStreaming();
    toast.info("Response stopped");
  }, [stopStreaming]);

  /**
   * Create a new conversation
   */
  const handleNewConversation = useCallback(() => {
    createNewConversation();
    toast.success("New conversation started");
  }, [createNewConversation]);

  /**
   * Switch to a different conversation
   */
  const handleSelectConversation = useCallback(
    (id: string) => {
      if (isStreaming) {
        toast.warning("Please wait for the current response to complete");
        return;
      }
      selectConversation(id);
    },
    [selectConversation, isStreaming]
  );

  /**
   * Delete a conversation
   */
  const handleDeleteConversation = useCallback(
    (id: string) => {
      if (isStreaming && currentConversationId === id) {
        toast.error("Cannot delete conversation while streaming");
        return;
      }
      deleteConversation(id);
      toast.success("Conversation deleted");
    },
    [deleteConversation, isStreaming, currentConversationId]
  );

  return {
    // State
    conversations,
    currentConversation,
    currentConversationId,
    messages,
    isStreaming,
    streamingMessage,
    streamingSearchInfo,
    checkpointId,

    // Actions
    sendMessage: handleSendMessage,
    stopStreaming: handleStopStreaming,
    newConversation: handleNewConversation,
    selectConversation: handleSelectConversation,
    deleteConversation: handleDeleteConversation,
  };
};
