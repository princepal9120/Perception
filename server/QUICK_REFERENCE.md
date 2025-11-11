# Quick Reference Guide

## 🚀 Start the Server

```bash
# Development
uvicorn main:app --reload

# Production
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

## 🔑 Environment Variables (Required)

```bash
SECRET_KEY="your-secret-key-32-chars-min"
DATABASE_URL="postgresql+asyncpg://user:pass@host/db"
GROQ_API_KEY="your-groq-key"
TAVILY_API_KEY="your-tavily-key"
```

## 📡 Quick API Test

```bash
# 1. Signup and save token
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"Test123!"}' \
  | jq -r '.access_token')

# 2. Create chat and save ID
CHAT=$(curl -s -X POST http://localhost:8000/api/v1/chats \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Chat"}' | jq -r '.id')

# 3. Send message
curl -N -X POST http://localhost:8000/api/v1/chats/$CHAT/message \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"Hello AI!"}'
```

## 📋 Common Commands

```bash
# Check health
curl http://localhost:8000/health

# View docs
open http://localhost:8000/docs

# Test Redis
redis-cli ping

# Check database
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"

# View logs
tail -f server.log

# Install dependencies
pip install -r requirements.txt

# Create .env from template
cp .env.example .env
```

## 🔧 Troubleshooting

### Port already in use

```bash
lsof -ti:8000 | xargs kill -9
```

### Redis not connected

```bash
# Start Redis
brew services start redis  # macOS
docker run -d -p 6379:6379 redis:alpine  # Docker
```

### Database connection failed

- Check DATABASE_URL format
- Verify network access to Neon.tech
- Check credentials

### Import errors

```bash
# Reinstall dependencies
pip install --upgrade -r requirements.txt
```

## 📊 Status Codes

- **200** OK - Success
- **201** Created - Resource created
- **400** Bad Request - Invalid input
- **401** Unauthorized - Missing/invalid token
- **403** Forbidden - No access to resource
- **404** Not Found - Resource doesn't exist
- **409** Conflict - Duplicate resource
- **422** Validation Error - Invalid data format
- **429** Too Many Requests - Rate limit exceeded
- **500** Internal Server Error - Server error

## 🔐 Token Format

```bash
# Authorization header
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 📁 Key Files

- `main.py` - FastAPI application
- `core/config.py` - Settings
- `routes/auth_routes.py` - Auth endpoints
- `routes/chat_routes.py` - Chat endpoints
- `services/chat_service.py` - Business logic
- `models/tables.py` - Database models
- `.env` - Environment variables

## 🗄️ Database Commands

```bash
# Connect to database
psql $DATABASE_URL

# List tables
\dt

# View users
SELECT * FROM users;

# View chats
SELECT * FROM chats ORDER BY created_at DESC LIMIT 10;

# Count messages
SELECT COUNT(*) FROM messages;
```

## 📝 Quick Fixes

### Reset database

```python
# In Python shell
from db.init_db import reset_db
import asyncio
asyncio.run(reset_db())
```

### Clear Redis cache

```bash
redis-cli FLUSHALL
```

### Regenerate secret key

```bash
openssl rand -hex 32
```

## 🎯 Performance Tips

1. **Use connection pooling** (already configured)
2. **Enable Redis** for caching
3. **Use pagination** for large datasets
4. **Monitor slow queries** with DEBUG=true
5. **Scale horizontally** with multiple workers

## 📞 Getting Help

- Check `README.md` for detailed docs
- View `CURL_EXAMPLES.md` for API examples
- Visit `/docs` for interactive API docs
- Check logs for error messages

## 🔄 Update Workflow

```bash
# 1. Pull latest code
git pull

# 2. Update dependencies
pip install -r requirements.txt

# 3. Run migrations (if any)
# alembic upgrade head

# 4. Restart server
# systemctl restart perception-api
```

---

**Keep this handy for quick reference!** 📌
