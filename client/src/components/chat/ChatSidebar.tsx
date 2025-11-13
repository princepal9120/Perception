import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Plus, MessageSquare, ChevronLeft, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChat } from "@/hooks/use-chat";
import { formatDistanceToNow } from "date-fns";

interface ChatSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const ChatSidebar = ({ isOpen, onToggle }: ChatSidebarProps) => {
  const { chats, currentChatId, selectChat, deleteChat, createChat, isLoading } = useChat();

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
            className="fixed lg:relative inset-y-0 left-0 z-50 w-[280px] sm:w-[320px] bg-card border-r border-border flex flex-col"
          >
            {/* Header */}
            <div className="p-3 sm:p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold text-base sm:text-lg">Conversations</h2>
              <Button variant="ghost" size="icon" onClick={onToggle} className="h-8 w-8">
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </div>

            {/* New Chat Button */}
            <div className="p-3 sm:p-4">
              <Button
                onClick={() => createChat()}
                className="w-full gradient-primary shadow-glow text-sm sm:text-base"
                size="sm"
                disabled={isLoading}
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                New Chat
              </Button>
            </div>

            {/* Chat History */}
            <ScrollArea className="flex-1 px-2">
              <div className="space-y-1">
                {chats.map((chat) => (
                  <motion.div
                    key={chat.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={`relative group w-full text-left p-2.5 sm:p-3 rounded-lg hover:bg-muted/50 transition-colors ${currentChatId === chat.id ? 'bg-muted' : ''
                      }`}
                  >
                    <button
                      onClick={() => {
                        selectChat(chat.id);
                        // Close sidebar on mobile after selection
                        if (window.innerWidth < 1024) {
                          onToggle();
                        }
                      }}
                      className="w-full text-left"
                    >
                      <div className="flex items-start gap-2 sm:gap-3 pr-8">
                        <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 mt-0.5 sm:mt-1 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-medium truncate">{chat.title}</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(chat.updated_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteChat(chat.id);
                      }}
                      className="absolute right-1.5 sm:right-2 top-2 sm:top-2.5 opacity-0 group-hover:opacity-100 h-6 w-6 sm:h-7 sm:w-7 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    </Button>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
