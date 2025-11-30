# Perception AI

**Perception AI** is a production-ready, full-stack conversational AI platform. It features a modern React frontend, a robust FastAPI backend, and advanced agentic capabilities powered by LangGraph.

## 🌟 Key Features

- **Advanced Chat Interface**:
  - Real-time streaming responses (SSE).
  - Markdown support, code highlighting, and typing indicators.
  - Persistent chat history and session management.
- **Voice Mode** 🎙️:
  - Hands-free voice interaction.
  - Real-time Speech-to-Text (Whisper) and Text-to-Speech (OpenAI/ElevenLabs).
  - Modern, animated voice overlay.
- **Agentic Intelligence**:
  - Powered by **LangGraph** for complex reasoning.
  - Integrated tools for web search and calculation.
  - Context-aware conversations with long-term memory.
- **Secure & Scalable**:
  - JWT Authentication (Access/Refresh tokens).
  - Redis caching and rate limiting.
  - PostgreSQL database with async support.
- **Branch-Your-LLM** 🌳:
  - **Non-linear Conversations**: Fork chats at any point to explore alternative paths.
  - **Tree Visualization**: Interactive graph view of your entire conversation history.
  - **Context Management**: Each branch maintains its own independent context.
  - **Regeneration**: Get multiple AI responses for the same prompt and compare them.

## 🌳 Branch-Your-LLM Guide

The **Branch-Your-LLM** system transforms linear chats into powerful conversation trees.

### Key Features
- **Fork**: Create a new branch from any message to explore a different direction.
- **Tree View**: Switch to the "Tree" tab to see the full conversation graph.
- **Navigate**: Click any node in the tree to jump to that point in the conversation.
- **Regenerate**: Create sibling nodes to compare different AI responses.

### How to Use
1.  **Start a Chat**: Begin a conversation as usual.
2.  **Fork**: Click the **⋮** menu on any message and select "Fork Branch".
3.  **Visualize**: Click the **Tree View** tab to see your branches.
4.  **Explore**: Click different nodes to switch contexts.

*For setup instructions, see [SETUP.md](./SETUP.md).*

## 🔬 Deep Research Mode

**Deep Research Mode** is an advanced AI-powered research feature that performs iterative, evidence-backed research.

### Key Features
-   **Iterative Research**: Performs multiple rounds of research to deepen understanding.
-   **Evidence-Backed**: Extracts and verifies claims against real-world sources (Tavily).
-   **Gap Analysis**: Automatically identifies missing information and generates new queries.
-   **Structured Reports**: Generates comprehensive JSON reports with executive summaries, findings, and references.

### How to Use
1.  **Navigate**: Go to `/deep-research` in the application.
2.  **Configure**:
    -   **Topic**: Enter your research question.
    -   **Depth** (1-5): Set the level of detail.
    -   **Iterations** (1-10): Set the thoroughness.
3.  **Start**: Click "Start Research" and watch the real-time progress.

## 📚 Documentation

We have organized the documentation into the following guides:

- **[SETUP.md](./SETUP.md)**: Installation, configuration, and getting started guide.
- **[ARCHITECTURE.md](./ARCHITECTURE.md)**: Detailed system architecture, diagrams, and data flow.

## 🛠️ Tech Stack

### Frontend (`/client`)
- **Framework**: Next.js / React
- **Styling**: Tailwind CSS, Shadcn UI
- **State**: Zustand
- **API**: Axios, EventSource

### Backend (`/server`)
- **Framework**: FastAPI
- **Database**: PostgreSQL (SQLModel), Redis
- **AI**: LangGraph, Groq (Llama 3), OpenAI (Whisper/TTS)
- **Auth**: Python-JOSE (JWT), Passlib (Bcrypt)

## 🚀 Quick Start

```bash
# 1. Start Backend
cd server
python main.py

# 2. Start Frontend
cd client
npm run dev
```

*For detailed instructions, see [SETUP.md](./SETUP.md).*

## 📄 License

MIT License
