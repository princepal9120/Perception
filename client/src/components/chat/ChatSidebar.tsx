import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, LogOut, GitBranch, Search, MessageSquare, Pencil, Check, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChat } from "@/hooks/use-chat";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/use-auth";

interface ChatSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const ChatSidebar = ({ isOpen, onToggle }: ChatSidebarProps) => {
  const { chats, currentChatId, selectChat, deleteChat, createChat, updateChat, isLoading } = useChat();
  const { signOut, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [editingChatId, setEditingChatId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (editingChatId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingChatId]);

  const handleStartEdit = (chatId: number, currentTitle: string) => {
    setEditingChatId(chatId);
    setEditTitle(currentTitle || "New Conversation");
  };

  const handleSaveEdit = async () => {
    if (editingChatId && editTitle.trim()) {
      await updateChat(editingChatId, editTitle.trim());
    }
    setEditingChatId(null);
    setEditTitle("");
  };

  const handleCancelEdit = () => {
    setEditingChatId(null);
    setEditTitle("");
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  // Filter chats based on search query
  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return chats;
    const query = searchQuery.toLowerCase();
    return chats.filter(chat =>
      chat.title?.toLowerCase().includes(query) ||
      "new conversation".includes(query)
    );
  }, [chats, searchQuery]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay for mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onToggle}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />

          <motion.aside
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed lg:relative inset-y-0 left-0 z-50 w-[260px] bg-background border-r border-border flex flex-col"
          >
            {/* New Chat Button */}
            <div className="p-3 space-y-2">
              <Button
                onClick={() => createChat()}
                className="w-full justify-start gap-2 bg-muted hover:bg-muted/80 text-foreground border-0 h-10 rounded-lg transition-colors"
                variant="ghost"
                disabled={isLoading}
                aria-label="Create new chat"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm font-medium">New chat</span>
              </Button>

              {currentChatId && (
                <Button
                  onClick={() => window.location.href = `/workflow/${currentChatId}`}
                  className="w-full justify-start gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-0 h-10 rounded-lg transition-colors"
                  variant="ghost"
                  aria-label="View conversation tree workflow"
                >
                  <GitBranch className="w-4 h-4" />
                  <span className="text-sm font-medium">View Workflow</span>
                </Button>
              )}

              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search chats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-9 text-sm bg-muted/50 border-0 focus-visible:ring-1"
                  aria-label="Search chat history"
                />
              </div>
            </div>

            {/* Chat History */}
            <ScrollArea className="flex-1 px-3" aria-label="Chat history">
              <div className="space-y-1 py-2">
                <div className="text-xs font-medium text-muted-foreground px-2 py-2">
                  {searchQuery ? `Results (${filteredChats.length})` : "Recent"}
                </div>

                {/* Empty state - no chats */}
                {chats.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                    <MessageSquare className="w-10 h-10 text-muted-foreground/50 mb-3" />
                    <p className="text-sm text-muted-foreground">No conversations yet</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">Start a new chat to begin</p>
                  </div>
                )}

                {/* Empty state - no search results */}
                {chats.length > 0 && filteredChats.length === 0 && searchQuery && (
                  <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                    <Search className="w-8 h-8 text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">No chats found</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">Try a different search term</p>
                  </div>
                )}

                {/* Chat list */}
                {filteredChats.map((chat) => (
                  <motion.div
                    key={chat.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`group relative rounded-lg transition-colors ${currentChatId === chat.id ? 'bg-muted' : 'hover:bg-muted/50'
                      }`}
                    role="listitem"
                  >
                    {editingChatId === chat.id ? (
                      // Edit mode
                      <div className="flex items-center gap-1 p-1.5">
                        <Input
                          ref={editInputRef}
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={handleEditKeyDown}
                          onBlur={handleSaveEdit}
                          className="h-8 text-sm flex-1"
                          aria-label="Edit chat title"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleSaveEdit}
                          className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                          aria-label="Save chat title"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleCancelEdit}
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          aria-label="Cancel editing"
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ) : (
                      // Normal mode
                      <>
                        <button
                          onClick={() => {
                            selectChat(chat.id);
                            if (window.innerWidth < 1024) onToggle();
                          }}
                          onDoubleClick={() => handleStartEdit(chat.id, chat.title)}
                          className="w-full text-left p-2 pr-16 flex items-center gap-3 overflow-hidden"
                          aria-label={`Select chat: ${chat.title || "New Conversation"}`}
                          aria-current={currentChatId === chat.id ? "true" : undefined}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground/80 truncate group-hover:text-foreground transition-colors">
                              {chat.title || "New Conversation"}
                            </p>
                            {chat.updated_at && (
                              <p className="text-xs text-muted-foreground/60 mt-0.5">
                                {formatDistanceToNow(new Date(chat.updated_at), { addSuffix: true })}
                              </p>
                            )}
                          </div>
                        </button>

                        {/* Action buttons */}
                        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartEdit(chat.id, chat.title);
                            }}
                            className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted"
                            aria-label={`Rename chat: ${chat.title || "New Conversation"}`}
                          >
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteChat(chat.id);
                            }}
                            className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-muted"
                            aria-label={`Delete chat: ${chat.title || "New Conversation"}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </>
                    )}
                  </motion.div>
                ))}
              </div>
            </ScrollArea>

            {/* User Profile / Bottom Section */}
            <div className="p-3 border-t border-border mt-auto">
              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors group">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-medium text-primary-foreground">
                  {user?.email?.[0].toUpperCase() || "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{user?.email}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={signOut}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
