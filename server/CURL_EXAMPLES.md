# API Testing Examples with cURL

This file contains example cURL commands for testing all API endpoints.

## Setup

```bash
# Base URL
BASE_URL="http://localhost:8000"
API_BASE="$BASE_URL/api/v1"
```

## Authentication Flow

### 1. Signup

```bash
curl -X POST "$API_BASE/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Test123!"
  }' | jq

# Save tokens
RESPONSE=$(curl -s -X POST "$API_BASE/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"Test123!"}')

ACCESS_TOKEN=$(echo $RESPONSE | jq -r '.access_token')
REFRESH_TOKEN=$(echo $RESPONSE | jq -r '.refresh_token')

echo "Access Token: $ACCESS_TOKEN"
echo "Refresh Token: $REFRESH_TOKEN"
```

### 2. Login

```bash
curl -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }' | jq
```

### 3. Get Current User Profile

```bash
curl -X GET "$API_BASE/auth/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq
```

### 4. Refresh Token

```bash
curl -X POST "$API_BASE/auth/token/refresh" \
  -H "Content-Type: application/json" \
  -d "{
    \"refresh_token\": \"$REFRESH_TOKEN\"
  }" | jq

# Update access token
NEW_TOKENS=$(curl -s -X POST "$API_BASE/auth/token/refresh" \
  -H "Content-Type: application/json" \
  -d "{\"refresh_token\": \"$REFRESH_TOKEN\"}")
ACCESS_TOKEN=$(echo $NEW_TOKENS | jq -r '.access_token')
```

### 5. Logout

```bash
curl -X POST "$API_BASE/auth/logout" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq
```

## Chat Management

### 1. Create a New Chat

```bash
curl -X POST "$API_BASE/chats" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My First AI Chat"
  }' | jq

# Save chat ID
CHAT_RESPONSE=$(curl -s -X POST "$API_BASE/chats" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Chat"}')
CHAT_ID=$(echo $CHAT_RESPONSE | jq -r '.id')
echo "Chat ID: $CHAT_ID"
```

### 2. List All Chats

```bash
# Default pagination
curl -X GET "$API_BASE/chats" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq

# With pagination
curl -X GET "$API_BASE/chats?skip=0&limit=20" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq
```

### 3. Get Specific Chat

```bash
curl -X GET "$API_BASE/chats/$CHAT_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq
```

### 4. Update Chat Title

```bash
curl -X PATCH "$API_BASE/chats/$CHAT_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Chat Title"
  }' | jq
```

### 5. Delete Chat

```bash
curl -X DELETE "$API_BASE/chats/$CHAT_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq
```

## Messages

### 1. Send Message (Non-Streaming for Testing)

```bash
# This shows the streaming response (will see SSE events)
curl -X POST "$API_BASE/chats/$CHAT_ID/message" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Hello! What is 2 + 2?"
  }'
```

### 2. Send Message with Streaming (Proper SSE Client)

```bash
# Using curl with no buffering to see streaming
curl -N -X POST "$API_BASE/chats/$CHAT_ID/message" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Tell me about artificial intelligence"
  }'
```

### 3. Get Chat Messages

```bash
# All messages
curl -X GET "$API_BASE/chats/$CHAT_ID/messages" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq

# With pagination
curl -X GET "$API_BASE/chats/$CHAT_ID/messages?skip=0&limit=50" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq
```

## Complete Workflow Example

