import { create } from "zustand";
import { chatAPI, SearchInfo } from "@/lib/chat-api";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  searchInfo?: SearchInfo;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

interface ChatState {
  conversations: Conversation[];
  currentConversationId: string | null;
  isStreaming: boolean;
  streamingMessage: string;
  streamingSearchInfo: SearchInfo | null;
  checkpointId: string | null;
  currentEventSource: EventSource | null;

  // Actions
  createNewConversation: () => void;
  selectConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  addMessage: (message: Omit<Message, "id" | "timestamp">) => void;
  updateStreamingMessage: (content: string) => void;
  updateStreamingSearchInfo: (searchInfo: SearchInfo) => void;
  setIsStreaming: (isStreaming: boolean) => void;
  setCheckpointId: (checkpointId: string) => void;
  finalizeStreamingMessage: () => void;
  sendMessage: (message: string) => Promise<void>;
  stopStreaming: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [
    {
      id: "1",
      title: "AI Research Best Practices",
      messages: [
        {
          id: "m1",
          role: "assistant",
          content:
            "Hello! I'm your AI research copilot. I can help you with web searches, document analysis, and complex research tasks. What would you like to explore today?",
          timestamp: new Date(Date.now() - 7200000),
        },
      ],
      createdAt: new Date(Date.now() - 7200000),
      updatedAt: new Date(Date.now() - 7200000),
    },
  ],
  currentConversationId: "1",
  isStreaming: false,
  streamingMessage: "",
  streamingSearchInfo: null,
  checkpointId: null,
  currentEventSource: null,

  createNewConversation: () => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: "New Conversation",
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    set((state) => ({
      conversations: [newConversation, ...state.conversations],
      currentConversationId: newConversation.id,
    }));
  },

  selectConversation: (id: string) => {
    set({ currentConversationId: id });
  },

  deleteConversation: (id: string) => {
    set((state) => {
      const filtered = state.conversations.filter((c) => c.id !== id);
      const newCurrentId =
        state.currentConversationId === id
          ? filtered[0]?.id || null
          : state.currentConversationId;

      return {
        conversations: filtered,
        currentConversationId: newCurrentId,
      };
    });
  },

  addMessage: (message) => {
    const { currentConversationId, conversations } = get();
    if (!currentConversationId) return;

    const newMessage: Message = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date(),
    };

    set({
      conversations: conversations.map((conv) => {
        if (conv.id === currentConversationId) {
          const updatedMessages = [...conv.messages, newMessage];
          const title =
            conv.title === "New Conversation" && updatedMessages.length === 1
              ? message.content.slice(0, 50) +
                (message.content.length > 50 ? "..." : "")
              : conv.title;

          return {
            ...conv,
            messages: updatedMessages,
            title,
            updatedAt: new Date(),
          };
        }
        return conv;
      }),
    });
  },

  updateStreamingMessage: (content: string) => {
    set({ streamingMessage: content });
  },

  updateStreamingSearchInfo: (searchInfo: SearchInfo) => {
    set({ streamingSearchInfo: searchInfo });
  },

  setIsStreaming: (isStreaming: boolean) => {
    set({ isStreaming });
  },

  setCheckpointId: (checkpointId: string) => {
    set({ checkpointId });
  },

  finalizeStreamingMessage: () => {
    const { streamingMessage, streamingSearchInfo, addMessage } = get();
    if (streamingMessage) {
      addMessage({
        role: "assistant",
        content: streamingMessage,
        searchInfo: streamingSearchInfo || undefined,
      });
      set({
        streamingMessage: "",
        streamingSearchInfo: null,
        isStreaming: false,
        currentEventSource: null,
      });
    }
  },

  sendMessage: async (message: string) => {
    const {
      addMessage,
      checkpointId,
      setIsStreaming,
      updateStreamingMessage,
      updateStreamingSearchInfo,
      setCheckpointId,
      finalizeStreamingMessage,
    } = get();

    // Add user message
    addMessage({ role: "user", content: message });

    // Start streaming
    setIsStreaming(true);

    let streamedContent = "";
    let searchData: SearchInfo | null = null;

    const eventSource = chatAPI.streamChat(message, checkpointId, {
      onContent: (content: string) => {
        streamedContent += content;
        updateStreamingMessage(streamedContent);
      },

      onSearchStart: (query: string) => {
        searchData = {
          stages: ["searching"],
          query,
          urls: [],
        };
        updateStreamingSearchInfo(searchData);
      },

      onSearchResults: (urls: string[]) => {
        if (searchData) {
          searchData = {
            ...searchData,
            stages: [...searchData.stages, "reading"],
            urls,
          };
          updateStreamingSearchInfo(searchData);
        }
      },

      onSearchError: (error: string) => {
        if (searchData) {
          searchData = {
            ...searchData,
            stages: [...searchData.stages, "error"],
            error,
            urls: [],
          };
          updateStreamingSearchInfo(searchData);
        }
      },

      onCheckpoint: (newCheckpointId: string) => {
        setCheckpointId(newCheckpointId);
      },

      onEnd: () => {
        if (searchData) {
          const finalSearchInfo: SearchInfo = {
            ...searchData,
            stages: [...searchData.stages, "writing"],
          };
          updateStreamingSearchInfo(finalSearchInfo);
        }
        finalizeStreamingMessage();
      },

      onError: (error: Error) => {
        console.error("Chat stream error:", error);
        if (!streamedContent) {
          streamedContent =
            "Sorry, there was an error processing your request.";
          updateStreamingMessage(streamedContent);
        }
        finalizeStreamingMessage();
      },
    });

    set({ currentEventSource: eventSource });
  },

  stopStreaming: () => {
    const { currentEventSource, finalizeStreamingMessage } = get();
    if (currentEventSource) {
      chatAPI.cancelStream(currentEventSource);
      finalizeStreamingMessage();
    }
  },
}));
