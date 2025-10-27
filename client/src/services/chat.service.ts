// src/services/chat.service.ts

import { chatAPI, StreamCallbacks, SearchInfo } from "@/lib/chat-api";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  searchInfo?: SearchInfo;
}

export interface ChatResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Chat Service - Handles all chat-related business logic
 */
export class ChatService {
  private static instance: ChatService;
  private activeStreams: Map<string, EventSource> = new Map();

  private constructor() {}

  static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  /**
   * Start streaming a chat response
   * @param conversationId - Unique conversation identifier
   * @param message - User's message
   * @param checkpointId - Optional checkpoint for conversation continuity
   * @param callbacks - Event handlers for streaming
   * @returns Promise that resolves when streaming is set up
   */
  async startStream(
    conversationId: string,
    message: string,
    checkpointId: string | null,
    callbacks: StreamCallbacks
  ): Promise<ChatResponse> {
    try {
      // Cancel any existing stream for this conversation
      this.cancelStream(conversationId);

      // Start new stream
      const eventSource = chatAPI.streamChat(message, checkpointId, callbacks);

      // Store the event source
      this.activeStreams.set(conversationId, eventSource);

      return {
        success: true,
        message: "Stream started successfully",
      };
    } catch (error) {
      console.error("Failed to start stream:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to start stream",
      };
    }
  }

  /**
   * Cancel an active stream
   * @param conversationId - Conversation identifier
   */
  cancelStream(conversationId: string): void {
    const eventSource = this.activeStreams.get(conversationId);
    if (eventSource) {
      chatAPI.cancelStream(eventSource);
      this.activeStreams.delete(conversationId);
    }
  }

  /**
   * Cancel all active streams
   */
  cancelAllStreams(): void {
    this.activeStreams.forEach((eventSource, conversationId) => {
      chatAPI.cancelStream(eventSource);
    });
    this.activeStreams.clear();
  }

  /**
   * Check if a stream is active for a conversation
   * @param conversationId - Conversation identifier
   */
  isStreamActive(conversationId: string): boolean {
    return this.activeStreams.has(conversationId);
  }

  /**
   * Get the number of active streams
   */
  getActiveStreamCount(): number {
    return this.activeStreams.size;
  }
}

// Export singleton instance
export const chatService = ChatService.getInstance();
