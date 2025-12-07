import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Bot, User } from "lucide-react";
import { MarkdownMessage } from "./MarkdownMessage";
import { TypingIndicator } from "./TypingIndicator";
import { WelcomeScreen } from "./WelcomeScreen";
import { useChat } from "@/hooks/use-chat";
import { AgentProgressTracker } from "./AgentProgressTracker";
import { DeepResearchFlow } from "./DeepResearchFlow";

import { MessageActions } from "./MessageActions";

import { useTreeStore } from "@/store/treeStore";
import { treeApi } from "@/lib/tree-api";
import { useChatStore } from "@/store/chatStore";


interface ChatMessagesProps {
  isTreeViewOpen?: boolean;
}

export const ChatMessages: React.FC<ChatMessagesProps> = ({ isTreeViewOpen = false }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const {
    messages,
    isStreaming,
    streamingContent,
    isLoading,
    agentProgress,
  } = useChat();
  const { sendMessage } = useChat();
  const { setActiveNode } = useTreeStore();
  const { setMessages, deepResearchState } = useChatStore();

  // Check if deep research is active
  const isDeepResearchActive = deepResearchState.phase !== 'idle';

  // Auto-scroll to bottom on new messages or stream updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  const handleSuggestedPrompt = async (prompt: string, deepResearch?: boolean) => {
    await sendMessage(prompt);
  };

  const handleFork = async (message: any) => {
    const { currentChatId, branchFromMessage } = useChatStore.getState();

    if (!currentChatId) {
      console.error("Cannot branch: no current chat ID");
      return;
    }

    if (!message.id) {
      console.error("Cannot branch: no message ID");
      return;
    }

    try {
      // Create a new chat branched from this message
      const newChat = await branchFromMessage(currentChatId, message.id);

      if (newChat) {
        console.log(`Created new branch chat ${newChat.id} from message ${message.id}`);
      }
    } catch (e) {
      console.error("Failed to create branch:", e);
    }
  };

  const handleRegenerate = async (message: any) => {
    if (!message.metadata?.nodeId) return;
    // Regenerate logic here
    // For now just log
    console.log('Regenerate', message.id);
  };

  // Prevent duplicate rendering when assistant message is already completed
  const lastMessage = messages[messages.length - 1];
  const shouldRenderStreaming =
    isStreaming &&
    streamingContent &&
    (!lastMessage || lastMessage.role !== "assistant");

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Welcome screen when no messages */}
      {messages.length === 0 && !isStreaming ? (
        <WelcomeScreen onSuggestedPrompt={handleSuggestedPrompt} />
      ) : (
        <>
          {/* Render all completed messages */}
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`group w-full text-foreground border-b border-black/5 dark:border-white/5 pb-6 last:border-0 ${message.role === "assistant" ? "bg-transparent" : "bg-transparent"
                }`}
            >
              <div className="flex gap-4 md:gap-6 m-auto">
                {/* Avatar */}
                <div className="flex-shrink-0 flex flex-col relative items-end">
                  <div className={`w-8 h-8 rounded-sm flex items-center justify-center ${message.role === "assistant"
                    ? "bg-green-500"
                    : "bg-gray-500"
                    }`}>
                    {message.role === "assistant" ? (
                      <Bot className="w-5 h-5 text-white" />
                    ) : (
                      <User className="w-5 h-5 text-white" />
                    )}
                  </div>
                </div>

                {/* Message Content */}
                <div className="relative flex-1 overflow-hidden">
                  <div className="font-semibold text-sm mb-1 opacity-90 flex justify-between items-center">
                    <span>{message.role === "assistant" ? "Perception" : "You"}</span>
                    <MessageActions
                      messageId={message.id}
                      role={message.role as any}
                      content={message.content}
                      isTreeMode={isTreeViewOpen}
                      onFork={() => handleFork(message)}
                      onRegenerate={() => handleRegenerate(message)}
                    />
                  </div>
                  <div className="prose prose-slate dark:prose-invert max-w-none leading-7">
                    {message.role === "assistant" ? (
                      <MarkdownMessage content={message.content} />
                    ) : (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Deep Research Flow UI */}
          {isDeepResearchActive && isStreaming && (
            <DeepResearchFlow
              state={deepResearchState as any}
              isActive={isStreaming}
            />
          )}

          {/* Streaming message (only show if not in deep research mode) */}
          {shouldRenderStreaming && !isDeepResearchActive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full text-foreground pb-6"
            >
              <div className="flex gap-4 md:gap-6 m-auto">
                <div className="flex-shrink-0 flex flex-col relative items-end">
                  <div className="w-8 h-8 rounded-sm bg-green-500 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                </div>

                <div className="relative flex-1 overflow-hidden">
                  <div className="font-semibold text-sm mb-1 opacity-90">Perception</div>

                  {/* Agent Progress Tracker */}
                  <AgentProgressTracker
                    steps={agentProgress}
                    isActive={isStreaming}
                  />

                  <div className="prose prose-slate dark:prose-invert max-w-none leading-7">
                    <MarkdownMessage content={streamingContent} isStreaming={true} />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Deep Research streaming content (shown when research is complete with content) */}
          {isDeepResearchActive && streamingContent && deepResearchState.phase === 'complete' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full text-foreground pb-6"
            >
              <div className="flex gap-4 md:gap-6 m-auto">
                <div className="flex-shrink-0 flex flex-col relative items-end">
                  <div className="w-8 h-8 rounded-sm bg-green-500 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                </div>

                <div className="relative flex-1 overflow-hidden">
                  <div className="font-semibold text-sm mb-1 opacity-90">Perception</div>
                  <div className="prose prose-slate dark:prose-invert max-w-none leading-7">
                    <MarkdownMessage content={streamingContent} isStreaming={false} />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Typing indicator */}
          {isStreaming && !streamingContent && !isDeepResearchActive && <TypingIndicator />}
        </>
      )}

      <div ref={messagesEndRef} className="h-4" />

      <div ref={messagesEndRef} className="h-4" />
    </div>
  );
};
