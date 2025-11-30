import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Plus, MessageSquare, ChevronLeft, Trash2, Settings, LogOut, GitBranch } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChat } from "@/hooks/use-chat";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/use-auth";

interface ChatSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const ChatSidebar = ({ isOpen, onToggle }: ChatSidebarProps) => {
  const { chats, currentChatId, selectChat, deleteChat, createChat, isLoading } = useChat();
  const { logout, user } = useAuth();

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
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm font-medium">New chat</span>
              </Button>

              {currentChatId && (
                <Button
                  onClick={() => window.location.href = `/workflow/${currentChatId}`}
                  className="w-full justify-start gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-0 h-10 rounded-lg transition-colors"
                  variant="ghost"
                >
                  <GitBranch className="w-4 h-4" />
                  <span className="text-sm font-medium">View Workflow</span>
                </Button>
              )}
            </div>

            {/* Chat History */}
            <ScrollArea className="flex-1 px-3">
              <div className="space-y-1 py-2">
                <div className="text-xs font-medium text-muted-foreground px-2 py-2">Recent</div>
                {chats.map((chat) => (
                  <motion.div
                    key={chat.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`group relative rounded-lg transition-colors ${currentChatId === chat.id ? 'bg-muted' : 'hover:bg-muted/50'
                      }`}
                  >
                    <button
                      onClick={() => {
                        selectChat(chat.id);
                        if (window.innerWidth < 1024) onToggle();
                      }}
                      className="w-full text-left p-2 flex items-center gap-3 overflow-hidden"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground/80 truncate group-hover:text-foreground transition-colors">
                          {chat.title || "New Conversation"}
                        </p>
                      </div>
                    </button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteChat(chat.id);
                      }}
                      className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-muted transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
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
                  onClick={logout}
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
