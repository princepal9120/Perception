import { create } from "zustand";
import { chatAPI, Chat, Message } from "@/lib/chat-api";
import { useAuth } from "@/hooks/use-auth";

interface AgentProgressStep {
  type: 'thinking' | 'searching' | 'analyzing' | 'reading' | 'completed';
  message: string;
  query?: string;
  sources?: string[];
  timestamp?: number;
}

interface ChatState {
  // State
  chats: Chat[];
  currentChatId: number | null;
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  streamingContent: string;
  currentEventSource: (() => void) | null;
  agentProgress: AgentProgressStep[];

  // Actions
  loadChats: () => Promise<void>;
  createChat: (title: string) => Promise<void>;
  selectChat: (chatId: number) => Promise<void>;
  updateChat: (chatId: number, title: string) => Promise<void>;
  deleteChat: (chatId: number) => Promise<void>;
  loadMessages: (chatId: number) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  sendDeepResearch: (topic: string, depth: number, iterations: number) => Promise<void>;
  stopStreaming: () => void;
  clearCurrentChat: () => void;
  setMessages: (messages: Message[]) => void;
}

// Helper function to format research report as markdown
const formatResearchReport = (report: any): string => {
  const depthLabels = ['Basic', 'Intermediate', 'Advanced', 'Expert', 'Research-Grade'];
  let markdown = `# 🔬 Deep Research Report\n\n`;
  markdown += `**Topic:** ${report.topic}\n`;
  markdown += `**Depth:** ${depthLabels[report.depth - 1]} (${report.depth}/5)\n`;
  markdown += `**Iterations:** ${report.iterations}\n\n`;
  markdown += `---\n\n`;

  if (report.report.executive_summary) {
    markdown += `## Executive Summary\n\n${report.report.executive_summary}\n\n`;
  }

  if (report.report.background) {
    markdown += `## Background\n\n${report.report.background}\n\n`;
  }

  if (report.report.key_findings?.length > 0) {
    markdown += `## Key Findings\n\n`;
    report.report.key_findings.forEach((finding: string, idx: number) => {
      markdown += `${idx + 1}. ${finding}\n`;
    });
    markdown += `\n`;
  }

  if (report.report.technical_details) {
    markdown += `## Technical Details\n\n${report.report.technical_details}\n\n`;
  }

  if (report.report.opportunities_risks) {
    markdown += `## Opportunities & Risks\n\n${report.report.opportunities_risks}\n\n`;
  }

  if (report.report.applications) {
    markdown += `## Applications\n\n${report.report.applications}\n\n`;
  }

  if (report.report.references?.length > 0) {
    markdown += `## References\n\n`;
    report.report.references.forEach((ref: string, idx: number) => {
      markdown += `${idx + 1}. ${ref}\n`;
    });
    markdown += `\n`;
  }

  if (report.report.research_log?.length > 0) {
    markdown += `## Research Log\n\n`;
    report.report.research_log.forEach((log: any) => {
      markdown += `### Iteration ${log.iteration}\n`;
      markdown += `- **Focus:** ${log.focus}\n`;
      markdown += `- **Findings:** ${log.findings}\n`;
      markdown += `- **Gaps:** ${log.gaps_identified}\n\n`;
    });
  }

  return markdown;
};

// Get token from auth context (this will be used in actions)
const getAuthToken = () => {
  // This is a workaround to get the token outside of React context
  // In a real implementation, you might want to pass the token as a parameter
  return localStorage.getItem("perception_auth_token");
};

