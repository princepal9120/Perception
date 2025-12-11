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
2.  **Open Tree View**: Click the **GitBranch icon** (🌿) in the top-right header.
3.  **Sync**: If asked, click **"Sync Chat to Tree"** to visualize your current conversation.
4.  **Explore**: Use the interactive tree to navigate different conversation paths.

*Note: Some advanced branching features are currently in beta.*

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

## 📊 Real-Time Progress Tracking

We've implemented **real-time progress tracking** for both Deep Research mode and regular chat, providing users with transparent visibility into what the AI is doing at every step.

### 🔬 Deep Research Tracking
Shows detailed, step-by-step progress during deep research iterations:
- **Searching** 🔍: Web search with query display and source counts.
- **Extracting** 📄: Claim extraction from sources.
- **Verifying** ✅: Evidence-based claim verification.
- **Analyzing** 🧠: Knowledge gap analysis.
- **Synthesizing** ✨: Final report generation.

### 💬 Chat Progress Tracking
Shows real-time agent actions during regular chat conversations:
- **Thinking** 🧠: Processing your request.
- **Searching** 🔍: Web search with actual queries.
- **Reading** 📄: Analyzing sources (shows domains).
- **Analyzing** 🧠: Processing information.
- **Completed** ✅: Task finished.

*The UI features smooth animations, color-coded steps, and detailed data display (source counts, actual queries, etc.) to build trust and engagement.*

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
