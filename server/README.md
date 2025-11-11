# Perception AI Chat API - Backend

A production-ready FastAPI backend for an AI chatbot with JWT authentication, session-based chat management, and persistent storage using PostgreSQL and Redis. Integrates with LangGraph for advanced conversational AI capabilities.

## 🎯 Features

### Authentication

- **JWT-based authentication** with access (15min) and refresh (7d) tokens
- **Secure password hashing** using bcrypt
- **Input validation** for email, username, and password strength
- **Protected routes** with automatic token verification

### Chat Management

- **Session-based conversations** with persistent storage
- **Redis caching** for latest 100 messages per chat
- **Rate limiting** (20 messages/minute/user)
- **Ownership checks** for all chat operations
- **Full CRUD operations** for chats and messages

### LangGraph Integration

- **Streaming responses** via Server-Sent Events (SSE)
- **Tool execution** with search and calculation capabilities
- **Checkpoint management** for conversation continuity
- **PostgreSQL checkpointing** for stateful conversations

### Performance

- **Async/await** throughout for optimal performance
- **Connection pooling** for database efficiency
- **Redis caching** to reduce database load
- **Streaming responses** for real-time user experience

## 🏗️ Architecture

```
server/
├── core/                    # Core configuration and security
│   ├── config.py           # Settings and environment variables
│   ├── security.py         # JWT, password hashing
│   └── dependencies.py     # FastAPI dependencies
├── db/                      # Database layer
│   ├── session.py          # SQLAlchemy async session
│   ├── init_db.py          # Database initialization
│   └── migrations/         # Database migrations (Alembic)
├── models/                  # Data models
│   ├── tables.py           # SQLModel database tables
│   └── schemas.py          # Pydantic request/response schemas
├── services/                # Business logic
│   ├── redis_utils.py      # Redis operations
│   ├── chat_service.py     # Chat/message management
│   └── llm_client.py       # LangGraph integration
├── routes/                  # API endpoints
│   ├── auth_routes.py      # Authentication endpoints
│   └── chat_routes.py      # Chat endpoints
├── main.py                  # FastAPI application
├── tools.py                 # LangGraph tools
├── requirements.txt         # Python dependencies
└── .env.example            # Environment variables template
```

## 📦 Tech Stack

- **FastAPI** - Modern async web framework
- **PostgreSQL** (Neon.tech) - Primary database with asyncpg
- **SQLModel** - SQL database ORM built on SQLAlchemy and Pydantic
- **Redis** - Caching and rate limiting with aioredis
- **JWT** - Token-based authentication (python-jose)
- **bcrypt** - Password hashing (passlib)
- **LangGraph** - Conversational AI framework
- **Groq** - LLM provider (Llama model)

## 🚀 Quick Start

### Prerequisites

- Python 3.10+
- PostgreSQL database (Neon.tech recommended)
- Redis server
- Groq API key
- Tavily API key (for search)

### Installation

1. **Clone the repository**

   ```bash
   cd server
   ```

2. **Create virtual environment**

   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**

   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

5. **Configure your .env file**

   ```env
   # Generate secure secret keys
   SECRET_KEY=$(openssl rand -hex 32)
   SESSION_SECRET_KEY=$(openssl rand -hex 32)

   # Add your Neon.tech PostgreSQL URL
   DATABASE_URL=postgresql+asyncpg://user:password@host/database?sslmode=require

   # Add your Redis URL (or use local)
   REDIS_URL=redis://localhost:6379

   # Add your API keys
   GROQ_API_KEY=your_groq_key
   TAVILY_API_KEY=your_tavily_key
   ```

6. **Start Redis (if using local)**

   ```bash
   # macOS with Homebrew
   brew services start redis

   # Docker
   docker run -d -p 6379:6379 redis:alpine
   ```

7. **Run the application**

   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

8. **Access the API**
   - API: http://localhost:8000
   - Docs: http://localhost:8000/docs
   - ReDoc: http://localhost:8000/redoc

## 📚 API Documentation

### Authentication Endpoints

#### POST /api/v1/auth/signup

Register a new user.

**Request:**

