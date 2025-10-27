# Chat Feature Architecture

This document describes the industry-level architecture of the chat feature implementation.

## 📁 Project Structure

```
client/src/
├── lib/
│   └── chat-api.ts              # API client for chat streaming
├── services/
│   └── chat.service.ts          # Business logic layer
├── store/
│   └── chatStore.ts             # Global state management (Zustand)
├── hooks/
│   └── use-chat.ts              # Custom React hook for chat
└── components/
    └── chat/
        ├── ChatInput.tsx        # Message input component
        ├── ChatMessages.tsx     # Messages display component
        ├── ChatHeader.tsx       # Chat header component
        ├── ChatSidebar.tsx      # Conversations sidebar
        ├── SearchInfoDisplay.tsx # Search metadata display
        ├── MarkdownMessage.tsx  # Markdown rendering
        └── TypingIndicator.tsx  # Loading indicator
```

## 🏗️ Architecture Layers

### 1. API Layer (`lib/chat-api.ts`)

**Responsibility**: Direct communication with the backend API

- ✅ Handles SSE (Server-Sent Events) connections
- ✅ Parses and types event data
- ✅ Provides callback-based streaming interface
- ✅ No business logic - pure API communication

**Key Features**:

```typescript
// Type-safe event handling
type EventData = CheckpointEventData | ContentEventData | ...

// Callback-based streaming
interface StreamCallbacks {
  onContent: (content: string) => void;
  onSearchStart: (query: string) => void;
  // ... more callbacks
}

// Simple API interface
chatAPI.streamChat(message, checkpointId, callbacks)
```

### 2. Service Layer (`services/chat.service.ts`)

**Responsibility**: Business logic and stream management

- ✅ Manages multiple active streams
- ✅ Handles stream lifecycle (start/stop/cancel)
- ✅ Provides error handling
- ✅ Tracks active conversations
- ✅ Singleton pattern for global access

**Key Features**:

```typescript
// Singleton service
const chatService = ChatService.getInstance();

// Stream management
chatService.startStream(conversationId, message, checkpointId, callbacks);
chatService.cancelStream(conversationId);
chatService.cancelAllStreams();
```

### 3. State Management (`store/chatStore.ts`)

**Responsibility**: Global state management with Zustand

- ✅ Manages conversations and messages
- ✅ Handles streaming state
- ✅ Stores checkpoint IDs for conversation continuity
- ✅ Manages search metadata
- ✅ Provides actions for state updates

**Key Features**:

```typescript
interface ChatState {
  // State
  conversations: Conversation[];
  isStreaming: boolean;
  streamingMessage: string;
  streamingSearchInfo: SearchInfo | null;
  checkpointId: string | null;

  // Actions
  sendMessage: (message: string) => Promise<void>;
  stopStreaming: () => void;
  // ... more actions
}
```

### 4. Custom Hook (`hooks/use-chat.ts`)

**Responsibility**: Clean interface for components

- ✅ Encapsulates store logic
- ✅ Provides user-friendly methods
- ✅ Handles toast notifications
- ✅ Validates user actions
- ✅ Simplifies component code

**Usage in Components**:

```typescript
const { messages, isStreaming, sendMessage, stopStreaming } = useChat();
```

### 5. UI Components (`components/chat/`)

**Responsibility**: Presentation and user interaction

- ✅ Clean, focused components
- ✅ No business logic
- ✅ Uses custom hooks
- ✅ Handles user input
- ✅ Displays streaming responses

## 🔄 Data Flow

### Sending a Message:

```
User Input (ChatInput.tsx)
    ↓
Custom Hook (use-chat.ts)
    ↓
Store Action (chatStore.ts → sendMessage)
    ↓
API Layer (chat-api.ts → streamChat)
    ↓
Backend API (SSE Stream)
    ↓
Callbacks (Store updates state)
    ↓
UI Updates (ChatMessages.tsx)
```

### Streaming Response Flow:

```
Backend SSE Events
    ↓
API Layer Callbacks
    ├─→ onContent → Update streamingMessage
    ├─→ onSearchStart → Create searchInfo
    ├─→ onSearchResults → Update searchInfo
    ├─→ onCheckpoint → Save checkpointId
    └─→ onEnd → Finalize message
```