```bash
#!/bin/bash

# Set base URL
BASE_URL="http://localhost:8000"
API_BASE="$BASE_URL/api/v1"

echo "=== Perception AI Chat API Test ==="
echo ""

# 1. Signup
echo "1. Creating new user..."
SIGNUP_RESPONSE=$(curl -s -X POST "$API_BASE/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "demo_user",
    "email": "demo@example.com",
    "password": "Demo123!"
  }')

ACCESS_TOKEN=$(echo $SIGNUP_RESPONSE | jq -r '.access_token')
REFRESH_TOKEN=$(echo $SIGNUP_RESPONSE | jq -r '.refresh_token')

if [ "$ACCESS_TOKEN" == "null" ]; then
  echo "❌ Signup failed. Trying login..."

  # Try login instead
  LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/auth/login" \
    -H "Content-Type: application/json" \
    -d '{
      "email": "demo@example.com",
      "password": "Demo123!"
    }')

  ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.access_token')
  REFRESH_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.refresh_token')
fi

echo "✅ Authenticated"
echo ""

# 2. Get profile
echo "2. Getting user profile..."
curl -s -X GET "$API_BASE/auth/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq
echo ""

# 3. Create chat
echo "3. Creating new chat..."
CHAT_RESPONSE=$(curl -s -X POST "$API_BASE/chats" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Demo Chat Session"}')

CHAT_ID=$(echo $CHAT_RESPONSE | jq -r '.id')
echo "✅ Chat created with ID: $CHAT_ID"
echo ""

# 4. List chats
echo "4. Listing all chats..."
curl -s -X GET "$API_BASE/chats" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.chats[] | {id, title, message_count}'
echo ""

# 5. Send message
echo "5. Sending message..."
curl -N -X POST "$API_BASE/chats/$CHAT_ID/message" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "What is 5 + 7?"
  }'
echo ""
echo ""

# 6. Get messages
echo "6. Getting chat messages..."
curl -s -X GET "$API_BASE/chats/$CHAT_ID/messages" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.messages[] | {role, content}'
echo ""

# 7. Update chat title
echo "7. Updating chat title..."
curl -s -X PATCH "$API_BASE/chats/$CHAT_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Math Questions Chat"}' | jq
echo ""

echo "=== Test Complete ==="
```

## Error Handling Examples

### 401 Unauthorized (No Token)

```bash
curl -X GET "$API_BASE/chats" | jq
```

### 401 Unauthorized (Invalid Token)

```bash
curl -X GET "$API_BASE/chats" \
  -H "Authorization: Bearer invalid_token" | jq
```

### 403 Forbidden (Accessing Another User's Chat)

```bash
# Try to access chat with wrong user's token
curl -X GET "$API_BASE/chats/999999" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq
```

### 404 Not Found

```bash
curl -X GET "$API_BASE/chats/999999" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq
```

### 409 Conflict (Duplicate Email)

```bash
curl -X POST "$API_BASE/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Test123!"
  }' | jq
```

### 422 Validation Error (Weak Password)

```bash
curl -X POST "$API_BASE/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser2",
    "email": "test2@example.com",
    "password": "weak"
  }' | jq
```

### 429 Too Many Requests (Rate Limit)

```bash
# Send 21 messages rapidly to trigger rate limit
for i in {1..21}; do
  curl -s -X POST "$API_BASE/chats/$CHAT_ID/message" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"content\": \"Message $i\"}" &
done
wait
```

## Health Check

```bash
curl "$BASE_URL/health" | jq
```

## API Root

```bash
curl "$BASE_URL/" | jq
```

## Advanced: Multiple Concurrent Requests

```bash
# Test concurrent chat creation
for i in {1..5}; do
  curl -s -X POST "$API_BASE/chats" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"title\": \"Concurrent Chat $i\"}" | jq '.id' &
done
wait

# List all created chats
curl -s -X GET "$API_BASE/chats" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.total'
```

## Testing with Python (Alternative)

```python
import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

# Signup
response = requests.post(f"{BASE_URL}/auth/signup", json={
    "username": "pythonuser",
    "email": "python@example.com",
    "password": "Python123!"
})
tokens = response.json()
access_token = tokens['access_token']

headers = {"Authorization": f"Bearer {access_token}"}

# Create chat
chat = requests.post(f"{BASE_URL}/chats",
    headers=headers,
    json={"title": "Python Test Chat"}
).json()
chat_id = chat['id']

# Send message with streaming
response = requests.post(
    f"{BASE_URL}/chats/{chat_id}/message",
    headers=headers,
    json={"content": "Hello from Python!"},
    stream=True
)

# Read streaming response
for line in response.iter_lines():
    if line:
        print(line.decode('utf-8'))
```

## Notes

- Replace `$ACCESS_TOKEN`, `$CHAT_ID`, etc. with actual values
- Use `jq` for JSON formatting (install with: `brew install jq`)
- Use `-N` flag with curl for proper streaming
- Tokens expire after 15 minutes - refresh when needed
- Rate limit is 20 messages per minute per user
