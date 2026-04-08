// src/lib/chat-api.ts - Updated to work with new backend

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

// ==================== Chat Interfaces ====================

export interface Chat {
  id: number;
  user_id: number;
  title: string;
  checkpoint_id: string | null;
  parent_chat_id?: number | null;  // For branch tracking
  branch_message_id?: number | null;  // Message this chat branched from
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
  metadata?: Record<string, unknown> | null;
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

// ==================== Document Interfaces ====================

export interface Document {
  id: number;
  user_id: number;
  chat_id: number;
  filename: string;
  original_filename: string;
  file_size: number;
  file_type: string;
  file_extension: string;
  session_id: string;
  chunk_count: number;
  indexed: boolean;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface DocumentListResponse {
  documents: Document[];
  total: number;
  chat_id?: number;
}

export interface DocumentUploadResponse {
  documents: Document[];
  session_id: string;
  indexed: boolean;
  message: string;
}

export interface DocumentDeleteResponse {
  message: string;
  document_id: number;
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
  output: unknown;
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
  onToolOutput: (output: unknown) => void;
  onCheckpoint: (checkpointId: string) => void;
  onEnd: () => void;
  onError: (error: Error) => void;
}

interface ErrorResponse {
  detail?: string;
}

// ==================== Token Management ====================

import AuthService from './auth-service';

// Use AuthService for all token operations
const refreshAccessToken = () => AuthService.refreshAccessToken();


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

  /**
   * Fetch with automatic token refresh on 401 errors
   */
  private async fetchWithTokenRefresh(
    url: string,
    options: RequestInit,
    _originalToken: string
  ): Promise<Response> {
    let response = await fetch(url, options);

    // If we get a 401, try to refresh the token and retry once
    if (response.status === 401) {
      const newToken = await refreshAccessToken();

      if (newToken) {
        // Update Authorization header with new token
        const headers = options.headers as Record<string, string>;
        headers["Authorization"] = `Bearer ${newToken}`;

        // Retry the request with the new token
        response = await fetch(url, options);
      }
    }

    return response;
  }

  // ==================== Chat Management ====================

  async createChat(title: string, token: string): Promise<Chat> {
    const response = await this.fetchWithTokenRefresh(
      `${API_BASE_URL}/chats`,
      {
        method: "POST",
        headers: this.getHeaders(token),
        body: JSON.stringify({ title }),
      },
      token
    );

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
    const response = await this.fetchWithTokenRefresh(
      `${API_BASE_URL}/chats?skip=${skip}&limit=${limit}`,
      {
        method: "GET",
        headers: this.getHeaders(token),
      },
      token
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to fetch chats");
    }

    return response.json();
  }

  async getChat(chatId: number, token: string): Promise<Chat> {
    const response = await this.fetchWithTokenRefresh(
      `${API_BASE_URL}/chats/${chatId}`,
      {
        method: "GET",
        headers: this.getHeaders(token),
      },
      token
    );

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
    const response = await this.fetchWithTokenRefresh(
      `${API_BASE_URL}/chats/${chatId}`,
      {
        method: "PATCH",
        headers: this.getHeaders(token),
        body: JSON.stringify({ title }),
      },
      token
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to update chat");
    }

    return response.json();
  }

  async deleteChat(chatId: number, token: string): Promise<void> {
    const response = await this.fetchWithTokenRefresh(
      `${API_BASE_URL}/chats/${chatId}`,
      {
        method: "DELETE",
        headers: this.getHeaders(token),
      },
      token
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to delete chat");
    }
  }

  /**
   * Branch a new chat from a specific message
   * Creates a new chat with messages up to and including the specified message
   */
  async branchChat(
    chatId: number,
    messageId: number,
    token: string
  ): Promise<Chat> {
    const response = await this.fetchWithTokenRefresh(
      `${API_BASE_URL}/chats/${chatId}/branch/${messageId}`,
      {
        method: "POST",
        headers: this.getHeaders(token),
      },
      token
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to branch chat");
    }

    return response.json();
  }

  // ==================== Message Management ====================

