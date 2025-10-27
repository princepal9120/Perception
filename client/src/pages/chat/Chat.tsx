import { useState } from "react";
import { motion } from "framer-motion";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatMessages } from "@/components/chat/ChatMessages";
import { ChatInput } from "@/components/chat/ChatInput";

const Chat = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Default closed on mobile

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <ChatSidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <ChatHeader onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <ChatMessages />
        </div>

        <ChatInput />
      </div>
    </div>
  );
};

export default Chat;
