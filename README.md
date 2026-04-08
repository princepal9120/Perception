# Perception

Perception is an open-source deep research and agentic search workspace.

It combines:
- chat with tool use and streaming output
- Deep Research with iterative web search and citations
- document-grounded retrieval
- branching conversation trees
- optional voice and MCP integrations

The OSS-first default path is:
- `AUTH_MODE=disabled`
- `MODEL_PROVIDER=openai_compatible`
- `SEARCH_PROVIDER=duckduckgo`

That means a new user can run the app locally without Clerk, point it at their own OpenAI-compatible endpoint, and try one flagship workflow immediately.

## Why Perception

Perception is designed for people who want a research workspace they can:
- self-host
- inspect and extend
- connect to their own model stack
- use for evidence-backed research flows instead of generic chat only

## Flagship Demo

Try this first after setup:

1. Start the backend and frontend.
2. Open `/chat`.
3. Launch **Deep Research** from the chat input.
4. Ask a question like `Compare local LLM hosting options for private document analysis`.
5. Watch the live search, extraction, verification, and synthesis steps.

## Reference Stack

### Backend
- FastAPI
- LangGraph
- SQLModel / PostgreSQL
- Redis / Upstash

### Frontend
- React + Vite
- Tailwind + shadcn/ui
- Zustand
- React Flow

### Configurable Providers
- Auth: disabled, JWT, Clerk
- Chat model: OpenAI-compatible, Groq, Google
- Embeddings: OpenAI-compatible, Google
- Search: DuckDuckGo, Tavily, both

## Quick Start

See [SETUP.md](./SETUP.md) for the full guide.

### 1. Backend

```bash
cd server
cp .env.example .env
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py
```

### 2. Frontend

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

## Minimum OSS Config

### `server/.env`

```env
AUTH_MODE=disabled
MODEL_PROVIDER=openai_compatible
EMBEDDING_PROVIDER=openai_compatible
SEARCH_PROVIDER=duckduckgo

DATABASE_URL=postgresql+asyncpg://...
SECRET_KEY=replace-me
SESSION_SECRET_KEY=replace-me

OPENAI_API_KEY=replace-me
OPENAI_API_BASE_URL=http://localhost:11434/v1
OPENAI_MODEL=qwen2.5:14b-instruct
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
```

### `client/.env`

```env
VITE_API_URL=http://localhost:8000/api/v1
VITE_AUTH_MODE=disabled
VITE_LOCAL_AUTH_TOKEN=perception-local-dev-token
```

## Docs

- [SETUP.md](./SETUP.md): local setup and provider configuration
- [ARCHITECTURE.md](./ARCHITECTURE.md): system structure and data flow
- [ROADMAP.md](./ROADMAP.md): current OSS roadmap
- [CONTRIBUTING.md](./CONTRIBUTING.md): contributor workflow

## Current Scope

The current OSS MVP focuses on:
- local-first setup
- BYO-model support
- configurable search providers
- Deep Research as the primary showcase workflow

Explicitly deferred for now:
- full plugin ecosystem
- broad vector database abstraction
- broader voice-provider abstraction
- commercial pricing and team-workspace features

## License

MIT
