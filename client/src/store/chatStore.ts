import { create } from 'zustand';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
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
  
  // Actions
  createNewConversation: () => void;
  selectConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  updateStreamingMessage: (content: string) => void;
  setIsStreaming: (isStreaming: boolean) => void;
  finalizeStreamingMessage: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [
    {
      id: '1',
      title: 'AI Research Best Practices',
      messages: [
        {
          id: 'm1',
          role: 'assistant',
          content: "Hello! I'm your AI research copilot. I can help you with web searches, document analysis, and complex research tasks. What would you like to explore today?",
          timestamp: new Date(Date.now() - 7200000),
        },
      ],
      createdAt: new Date(Date.now() - 7200000),
      updatedAt: new Date(Date.now() - 7200000),
    },
  ],
  currentConversationId: '1',
  isStreaming: false,
  streamingMessage: '',

  createNewConversation: () => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: 'New Conversation',
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
      const newCurrentId = state.currentConversationId === id 
        ? (filtered[0]?.id || null)
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
          const title = conv.title === 'New Conversation' && updatedMessages.length === 1
            ? message.content.slice(0, 50) + (message.content.length > 50 ? '...' : '')
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

  setIsStreaming: (isStreaming: boolean) => {
    set({ isStreaming });
  },

  finalizeStreamingMessage: () => {
    const { streamingMessage, addMessage } = get();
    if (streamingMessage) {
      addMessage({ role: 'assistant', content: streamingMessage });
      set({ streamingMessage: '', isStreaming: false });
    }
  },
}));
