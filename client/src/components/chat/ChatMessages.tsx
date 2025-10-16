import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Bot, User } from "lucide-react";
import { useChatStore } from "@/store/chatStore";
import { MarkdownMessage } from "./MarkdownMessage";
import { TypingIndicator } from "./TypingIndicator";

export const ChatMessages = () => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { conversations, currentConversationId, isStreaming, streamingMessage } = useChatStore();
  
  const currentConversation = conversations.find(c => c.id === currentConversationId);
  const messages = currentConversation?.messages || [];

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingMessage]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {messages.map((message, index) => (
        <motion.div
          key={message.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.05 }}
          className={`flex gap-4 ${message.role === "user" ? "flex-row-reverse" : ""}`}
        >
          {/* Avatar */}
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
            message.role === "assistant" 
              ? "gradient-primary" 
              : "bg-muted"
          }`}>
            {message.role === "assistant" ? (
              <Bot className="w-5 h-5 text-white" />
            ) : (
              <User className="w-5 h-5 text-foreground" />
            )}
          </div>

          {/* Message Content */}
          <div className={`flex-1 max-w-2xl ${message.role === "user" ? "flex justify-end" : ""}`}>
            <div className={`inline-block p-4 rounded-2xl ${
              message.role === "assistant"
                ? "bg-card border border-border shadow-elegant text-left"
                : "bg-primary text-primary-foreground"
            }`}>
              {message.role === "assistant" ? (
                <MarkdownMessage content={message.content} />
              ) : (
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
              )}
            </div>
          </div>
        </motion.div>
      ))}

      {/* Streaming message */}
      {isStreaming && streamingMessage && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex gap-4"
        >
          <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
            <Bot className="w-5 h-5 text-white" />
          </div>
          
          <div className="flex-1 max-w-2xl">
            <div className="inline-block p-4 rounded-2xl bg-card border border-border shadow-elegant">
              <MarkdownMessage content={streamingMessage} />
            </div>
          </div>
        </motion.div>
      )}

      {/* Typing indicator */}
      {isStreaming && !streamingMessage && <TypingIndicator />}
      
      <div ref={messagesEndRef} />
    </div>
  );
};
