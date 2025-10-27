// src/lib/chat-api.ts

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8002/api/v1";

export interface SearchInfo {
  stages: string[];
  query: string;
  urls: string[];
  error?: string;
}

export interface MessageContent {
  content: string;
  searchInfo?: SearchInfo;
}

// Define the possible event data types
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

export interface SearchErrorEventData {
  type: "search_error";
  error: string;
}

export interface EndEventData {
  type: "end";
}

export type EventData =
  | CheckpointEventData
  | ContentEventData
  | SearchStartEventData
  | SearchResultsEventData
  | SearchErrorEventData
  | EndEventData;

export interface StreamCallbacks {
  onContent: (content: string) => void;
  onSearchStart: (query: string) => void;
  onSearchResults: (urls: string[]) => void;
  onSearchError: (error: string) => void;
  onCheckpoint: (checkpointId: string) => void;
  onEnd: () => void;
  onError: (error: Error) => void;
}

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
   * Stream chat response from the server
   * @param message - The user's message
   * @param checkpointId - Optional checkpoint ID for conversation continuity
   * @param callbacks - Callbacks for handling different event types
   * @returns EventSource instance for manual control if needed
   */
  streamChat(
    message: string,
    checkpointId: string | null,
    callbacks: StreamCallbacks
  ): EventSource {
    let url = `${API_BASE_URL}/chat_stream/${encodeURIComponent(message)}`;

    if (checkpointId) {
      url += `?checkpoint_id=${encodeURIComponent(checkpointId)}`;
    }

    const eventSource = new EventSource(url);
    let searchData: SearchInfo | null = null;

    eventSource.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data) as EventData;

        switch (data.type) {
          case "checkpoint":
            callbacks.onCheckpoint(data.checkpoint_id);
            break;

          case "content":
            callbacks.onContent(data.content);
            break;

          case "search_start":
            searchData = {
              stages: ["searching"],
              query: data.query,
              urls: [],
            };
            callbacks.onSearchStart(data.query);
            break;

          case "search_results":
            try {
              const urls: string[] =
                typeof data.urls === "string"
                  ? JSON.parse(data.urls)
                  : data.urls;

              if (searchData) {
                searchData = {
                  ...searchData,
                  stages: [...searchData.stages, "reading"],
                  urls,
                };
              }

              callbacks.onSearchResults(urls);
            } catch (err) {
              console.error("Error parsing search results:", err);
            }
            break;

          case "search_error":
            if (searchData) {
              searchData = {
                ...searchData,
                stages: [...searchData.stages, "error"],
                error: data.error,
              };
            }
            callbacks.onSearchError(data.error);
            break;

          case "end":
            callbacks.onEnd();
            eventSource.close();
            break;

          default:
            console.warn("Unknown event type:", data);
        }
      } catch (error) {
        console.error("Error parsing event data:", error, event.data);
        callbacks.onError(error as Error);
      }
    };

    eventSource.onerror = (error: Event) => {
      console.error("EventSource error:", error);
      eventSource.close();
      callbacks.onError(new Error("Connection to server failed"));
    };

    // Listen for explicit 'end' event
    eventSource.addEventListener("end", () => {
      eventSource.close();
    });

    return eventSource;
  }

  /**
   * Cancel an ongoing stream
   * @param eventSource - The EventSource instance to close
   */
  cancelStream(eventSource: EventSource): void {
    eventSource.close();
  }
}

export const chatAPI = new ChatAPI();
