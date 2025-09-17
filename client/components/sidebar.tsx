"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"
import { Plus, MessageSquare, Settings, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

interface Chat {
  id: string
  title: string
  lastMessage: string
  timestamp: Date
}

interface SidebarProps {
  currentChatId: string | null
  onChatSelect: (chatId: string) => void
  isOpen: boolean
  onToggle: () => void
}

export function Sidebar({ currentChatId, onChatSelect, isOpen, onToggle }: SidebarProps) {
  const [chats, setChats] = useState<Chat[]>([
    {
      id: "1",
      title: "React Components Help",
      lastMessage: "How do I create a reusable button component?",
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    },
    {
      id: "2",
      title: "API Integration",
      lastMessage: "Setting up REST API calls in Next.js",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    },
    {
      id: "3",
      title: "Database Design",
      lastMessage: "Best practices for PostgreSQL schema",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    },
  ])

  const handleNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: "New Chat",
      lastMessage: "",
      timestamp: new Date(),
    }
    setChats([newChat, ...chats])
    onChatSelect(newChat.id)
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onToggle}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{
          x: isOpen ? 0 : -320,
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
        }}
        className="fixed lg:relative inset-y-0 left-0 z-50 w-80 bg-sidebar border-r border-sidebar-border lg:translate-x-0"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center justify-between p-4 border-b border-sidebar-border"
          >
            <h1 className="text-lg font-semibold text-sidebar-foreground">Chatbot</h1>
            <Button variant="ghost" size="icon" onClick={onToggle} className="lg:hidden">
              <X className="h-4 w-4" />
            </Button>
          </motion.div>

          {/* New Chat Button */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-4"
          >
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={handleNewChat}
                className="w-full justify-start gap-2 bg-sidebar-primary hover:bg-sidebar-primary/90 text-sidebar-primary-foreground transition-all duration-200"
              >
                <Plus className="h-4 w-4" />
                New Chat
              </Button>
            </motion.div>
          </motion.div>

          {/* Chat History */}
          <ScrollArea className="flex-1 px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="space-y-2"
            >
              {chats.map((chat, index) => (
                <motion.div
                  key={chat.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card
                    className={cn(
                      "p-3 cursor-pointer transition-all duration-200 hover:bg-sidebar-accent hover:shadow-sm",
                      currentChatId === chat.id && "bg-sidebar-accent border-sidebar-primary shadow-sm",
                    )}
                    onClick={() => onChatSelect(chat.id)}
                  >
                    <div className="flex items-start gap-3">
                      <MessageSquare className="h-4 w-4 mt-1 text-sidebar-foreground/60 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm text-sidebar-foreground truncate">{chat.title}</h3>
                        <p className="text-xs text-sidebar-foreground/60 truncate mt-1">
                          {chat.lastMessage || "No messages yet"}
                        </p>
                        <span className="text-xs text-sidebar-foreground/40 mt-1 block">
                          {formatTime(chat.timestamp)}
                        </span>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </ScrollArea>

          {/* Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="p-4 border-t border-sidebar-border"
          >
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-200"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </>
  )
}
