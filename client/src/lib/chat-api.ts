// src/lib/chat-api.ts - Updated to work with new backend

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

// ==================== Chat Interfaces ====================

export interface Chat {
  id: number;
  user_id: number;
  title: string;
  checkpoint_id: string | null;
  created_at: string;
  updated_at: string;
  message_count?: number;
}

export interface Message {
  id: number;
  chat_id: number;
  user_id: number;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  created_at: string;
  metadata?: any;
}

export interface CreateChatRequest {
  title: string;
}

export interface SendMessageRequest {
  content: string;
}

export interface ChatListResponse {
  chats: Chat[];
  total: number;
}

export interface MessageListResponse {
  messages: Message[];
  total: number;
  chat_id: number;
}

// ==================== Streaming Interfaces ====================

export interface SearchInfo {
  stages: string[];
  query: string;
  urls: string[];
  error?: string;
}

export interface CheckpointEventData {
  type: "checkpoint";
  checkpoint_id: string;
}

export interface ContentEventData {
  type: "content";
  content: string;
}

export interface SearchStartEventData {
  type: "search_start";
  query: string;
}

export interface SearchResultsEventData {
  type: "search_results";
  urls: string | string[];
}

export interface ToolOutputEventData {
  type: "tool_output";
  output: any;
}

export interface ErrorEventData {
  type: "error";
  message: string;
}

export interface EndEventData {
  type: "end";
}

export type StreamEventData =
  | CheckpointEventData
  | ContentEventData
  | SearchStartEventData
  | SearchResultsEventData
  | ToolOutputEventData
  | ErrorEventData
  | EndEventData;

export interface StreamCallbacks {
  onContent: (content: string) => void;
  onSearchStart: (query: string) => void;
  onSearchResults: (urls: string[]) => void;
  onToolOutput: (output: any) => void;
  onCheckpoint: (checkpointId: string) => void;
  onEnd: () => void;
  onError: (error: Error) => void;
}

// ==================== Chat API Class ====================

class ChatAPI {
  private getHeaders(token?: string): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return headers;
  }

  // ==================== Chat Management ====================

  async createChat(title: string, token: string): Promise<Chat> {
    const response = await fetch(`${API_BASE_URL}/chats`, {
      method: "POST",
      headers: this.getHeaders(token),
      body: JSON.stringify({ title }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to create chat");
    }

    return response.json();
  }

  async listChats(
    token: string,
    skip: number = 0,
    limit: number = 50
  ): Promise<ChatListResponse> {
    const response = await fetch(
      `${API_BASE_URL}/chats?skip=${skip}&limit=${limit}`,
      {
        method: "GET",
        headers: this.getHeaders(token),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to fetch chats");
    }

    return response.json();
  }

  async getChat(chatId: number, token: string): Promise<Chat> {
    const response = await fetch(`${API_BASE_URL}/chats/${chatId}`, {
      method: "GET",
      headers: this.getHeaders(token),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to fetch chat");
    }

    return response.json();
  }

  async updateChat(
    chatId: number,
    title: string,
    token: string
  ): Promise<Chat> {
    const response = await fetch(`${API_BASE_URL}/chats/${chatId}`, {
      method: "PATCH",
      headers: this.getHeaders(token),
      body: JSON.stringify({ title }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to update chat");
    }

    return response.json();
  }

  async deleteChat(chatId: number, token: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/chats/${chatId}`, {
      method: "DELETE",
      headers: this.getHeaders(token),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to delete chat");
    }
  }

  // ==================== Message Management ====================

  async getMessages(
    chatId: number,
    token: string,
    skip: number = 0,
    limit: number = 100
  ): Promise<MessageListResponse> {
    const response = await fetch(
      `${API_BASE_URL}/chats/${chatId}/messages?skip=${skip}&limit=${limit}`,
      {
        method: "GET",
        headers: this.getHeaders(token),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to fetch messages");
    }

    return response.json();
  }

  /**
   * Send a message and stream the AI response
   * Uses EventSource for Server-Sent Events (SSE)
   */
  async sendMessageStream(
    chatId: number,
    content: string,
    token: string,
    callbacks: StreamCallbacks
  ): Promise<() => void> {
    // Create a custom fetch request with streaming
    const response = await fetch(`${API_BASE_URL}/chats/${chatId}/message`, {
      method: "POST",
      headers: this.getHeaders(token),
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to send message");
    }

    // Read the stream
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error("No reader available");
    }

    let buffer = "";
    let cancelled = false;

    const processStream = async () => {
      try {
        while (!cancelled) {
          const { done, value } = await reader.read();

          if (done) {
            callbacks.onEnd();
            break;
          }

          // Decode the chunk
          buffer += decoder.decode(value, { stream: true });

          // Process complete SSE messages
          const lines = buffer.split("\n");
          buffer = lines.pop() || ""; // Keep incomplete line in buffer

          for (const line of lines) {
            if (!line.trim() || !line.startsWith("data: ")) continue;

            try {
              const jsonStr = line.substring(6); // Remove "data: " prefix
              const data = JSON.parse(jsonStr) as StreamEventData;

              switch (data.type) {
                case "checkpoint":
                  callbacks.onCheckpoint(data.checkpoint_id);
                  break;

                case "content":
                  callbacks.onContent(data.content);
                  break;

                case "search_start":
                  callbacks.onSearchStart(data.query);
                  break;

                case "search_results":
                  const urls =
                    typeof data.urls === "string"
                      ? JSON.parse(data.urls)
                      : data.urls;
                  callbacks.onSearchResults(urls);
                  break;

                case "tool_output":
                  callbacks.onToolOutput(data.output);
                  break;

                case "error":
                  callbacks.onError(new Error(data.message));
                  break;

                case "end":
                  callbacks.onEnd();
                  cancelled = true;
                  break;
              }
            } catch (error) {
              console.error("Error parsing SSE message:", error, line);
            }
          }
        }
      } catch (error) {
        if (!cancelled) {
          callbacks.onError(error as Error);
        }
      } finally {
        reader.releaseLock();
      }
    };

    // Start processing the stream
    processStream();

    // Return cancel function
    return () => {
      cancelled = true;
      reader.cancel();
    };
  }

  /**
   * Legacy method for backward compatibility
   * Uses fetch with streaming instead of EventSource
   */
  streamChat(
    message: string,
    checkpointId: string | null,
    callbacks: StreamCallbacks,
    chatId?: number,
    token?: string
  ): { cancel: () => void } {
    if (!chatId || !token) {
      throw new Error("Chat ID and token are required");
    }

    let cancel: (() => void) | null = null;

    this.sendMessageStream(chatId, message, token, callbacks).then(
      (cancelFn) => {
        cancel = cancelFn;
      }
    );

    return {
      cancel: () => {
        if (cancel) cancel();
      },
    };
  }

  /**
   * Cancel an ongoing stream
   */
  cancelStream(cancelFn: () => void): void {
    cancelFn();
  }
}

export const chatAPI = new ChatAPI();
