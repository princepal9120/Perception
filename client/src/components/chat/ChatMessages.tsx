import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Bot, User } from "lucide-react";
import { MarkdownMessage } from "./MarkdownMessage";
import { TypingIndicator } from "./TypingIndicator";
import { WelcomeScreen } from "./WelcomeScreen";
import { MessageSkeleton } from "./MessageSkeleton";
import { useChat } from "@/hooks/use-chat";
import type { Message } from "@/lib/chat-api";
import { AgentProgressTracker } from "./AgentProgressTracker";
import { DeepResearchFlow } from "./DeepResearchFlow";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { format, isToday, isYesterday } from "date-fns";

import { MessageActions } from "./MessageActions";

import { useChatStore } from "@/store/chatStore";

// Format timestamp for display
const formatMessageTime = (dateString: string): string => {
  const date = new Date(dateString);
  if (isToday(date)) {
    return format(date, 'h:mm a');
  }
  if (isYesterday(date)) {
    return `Yesterday ${format(date, 'h:mm a')}`;
  }
  return format(date, 'MMM d, h:mm a');
};

const MAX_VALID_DB_ID = 2147483647;

const isPersistedMessageId = (messageId: number): boolean => messageId > 0 && messageId <= MAX_VALID_DB_ID;

const isMessageLiked = (message: Message): boolean => message.metadata?.feedback?.liked === true;

interface ChatMessagesProps {
  isTreeViewOpen?: boolean;
}

export const ChatMessages: React.FC<ChatMessagesProps> = ({ isTreeViewOpen = false }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const {
    messages,
    isStreaming,
    streamingContent,
    isLoading,
    agentProgress,
  } = useChat();
  const { sendMessage } = useChat();
  const { currentChatId, deepResearchState, loadMessages, updateMessageFeedback } = useChatStore();

  // Check if deep research is active
  const isDeepResearchActive = deepResearchState.phase !== 'idle';

  // Auto-scroll to bottom on new messages or stream updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  const handleSuggestedPrompt = async (prompt: string) => {
    await sendMessage(prompt);
  };

  const handleFork = async (message: Message) => {
    if (!currentChatId) {
      toast.error("Cannot branch: no current chat");
      return;
    }

    if (!message.id) {
      toast.error("Cannot branch: invalid message");
      return;
    }

    if (!isPersistedMessageId(message.id)) {
      toast.info("Refreshing messages...");
      try {
        await loadMessages(currentChatId);
        toast.info("Messages refreshed. Please try branching again.");
        return;
      } catch {
        toast.error("Failed to refresh messages");
        return;
      }
    }

    try {
      toast.loading("Creating branch...", { id: "branch-loading" });

      // Create a new chat branched from this message
      const { branchFromMessage } = useChatStore.getState();
      const newChat = await branchFromMessage(currentChatId, message.id);

      if (newChat) {
        toast.dismiss("branch-loading");

        // Show success toast with workflow link
        toast.success(
          <div className="flex flex-col gap-2">
            <span>✨ Branch created: <strong>{newChat.title}</strong></span>
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => navigate(`/workflow/${newChat.id}`)}
                className="text-xs px-2 py-1 bg-primary/20 hover:bg-primary/30 rounded text-primary font-medium transition-colors"
              >
                View Workflow →
              </button>
            </div>
          </div>,
          {
            duration: 5000,
          }
        );

      }
    } catch (error: unknown) {
      toast.dismiss("branch-loading");
      toast.error(error instanceof Error ? error.message : "Failed to create branch");
    }
  };


  const handleRegenerate = async (message: Message) => {
    if (!message.metadata?.nodeId) return;
    // TODO: Implement regenerate logic
  };

  const handleToggleLike = async (message: Message) => {
    if (!currentChatId) {
      toast.error("Cannot save feedback without an active chat");
      return;
    }

    if (!isPersistedMessageId(message.id)) {
      toast.info("Finishing sync before saving feedback...");
      try {
        await loadMessages(currentChatId);
      } catch {
        toast.error("Failed to refresh the latest messages");
      }
      return;
    }

    try {
      await updateMessageFeedback(message.id, !isMessageLiked(message));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save feedback");
    }
  };

  // Prevent duplicate rendering when assistant message is already completed
  const lastMessage = messages[messages.length - 1];
  const shouldRenderStreaming =
    isStreaming &&
    streamingContent &&
    (!lastMessage || lastMessage.role !== "assistant");

  // Show skeleton loader during initial load
  if (isLoading && messages.length === 0) {
    return <MessageSkeleton count={3} />;
  }

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Welcome screen when no messages */}
      {messages.length === 0 && !isStreaming ? (
        <WelcomeScreen onSuggestedPrompt={handleSuggestedPrompt} />
      ) : (
        <>
          {/* Render all completed messages */}
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`group w-full text-foreground border-b border-black/5 dark:border-white/5 pb-6 last:border-0 ${message.role === "assistant" ? "bg-transparent" : "bg-transparent"
                }`}
              role="article"
              aria-label={`${message.role === 'assistant' ? 'AI' : 'User'} message`}
            >
              <div className="flex gap-4 md:gap-6 m-auto">
                {/* Avatar */}
                <div className="flex-shrink-0 flex flex-col relative items-end">
                  <div
                    className={`w-8 h-8 rounded-sm flex items-center justify-center ${message.role === "assistant"
                      ? "bg-green-500"
                      : "bg-gray-500"
                      }`}
                    aria-hidden="true"
                  >
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
                    <div className="flex items-center gap-2">
                      <span>{message.role === "assistant" ? "Perception" : "You"}</span>
                      {message.created_at && (
                        <span className="text-xs font-normal text-muted-foreground">
                          {formatMessageTime(message.created_at)}
                        </span>
                      )}
                    </div>
                    <MessageActions
                      messageId={message.id}
                      role={message.role as "user" | "assistant"}
                      content={message.content}
                      isLiked={isMessageLiked(message)}
                      canLike={isPersistedMessageId(message.id)}
                      isTreeMode={isTreeViewOpen}
                      onToggleLike={() => handleToggleLike(message)}
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
              state={deepResearchState}
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
