import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FileText,
  X,
  File,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Document } from "@/lib/chat-api";

interface DocumentAttachmentsProps {
  documents: Document[];
  onRemove: (documentId: number) => void;
  isUploading?: boolean;
  uploadProgress?: Record<string, number>;
  disabled?: boolean;
}

export const DocumentAttachments = ({
  documents,
  onRemove,
  isUploading = false,
  uploadProgress = {},
  disabled = false,
}: DocumentAttachmentsProps) => {
  const getFileIcon = (filename: string) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return <FileText className="w-4 h-4 text-red-500" />;
      case 'docx':
      case 'doc':
        return <FileText className="w-4 h-4 text-blue-500" />;
      case 'txt':
        return <FileText className="w-4 h-4 text-gray-500" />;
      case 'md':
        return <FileText className="w-4 h-4 text-purple-500" />;
      default:
        return <File className="w-4 h-4 text-gray-400" />;
    }
  };

  if (documents.length === 0) return null;

  return (
    <div className="w-full">
      <div className="space-y-2">
        <ScrollArea className="max-h-60">
          <div className="flex flex-wrap gap-2">
            <AnimatePresence>
              {documents.map((document) => {
                const progress = uploadProgress[document.id] || 0;
                const isCurrentlyUploading = isUploading && progress > 0 && progress < 100;

                return (
                  <motion.div
                    key={document.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="relative group flex items-center gap-2 p-2 bg-card rounded-lg border border-border hover:border-muted-foreground/50 transition-all max-w-[200px]"
                  >
                    {getFileIcon(document.filename)}

                    <div className="flex-1 min-w-0 overflow-hidden">
                      <p className="text-xs font-medium truncate" title={document.filename}>
                        {document.filename}
                      </p>

                      {/* Progress Bar */}
                      {(isCurrentlyUploading || document.status === 'processing') && (
                        <div className="mt-1">
                          <Progress value={progress} className="h-1" />
                        </div>
                      )}
                    </div>

                    {/* Remove Button */}
                    {!disabled && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onRemove(document.id)}
                        className="h-5 w-5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 -mr-1"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};
