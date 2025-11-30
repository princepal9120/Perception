import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Mic, Paperclip, Square, Zap, Brain } from "lucide-react";
import { motion } from "framer-motion";
import { useChat } from "@/hooks/use-chat";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DocumentAttachments } from "./DocumentAttachments";
import { Document } from "@/lib/chat-api";
import { useAuth } from "@/hooks/use-auth";
import { chatAPI } from "@/lib/chat-api";
import { VoiceChat } from "./VoiceChat";
import { DeepResearchModal, ResearchConfig } from "./DeepResearchModal";
import { useChatStore } from "@/store/chatStore";

export const ChatInput = () => {
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [deepResearchMode, setDeepResearchMode] = useState(false);
  const [isDeepResearchModalOpen, setIsDeepResearchModalOpen] = useState(false);
  const [attachedDocuments, setAttachedDocuments] = useState<Document[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { sendMessage, isStreaming, stopStreaming, currentChat, messages } = useChat();
  const { sendDeepResearch } = useChatStore();
  const { token } = useAuth();
  const [isVoiceChatOpen, setIsVoiceChatOpen] = useState(false);

  // Get last message for voice synthesis
  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
  const lastMessageContent = lastMessage?.role === 'assistant' ? lastMessage.content : undefined;

  const handleVoiceTranscript = (text: string) => {
    sendMessage(text);
  };

  const handleSend = async () => {
    if (message.trim() && !isStreaming) {
      const userMessage = message.trim();
      setMessage("");

      // Add context about deep research mode to guide the AI
      const enhancedMessage = deepResearchMode
        ? `Please research this topic thoroughly using web search and provide a comprehensive answer with sources: ${userMessage}`
        : userMessage;

      await sendMessage(enhancedMessage);
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

  // Document upload handlers
  const handleDocumentUpload = async (files: FileList) => {
    if (!token) return;

    // Create a chat if one doesn't exist
    let chatId = currentChat?.id;
    if (!chatId) {
      try {
        const newChat = await chatAPI.createChat("New Chat", token);
        chatId = newChat.id;
        // Reload chats to update the UI
        window.location.reload();
      } catch (error) {
        console.error('Failed to create chat:', error);
        return;
      }
    }

    setIsUploading(true);
    const fileArray = Array.from(files);

    try {
      // Convert files to File objects for API
      const response = await chatAPI.uploadDocuments(
        chatId,
        fileArray,
        token,
        (progress) => {
          // This is a simplified progress for all files. 
          // Ideally we'd track per file, but for now we'll just show it on the last one or generic
        }
      );

      // Add uploaded documents to attached documents
      setAttachedDocuments(prev => [...prev, ...response.documents]);

      // Clear upload progress
      setUploadProgress({});

    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      handleDocumentUpload(files);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleDocumentUpload(files);
    }
  };

  const handleDocumentRemove = (documentId: number) => {
    setAttachedDocuments(prev => prev.filter(doc => doc.id !== documentId));
  };

  const loadChatDocuments = async () => {
    if (!currentChat || !token) return;

    try {
      const response = await chatAPI.getChatDocuments(currentChat.id, token);
      setAttachedDocuments(response.documents);
    } catch (error) {
      console.error('Failed to load documents:', error);
    }
  };

  const handleStartDeepResearch = async (config: ResearchConfig) => {
    try {
      await sendDeepResearch(config.topic, config.depth, config.iterations);
    } catch (error) {
      console.error('Deep Research failed:', error);
    }
  };

  // Load documents when chat changes
  useEffect(() => {
    if (currentChat && token) {
      loadChatDocuments();
    }
  }, [currentChat, token]);

  return (
    <div className="w-full bg-gradient-to-t from-background via-background to-transparent pb-6 pt-10 px-4 fixed bottom-0 md:relative md:bottom-auto z-20">
      <div className="max-w-3xl mx-auto">
        {/* Document Attachments */}
        <div className="mb-2">
          <DocumentAttachments
            documents={attachedDocuments}
            onRemove={handleDocumentRemove}
            isUploading={isUploading}
            uploadProgress={uploadProgress}
            disabled={isStreaming}
          />
        </div>

        <div className="relative flex items-end w-full p-3 bg-[#f4f4f4] dark:bg-[#212121] rounded-3xl border border-transparent focus-within:border-gray-300 dark:focus-within:border-gray-600 shadow-sm transition-all">
          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.doc,.txt,.md"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isStreaming}
          />

          {/* Attachment Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            className="h-10 w-10 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full"
            disabled={isStreaming}
          >
            <Paperclip className="w-5 h-5" />
          </Button>

          {/* Text Input */}
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Perception..."
            disabled={isStreaming}
            className="flex-1 min-h-[44px] max-h-[200px] bg-transparent border-0 focus-visible:ring-0 resize-none py-3 px-2 text-base"
            rows={1}
          />

          {/* Right Actions */}
          <div className="flex items-center gap-1">
            {/* Deep Research Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsDeepResearchModalOpen(true)}
                  disabled={isStreaming}
                  className="h-10 w-10 rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <Brain className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Deep Research</TooltipContent>
            </Tooltip>

            {/* Voice Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsVoiceChatOpen(true)}
              className="h-10 w-10 text-gray-500 hover:text-gray-700 dark:text-gray-400 rounded-full"
            >
              <Mic className="w-5 h-5" />
            </Button>

            {/* Send Button */}
            <Button
              onClick={isStreaming ? handleStopGenerating : handleSend}
              disabled={!message.trim() && !isStreaming}
              className={`h-10 w-10 rounded-full transition-all ${message.trim() || isStreaming
                ? "bg-black dark:bg-white text-white dark:text-black"
                : "bg-gray-200 dark:bg-gray-700 text-gray-400"
                }`}
              size="icon"
            >
              {isStreaming ? (
                <Square className="w-4 h-4 fill-current" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        <p className="text-xs text-center text-gray-400 mt-2">
          Perception can make mistakes. Consider checking important information.
        </p>
      </div>

      <VoiceChat
        isOpen={isVoiceChatOpen}
        onClose={() => setIsVoiceChatOpen(false)}
        onTranscript={handleVoiceTranscript}
        isStreaming={isStreaming}
        lastMessage={lastMessageContent}
      />

      <DeepResearchModal
        isOpen={isDeepResearchModalOpen}
        onClose={() => setIsDeepResearchModalOpen(false)}
        onStartResearch={handleStartDeepResearch}
      />
    </div>
  );
};
