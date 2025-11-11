# Perception AI Chat Backend - Architecture Diagrams

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Frontend)                        │
│                    React/Vue/Angular App                         │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTPS/WSS
                         │ Bearer Token
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FASTAPI APPLICATION                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Middleware Layer                             │  │
│  │  • CORS            • Session         • Error Handling    │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Route Layer                                  │  │
│  │  • /auth/*         • /chats/*        • /health           │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Service Layer                                │  │
│  │  • ChatService     • LLMClient       • RedisClient       │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────┬──────────────────────┬─────────────────┬──────────┘
             │                      │                 │
             │                      │                 │
    ┌────────▼────────┐    ┌───────▼────────┐   ┌───▼──────────┐
    │   PostgreSQL    │    │  LangGraph     │   │    Redis     │
    │   (Neon.tech)   │    │  + Groq LLM    │   │   (Cache)    │
    │                 │    │                │   │              │
    │ • users         │    │ • Checkpoints  │   │ • Messages   │
    │ • chats         │    │ • Tools        │   │ • Sessions   │
    │ • messages      │    │ • Streaming    │   │ • Rate Limit │
    └─────────────────┘    └────────────────┘   └──────────────┘
```

## Authentication Flow

```
┌──────┐                                           ┌──────────┐
│      │  1. POST /auth/signup                     │          │
│      │  {username, email, password}              │          │
│      │──────────────────────────────────────────>│          │
│      │                                           │          │
│      │  2. Hash password (bcrypt)                │  FastAPI │
│      │  3. Save to database                      │          │
│Client│  4. Generate JWT tokens                   │          │
│      │                                           │          │
│      │<──────────────────────────────────────────│          │
│      │  5. {access_token, refresh_token}         │          │
│      │                                           └──────────┘
│      │                                                  │
│      │  6. Store tokens securely                       │
│      │                                                  │
│      │  7. Include in subsequent requests              │
│      │  Authorization: Bearer {access_token}           │
│      │─────────────────────────────────────────────────>
│      │                                                  │
│      │  8. Validate token & extract user               │
│      │  9. Execute authorized operation                │
│      │                                                  │
│      │<─────────────────────────────────────────────────
│      │  10. Response with data                         │
└──────┘                                                  │
                                                          │
   After 15 minutes (token expires)                      │
                                                          │
┌──────┐                                           ┌──────────┐
│      │  11. POST /auth/token/refresh             │          │
│      │  {refresh_token}                          │          │
│      │──────────────────────────────────────────>│          │
│      │                                           │          │
│Client│  12. Validate refresh token               │  FastAPI │
│      │  13. Generate new token pair              │          │
│      │                                           │          │
│      │<──────────────────────────────────────────│          │
│      │  14. {new_access_token, new_refresh_token}│          │
└──────┘                                           └──────────┘
```

## Chat Message Flow with Streaming

```
┌──────┐                                                    ┌──────────┐
│      │  1. POST /chats/{id}/message                       │          │
│      │  {content: "What is AI?"}                          │          │
│      │───────────────────────────────────────────────────>│          │
│      │                                                    │          │
│      │  2. Check rate limit (Redis)                      │          │
│      │  3. Verify chat ownership                         │  FastAPI │
│      │  4. Save user message to DB                       │          │
│      │                                                    │          │
│Client│  5. Call LangGraph with streaming                 │          │
│      │                                                    └─────┬────┘
│      │                                                          │
│      │  6. data: {"type":"checkpoint","checkpoint_id":"..."}   │
│      │<─────────────────────────────────────────────────────────
│      │                                                          │
│      │  7. data: {"type":"content","content":"AI is"}          │
│      │<─────────────────────────────────────────────────────────
│      │                                                          │
│      │  8. data: {"type":"content","content":" a field"}       │
│      │<─────────────────────────────────────────────────────────
│      │                                                          │
│      │  9. data: {"type":"content","content":" of"}            │
│      │<─────────────────────────────────────────────────────────
│      │                                                          │
│      │  10. data: {"type":"tool_output","output":{...}}        │
│      │<─────────────────────────────────────────────────────────
│      │                                                          │
│      │  11. data: {"type":"end"}                               │
│      │<─────────────────────────────────────────────────────────
│      │                                                          │
│      │  12. Save assistant message to DB                       │
│      │  13. Cache messages in Redis                            │
└──────┘                                                          │
                                                           ┌──────▼─────┐
                                                           │ PostgreSQL │
                                                           │ + Redis    │
                                                           └────────────┘
```

## Data Access Patterns

```
Request: GET /chats/{id}/messages
    │
    ▼
┌────────────────────────┐
│  Check Redis Cache     │
│  Key: session:{id}:msgs│
└───────┬────────────────┘
        │
        ├─── Cache Hit ───────────┐
        │                         │
        │                         ▼
        │                  ┌──────────────┐
        │                  │ Return from  │
        │                  │ Redis (Fast) │
        │                  └──────────────┘
        │
        └─── Cache Miss ──────────┐
                                  │
                                  ▼
                          ┌──────────────────┐
                          │ Query PostgreSQL │
                          │ (Slower)         │
                          └────────┬─────────┘
                                   │
                                   ▼
                          ┌──────────────────┐
                          │ Cache in Redis   │
                          │ (for next time)  │
                          └────────┬─────────┘
                                   │
                                   ▼
                          ┌──────────────────┐
                          │ Return to Client │
                          └──────────────────┘
```

## Rate Limiting Flow

```
Request: POST /chats/{id}/message
    │
    ▼
┌─────────────────────────────────┐
│ Redis: INCR rate_limit:user:{id}│
└────────┬────────────────────────┘
         │
         ├─── Count ≤ 20 ────────────┐
         │                           │
         │                           ▼
         │                   ┌──────────────┐
         │                   │ Process      │
         │                   │ Request      │
         │                   └──────────────┘
         │
         └─── Count > 20 ────────────┐
                                     │
                                     ▼
                             ┌──────────────────┐
                             │ Return 429 Error │
                             │ Retry-After: {n} │
                             └──────────────────┘

Note: Counter auto-expires after 60 seconds
```

## Database Relationships

```
┌─────────────┐
│    User     │
│─────────────│
│ id (PK)     │
│ username    │
│ email       │
│ password    │
│ created_at  │
└──────┬──────┘
       │ 1
       │
       │ has many
       │
       │ N
┌──────▼──────┐      N           ┌──────────────┐
│    Chat     │◄─────────────────┤   Message    │
│─────────────│   belongs to     │──────────────│
│ id (PK)     │                  │ id (PK)      │
│ user_id (FK)│                  │ chat_id (FK) │
│ title       │                  │ user_id (FK) │
│ checkpoint  │                  │ role         │
│ created_at  │                  │ content      │
│ updated_at  │                  │ metadata     │
└─────────────┘                  │ created_at   │
                                 └──────────────┘

Cascade Deletes:
• Delete User → Deletes all Chats → Deletes all Messages
• Delete Chat → Deletes all Messages
```

## Token Structure

```
JWT Access Token (15 min):
┌─────────────────────────────────┐
│ Header                          │
│ {                               │
│   "alg": "HS256",              │
│   "typ": "JWT"                 │
│ }                               │
├─────────────────────────────────┤
│ Payload                         │
│ {                               │
│   "sub": 123,                  │  ← User ID
│   "type": "access",            │  ← Token type
│   "exp": 1699876543,           │  ← Expiration
│   "iat": 1699875643            │  ← Issued at
│ }                               │
├─────────────────────────────────┤
│ Signature                       │
│ HMACSHA256(                     │
│   base64UrlEncode(header) + "." │
│   base64UrlEncode(payload),     │
│   SECRET_KEY                    │
│ )                               │
└─────────────────────────────────┘

JWT Refresh Token (7 days):
• Similar structure
• "type": "refresh"
• Longer expiration
```

## Dependency Injection Flow

```
Route Handler Function
    │
    ▼
┌─────────────────────────────────┐
│ Depends(get_current_user)       │
│   │                              │
│   ├──> Depends(security)         │  ← Extract token
│   │                              │
│   └──> Depends(get_db)           │  ← Get DB session
│                                  │
│   1. Extract Bearer token        │
│   2. Decode JWT                  │
│   3. Verify signature            │
│   4. Extract user_id             │
│   5. Query database              │
│   6. Return User object          │
└──────────┬──────────────────────┘
           │
           ▼
    ┌──────────────┐
    │ Service      │
    │ Layer        │
    │ (ChatService)│
    └──────────────┘
```

## Service Layer Architecture

```
┌──────────────────────────────────────┐
│         Route Handler                 │
│  async def create_chat(...)           │
└────────────────┬─────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────┐
│         ChatService                   │
│  ┌────────────────────────────────┐  │
│  │  Business Logic                │  │
│  │  • Validation                  │  │
│  │  • Authorization               │  │
│  │  • Transactions                │  │
│  └──────┬───────────────┬─────────┘  │
│         │               │             │
└─────────┼───────────────┼─────────────┘
          │               │
    ┌─────▼──────┐  ┌────▼──────┐
    │ PostgreSQL │  │   Redis   │
    │   (Write)  │  │  (Cache)  │
    └────────────┘  └───────────┘
```

## Error Handling Flow

```
Request → Route → Service → Database
                              │
                              └─ Exception thrown
                                      │
                                      ▼
                              ┌──────────────────┐
                              │ HTTPException    │
                              │ • status_code    │
                              │ • detail         │
                              │ • headers        │
                              └────────┬─────────┘
                                       │
                                       ▼
                              ┌──────────────────┐
                              │ FastAPI          │
                              │ Error Handler    │
                              └────────┬─────────┘
                                       │
                                       ▼
                              ┌──────────────────┐
                              │ JSON Response    │
                              │ {                │
                              │   "detail": "..." │
                              │ }                │
                              └──────────────────┘
```

## Caching Strategy

```
Message Write:
    │
    ├──> PostgreSQL (Permanent storage)
    │
    └──> Redis (Latest 100 messages)
         • Key: session:{chat_id}:messages
         • TTL: 1 hour
         • Eviction: Keep latest 100


Message Read:
    │
    ├──> Check Redis
    │    └──> If found: Return (Fast)
    │
    └──> Check PostgreSQL
         └──> If found:
              1. Return to client
              2. Cache in Redis for next time
```

## Deployment Architecture

```
                    Internet
                       │
                       ▼
              ┌────────────────┐
              │  Load Balancer │
              │   (nginx)      │
              └────────┬───────┘
                       │
         ┌─────────────┼─────────────┐
         │             │             │
    ┌────▼───┐   ┌────▼───┐   ┌────▼───┐
    │FastAPI │   │FastAPI │   │FastAPI │
    │Worker 1│   │Worker 2│   │Worker N│
    └────┬───┘   └────┬───┘   └────┬───┘
         │            │            │
         └────────────┼────────────┘
                      │
         ┌────────────┼────────────┐
         │            │            │
    ┌────▼─────┐ ┌───▼────┐ ┌────▼──────┐
    │PostgreSQL│ │ Redis  │ │ LangGraph │
    │(Neon.tech│ │(Cloud) │ │   API     │
    └──────────┘ └────────┘ └───────────┘
```

---

These diagrams provide a visual understanding of the system's architecture and data flows.
