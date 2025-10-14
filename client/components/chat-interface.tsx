"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Menu } from "lucide-react"
import { MessageBubble } from "@/components/message-bubble"
import { TypingIndicator } from "@/components/typing-indicator"

import { SearchProgress, type SearchStep } from "@/components/search-progress"
import { streamChatMessage, type ChatMessage, checkBackendHealth, getChatHistory, saveChatHistory } from "@/lib/api-client"

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
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [currentCheckpointId, setCurrentCheckpointId] = useState<string | null>(null)
  const [searchSteps, setSearchSteps] = useState<SearchStep[]>([])
  const [showSearchProgress, setShowSearchProgress] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
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

  // Load chat history when chatId changes
  useEffect(() => {
    const loadChatHistory = async () => {
      if (chatId) {
        setIsLoadingHistory(true)
        try {
          const history = await getChatHistory(chatId)
          const convertedMessages: Message[] = history.map((msg, index) => ({
            id: `${chatId}_${index}`,
            content: msg.content,
            role: msg.role,
            timestamp: new Date(Date.now() - (history.length - index) * 1000),
          }))
          setMessages(convertedMessages.length > 0 ? convertedMessages : [
            {
              id: "welcome",
              content: "Hello! How can I help you today?",
              role: "assistant",
              timestamp: new Date(),
            }
          ])
        } catch (error) {
          console.error('Failed to load chat history:', error)
          setMessages([{
            id: "welcome",
            content: "Hello! How can I help you today?",
            role: "assistant",
            timestamp: new Date(),
          }])
        } finally {
          setIsLoadingHistory(false)
        }
      } else {
        // New chat
        setMessages([{
          id: "welcome",
          content: "Hello! How can I help you today?",
          role: "assistant",
          timestamp: new Date(),
        }])
      }
    }

    loadChatHistory()
  }, [chatId])

  // Save chat history whenever messages change
  useEffect(() => {
    const saveChatHistoryDebounced = async () => {
      if (chatId && messages.length > 1) { // Don't save just the welcome message
        const chatMessages: ChatMessage[] = messages
          .filter(msg => msg.id !== "welcome") // Exclude welcome message
          .map(msg => ({
            role: msg.role,
            content: msg.content,
          }))

        if (chatMessages.length > 0) {
          await saveChatHistory(chatId, chatMessages)
        }
      }
    }

    const timeoutId = setTimeout(saveChatHistoryDebounced, 1000) // Debounce saves
    return () => clearTimeout(timeoutId)
  }, [messages, chatId])

  // Focus input on mount and check backend health
  useEffect(() => {
    inputRef.current?.focus()

    // Check backend health on mount
    checkBackendHealth().then((isHealthy) => {
      if (!isHealthy) {
        setConnectionError('Cannot connect to backend server. Please start the server.')
      } else {
        setConnectionError(null)
      }
    })
  }, [])

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    // Clear any previous connection errors
    setConnectionError(null)

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      role: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsTyping(true)

    // Initialize search progress
    const initialSteps: SearchStep[] = [
      { id: '1', title: 'Connecting to AI', status: 'active', description: 'Establishing connection...' },
      { id: '2', title: 'Processing Query', status: 'pending', description: 'Analyzing your message' },
      { id: '3', title: 'Searching Knowledge', status: 'pending', description: 'Finding relevant information' },
      { id: '4', title: 'Generating Response', status: 'pending', description: 'Crafting the answer' }
    ]

    setSearchSteps(initialSteps)
    setShowSearchProgress(true)

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
      let stepIndex = 0

      for await (const event of streamChatMessage(userMessage.content, currentCheckpointId || undefined)) {
        if (event.type === "checkpoint" && event.checkpoint_id) {
          setCurrentCheckpointId(event.checkpoint_id)

          // Update step 1 to completed
          setSearchSteps(prev => prev.map(step =>
            step.id === '1' ? { ...step, status: 'completed', duration: 500 } : step
          ))

          // Activate step 2
          setSearchSteps(prev => prev.map(step =>
            step.id === '2' ? { ...step, status: 'active' } : step
          ))

        } else if (event.type === "tool_output" && event.output) {
          // Handle tool outputs for search progress
          console.log("Tool output:", event.output)

          // Update step 2 to completed and activate step 3
          setSearchSteps(prev => prev.map(step => {
            if (step.id === '2') return { ...step, status: 'completed', duration: 800 }
            if (step.id === '3') return { ...step, status: 'active' }
            return step
          }))

        } else if (event.type === "content" && event.content) {
          accumulatedContent += event.content

          // First content means we're generating response
          if (accumulatedContent.length === event.content.length) {
            setSearchSteps(prev => prev.map(step => {
              if (step.id === '3') return { ...step, status: 'completed', duration: 1200 }
              if (step.id === '4') return { ...step, status: 'active' }
              return step
            }))
          }

          // Update the streaming message
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: accumulatedContent }
                : msg
            )
          )
        } else if (event.type === "end") {
          // Complete all steps
          setSearchSteps(prev => prev.map(step =>
            step.status !== 'completed' ? { ...step, status: 'completed', duration: step.id === '4' ? 1500 : 500 } : step
          ))

          // Streaming finished
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, isStreaming: false }
                : msg
            )
          )

          // Hide search progress after a delay
          setTimeout(() => {
            setShowSearchProgress(false)
          }, 2000)

          break
        }
      }
    } catch (error) {
      console.error("Failed to send message:", error)

      // Update search steps to show error
      setSearchSteps(prev => prev.map(step =>
        step.status === 'active' ? { ...step, status: 'error' } : step
      ))

      // Set connection error message
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
      setConnectionError(errorMessage)

      // Replace the streaming message with an error message
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
              ...msg,
              content: `Error: ${errorMessage}`,
              isStreaming: false
            }
            : msg
        )
      )

      // Hide search progress after showing error
      setTimeout(() => {
        setShowSearchProgress(false)
      }, 3000)
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
      {/* Connection Error Alert */}
      {connectionError && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3 m-4 rounded-lg text-sm">
          <strong>Connection Error:</strong> {connectionError}
        </div>
      )}

      {/* Search Progress */}
      <SearchProgress
        isVisible={showSearchProgress}
        steps={searchSteps}
        onClose={() => setShowSearchProgress(false)}
      />

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
                disabled={isTyping || !!connectionError}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isTyping || !!connectionError}
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


    </div>
  )
}
