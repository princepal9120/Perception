import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Mic, Paperclip, Square } from "lucide-react";
import { motion } from "framer-motion";
import { useChatStore } from "@/store/chatStore";
import { toast } from "sonner";

export const ChatInput = () => {
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const { addMessage, isStreaming, setIsStreaming, updateStreamingMessage, finalizeStreamingMessage } = useChatStore();

  const simulateStreaming = async (userMessage: string) => {
    // Simulate AI response with streaming
    setIsStreaming(true);
    
    const responses = [
      "Sure! I can help you with that. Let me provide a detailed explanation.\n\n",
      "Here's an example code snippet:\n\n```typescript\nconst greeting = (name: string) => {\n  return `Hello, ${name}!`;\n};\n\nconsole.log(greeting('World'));\n```\n\n",
      "This demonstrates a simple TypeScript function that takes a name parameter and returns a greeting message.",
    ];

    let fullResponse = "";
    
    for (const chunk of responses) {
      for (let i = 0; i < chunk.length; i++) {
        fullResponse += chunk[i];
        updateStreamingMessage(fullResponse);
        await new Promise(resolve => setTimeout(resolve, 20));
      }
    }
    
    finalizeStreamingMessage();
  };

  const handleSend = async () => {
    if (message.trim() && !isStreaming) {
      const userMessage = message.trim();
      addMessage({ role: "user", content: userMessage });
      setMessage("");
      
      // Simulate streaming response
      await simulateStreaming(userMessage);
    }
  };

  const handleStopGenerating = () => {
    finalizeStreamingMessage();
    toast.info("Response stopped");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-border bg-card p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex gap-2 items-end">
          {/* Upload Button */}
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0 hover:bg-accent/10"
          >
            <Paperclip className="w-5 h-5" />
          </Button>

          {/* Message Input */}
          <div className="flex-1 relative">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything... (Shift + Enter for new line)"
              className="min-h-[60px] max-h-[200px] resize-none pr-12 rounded-2xl"
            />
          </div>

          {/* Voice Button */}
          <motion.div
            whileTap={{ scale: 0.95 }}
            className="flex-shrink-0"
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsRecording(!isRecording)}
              className={`hover:bg-accent/10 ${isRecording ? "text-destructive animate-pulse-glow" : ""}`}
            >
              <Mic className="w-5 h-5" />
            </Button>
          </motion.div>

          {/* Send/Stop Button */}
          {isStreaming ? (
            <Button
              onClick={handleStopGenerating}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground flex-shrink-0"
              size="icon"
            >
              <Square className="w-5 h-5" />
            </Button>
          ) : (
            <Button
              onClick={handleSend}
              disabled={!message.trim()}
              className="gradient-primary shadow-glow flex-shrink-0"
              size="icon"
            >
              <Send className="w-5 h-5" />
            </Button>
          )}
        </div>

        <p className="text-xs text-muted-foreground mt-2 text-center">
          {isStreaming ? "Generating response..." : "Connect  to enable AI responses, web search, and document analysis"}
        </p>
      </div>
    </div>
  );
};
