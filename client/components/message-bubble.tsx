"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { User, Bot } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
  isStreaming?: boolean
}

interface MessageBubbleProps {
  message: Message
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user"

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.3,
        ease: [0.25, 0.46, 0.45, 0.94],
        type: "spring",
        stiffness: 100,
        damping: 15,
      }}
      className={cn("flex gap-3 group", isUser ? "justify-end" : "justify-start")}
    >
      {!isUser && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1, duration: 0.2 }}>
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarFallback className="bg-primary text-primary-foreground">
              <Bot className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        </motion.div>
      )}

      <div className={cn("flex flex-col gap-1 max-w-[80%] sm:max-w-[70%]", isUser ? "items-end" : "items-start")}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.25 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Card
            className={cn(
              "p-4 rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md",
              isUser ? "bg-primary text-primary-foreground ml-auto" : "bg-card text-card-foreground border-border",
            )}
          >
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
              {message.content}
              {message.isStreaming && (
                <motion.span
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="inline-block ml-1 w-2 h-4 bg-current"
                />
              )}
            </p>
          </Card>
        </motion.div>

        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "text-xs text-muted-foreground group-hover:opacity-100 transition-opacity duration-200",
            isUser ? "text-right" : "text-left",
          )}
        >
          {formatTime(message.timestamp)}
        </motion.span>
      </div>

      {isUser && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1, duration: 0.2 }}>
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarFallback className="bg-secondary text-secondary-foreground">
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        </motion.div>
      )}
    </motion.div>
  )
}
