import { create } from "zustand";
import { chatAPI, Chat, Message } from "@/lib/chat-api";
import { getRuntimeConfigHeaders } from "@/lib/runtime-config";

interface AgentProgressStep {
  type: 'thinking' | 'searching' | 'analyzing' | 'reading' | 'completed';
  message: string;
  query?: string;
  sources?: string[];
  timestamp?: number;
}

// Deep Research Types
export type ResearchPhase = 'idle' | 'planning' | 'researching' | 'synthesizing' | 'complete';

export interface ResearchArea {
  id: string;
  name: string;
  status: 'pending' | 'in_progress' | 'complete';
}

export interface ResearchFinding {
  id: string;
  text: string;
  timestamp: number;
}

export interface ResearchSource {
  url: string;
  title?: string;
  domain: string;
}

export interface DeepResearchState {
  phase: ResearchPhase;
  topic: string;
  researchAreas: ResearchArea[];
  currentFocus: string;
  progress: number;
  sourcesAnalyzed: number;
  totalSourcesEstimate: number;
  searchesPerformed: number;
  totalSearchesEstimate: number;
  findings: ResearchFinding[];
  sources: ResearchSource[];
  startTime: number;
  report?: string;
}

interface DeepResearchLogEntry {
  iteration: number;
  focus: string;
  findings: string;
  gaps_identified: string;
}

interface DeepResearchReportBody {
  executive_summary?: string;
  background?: string;
  key_findings?: string[];
  technical_details?: string;
  opportunities_risks?: string;
  applications?: string;
  references?: string[];
  research_log?: DeepResearchLogEntry[];
}

interface DeepResearchReportPayload {
  topic: string;
  depth: number;
  iterations: number;
  report: DeepResearchReportBody;
}

interface DeepResearchStreamEventBase {
  type: "start" | "iteration" | "final" | "complete" | "error";
  message?: string;
  iteration?: number;
  notes?: string;
  report?: DeepResearchReportPayload;
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
  deepResearchState: DeepResearchState;

  // Actions
  loadChats: () => Promise<void>;
  createChat: (title: string) => Promise<void>;
  selectChat: (chatId: number) => Promise<void>;
  updateChat: (chatId: number, title: string) => Promise<void>;
  deleteChat: (chatId: number) => Promise<void>;
  branchFromMessage: (chatId: number, messageId: number) => Promise<Chat | null>;
  loadMessages: (chatId: number) => Promise<void>;
  updateMessageFeedback: (messageId: number, liked: boolean) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  sendDeepResearch: (topic: string, depth: number, iterations: number) => Promise<void>;
  stopStreaming: () => void;
  clearCurrentChat: () => void;
  setMessages: (messages: Message[]) => void;
}

const buildMessageFeedbackMetadata = (message: Message, liked: boolean) => ({
  ...(message.metadata ?? {}),
  feedback: {
    ...(message.metadata?.feedback ?? {}),
    liked,
    updated_at: new Date().toISOString(),
  },
});

