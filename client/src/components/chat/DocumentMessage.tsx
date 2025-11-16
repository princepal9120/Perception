import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  FileText, 
  X, 
  File, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Paperclip,
  Eye
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Document } from "@/lib/chat-api";

interface DocumentMessageProps {
  documents: Document[];
  isLoading?: boolean;
  showTitle?: boolean;
  compact?: boolean;
  maxWidth?: string;
}

export const DocumentMessage = ({ 
  documents, 
  isLoading = false,
  showTitle = true,
  compact = false,
  maxWidth = "100%"
}: DocumentMessageProps) => {
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-3 h-3 text-red-500" />;
      case 'processing':
        return <Loader2 className="w-3 h-3 animate-spin text-blue-500" />;
      default:
        return <Loader2 className="w-3 h-3 animate-spin text-gray-400" />;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  if (documents.length === 0 && !isLoading) return null;

  return (
    <div className="w-full" style={{ maxWidth }}>
      {showTitle && (
        <div className="flex items-center gap-2 mb-3">
          <Paperclip className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">
            {documents.length > 0 ? `${documents.length} document${documents.length > 1 ? 's' : ''} attached` : 'Processing documents...'}
          </span>
        </div>
      )}

      <div className={`space-y-2 ${compact ? 'max-h-32' : 'max-h-48'}`}>
        {isLoading && documents.length === 0 ? (
          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Processing documents...</span>
          </div>
        ) : (
          <ScrollArea className={compact ? "max-h-32" : "max-h-48"}>
            <div className="space-y-2">
              <AnimatePresence>
                {documents.map((document, index) => (
                  <motion.div
                    key={document.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border hover:border-muted-foreground/50 transition-all"
                  >
                    {getFileIcon(document.filename)}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">
                          {document.filename}
                        </p>
                        <Badge 
                          variant="secondary" 
                          className="text-xs flex-shrink-0"
                        >
                          {formatFileSize(document.file_size)}
                        </Badge>
                        {getStatusIcon(document.status)}
                      </div>
                      
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-xs text-muted-foreground capitalize">
                          {document.status}
                        </span>
                        {document.indexed && (
                          <>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-green-600">Indexed</span>
                          </>
                        )}
                        {document.chunk_count > 0 && (
                          <>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">
                              {document.chunk_count} chunks
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* View/Preview Button */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-foreground"
                          disabled={document.status !== 'completed'}
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Preview document</p>
                      </TooltipContent>
                    </Tooltip>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Processing indicator */}
      {isLoading && documents.some(doc => doc.status === 'processing') && (
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>Processing documents for search...</span>
        </div>
      )}
    </div>
  );
};

// Compact version for inline display
export const CompactDocumentList = ({ documents }: { documents: Document[] }) => {
  if (documents.length === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Paperclip className="w-3 h-3 text-muted-foreground" />
      {documents.slice(0, 3).map((doc) => (
        <Badge 
          key={doc.id} 
          variant="secondary" 
          className="text-xs px-2 py-0.5"
        >
          {doc.filename}
        </Badge>
      ))}
      {documents.length > 3 && (
        <Badge variant="outline" className="text-xs">
          +{documents.length - 3} more
        </Badge>
      )}
    </div>
  );
};
