import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatMessages } from "@/components/chat/ChatMessages";
import { ChatInput } from "@/components/chat/ChatInput";
import { DocumentManager } from "@/components/chat/DocumentManager";
import { TreePanel } from "@/components/tree/TreePanel";
import { MCPToolExplorer } from "@/components/mcp/MCPToolExplorer";
import { useAuth } from "@/hooks/use-auth";
import { useChat } from "@/hooks/use-chat";
import { useTreeStore } from "@/store/treeStore";
import { X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { WorkflowSyncVisualizer } from "@/components/tree/WorkflowSyncVisualizer";

const Chat = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Default closed on mobile
  const [isDocumentManagerOpen, setIsDocumentManagerOpen] = useState(false);
  const [isTreeViewOpen, setIsTreeViewOpen] = useState(false);
  const [isMCPOpen, setIsMCPOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const { token } = useAuth();
  const { currentChat } = useChat();
  const { loadTree } = useTreeStore();

  // Listen for custom event to open document manager
  useState(() => {
    const handleOpenDocumentManager = () => setIsDocumentManagerOpen(true);
    window.addEventListener('openDocumentManager', handleOpenDocumentManager);
    return () => {
      window.removeEventListener('openDocumentManager', handleOpenDocumentManager);
    };
  });

  const handleSyncToTree = async () => {
    if (!currentChat) return;

    setIsSyncing(true);
    try {
      const { treeApi } = await import('@/lib/tree-api');

      // First, try to get existing tree
      try {
        const existingTree = await treeApi.getTreeStructure(currentChat.id);
        console.log('[Sync] Found existing tree with', existingTree.nodes.length, 'nodes');

        // If tree exists but only has root node, we need to re-migrate
        if (existingTree.nodes.length <= 1) {
          console.log('[Sync] Tree is empty, will re-migrate');
          toast.info('Refreshing tree with chat messages...');
        } else {
          toast.info('Tree already exists with ' + existingTree.nodes.length + ' nodes');
          await loadTree(currentChat.id);
          setIsSyncing(false);
          return;
        }
      } catch (error: any) {
        // Tree doesn't exist, that's fine
        console.log('[Sync] No existing tree, will create new one');
      }

      // Migrate chat to tree
      console.log('[Sync] Starting migration for chat', currentChat.id);
      const result = await treeApi.migrateToTree(currentChat.id);
      console.log('[Sync] Migration result:', result);

      toast.success(`Chat synced! Created ${result.nodes_created || 0} nodes`);

      // Reload tree
      await loadTree(currentChat.id);
    } catch (error: any) {
      console.error('[Sync] Failed to sync:', error);
      toast.error(error.response?.data?.detail || error.message || 'Failed to sync chat to tree');
    } finally {
      setIsSyncing(false);
    }
  };

  const toggleTreeView = () => {
    if (isMCPOpen) setIsMCPOpen(false);
    setIsTreeViewOpen(!isTreeViewOpen);
  };

  const toggleMCP = () => {
    if (isTreeViewOpen) setIsTreeViewOpen(false);
    setIsMCPOpen(!isMCPOpen);
  };

  const isPanelOpen = isTreeViewOpen || isMCPOpen;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <ChatSidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Main Content Area - Chat + Tree View / MCP */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Area */}
        <motion.div
          className="flex flex-col min-w-0 relative bg-white dark:bg-[#212121]"
          animate={{
            width: isPanelOpen ? "50%" : "100%",
          }}
          transition={{
            duration: 0.3,
            ease: [0.4, 0, 0.2, 1],
          }}
        >
          <ChatHeader
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            onToggleDocumentManager={() => setIsDocumentManagerOpen(true)}
            onOpenTreeView={toggleTreeView}
            isTreeViewOpen={isTreeViewOpen}
            onOpenMCP={toggleMCP}
            isMCPOpen={isMCPOpen}
          />

          <div className="flex-1 overflow-y-auto overflow-x-hidden relative scroll-smooth">
            <div className="min-h-full flex flex-col">
              <ChatMessages isTreeViewOpen={isTreeViewOpen} />
              <div className="h-32 md:h-48 flex-shrink-0" /> {/* Spacer for floating input */}
            </div>
          </div>

          <ChatInput isTreeViewOpen={isTreeViewOpen} />

          {/* Workflow Sync Visualizer - Always visible in chat area */}
          <WorkflowSyncVisualizer />
        </motion.div>

        {/* Tree View Side Panel */}
        <AnimatePresence>
          {isTreeViewOpen && currentChat && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "50%", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{
                duration: 0.3,
                ease: [0.4, 0, 0.2, 1],
              }}
              className="relative border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#212121] flex flex-col overflow-hidden"
            >
              {/* Tree View Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
                <div>
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    Conversation Tree
                  </h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Branch and explore different conversation paths
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSyncToTree}
                    disabled={isSyncing}
                  >
                    {isSyncing ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      'Sync Chat to Tree'
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsTreeViewOpen(false)}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Tree View Content */}
              <div className="flex-1 overflow-hidden">
                <TreePanel chatId={currentChat.id} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MCP Tool Explorer Side Panel */}
        <AnimatePresence>
          {isMCPOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "50%", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{
                duration: 0.3,
                ease: [0.4, 0, 0.2, 1],
              }}
              className="relative border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#212121] flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
                <div>
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    MCP Tool Explorer
                  </h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Manage servers and discover available tools
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMCPOpen(false)}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1 overflow-hidden">
                <MCPToolExplorer />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Document Manager */}
      {token && currentChat && (
        <DocumentManager
          isOpen={isDocumentManagerOpen}
          onClose={() => setIsDocumentManagerOpen(false)}
          chatId={currentChat.id}
          token={token}
        />
      )}
    </div>
  );
};

export default Chat;
