#!/bin/bash

# Branch-Your-LLM Setup Script
# This script sets up the conversation tree system

echo "========================================="
echo "Branch-Your-LLM Setup"
echo "========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "main.py" ]; then
    echo -e "${RED}Error: Please run this script from the server directory${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 1: Installing Python dependencies...${NC}"
pip install -r requirements.txt
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Python dependencies installed${NC}"
else
    echo -e "${RED}✗ Failed to install Python dependencies${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Step 2: Running database migration...${NC}"
python migrate_tree_tables.py
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database migration completed${NC}"
else
    echo -e "${RED}✗ Database migration failed${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Step 3: Verifying tree routes...${NC}"
if grep -q "tree_routes" main.py; then
    echo -e "${GREEN}✓ Tree routes are integrated${NC}"
else
    echo -e "${RED}✗ Tree routes not found in main.py${NC}"
    exit 1
fi

echo ""
echo "========================================="
echo -e "${GREEN}Backend Setup Complete!${NC}"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. cd ../client"
echo "2. npm install reactflow"
echo "3. npm run dev"
echo ""
echo "Then visit http://localhost:5173 to use the tree interface"
echo ""
