# Perception Setup

This guide is for the OSS-first local path.

## Prerequisites

- Node.js 20+
- Python 3.12+
- PostgreSQL
- Optional Redis
- An OpenAI-compatible model endpoint or API

## Recommended Local Mode

Use this mode unless you specifically need hosted auth:

```env
AUTH_MODE=disabled
MODEL_PROVIDER=openai_compatible
EMBEDDING_PROVIDER=openai_compatible
SEARCH_PROVIDER=duckduckgo
```

## Backend

```bash
cd server
cp .env.example .env
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py
```

### Required backend env

```env
DATABASE_URL=postgresql+asyncpg://user:password@host/db
SECRET_KEY=replace-me
SESSION_SECRET_KEY=replace-me

AUTH_MODE=disabled
MODEL_PROVIDER=openai_compatible
EMBEDDING_PROVIDER=openai_compatible
SEARCH_PROVIDER=duckduckgo

OPENAI_API_KEY=replace-me
OPENAI_API_BASE_URL=http://localhost:11434/v1
OPENAI_MODEL=qwen2.5:14b-instruct
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
```

### Optional backend env

```env
TAVILY_API_KEY=
CLERK_SECRET_KEY=
CLERK_PUBLISHABLE_KEY=
OPENAI_API_KEY=
ELEVENLABS_API_KEY=
```

## Frontend

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

### Required frontend env

```env
VITE_API_URL=http://localhost:8000/api/v1
VITE_AUTH_MODE=disabled
VITE_LOCAL_AUTH_TOKEN=perception-local-dev-token
```

### Clerk mode

If you want hosted auth:

```env
VITE_AUTH_MODE=clerk
VITE_CLERK_PUBLISHABLE_KEY=pk_...
```

And on the backend:

```env
AUTH_MODE=clerk
CLERK_SECRET_KEY=sk_...
CLERK_PUBLISHABLE_KEY=pk_...
```

## First Demo

1. Open `http://localhost:5173/chat`
2. Start a new conversation
3. Click the Deep Research button
4. Ask a question that benefits from web search
5. Confirm the response shows research progress and a synthesized report

## Provider Notes

### Chat model

- `MODEL_PROVIDER=openai_compatible`
- `MODEL_PROVIDER=groq`
- `MODEL_PROVIDER=google`

### Embeddings

- `EMBEDDING_PROVIDER=openai_compatible`
- `EMBEDDING_PROVIDER=google`

### Search

- `SEARCH_PROVIDER=duckduckgo`
- `SEARCH_PROVIDER=tavily`
- `SEARCH_PROVIDER=both`

## Verification

Run these after setup:

```bash
# frontend
cd client
npm run lint
npm run test
npm run build

# backend
cd server
pytest -q
```

## Troubleshooting

### Frontend fails because Clerk key is missing

Set:

```env
VITE_AUTH_MODE=disabled
```

### Backend returns 401 in local mode

Set:

```env
AUTH_MODE=disabled
```

### Deep Research cannot search

Start with:

```env
SEARCH_PROVIDER=duckduckgo
```

Then add `TAVILY_API_KEY` later if you want higher-quality search results.
