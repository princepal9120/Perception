import { useCallback, useEffect } from "react";
import { useChatStore } from "@/store/chatStore";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

/**
 * Custom hook for chat functionality
 * Provides a clean interface for components to interact with chat features
 */
export const useChat = () => {
  const {
    chats,
    currentChatId,
    messages,
    isLoading,
    isStreaming,
    streamingContent,
    agentProgress,
    loadChats,
    createChat,
    selectChat,
    updateChat,
    deleteChat,
    loadMessages,
    sendMessage,
    stopStreaming,
    clearCurrentChat,
  } = useChatStore();

  const { isAuthenticated, token } = useAuth();

  // Get current chat
  const currentChat = chats.find((c) => c.id === currentChatId);

  // Load chats when user is authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      loadChats();
    }
  }, [isAuthenticated, token, loadChats]);

  /**
   * Create a new chat
   */
  const handleCreateChat = useCallback(
    async (title?: string) => {
      if (!isAuthenticated) {
        toast.error("Please login to create a chat", {
          description: "You need to be authenticated to start a conversation."
        });
        return;
      }

      try {
        await createChat(title || "New Chat");
        toast.success("Chat created successfully", {
          description: "Your new conversation is ready. Start typing to begin!"
        });
      } catch (error) {
        console.error("Failed to create chat:", error);

        // Provide more specific error messages
        let errorMessage = "Failed to create chat. Please try again.";
        let errorDescription = "There was an issue creating your conversation.";

        if (error instanceof Error) {
          if (error.message.includes("401") || error.message.includes("unauthorized")) {
            errorMessage = "Authentication required";
            errorDescription = "Please login again to create a chat.";
          } else if (error.message.includes("429")) {
            errorMessage = "Too many requests";
            errorDescription = "Please wait a moment before creating another chat.";
          } else if (error.message.includes("network") || error.message.includes("fetch")) {
            errorMessage = "Network error";
            errorDescription = "Please check your connection and try again.";
          }
        }

        toast.error(errorMessage, {
          description: errorDescription
        });
      }
    },
    [createChat, isAuthenticated]
  );

  /**
   * Send a message
   */
  const handleSendMessage = useCallback(
    async (message: string) => {
      if (!message.trim()) {
        toast.error("Please enter a message", {
          description: "Type a message in the input field below."
        });
        return;
      }

      if (!isAuthenticated) {
        toast.error("Please login to send messages", {
          description: "You need to be authenticated to participate in conversations."
        });
        return;
      }

      if (isStreaming) {
        toast.warning("Please wait for the current response to complete", {
          description: "The AI is still responding. Please wait for it to finish."
        });
        return;
      }

      try {
        // Create a new chat if none exists
        if (!currentChatId) {
          await handleCreateChat();
          // The chat store will have updated currentChatId, but we need to wait for it
          // Get the updated chat ID from the store after creation
          const updatedState = useChatStore.getState();
          if (!updatedState.currentChatId) {
            toast.error("Failed to create chat", {
              description: "Could not create a new conversation. Please try again."
            });
            return;
          }
        }

        await sendMessage(message);
      } catch (error) {
        console.error("Failed to send message:", error);

        // Provide more specific error messages
        let errorMessage = "Failed to send message. Please try again.";
        let errorDescription = "There was an issue sending your message.";

        if (error instanceof Error) {
          if (error.message.includes("401") || error.message.includes("unauthorized")) {
            errorMessage = "Authentication required";
            errorDescription = "Please login again to send messages.";
          } else if (error.message.includes("429")) {
            errorMessage = "Rate limit exceeded";
            errorDescription = "You're sending messages too quickly. Please wait a moment.";
          } else if (error.message.includes("network") || error.message.includes("fetch")) {
            errorMessage = "Network error";
            errorDescription = "Please check your connection and try again.";
          } else if (error.message.includes("503")) {
            errorMessage = "Service unavailable";
            errorDescription = "The AI service is temporarily unavailable. Please try again later.";
          }
        }

        toast.error(errorMessage, {
          description: errorDescription
        });
      }
    },
    [sendMessage, isStreaming, currentChatId, isAuthenticated, handleCreateChat]
  );

  /**
   * Stop the current streaming response
   */
  const handleStopStreaming = useCallback(() => {
    stopStreaming();
    toast.info("Response stopped");
  }, [stopStreaming]);

  /**
   * Switch to a different conversation
   */
  const handleSelectChat = useCallback(
    async (chatId: number) => {
      if (isStreaming) {
        toast.warning("Please wait for the current response to complete");
        return;
      }

      try {
        await selectChat(chatId);
      } catch (error) {
        console.error("Failed to select chat:", error);
        toast.error("Failed to load chat. Please try again.");
      }
    },
    [selectChat, isStreaming]
  );

  /**
   * Delete a conversation
   */
  const handleDeleteChat = useCallback(
    async (chatId: number) => {
      if (isStreaming && currentChatId === chatId) {
        toast.error("Cannot delete chat while streaming");
        return;
      }

      try {
        await deleteChat(chatId);
        toast.success("Chat deleted successfully");
      } catch (error) {
        console.error("Failed to delete chat:", error);
        toast.error("Failed to delete chat. Please try again.");
      }
    },
    [deleteChat, isStreaming, currentChatId]
  );

  /**
   * Update chat title
   */
  const handleUpdateChat = useCallback(
    async (chatId: number, title: string) => {
      if (!title.trim()) {
        toast.error("Please enter a valid title");
        return;
      }

      try {
        await updateChat(chatId, title);
        toast.success("Chat updated successfully");
      } catch (error) {
        console.error("Failed to update chat:", error);
        toast.error("Failed to update chat. Please try again.");
      }
    },
    [updateChat]
  );

  return {
    // State
    chats,
    currentChat,
    currentChatId,
    messages,
    isLoading,
    isStreaming,
    streamingContent,
    agentProgress,
    isAuthenticated,

    // Actions
    createChat: handleCreateChat,
    sendMessage: handleSendMessage,
    stopStreaming: handleStopStreaming,
    selectChat: handleSelectChat,
    deleteChat: handleDeleteChat,
    updateChat: handleUpdateChat,
  };
};
