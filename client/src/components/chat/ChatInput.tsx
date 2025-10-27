import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Mic, Paperclip, Square, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { useChat } from "@/hooks/use-chat";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const ChatInput = () => {
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [deepResearchMode, setDeepResearchMode] = useState(false);
  const { sendMessage, isStreaming, stopStreaming } = useChat();

  const handleSend = async () => {
    if (message.trim() && !isStreaming) {
      const userMessage = message.trim();
      setMessage("");
      await sendMessage(userMessage);
    }
  };

  const handleStopGenerating = () => {
    stopStreaming();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-border bg-card/80 backdrop-blur-sm p-3 sm:p-4 sticky bottom-0">
      <div className="w-full max-w-5xl mx-auto space-y-2">
        {/* Deep Research Mode Toggle */}
        {!isStreaming && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center justify-between"
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={deepResearchMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDeepResearchMode(!deepResearchMode)}
                  className={`gap-2 h-8 text-xs transition-all ${deepResearchMode
                      ? "gradient-primary shadow-glow text-white"
                      : "hover:bg-muted"
                    }`}
                >
                  <Zap className={`w-3.5 h-3.5 ${deepResearchMode ? "fill-white" : ""}`} />
                  <span>Deep Research</span>
                  {deepResearchMode && (
                    <span className="px-1.5 py-0.5 bg-white/20 rounded text-[10px] font-medium">ON</span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Enable web search and multi-source analysis</p>
              </TooltipContent>
            </Tooltip>

            {deepResearchMode && (
              <motion.p
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-xs text-muted-foreground hidden sm:block"
              >
                AI will search the web and analyze multiple sources
              </motion.p>
            )}
          </motion.div>
        )}

        <div className="flex gap-1.5 sm:gap-2 items-end">
          {/* Upload Button - Hidden on mobile */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden sm:flex flex-shrink-0 hover:bg-accent/10 h-9 w-9"
          >
            <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>

          {/* Message Input */}
          <div className="flex-1 relative">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={deepResearchMode ? "Ask a question to research..." : "Ask anything..."}
              disabled={isStreaming}
              className={`min-h-[44px] sm:min-h-[52px] max-h-[120px] sm:max-h-[200px] resize-none rounded-xl sm:rounded-2xl text-sm sm:text-base py-2.5 sm:py-3 px-3 sm:px-4 pr-10 sm:pr-12 bg-background transition-all ${deepResearchMode ? "border-primary/50 focus-visible:ring-primary/50" : ""
                }`}
            />
            {deepResearchMode && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute top-2 right-2 sm:right-3"
              >
                <div className="flex items-center gap-1 px-2 py-0.5 bg-primary/10 border border-primary/20 rounded-full">
                  <Zap className="w-2.5 h-2.5 text-primary fill-primary" />
                  <span className="text-[10px] font-medium text-primary">Research Mode</span>
                </div>
              </motion.div>
            )}
          </div>

          {/* Voice Button - Hidden on mobile when streaming */}
          {!isStreaming && (
            <motion.div
              whileTap={{ scale: 0.95 }}
              className="hidden sm:flex flex-shrink-0"
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsRecording(!isRecording)}
                className={`hover:bg-accent/10 h-9 w-9 ${isRecording ? "text-destructive animate-pulse" : ""}`}
              >
                <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </motion.div>
          )}

          {/* Send/Stop Button */}
          {isStreaming ? (
            <Button
              onClick={handleStopGenerating}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground flex-shrink-0 h-9 w-9 sm:h-10 sm:w-10"
              size="icon"
            >
              <Square className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
            </Button>
          ) : (
            <Button
              onClick={handleSend}
              disabled={!message.trim()}
              className="gradient-primary shadow-glow flex-shrink-0 h-9 w-9 sm:h-10 sm:w-10 disabled:opacity-50"
              size="icon"
            >
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          )}
        </div>

        <p className="text-[10px] sm:text-xs text-muted-foreground text-center px-2">
          {isStreaming
            ? "⚡ Generating response..."
            : deepResearchMode
              ? "🌐 Deep research mode active • Web search enabled • Shift + Enter for new line"
              : "💬 Quick answer mode • Shift + Enter for new line"
          }
        </p>
      </div>
    </div>
  );
};
