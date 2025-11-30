# Perception AI - Setup & Usage Guide

This guide covers everything you need to get the Perception AI system running, including the backend, frontend, and voice mode features.

## 📋 Prerequisites

- **Node.js** 18+
- **Python** 3.10+
- **PostgreSQL** (Local or Neon.tech)
- **Redis** (Local or Cloud)
- **API Keys**:
  - Groq (LLM)
  - Tavily (Search)
  - OpenAI (Voice Mode - STT/TTS)
  - ElevenLabs (Optional - Voice Mode TTS)

---

## 🚀 Quick Start

### 1. Backend Setup (`/server`)

```bash
cd server

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure Environment
cp .env.example .env
nano .env  # Add your API keys and DB URLs

# Start Server
python main.py
```

**Required `.env` Variables:**
```env
DATABASE_URL=postgresql+asyncpg://...
REDIS_URL=redis://...
GROQ_API_KEY=...
TAVILY_API_KEY=...
OPENAI_API_KEY=...  # For Voice Mode
SECRET_KEY=...      # Generate with: openssl rand -hex 32
```

### 2. Frontend Setup (`/client`)

```bash
cd client

# Install dependencies
npm install

# Configure Environment
cp .env.example .env.local
nano .env.local

# Start Development Server
npm run dev
```

**Required `.env.local` Variables:**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_AUTH_URL=http://localhost:8000/api/v1/auth
```

---

## 🌳 Branch-Your-LLM Setup

To enable the conversation tree features:

### 1. Backend Migration
Run the migration script to create the necessary tables:
```bash
cd server
python migrate_tree_tables.py
```

### 2. Frontend Dependencies
Install ReactFlow for the tree visualization:
```bash
cd client
npm install reactflow
```

### 3. Usage
The feature is automatically enabled.
-   **Initialize**: Opening a chat initializes the tree.
-   **Visualize**: Use the "Tree View" tab in the chat interface.
-   **Branch**: Click the "Fork" button on any message node.

## 🎙️ Voice Mode Setup

To enable the voice interaction feature:

1.  **Get API Keys**:
    -   **OpenAI API Key**: Required for Whisper (STT) and TTS.
    -   **ElevenLabs API Key**: Optional, for higher quality voices.

2.  **Update Backend `.env`**:
    ```env
    OPENAI_API_KEY=sk-...
    ELEVENLABS_API_KEY=...
    ```

3.  **Test It**:
    -   Open the app.
    -   Click the **Microphone icon** in the chat input.
    -   Speak to the agent!

---

---

## 🔬 Deep Research Setup

Deep Research Mode is pre-configured but requires specific API keys.

### 1. Prerequisites
Ensure these keys are in your `server/.env`:
```env
GROQ_API_KEY=...    # Required for LLM reasoning
TAVILY_API_KEY=...  # Required for web search
```

### 2. Usage
-   **Frontend**: Navigate to `/deep-research` (e.g., `http://localhost:5173/deep-research`).
-   **Configuration**:
    -   **Topic**: Enter your research question.
    -   **Depth** (1-5): Controls analysis detail (1=Overview, 5=Deep Dive).
    -   **Iterations** (1-10): Controls thoroughness (more iterations = more evidence).

### 3. API Usage
```bash
curl -X POST http://localhost:8000/api/v1/deep-research/stream \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Quantum Computing",
    "depth": 3,
    "iterations": 3
  }'
```

## 🧪 Testing & Verification

### Health Check
```bash
curl http://localhost:8000/health
```

### Manual API Testing (cURL)

**1. Signup**
```bash
curl -X POST http://localhost:8000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"Test123!"}'
```

**2. Create Chat**
```bash
# Replace TOKEN with your access token
curl -X POST http://localhost:8000/api/v1/chats \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Chat"}'
```

**3. Send Message (Streaming)**
```bash
curl -N -X POST http://localhost:8000/api/v1/chats/{chat_id}/message \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"Hello AI"}'
```

**4. Test Voice Synthesis**
```bash
curl -X POST http://localhost:8000/api/v1/voice/synthesize \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello world"}' --output test.mp3
```

---

## 🔧 Troubleshooting

### Common Issues

**1. "Microphone access denied"**
- Check browser permissions.
- Ensure you are serving over localhost or HTTPS.

**2. "Connection refused"**
- Verify backend is running on port 8000.
- Verify Redis is running on port 6379.

**3. "Transcription failed"**
- Check `OPENAI_API_KEY` in `server/.env`.
- Check server logs for API errors.

**4. Database Errors**
- Ensure `DATABASE_URL` is correct.
- Run migrations: `alembic upgrade head` (if applicable).

### Useful Commands

```bash
# Clear Redis Cache
redis-cli FLUSHALL

# Reset Database (Python Shell)
from app.db.init_db import reset_db
import asyncio
asyncio.run(reset_db())
```
