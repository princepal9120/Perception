import { useState } from "react";
import { motion } from "framer-motion";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatMessages } from "@/components/chat/ChatMessages";
import { ChatInput } from "@/components/chat/ChatInput";
import { DocumentManager } from "@/components/chat/DocumentManager";
import { useAuth } from "@/hooks/use-auth";
import { useChat } from "@/hooks/use-chat";

const Chat = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Default closed on mobile
  const [isDocumentManagerOpen, setIsDocumentManagerOpen] = useState(false);
  const { token } = useAuth();
  const { currentChat } = useChat();

  // Listen for custom event to open document manager
  useState(() => {
    const handleOpenDocumentManager = () => setIsDocumentManagerOpen(true);
    window.addEventListener('openDocumentManager', handleOpenDocumentManager);
    return () => {
      window.removeEventListener('openDocumentManager', handleOpenDocumentManager);
    };
  });

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <ChatSidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 relative bg-white dark:bg-[#212121]">
        <ChatHeader
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onToggleDocumentManager={() => setIsDocumentManagerOpen(true)}
        />

        <div className="flex-1 overflow-y-auto overflow-x-hidden relative scroll-smooth">
          <div className="min-h-full flex flex-col">
            <ChatMessages />
            <div className="h-32 md:h-48 flex-shrink-0" /> {/* Spacer for floating input */}
          </div>
        </div>

        <ChatInput />
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