  async getMessages(
    chatId: number,
    token: string,
    skip: number = 0,
    limit: number = 100
  ): Promise<MessageListResponse> {
    const response = await this.fetchWithTokenRefresh(
      `${API_BASE_URL}/chats/${chatId}/messages?skip=${skip}&limit=${limit}`,
      {
        method: "GET",
        headers: this.getHeaders(token),
      },
      token
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
   * Includes timeout protection to prevent zombie streams
   */
  async sendMessageStream(
    chatId: number,
    content: string,
    token: string,
    callbacks: StreamCallbacks
  ): Promise<() => void> {
    const STREAM_TIMEOUT_MS = 120000; // 2 minute timeout
    const CHUNK_TIMEOUT_MS = 30000; // 30 second timeout between chunks

    // Create a custom fetch request with streaming
    const response = await this.fetchWithTokenRefresh(
      `${API_BASE_URL}/chats/${chatId}/message`,
      {
        method: "POST",
        headers: this.getHeaders(token),
        body: JSON.stringify({ content }),
      },
      token
    );

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
    let lastChunkTime = Date.now();
    let chunkTimeoutId: ReturnType<typeof setTimeout> | null = null;
    let streamTimeoutId: ReturnType<typeof setTimeout> | null = null;

    const clearTimeouts = () => {
      if (chunkTimeoutId) clearTimeout(chunkTimeoutId);
      if (streamTimeoutId) clearTimeout(streamTimeoutId);
    };

    const resetChunkTimeout = () => {
      if (chunkTimeoutId) clearTimeout(chunkTimeoutId);
      lastChunkTime = Date.now();
      chunkTimeoutId = setTimeout(() => {
        if (!cancelled) {
          cancelled = true;
          callbacks.onError(new Error("Stream timeout: No data received for 30 seconds"));
          reader.cancel();
        }
      }, CHUNK_TIMEOUT_MS);
    };

    // Overall stream timeout
    streamTimeoutId = setTimeout(() => {
      if (!cancelled) {
        cancelled = true;
        callbacks.onError(new Error("Stream timeout: Maximum duration exceeded"));
        reader.cancel();
      }
    }, STREAM_TIMEOUT_MS);

    const processStream = async () => {
      try {
        resetChunkTimeout();

        while (!cancelled) {
          const { done, value } = await reader.read();

          if (done) {
            clearTimeouts();
            callbacks.onEnd();
            break;
          }

          // Reset chunk timeout on each chunk received
          resetChunkTimeout();

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

                case "search_results": {
                  const urls =
                    typeof data.urls === "string"
                      ? (JSON.parse(data.urls) as string[])
                      : data.urls;
                  callbacks.onSearchResults(urls);
                  break;
                }

                case "tool_output":
                  callbacks.onToolOutput(data.output);
                  break;

                case "error":
                  clearTimeouts();
                  callbacks.onError(new Error(data.message));
                  break;

                case "end":
                  clearTimeouts();
                  callbacks.onEnd();
                  cancelled = true;
                  break;
              }
            } catch {
              // Silently ignore parse errors for incomplete JSON chunks
            }
          }
        }
      } catch (error) {
        clearTimeouts();
        if (!cancelled) {
          callbacks.onError(error as Error);
        }
      } finally {
        clearTimeouts();
        reader.releaseLock();
      }
    };

    // Start processing the stream
    processStream();

    // Return cancel function
    return () => {
      clearTimeouts();
      cancelled = true;
      reader.cancel();
    };
  }



  // ==================== Document Management ====================

  async uploadDocuments(
    chatId: number,
    files: File[],
    token: string,
    onProgress?: (progress: number) => void
  ): Promise<DocumentUploadResponse> {
    return new Promise((resolve, reject) => {
      const formData = new FormData();

      // Add files to form data
      files.forEach((file) => {
        formData.append("files", file);
      });

      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${API_BASE_URL}/documents/upload/${chatId}`);
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);

      if (onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = (event.loaded / event.total) * 100;
            onProgress(percentComplete);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText) as DocumentUploadResponse;
            resolve(response);
          } catch {
            reject(new Error("Failed to parse response"));
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText) as ErrorResponse;
            reject(new Error(error.detail || "Failed to upload documents"));
          } catch {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => {
        reject(new Error("Network error occurred during upload"));
      };

      xhr.send(formData);
    });
  }

  async getChatDocuments(
    chatId: number,
    token: string,
    skip: number = 0,
    limit: number = 50
  ): Promise<DocumentListResponse> {
    const response = await this.fetchWithTokenRefresh(
      `${API_BASE_URL}/documents/chat/${chatId}?skip=${skip}&limit=${limit}`,
      {
        method: "GET",
        headers: this.getHeaders(token),
      },
      token
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to fetch chat documents");
    }

    return response.json();
  }

  async getUserDocuments(
    token: string,
    skip: number = 0,
    limit: number = 50
  ): Promise<DocumentListResponse> {
    const response = await this.fetchWithTokenRefresh(
      `${API_BASE_URL}/documents?skip=${skip}&limit=${limit}`,
      {
        method: "GET",
        headers: this.getHeaders(token),
      },
      token
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to fetch user documents");
    }

    return response.json();
  }

  async getDocument(
    documentId: number,
    token: string
  ): Promise<Document> {
    const response = await this.fetchWithTokenRefresh(
      `${API_BASE_URL}/documents/${documentId}`,
      {
        method: "GET",
        headers: this.getHeaders(token),
      },
      token
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to fetch document");
    }

    return response.json();
  }

  async deleteDocument(
    documentId: number,
    token: string
  ): Promise<DocumentDeleteResponse> {
    const response = await this.fetchWithTokenRefresh(
      `${API_BASE_URL}/documents/${documentId}`,
      {
        method: "DELETE",
        headers: this.getHeaders(token),
      },
      token
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to delete document");
    }

    return response.json();
  }

  async batchDeleteDocuments(
    documentIds: number[],
    token: string
  ): Promise<DocumentDeleteResponse[]> {
    const response = await this.fetchWithTokenRefresh(
      `${API_BASE_URL}/documents/batch-delete`,
      {
        method: "POST",
        headers: this.getHeaders(token),
        body: JSON.stringify(documentIds),
      },
      token
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to batch delete documents");
    }

    return response.json();
  }

  /**
   * Check document service health
   */
  async checkDocumentHealth(): Promise<{ status: string; service: string }> {
    const response = await fetch(`${API_BASE_URL}/documents/health`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error("Document service health check failed");
    }

    return response.json();
  }
}

export const chatAPI = new ChatAPI();
