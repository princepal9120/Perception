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
