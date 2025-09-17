"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Menu } from "lucide-react"
import { MessageBubble } from "@/components/message-bubble"
import { TypingIndicator } from "@/components/typing-indicator"
import { ApiMonitor } from "@/components/api-monitor"
import { streamChatMessage, type ChatMessage } from "@/lib/api-client"

interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
  isStreaming?: boolean
}

interface ChatInterfaceProps {
  chatId: string | null
  isSidebarOpen: boolean
  onToggleSidebar: () => void
}

export function ChatInterface({ chatId, isSidebarOpen, onToggleSidebar }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hello! How can I help you today?",
      role: "assistant",
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [currentCheckpointId, setCurrentCheckpointId] = useState<string | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [messages, isTyping])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      role: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsTyping(true)

    // Create a placeholder message for streaming
    const assistantMessageId = (Date.now() + 1).toString()
    const assistantMessage: Message = {
      id: assistantMessageId,
      content: "",
      role: "assistant",
      timestamp: new Date(),
      isStreaming: true,
    }

    setMessages((prev) => [...prev, assistantMessage])

    try {
      let accumulatedContent = ""

      for await (const event of streamChatMessage(userMessage.content, currentCheckpointId || undefined)) {
        if (event.type === "checkpoint" && event.checkpoint_id) {
          setCurrentCheckpointId(event.checkpoint_id)
        } else if (event.type === "content" && event.content) {
          accumulatedContent += event.content

          // Update the streaming message
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: accumulatedContent }
                : msg
            )
          )
        } else if (event.type === "tool_output" && event.output) {
          // You can handle tool outputs here if needed
          console.log("Tool output:", event.output)
        } else if (event.type === "end") {
          // Streaming finished
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, isStreaming: false }
                : msg
            )
          )
          break
        }
      }
    } catch (error) {
      console.error("Failed to send message:", error)

      // Replace the streaming message with an error message
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
              ...msg,
              content: "Sorry, I encountered an error. Please try again.",
              isStreaming: false
            }
            : msg
        )
      )
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="flex flex-col h-full flex-1">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="lg:hidden">
            <Menu className="h-4 w-4" />
          </Button>
          <h2 className="font-semibold text-foreground">{chatId ? `Chat ${chatId}` : "New Chat"}</h2>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          {isTyping && <TypingIndicator />}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-3xl mx-auto p-4">
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Message Chatbot..."
                className="min-h-[44px] pr-12 resize-none rounded-2xl border-input bg-background"
                disabled={isTyping}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isTyping}
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Chatbot can make mistakes. Consider checking important information.
          </p>
        </div>
      </div>

      <ApiMonitor />
    </div>
  )
}