export const useChatStore = create<ChatState>((set, get) => ({
  // Initial state
  chats: [],
  currentChatId: null,
  messages: [],
  isLoading: false,
  isStreaming: false,
  streamingContent: "",
  currentEventSource: null,
  agentProgress: [],

  // Load all chats for the user
  loadChats: async () => {
    const token = getAuthToken();
    if (!token) {
      console.error("No authentication token found");
      return;
    }

    try {
      set({ isLoading: true });
      const response = await chatAPI.listChats(token);
      set({ chats: response.chats });
    } catch (error) {
      console.error("Failed to load chats:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  // Create a new chat
  createChat: async (title: string) => {
    const token = getAuthToken();
    if (!token) {
      console.error("No authentication token found");
      return;
    }

    try {
      set({ isLoading: true });
      const newChat = await chatAPI.createChat(title, token);
      set((state) => ({
        chats: [newChat, ...state.chats],
        currentChatId: newChat.id,
        messages: [],
      }));
    } catch (error) {
      console.error("Failed to create chat:", error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Select a chat and load its messages
  selectChat: async (chatId: number) => {
    const token = getAuthToken();
    if (!token) {
      console.error("No authentication token found");
      return;
    }

    try {
      set({ isLoading: true, currentChatId: chatId });
      await get().loadMessages(chatId);
    } catch (error) {
      console.error("Failed to select chat:", error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Update chat title
  updateChat: async (chatId: number, title: string) => {
    const token = getAuthToken();
    if (!token) {
      console.error("No authentication token found");
      return;
    }

    try {
      const updatedChat = await chatAPI.updateChat(chatId, title, token);
      set((state) => ({
        chats: state.chats.map((chat) =>
          chat.id === chatId ? updatedChat : chat
        ),
      }));
    } catch (error) {
      console.error("Failed to update chat:", error);
      throw error;
    }
  },

  // Delete a chat
  deleteChat: async (chatId: number) => {
    const token = getAuthToken();
    if (!token) {
      console.error("No authentication token found");
      return;
    }

    try {
      await chatAPI.deleteChat(chatId, token);
      set((state) => {
        const newChats = state.chats.filter((chat) => chat.id !== chatId);
        const newCurrentId =
          state.currentChatId === chatId
            ? newChats[0]?.id || null
            : state.currentChatId;

        return {
          chats: newChats,
          currentChatId: newCurrentId,
          messages: state.currentChatId === chatId ? [] : state.messages,
        };
      });
    } catch (error) {
      console.error("Failed to delete chat:", error);
      throw error;
    }
  },

  // Load messages for a chat
  loadMessages: async (chatId: number) => {
    const token = getAuthToken();
    if (!token) {
      console.error("No authentication token found");
      return;
    }

    try {
      const response = await chatAPI.getMessages(chatId, token);
      set({ messages: response.messages });
    } catch (error) {
      console.error("Failed to load messages:", error);
      throw error;
    }
  },

  // Send a message and stream the response
  sendMessage: async (content: string) => {
    const { currentChatId, currentEventSource } = get();
    const token = getAuthToken();

    if (!token) {
      console.error("No authentication token found");
      return;
    }

    if (!currentChatId) {
      console.error("No chat selected");
      return;
    }

    // Stop any existing stream
    if (currentEventSource) {
      currentEventSource();
    }

    try {
      set({ isStreaming: true, streamingContent: "", agentProgress: [] });

      // Add user message immediately
      const userMessage: Message = {
        id: Date.now(),
        chat_id: currentChatId,
        user_id: 0, // Will be filled by backend
        role: "user",
        content,
        created_at: new Date().toISOString(),
      };

      set((state) => ({
        messages: [...state.messages, userMessage],
      }));

      // Add initial thinking step
      set((state) => ({
        agentProgress: [
          {
            type: 'thinking',
            message: 'Processing your request...',
            timestamp: Date.now(),
          },
        ],
      }));

      // Stream the response
      const cancelFn = await chatAPI.sendMessageStream(
        currentChatId,
        content,
        token,
        {
          onContent: (content: string) => {
            set((state) => ({
              streamingContent: state.streamingContent + content,
            }));
          },
          onSearchStart: (query: string) => {
            console.log("Search started:", query);
            set((state) => ({
              agentProgress: [
                ...state.agentProgress,
                {
                  type: 'searching',
                  message: 'Searching the web for relevant information',
                  query,
                  timestamp: Date.now(),
                },
              ],
            }));
          },
          onSearchResults: (urls: string[]) => {
            console.log("Search results:", urls);
            set((state) => ({
              agentProgress: [
                ...state.agentProgress,
                {
                  type: 'reading',
                  message: 'Reading and analyzing sources',
                  sources: urls,
                  timestamp: Date.now(),
                },
              ],
            }));
          },
          onToolOutput: (output: any) => {
            console.log("Tool output:", output);
            // Add analyzing step for tool outputs
            set((state) => ({
              agentProgress: [
                ...state.agentProgress,
                {
                  type: 'analyzing',
                  message: 'Analyzing information',
                  timestamp: Date.now(),
                },
              ],
            }));
          },
          onCheckpoint: (checkpointId: string) => {
            console.log("Checkpoint:", checkpointId);
          },
          onEnd: () => {
            // Add the complete assistant message
            const { streamingContent } = get();
            const assistantMessage: Message = {
              id: Date.now() + 1,
              chat_id: currentChatId,
              user_id: 0, // Will be filled by backend
              role: "assistant",
              content: streamingContent,
              created_at: new Date().toISOString(),
            };

            set((state) => ({
              messages: [...state.messages, assistantMessage],
              isStreaming: false,
              streamingContent: "",
              currentEventSource: null,
              agentProgress: [
                ...state.agentProgress,
                {
                  type: 'completed',
                  message: 'Response complete',
                  timestamp: Date.now(),
                },
              ],
            }));

            // Clear progress after a delay
            setTimeout(() => {
              set({ agentProgress: [] });
            }, 2000);
          },
          onError: (error: Error) => {
            console.error("Stream error:", error);
            set({
              isStreaming: false,
              streamingContent: "",
              currentEventSource: null,
              agentProgress: [],
            });
          },
        }
      );

      set({ currentEventSource: cancelFn });
    } catch (error) {
      console.error("Failed to send message:", error);
      set({
        isStreaming: false,
        streamingContent: "",
        currentEventSource: null,
        agentProgress: [],
      });
      throw error;
    }
  },

  // Send a deep research request and stream the response
  sendDeepResearch: async (topic: string, depth: number, iterations: number) => {
    const { currentChatId, currentEventSource } = get();
    const token = getAuthToken();

    if (!token) {
      console.error("No authentication token found");
      return;
    }

    if (!currentChatId) {
      console.error("No chat selected");
      return;
    }

    // Stop any existing stream
    if (currentEventSource) {
      currentEventSource();
    }

    try {
      set({ isStreaming: true, streamingContent: "" });

      // Add user message immediately
      const userMessage: Message = {
        id: Date.now(),
        chat_id: currentChatId,
        user_id: 0,
        role: "user",
        content: `🔬 Deep Research Request: ${topic}\n\n**Parameters:**\n- Depth: ${depth}/5\n- Iterations: ${iterations}`,
        created_at: new Date().toISOString(),
      };

      set((state) => ({
        messages: [...state.messages, userMessage],
      }));

      // Start streaming research
      const url = new URL('/api/v1/deep-research/stream', import.meta.env.VITE_API_URL || 'http://localhost:8000');

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ topic, depth, iterations }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      // Read SSE stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let researchLog: string[] = [];
      let finalReport: any = null;

      const cancelFn = () => {
        reader.cancel();
      };

      set({ currentEventSource: cancelFn });

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);

            try {
              const event = JSON.parse(data);

              switch (event.type) {
                case 'start':
                  set({ streamingContent: `🔬 **Deep Research Started**\n\n${event.message || 'Initializing research...'}\n\n---\n\n` });
                  break;

                case 'iteration':
                  const iterationLog = `**Iteration ${event.iteration}**\n${event.notes}\n\n`;
                  researchLog.push(iterationLog);
                  set((state) => ({
                    streamingContent: state.streamingContent + iterationLog,
                  }));
                  break;

                case 'final':
                  if (event.report) {
                    finalReport = event.report;
                    // Format the final report
                    const formattedReport = formatResearchReport(event.report);
                    set({ streamingContent: formattedReport });
                  }
                  break;

                case 'complete':
                  // Research complete
                  break;

                case 'error':
                  set((state) => ({
                    streamingContent: state.streamingContent + `\n\n❌ **Error:** ${event.message}`,
                  }));
                  break;
              }
            } catch (e) {
              console.error('Failed to parse SSE event:', e);
            }
          }
        }
      }

      // Add the complete assistant message
      const { streamingContent } = get();
      const assistantMessage: Message = {
        id: Date.now() + 1,
        chat_id: currentChatId,
        user_id: 0,
        role: "assistant",
        content: streamingContent,
        created_at: new Date().toISOString(),
      };

      set((state) => ({
        messages: [...state.messages, assistantMessage],
        isStreaming: false,
        streamingContent: "",
        currentEventSource: null,
      }));

    } catch (error) {
      console.error("Failed to perform deep research:", error);
      set({
        isStreaming: false,
        streamingContent: "",
        currentEventSource: null,
      });
      throw error;
    }
  },

  // Stop the current streaming response
  stopStreaming: () => {
    const { currentEventSource } = get();
    if (currentEventSource) {
      currentEventSource();
      set({
        isStreaming: false,
        streamingContent: "",
        currentEventSource: null,
      });
    }
  },

  // Clear the current chat (for new conversations)
  clearCurrentChat: () => {
    set({
      currentChatId: null,
      messages: [],
      isStreaming: false,
      streamingContent: "",
      currentEventSource: null,
      agentProgress: [],
    });
  },

  setMessages: (messages: Message[]) => {
    set({ messages });
  },
}));
