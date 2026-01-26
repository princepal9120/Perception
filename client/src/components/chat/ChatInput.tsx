import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Mic, Paperclip, Square, Brain } from "lucide-react";
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
import { useTreeStore } from "@/store/treeStore";
import { useChatStore } from "@/store/chatStore";
import { useGuestChatLimit } from "@/hooks/useGuestChatLimit";
import { AuthLimitModal } from "@/components/auth/AuthLimitModal";

interface ChatInputProps {
  isTreeViewOpen?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ isTreeViewOpen = false }) => {
  const [message, setMessage] = useState("");
  const [deepResearchMode, setDeepResearchMode] = useState(false);
  const [isDeepResearchModalOpen, setIsDeepResearchModalOpen] = useState(false);
  const [attachedDocuments, setAttachedDocuments] = useState<Document[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { sendMessage, isStreaming, stopStreaming, currentChat, messages, createChat: createChatAction } = useChat();
  const { sendDeepResearch, loadChats, selectChat } = useChatStore();
  const { token, isAuthenticated } = useAuth();
  const [isVoiceChatOpen, setIsVoiceChatOpen] = useState(false);

  // Guest chat limit tracking
  const { messagesUsed, hasReachedLimit, incrementCount } = useGuestChatLimit();

  const { activeNodeId, treeStructure, loadTree } = useTreeStore();

  // Get last message for voice synthesis
  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
  const lastMessageContent = lastMessage?.role === 'assistant' ? lastMessage.content : undefined;

  // Auto-resize textarea as user types (like ChatGPT/Claude)
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto';
      // Set the height to scrollHeight, capped at max-height (200px)
      const newHeight = Math.min(textarea.scrollHeight, 200);
      textarea.style.height = `${newHeight}px`;
    }
  }, [message]);

  const handleVoiceTranscript = (text: string) => {
    sendMessage(text);
  };

  const handleSend = async () => {
    if (message.trim() && !isStreaming) {

      if (!isAuthenticated && hasReachedLimit) {
        setIsAuthModalOpen(true);
        return;
      }

      const userMessage = message.trim();
      setMessage("");


      if (!isAuthenticated) {
        incrementCount();
      }

      // If in tree mode, use tree API
      if (isTreeViewOpen && currentChat) {
        try {
          // Determine parent node
          // If we have an active node, use it. Otherwise use root.
          const parentId = activeNodeId || treeStructure?.tree_metadata.root_node_id;

          if (!parentId) {
            // Fallback to regular chat if no tree context
            await sendMessage(userMessage);
            return;
          }

          // Send via tree store/API
          // We need to implement sendMessage in treeStore or call API directly
          // calling API directly for now to ensure it works

          // We need to handle streaming here manually or update treeStore to handle it
          // For now, let's just send it and reload tree

          // TODO: Implement proper streaming integration with Chat UI
          // For now, we'll just fire and forget, then reload tree

          const { treeApi } = await import('@/lib/tree-api');
          await treeApi.sendMessage(currentChat.id, {
            message: userMessage,
            node_id: parentId,
            regenerate: false
          }, (_event) => {
            // TODO: Update UI with streaming content
          });

          // Reload tree to show new node
          await loadTree(currentChat.id);

        } catch (error) {
          console.error("Failed to send tree message:", error);
          // Fallback?
        }
        return;
      }

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
        // Update state properly without page reload
        await loadChats();
        await selectChat(chatId);
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

        <div className="relative flex items-end w-full p-2 md:p-3 bg-[#f4f4f4] dark:bg-[#212121] rounded-3xl border border-transparent focus-within:border-gray-300 dark:focus-within:border-gray-600 shadow-sm transition-all">
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
            className="h-10 w-10 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full flex-shrink-0"
            disabled={isStreaming}
          >
            <Paperclip className="w-5 h-5" />
          </Button>

          {/* Text Input */}
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Perception..."
            disabled={isStreaming}
            className="flex-1 min-w-0 min-h-[44px] max-h-[200px] bg-transparent border-0 focus-visible:ring-0 resize-none py-3 px-2 text-base overflow-y-auto"
            rows={1}
            aria-label="Message input"
            aria-describedby="keyboard-hint"
          />
          <span id="keyboard-hint" className="sr-only">
            Press Enter to send, Shift+Enter for new line
          </span>

          {/* Right Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
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

        <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-3 mt-2">
          <p className="text-xs text-gray-400">
            Perception can make mistakes. Consider checking important information.
          </p>
          <p className="text-xs text-gray-400/70 hidden sm:block">
            <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[10px] font-mono">Enter</kbd>
            {" "}to send
            <span className="mx-1.5">·</span>
            <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[10px] font-mono">Shift+Enter</kbd>
            {" "}new line
          </p>
        </div>
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

      <AuthLimitModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        messagesUsed={messagesUsed}
      />
    </div>
  );
};
