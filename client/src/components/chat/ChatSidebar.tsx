import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Plus, MessageSquare, ChevronLeft, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChatStore } from "@/store/chatStore";
import { formatDistanceToNow } from "date-fns";

interface ChatSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const ChatSidebar = ({ isOpen, onToggle }: ChatSidebarProps) => {
  const { conversations, currentConversationId, selectConversation, deleteConversation, createNewConversation } = useChatStore();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          initial={{ x: -280, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -280, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="w-[280px] bg-card border-r border-border flex flex-col"
        >
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-lg">Conversations</h2>
            <Button variant="ghost" size="icon" onClick={onToggle}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </div>

          {/* New Chat Button */}
          <div className="p-4">
            <Button onClick={createNewConversation} className="w-full gradient-primary shadow-glow" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              New Chat
            </Button>
          </div>

          {/* Chat History */}
          <ScrollArea className="flex-1 px-2">
            <div className="space-y-1">
              {conversations.map((conversation) => (
                <motion.div
                  key={conversation.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`relative group w-full text-left p-3 rounded-lg hover:bg-muted/50 transition-colors ${
                    currentConversationId === conversation.id ? 'bg-muted' : ''
                  }`}
                >
                  <button
                    onClick={() => selectConversation(conversation.id)}
                    className="w-full text-left"
                  >
                    <div className="flex items-start gap-3 pr-8">
                      <MessageSquare className="w-4 h-4 mt-1 text-muted-foreground group-hover:text-primary transition-colors" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{conversation.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(conversation.updatedAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </button>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversation(conversation.id);
                    }}
                    className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};
