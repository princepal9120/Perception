# 🌳 Branch-Your-LLM Quick Start Guide

## 🎯 How to Use the Conversation Tree

### **Step 1: Start a Conversation**
1. Open the chat interface
2. Send a few messages to create conversation history
3. Example:
   ```
   You: "What is machine learning?"
   AI: [Response about ML]
   You: "Give me crypto news"
   AI: [Response about crypto]
   ```

### **Step 2: Open Tree View**
1. Click the **GitBranch icon** (🌿) in the top-right header
2. The tree panel will slide in from the right (50% width)
3. You'll see a debug panel showing tree status

### **Step 3: Sync Your Chat to Tree**
**IMPORTANT:** The first time you open tree view, you need to sync your messages!

1. Click the **"Sync Chat to Tree"** button in the tree header
2. Wait for the page to reload
3. Your messages will now appear as nodes in the tree

### **Step 4: View Your Conversation Tree**
After syncing, you'll see:
- **User nodes** (gray) - Your messages
- **AI nodes** (blue) - AI responses
- **Tool nodes** (orange) - If AI used tools (search, etc.)
- **Edges** connecting the conversation flow

### **Step 5: Branch Your Conversation** (Coming Soon)
Once the tree is populated:
1. Hover over any message
2. Click **Fork** (🌿) to create a new branch
3. Click **Regenerate** (🔄) to get alternative AI response
4. The tree will update in real-time

---

## 🐛 Troubleshooting

### **Problem: Tree shows "Total Nodes: 1" (only root)**
**Solution:** Click "Sync Chat to Tree" button

### **Problem: Tree is empty/black screen**
**Solution:** 
1. Check debug panel for errors
2. Click "Reload Tree" button
3. Check browser console (F12) for errors

### **Problem: Messages don't appear in tree**
**Solution:**
1. Make sure you clicked "Sync Chat to Tree"
2. Refresh the page
3. Check that chat has messages

### **Problem: Tree doesn't update after sending message**
**Current Status:** Real-time updates not yet implemented
**Workaround:** Click "Reload Tree" button in debug panel

---

## 📊 Understanding the Debug Panel

The debug panel shows:
- **Chat ID**: Current chat identifier
- **Loading**: Is tree currently loading?
- **Streaming**: Is AI currently responding?
- **Error**: Any error messages
- **Active Node**: Currently selected node ID
- **Tree Loaded**: Has tree data been fetched?
- **Total Nodes**: Number of conversation nodes
- **Root Node**: Starting point of conversation
- **Max Depth**: Deepest branch level

---

## 🎨 Tree Visualization Features

### **Current Features:**
- ✅ Hierarchical tree layout
- ✅ Custom node types (User, AI, Tool)
- ✅ Auto-layout algorithm
- ✅ Zoom and pan controls
- ✅ Minimap for navigation
- ✅ Active node highlighting
- ✅ Debug panel for diagnostics

### **Coming Soon:**
- ⏳ Real-time tree updates
- ⏳ Fork button in messages
- ⏳ Regenerate button for AI responses
- ⏳ Click node → load branch in chat
- ⏳ Workflow visualization (LangGraph steps)
- ⏳ Branch comparison
- ⏳ Export tree as image

---

## 🔧 Developer Notes

### **Backend API Endpoints:**
```
GET  /api/v1/tree/{chat_id}              - Get tree structure
POST /api/v1/tree/{chat_id}/migrate      - Migrate chat to tree
POST /api/v1/tree/{chat_id}/send         - Send message in tree
POST /api/v1/tree/nodes/{node_id}/fork   - Fork from node
POST /api/v1/tree/nodes/{node_id}/regenerate - Regenerate response
```

### **Frontend Components:**
```
TreePanel.tsx           - Main tree container
TreeVisualization.tsx   - ReactFlow graph
TreeDebug.tsx          - Debug information
UserNode.tsx           - User message node
AINode.tsx             - AI response node
ToolNode.tsx           - Tool execution node
useTreeLayout.ts       - Layout algorithm
treeStore.ts           - State management
```

### **Data Flow:**
```
User sends message
  ↓
ChatInput → chatStore.sendMessage()
  ↓
Backend: /api/v1/chats/{id}/message
  ↓
Message saved to database
  ↓
(Manual) Click "Sync Chat to Tree"
  ↓
Backend: migrate_linear_chat_to_tree()
  ↓
Creates tree nodes from messages
  ↓
Frontend: Tree updates with new nodes
```

---

## 🚀 Next Steps

### **Phase 1: Get Tree Working** ✅
- [x] Tree visualization renders
- [x] Debug panel shows status
- [x] Sync button migrates messages
- [x] Nodes display correctly

### **Phase 2: Real-Time Updates** (In Progress)
- [ ] Auto-sync messages to tree
- [ ] SSE for live tree updates
- [ ] Workflow node visualization
- [ ] Active node highlighting during streaming

### **Phase 3: Branching UI** (Planned)
- [ ] Fork button in messages
- [ ] Regenerate button for AI
- [ ] Click node → load in chat
- [ ] Branch comparison view

### **Phase 4: Advanced Features** (Future)
- [ ] Keyboard shortcuts (F for fork, R for regenerate)
- [ ] Search in tree
- [ ] Collapse/expand branches
- [ ] Export tree as PNG/SVG
- [ ] Time-travel through conversation

---

## 💡 Tips & Tricks

1. **Use the debug panel** to understand what's happening
2. **Reload tree** if it doesn't update automatically
3. **Sync regularly** to keep tree up-to-date
4. **Check browser console** (F12) for detailed errors
5. **Zoom and pan** to navigate large trees
6. **Use minimap** for quick navigation

---

## 📝 Known Issues

1. **Tree doesn't auto-update** when sending messages
   - Workaround: Click "Reload Tree" or "Sync Chat to Tree"

2. **Page reload required** after sync
   - This is intentional to ensure clean state

3. **Fork/Regenerate buttons** not yet in chat messages
   - Coming in next update

4. **No real-time workflow visualization** yet
   - Backend supports it, frontend integration pending

---

## 🆘 Getting Help

If you encounter issues:
1. Check the debug panel
2. Look at browser console (F12)
3. Check backend logs (`uvicorn` terminal)
4. Review `BRANCH_LLM_STATUS.md` for implementation details

---

## ✨ Example Workflow

```
1. Start chat
2. Send: "What is AI?"
3. AI responds
4. Send: "Give me crypto news"
5. AI responds
6. Open tree view (GitBranch icon)
7. Click "Sync Chat to Tree"
8. Page reloads
9. See your conversation as a tree!
10. (Soon) Click fork on "What is AI?" message
11. (Soon) Ask different question from that point
12. (Soon) See branching visualization
```

---

**Last Updated:** 2025-12-01
**Status:** Beta - Core features working, advanced features in development
