import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Bot, User } from "lucide-react";
import { useChatStore } from "@/store/chatStore";
import { MarkdownMessage } from "./MarkdownMessage";
import { TypingIndicator } from "./TypingIndicator";
import { DeepResearchDisplay } from "./DeepResearchDisplay";
import { WelcomeScreen } from "./WelcomeScreen";
import { useChat } from "@/hooks/use-chat";

export const ChatMessages = () => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const {
    conversations,
    currentConversationId,
    isStreaming,
    streamingMessage,
    streamingSearchInfo,
  } = useChatStore();
  const { sendMessage } = useChat();

  const currentConversation = conversations.find(
    (c) => c.id === currentConversationId
  );
  const messages = currentConversation?.messages || [];

  // Auto-scroll to bottom on new messages or stream updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingMessage]);

  const handleSuggestedPrompt = async (prompt: string, deepResearch?: boolean) => {
    await sendMessage(prompt);
  };

  // Prevent duplicate rendering when assistant message is already completed
  const lastMessage = messages[messages.length - 1];
  const shouldRenderStreaming =
    isStreaming &&
    streamingMessage &&
    (!lastMessage || lastMessage.role !== "assistant");

  return (
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 space-y-4 sm:space-y-6">
      {/* Welcome screen when no messages */}
      {messages.length === 0 && !isStreaming ? (
        <WelcomeScreen onSuggestedPrompt={handleSuggestedPrompt} />
      ) : (
        <>
          {/* Render all completed messages */}
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className={`flex gap-2 sm:gap-3 md:gap-4 ${message.role === "user" ? "flex-row-reverse" : ""
                }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${message.role === "assistant" ? "gradient-primary" : "bg-muted"
                  }`}
              >
                {message.role === "assistant" ? (
                  <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                ) : (
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-foreground" />
                )}
              </div>

              {/* Message Content */}
              <div
                className={`flex-1 max-w-full sm:max-w-[85%] md:max-w-2xl ${message.role === "user" ? "flex justify-end" : ""
                  }`}
              >
                <div
                  className={`inline-block p-3 sm:p-4 rounded-xl sm:rounded-2xl ${message.role === "assistant"
                    ? "bg-card border border-border shadow-sm dark:shadow-none text-left w-full"
                    : "bg-primary text-primary-foreground"
                    }`}
                >
                  {message.role === "assistant" ? (
                    <>
                      {message.searchInfo && (
                        <DeepResearchDisplay
                          searchInfo={message.searchInfo}
                          isStreaming={false}
                        />
                      )}
                      <MarkdownMessage content={message.content} />
                    </>
                  ) : (
                    <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}

          {/* Streaming message (only shown when not yet finalized) */}
          
          {shouldRenderStreaming && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex gap-2 sm:gap-3 md:gap-4"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>

              <div className="flex-1 max-w-full sm:max-w-[85%] md:max-w-2xl">
                <div className="inline-block p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-card border border-border shadow-sm dark:shadow-none w-full">
                  {streamingSearchInfo && (
                    <DeepResearchDisplay
                      searchInfo={streamingSearchInfo}
                      isStreaming={true}
                    />
                  )}

                  {/* Only show answer after research is complete (writing stage reached) */}
                  {streamingSearchInfo && !streamingSearchInfo.stages.includes('writing') ? (
                    // Research in progress - don't show answer yet
                    null
                  ) : (
                    // Research complete or no research - show streaming answer
                    streamingMessage && (
                      <MarkdownMessage content={streamingMessage} isStreaming={true} />
                    )
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Typing indicator (only when stream starting, no message yet) */}
          {isStreaming && !streamingMessage && <TypingIndicator />}
        </>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};