```bash
curl -X POST http://localhost:8000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

**Response:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

#### POST /api/v1/auth/login

Authenticate and get tokens.

**Request:**

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

**Response:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

#### POST /api/v1/auth/token/refresh

Refresh access token.

**Request:**

```bash
curl -X POST http://localhost:8000/api/v1/auth/token/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

#### GET /api/v1/auth/me

Get current user profile.

**Request:**

```bash
curl -X GET http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**

```json
{
  "id": 1,
  "username": "johndoe",
  "email": "john@example.com",
  "created_at": "2025-11-11T10:30:00Z"
}
```

### Chat Endpoints

#### POST /api/v1/chats

Create a new chat session.

**Request:**

```bash
curl -X POST http://localhost:8000/api/v1/chats \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My AI Conversation"
  }'
```

**Response:**

```json
{
  "id": 1,
  "user_id": 1,
  "title": "My AI Conversation",
  "checkpoint_id": null,
  "created_at": "2025-11-11T10:35:00Z",
  "updated_at": "2025-11-11T10:35:00Z",
  "message_count": 0
}
```

#### GET /api/v1/chats

List all user's chats.

**Request:**

```bash
curl -X GET "http://localhost:8000/api/v1/chats?skip=0&limit=50" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**

```json
{
  "chats": [
    {
      "id": 1,
      "user_id": 1,
      "title": "My AI Conversation",
      "checkpoint_id": "abc-123",
      "created_at": "2025-11-11T10:35:00Z",
      "updated_at": "2025-11-11T10:40:00Z",
      "message_count": 5
    }
  ],
  "total": 1
}
```

#### GET /api/v1/chats/{chat_id}

Get chat details.

**Request:**

```bash
curl -X GET http://localhost:8000/api/v1/chats/1 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### PATCH /api/v1/chats/{chat_id}

Update chat title.

**Request:**

```bash
curl -X PATCH http://localhost:8000/api/v1/chats/1 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Title"
  }'
```

#### DELETE /api/v1/chats/{chat_id}

Delete a chat and all its messages.

**Request:**

```bash
curl -X DELETE http://localhost:8000/api/v1/chats/1 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**

```json
{
  "message": "Chat deleted successfully",
  "data": {
    "chat_id": 1
  }
}
```

#### GET /api/v1/chats/{chat_id}/messages

Get chat messages.

**Request:**

```bash
curl -X GET "http://localhost:8000/api/v1/chats/1/messages?skip=0&limit=100" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**

```json
{
  "messages": [
    {
      "id": 1,
      "chat_id": 1,
      "user_id": 1,
      "role": "user",
      "content": "Hello!",
      "created_at": "2025-11-11T10:36:00Z",
      "metadata": null
    },
    {
      "id": 2,
      "chat_id": 1,
      "user_id": 1,
      "role": "assistant",
      "content": "Hi! How can I help you today?",
      "created_at": "2025-11-11T10:36:05Z",
      "metadata": null
    }
  ],
  "total": 2,
  "chat_id": 1
}
```

#### POST /api/v1/chats/{chat_id}/message

Send a message and get streaming AI response.

**Request:**

```bash
curl -X POST http://localhost:8000/api/v1/chats/1/message \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "What is the weather like?"
  }'
```

**Response (Server-Sent Events):**

```
data: {"type":"checkpoint","checkpoint_id":"abc-123"}

data: {"type":"content","content":"Let me"}

data: {"type":"content","content":" check"}

data: {"type":"search_start","query":"current weather"}

data: {"type":"tool_output","output":{"result":"..."}}

data: {"type":"content","content":" the weather"}

