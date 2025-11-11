#!/bin/bash

# Perception AI Chat API - Setup Script
# This script helps you set up the backend environment

set -e

echo "🚀 Perception AI Chat API - Setup"
echo "=================================="
echo ""

# Check Python version
echo "📌 Checking Python version..."
python_version=$(python3 --version 2>&1 | grep -oE '\d+\.\d+' | head -1)
required_version="3.10"

if [ "$(printf '%s\n' "$required_version" "$python_version" | sort -V | head -n1)" != "$required_version" ]; then
    echo "❌ Error: Python $required_version or higher is required. You have Python $python_version"
    exit 1
fi
echo "✅ Python $python_version detected"
echo ""

# Create virtual environment
echo "📦 Creating virtual environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "✅ Virtual environment created"
else
    echo "ℹ️  Virtual environment already exists"
fi
echo ""

# Activate virtual environment
echo "🔄 Activating virtual environment..."
source venv/bin/activate
echo "✅ Virtual environment activated"
echo ""

# Upgrade pip
echo "📦 Upgrading pip..."
pip install --upgrade pip > /dev/null 2>&1
echo "✅ Pip upgraded"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
pip install -r requirements.txt
echo "✅ Dependencies installed"
echo ""

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    
    # Generate secret keys
    SECRET_KEY=$(openssl rand -hex 32)
    SESSION_KEY=$(openssl rand -hex 32)
    
    # Update .env with generated keys
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/your-super-secret-key-change-this-in-production-min-32-characters/$SECRET_KEY/" .env
        sed -i '' "s/your-session-secret-key-change-this-in-production/$SESSION_KEY/" .env
    else
        # Linux
        sed -i "s/your-super-secret-key-change-this-in-production-min-32-characters/$SECRET_KEY/" .env
        sed -i "s/your-session-secret-key-change-this-in-production/$SESSION_KEY/" .env
    fi
    
    echo "✅ .env file created with generated secret keys"
    echo ""
    echo "⚠️  IMPORTANT: Please edit .env and update the following:"
    echo "   - DATABASE_URL (your Neon.tech PostgreSQL URL)"
    echo "   - REDIS_URL (if not using local Redis)"
    echo "   - GROQ_API_KEY"
    echo "   - TAVILY_API_KEY"
    echo ""
else
    echo "ℹ️  .env file already exists"
    echo ""
fi

# Check Redis
echo "🔍 Checking Redis connection..."
if redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis is running"
else
    echo "⚠️  Redis is not running. You can:"
    echo "   - Install Redis: brew install redis (macOS)"
    echo "   - Start Redis: brew services start redis (macOS)"
    echo "   - Or use Docker: docker run -d -p 6379:6379 redis:alpine"
    echo ""
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Edit .env file with your database and API keys"
echo "   2. Ensure Redis is running"
echo "   3. Run: uvicorn main:app --reload"
echo "   4. Access API at: http://localhost:8000"
echo "   5. View docs at: http://localhost:8000/docs"
echo ""
echo "💡 For more information, see README.md"
echo ""
