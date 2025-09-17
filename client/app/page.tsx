"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { ChatInterface } from "@/components/chat-interface"
import { ThemeProvider } from "@/components/theme-provider"

export default function ChatPage() {
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <div className="flex h-screen bg-background">
        <Sidebar
          currentChatId={currentChatId}
          onChatSelect={setCurrentChatId}
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        />
        <ChatInterface
          chatId={currentChatId}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />
      </div>
    </ThemeProvider>
  )
}