## 🎯 Key Features

### 1. **Type Safety**

- TypeScript interfaces for all data structures
- Strongly typed event handling
- Type-safe callbacks

### 2. **Real-time Streaming**

- Server-Sent Events (SSE) for streaming
- Incremental content updates
- Live search metadata display

### 3. **Search Integration**

- Search query tracking
- URL source display
- Stage-based progress indicators
- Error handling for failed searches

### 4. **Conversation Continuity**

- Checkpoint system for maintaining context
- Multiple conversation support
- Conversation history

### 5. **Error Handling**

- Graceful degradation
- User-friendly error messages
- Automatic recovery

### 6. **Performance Optimizations**

- Singleton service pattern
- Efficient state updates
- Memoized callbacks
- Auto-scroll optimization

## 🔧 Configuration

### Environment Variables (`.env.local`):

```bash
VITE_API_URL=http://localhost:8002
VITE_AUTH_URL=http://localhost:8002/api/v1/auth
```

### API Endpoint:

```
GET /chat_stream/:message?checkpoint_id=xyz
```

## 📊 State Structure

### Message Interface:

```typescript
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  searchInfo?: SearchInfo; // Optional search metadata
}
```

### Search Info:

```typescript
interface SearchInfo {
  stages: string[]; // ['searching', 'reading', 'writing']
  query: string; // Search query
  urls: string[]; // Source URLs
  error?: string; // Optional error message
}
```

### Conversation:

```typescript
interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}
```

## 🚀 Usage Example

### Basic Message Sending:

```typescript
import { useChat } from '@/hooks/use-chat';

function ChatComponent() {
  const { sendMessage, messages, isStreaming } = useChat();

  const handleSubmit = async (text: string) => {
    await sendMessage(text);
  };

  return (
    // ... UI code
  );
}
```

### Stop Streaming:

```typescript
const { stopStreaming, isStreaming } = useChat();

if (isStreaming) {
  stopStreaming();
}
```

### New Conversation:

```typescript
const { newConversation } = useChat();

const handleNew = () => {
  newConversation();
};
```

## 🔐 Best Practices

1. **Separation of Concerns**

   - API layer handles only HTTP communication
   - Service layer contains business logic
   - Store manages state
   - Hooks provide component interface
   - Components handle UI only

2. **Error Handling**

   - Try-catch blocks in async operations
   - User-friendly error messages
   - Graceful degradation
   - Console logging for debugging

3. **Type Safety**

   - Define interfaces for all data structures
   - Use TypeScript strict mode
   - Type all function parameters and returns

4. **Performance**

   - Use useCallback for event handlers
   - Memoize expensive computations
   - Clean up resources (EventSource)
   - Efficient re-renders with proper dependencies

5. **User Experience**
   - Loading states
   - Error feedback
   - Optimistic updates
   - Smooth animations

## 🧪 Testing Considerations

### Unit Tests:

- Test store actions independently
- Mock API calls
- Test callback handling
- Validate state updates

### Integration Tests:

- Test component + hook integration
- Test streaming flow
- Test error scenarios
- Test conversation management

### E2E Tests:

- Full user flow
- Message sending and receiving
- Conversation switching
- Search functionality

## 📈 Future Enhancements

- [ ] Message editing
- [ ] Message regeneration
- [ ] Export conversations
- [ ] Search within conversations
- [ ] File attachments
- [ ] Voice input
- [ ] Message reactions
- [ ] Collaborative conversations
- [ ] Offline support
- [ ] Message persistence

## 🐛 Debugging Tips

1. **Check Console Logs**:

   - API layer logs all events
   - Service layer logs stream lifecycle

2. **Verify Environment Variables**:

   - Ensure VITE_API_URL is correct
   - Check backend server is running

3. **Monitor Network Tab**:

   - Check SSE connection status
   - Verify event stream data

4. **Use React DevTools**:
   - Inspect Zustand store state
   - Check component re-renders

## 📝 Notes

- This implementation follows React best practices
- Uses modern React patterns (hooks, functional components)
- Scalable and maintainable architecture
- Production-ready code structure
- Comprehensive error handling
- Type-safe throughout