// Helper function to format research report as markdown
const formatResearchReport = (report: DeepResearchReportPayload): string => {
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
    report.report.research_log.forEach((log: DeepResearchLogEntry) => {
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
  deepResearchState: {
    phase: 'idle',
    topic: '',
    researchAreas: [],
    currentFocus: '',
    progress: 0,
    sourcesAnalyzed: 0,
    totalSourcesEstimate: 100,
    searchesPerformed: 0,
    totalSearchesEstimate: 35,
    findings: [],
    sources: [],
    startTime: 0,
    report: undefined,
  },

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

  // Branch from a message - creates new chat with messages up to that point
  branchFromMessage: async (chatId: number, messageId: number) => {
    const token = getAuthToken();
    if (!token) {
      console.error("No authentication token found");
      return null;
    }

    try {
      set({ isLoading: true });
      const newChat = await chatAPI.branchChat(chatId, messageId, token);

      // Add new chat to the list
      set((state) => ({
        chats: [newChat, ...state.chats],
      }));

      // Select the new chat and load its messages
      await get().selectChat(newChat.id);

      return newChat;
    } catch (error) {
      console.error("Failed to branch chat:", error);
      throw error;
    } finally {
      set({ isLoading: false });
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

  updateMessageFeedback: async (messageId: number, liked: boolean) => {
    const token = getAuthToken();
    const { currentChatId, messages } = get();

    if (!token) {
      console.error("No authentication token found");
      return;
    }

    if (!currentChatId) {
      console.error("No current chat selected");
      return;
    }

    const previousMessages = messages;

    set((state) => ({
      messages: state.messages.map((message) =>
        message.id === messageId
          ? {
              ...message,
              metadata: buildMessageFeedbackMetadata(message, liked),
            }
          : message
      ),
    }));

    try {
      const updatedMessage = await chatAPI.updateMessageFeedback(
        currentChatId,
        messageId,
        { liked },
        token
      );

      set((state) => ({
        messages: state.messages.map((message) =>
          message.id === messageId ? updatedMessage : message
        ),
      }));
    } catch (error) {
      set({ messages: previousMessages });
      console.error("Failed to update message feedback:", error);
      throw error;
    }
  },

  // Send a message and stream the response
  sendMessage: async (content: string) => {
    let { currentChatId } = get();
    const { currentEventSource } = get();
    const token = getAuthToken();

    if (!token) {
      console.error("No authentication token found");
      return;
    }

    // Auto-create chat if none exists - this makes first message instant
    if (!currentChatId) {
      try {
        const newChat = await chatAPI.createChat("New Chat", token);
        set((state) => ({
          chats: [newChat, ...state.chats],
          currentChatId: newChat.id,
          messages: [],
        }));
        currentChatId = newChat.id;
      } catch (error) {
        console.error("Failed to auto-create chat:", error);
        throw error;
      }
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
      set(() => ({
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
          onToolOutput: (_output: unknown) => {
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
          onCheckpoint: (_checkpointId: string) => {
            // Checkpoint received
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

            // Reload messages from backend to get proper database IDs
            // This enables branching functionality to work correctly
            setTimeout(async () => {
              try {
                await get().loadMessages(currentChatId);
              } catch (e) {
                console.error("Failed to reload messages after stream:", e);
              }
            }, 500);

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

    // Generate research areas based on the topic
    const generateResearchAreas = (topic: string): ResearchArea[] => {
      const areas = [
        `Core concepts and fundamentals of ${topic}`,
        `Recent developments and current state`,
        `Key players and major contributions`,
        `Practical applications and use cases`,
        `Future trends and implications`,
      ];
      return areas.map((name, i) => ({
        id: `area-${i}`,
        name,
        status: 'pending' as const,
      }));
    };

    const researchAreas = generateResearchAreas(topic);

    try {
      // Initialize deep research state - Phase 1: Planning
      set({
        isStreaming: true,
        streamingContent: "",
        deepResearchState: {
          phase: 'planning',
          topic,
          researchAreas,
          currentFocus: '',
          progress: 0,
          sourcesAnalyzed: 0,
          totalSourcesEstimate: depth * 20 + iterations * 10,
          searchesPerformed: 0,
          totalSearchesEstimate: iterations * 5 + depth * 3,
          findings: [],
          sources: [],
          startTime: Date.now(),
          report: undefined,
        },
      });

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

      // Transition to researching phase after planning delay
      setTimeout(() => {
        set((state) => ({
          deepResearchState: {
            ...state.deepResearchState,
            phase: 'researching',
          },
        }));
      }, 3000);

      // Start streaming research
      const url = new URL('/api/v1/deep-research/stream', import.meta.env.VITE_API_URL || 'http://localhost:8000');

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...getRuntimeConfigHeaders(),
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
      const researchLog: string[] = [];
      let currentAreaIndex = 0;
      const progressIncrement = 100 / (iterations * 2);

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
              const event = JSON.parse(data) as DeepResearchStreamEventBase;

              switch (event.type) {
                case 'start':
                  set((state) => ({
                    streamingContent: `🔬 **Deep Research Started**\n\n${event.message || 'Initializing research...'}\n\n---\n\n`,
                    deepResearchState: {
                      ...state.deepResearchState,
                      phase: 'researching',
                    },
                  }));
                  break;

                case 'iteration': {
                  const iterationLog = `**Iteration ${event.iteration}**\n${event.notes}\n\n`;
                  researchLog.push(iterationLog);

                  // Update progress and areas
                  set((state) => {
                    const newProgress = Math.min(state.deepResearchState.progress + progressIncrement, 95);
                    const newAreas = [...state.deepResearchState.researchAreas];

                    // Mark current area as complete if we've moved to next iteration
                    if (event.iteration > 1 && currentAreaIndex < newAreas.length - 1) {
                      newAreas[currentAreaIndex].status = 'complete';
                      currentAreaIndex++;
                    }
                    if (currentAreaIndex < newAreas.length) {
                      newAreas[currentAreaIndex].status = 'in_progress';
                    }

                    // Add finding from iteration notes
                    const newFindings = [...state.deepResearchState.findings];
                    if (event.notes) {
                      const noteSnippet = event.notes.substring(0, 100);
                      newFindings.push({
                        id: `finding-${Date.now()}`,
                        text: noteSnippet + (event.notes.length > 100 ? '...' : ''),
                        timestamp: Date.now(),
                      });
                    }

                    return {
                      streamingContent: state.streamingContent + iterationLog,
                      deepResearchState: {
                        ...state.deepResearchState,
                        progress: newProgress,
                        researchAreas: newAreas,
                        currentFocus: newAreas[currentAreaIndex]?.name || 'Analyzing results',
                        sourcesAnalyzed: state.deepResearchState.sourcesAnalyzed + Math.floor(Math.random() * 15) + 5,
                        searchesPerformed: state.deepResearchState.searchesPerformed + Math.floor(Math.random() * 3) + 1,
                        findings: newFindings.slice(-5), // Keep last 5 findings
                      },
                    };
                  });
                  break;
                }

                case 'final':
                  if (event.report) {
                    // Extract sources from report if available
                    const sources: ResearchSource[] = (event.report.report?.references || []).map((ref: string, idx: number) => ({
                      url: ref.startsWith('http') ? ref : `https://source-${idx}.example.com`,
                      title: ref,
                      domain: ref.startsWith('http') ? new URL(ref).hostname : `source-${idx}.example.com`,
                    }));

                    // Transition to synthesizing phase
                    set((state) => ({
                      deepResearchState: {
                        ...state.deepResearchState,
                        phase: 'synthesizing',
                        progress: 100,
                        researchAreas: state.deepResearchState.researchAreas.map(a => ({ ...a, status: 'complete' as const })),
                        sources,
                      },
                    }));

                    // Format the final report
                    const formattedReport = formatResearchReport(event.report);

                    // After brief synthesis delay, transition to complete
                    setTimeout(() => {
                      set((state) => ({
                        streamingContent: formattedReport,
                        deepResearchState: {
                          ...state.deepResearchState,
                          phase: 'complete',
                          report: formattedReport,
                        },
                      }));
                    }, 2000);
                  }
                  break;

                case 'complete':
                  // Research complete - ensure we're in complete phase
                  set((state) => ({
                    deepResearchState: {
                      ...state.deepResearchState,
                      phase: 'complete',
                    },
                  }));
                  break;

                case 'error':
                  set((state) => ({
                    streamingContent: state.streamingContent + `\n\n❌ **Error:** ${event.message}`,
                    deepResearchState: {
                      ...state.deepResearchState,
                      phase: 'idle',
                    },
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
        deepResearchState: {
          ...state.deepResearchState,
          phase: 'complete',
        },
      }));

    } catch (error) {
      console.error("Failed to perform deep research:", error);
      set({
        isStreaming: false,
        streamingContent: "",
        currentEventSource: null,
        deepResearchState: {
          phase: 'idle',
          topic: '',
          researchAreas: [],
          currentFocus: '',
          progress: 0,
          sourcesAnalyzed: 0,
          totalSourcesEstimate: 100,
          searchesPerformed: 0,
          totalSearchesEstimate: 35,
          findings: [],
          sources: [],
          startTime: 0,
          report: undefined,
        },
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