data: {"type":"end"}
```

### Event Types in Streaming Response

- **checkpoint**: LangGraph checkpoint ID (sent once for new conversations)
- **content**: Streamed AI response text
- **tool_output**: Results from tool execution
- **search_start**: Search operation initiated
- **search_results**: URLs from search results
- **end**: Stream completed successfully
- **error**: Error occurred during streaming

## 🗄️ Database Schema

### Users Table

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(30) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Chats Table

```sql
CREATE TABLE chats (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    checkpoint_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Messages Table

```sql
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    chat_id INTEGER REFERENCES chats(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    metadata_json TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔐 Security Features

1. **JWT Authentication**

   - Access tokens expire in 15 minutes
   - Refresh tokens expire in 7 days
   - Tokens include user ID and type verification

2. **Password Security**

   - Bcrypt hashing with salt
   - Minimum 8 characters
   - Must contain uppercase, lowercase, and digit

3. **Input Validation**

   - Pydantic schemas for all requests
   - Email format validation
   - Username format restrictions

4. **Rate Limiting**

   - 20 messages per minute per user
   - Redis-based tracking
   - Automatic 429 responses

5. **Ownership Checks**
   - All chat operations verify ownership
   - 403 Forbidden for unauthorized access

## ⚡ Performance Optimizations

1. **Redis Caching**

   - Latest 100 messages per chat cached
   - 1-hour TTL on cached data
   - Automatic cache invalidation

2. **Database Connection Pooling**

   - Pool size: 10 connections
   - Max overflow: 20 connections
   - Pre-ping for connection health

3. **Async Operations**

   - Full async/await support
   - Non-blocking I/O
   - Concurrent request handling

4. **Streaming Responses**
   - Server-Sent Events for real-time updates
   - Reduces client waiting time
   - Better user experience

## 🧪 Testing

### Manual Testing with cURL

```bash
# 1. Sign up
ACCESS_TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"Test123!"}' \
  | jq -r '.access_token')

# 2. Create a chat
CHAT_ID=$(curl -s -X POST http://localhost:8000/api/v1/chats \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Chat"}' \
  | jq -r '.id')

# 3. Send a message
curl -X POST http://localhost:8000/api/v1/chats/$CHAT_ID/message \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"Hello AI!"}'

# 4. Get messages
curl -X GET http://localhost:8000/api/v1/chats/$CHAT_ID/messages \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# 5. List chats
curl -X GET http://localhost:8000/api/v1/chats \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

## 🚢 Deployment

### Environment Variables for Production

```env
DEBUG=false
SECRET_KEY=<generate-with-openssl-rand-hex-32>
SESSION_SECRET_KEY=<generate-with-openssl-rand-hex-32>
DATABASE_URL=postgresql+asyncpg://user:password@production-host/db?sslmode=require
REDIS_URL=redis://production-redis:6379
REDIS_PASSWORD=<your-redis-password>
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### Docker Deployment

```dockerfile
# Use official Python image
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Expose port
EXPOSE 8000

# Run application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Docker Compose

```yaml
version: "3.8"

services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=redis://redis:6379
      - SECRET_KEY=${SECRET_KEY}
    depends_on:
      - redis

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
```

## 📝 API Flow Example

### Complete Chat Flow

```bash
# 1. User Signs Up
POST /api/v1/auth/signup
→ Receives access_token & refresh_token

# 2. Create Chat Session
POST /api/v1/chats (with Bearer token)
→ Receives chat_id

# 3. Send First Message
POST /api/v1/chats/{chat_id}/message (with Bearer token)
→ Streams AI response via SSE
→ Receives checkpoint_id in first event

# 4. Continue Conversation
POST /api/v1/chats/{chat_id}/message (same chat_id)
→ Uses existing checkpoint_id
→ Maintains conversation context

# 5. View History
GET /api/v1/chats/{chat_id}/messages (with Bearer token)
→ Receives all messages (from cache or DB)

# 6. Token Expires (after 15 min)
POST /api/v1/auth/token/refresh
→ Use refresh_token to get new access_token

# 7. Clean Up
DELETE /api/v1/chats/{chat_id} (with Bearer token)
→ Deletes chat and all messages
```

## 🤝 Contributing

This backend is designed to work with the existing frontend at `/client`. The frontend should:

1. Store JWT tokens securely (httpOnly cookies recommended)
2. Include Bearer token in all authenticated requests
3. Handle token refresh before expiration
4. Use EventSource or fetch for streaming responses
5. Display streaming content in real-time

## 📄 License

See the LICENSE file in the root directory.

## 🙏 Acknowledgments

- FastAPI for the excellent web framework
- LangGraph for conversational AI capabilities
- Neon.tech for serverless PostgreSQL
- Groq for fast LLM inference

---

**Built with ❤️ for the Perception AI Chat Platform**
