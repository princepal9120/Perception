import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  FileText, 
  X, 
  Upload, 
  File, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Paperclip
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Document } from "@/lib/chat-api";

interface DocumentAttachmentsProps {
  documents: Document[];
  onUpload: (files: FileList) => void;
  onRemove: (documentId: number) => void;
  isUploading?: boolean;
  uploadProgress?: Record<string, number>;
  maxFiles?: number;
  disabled?: boolean;
}

export const DocumentAttachments = ({
  documents,
  onUpload,
  onRemove,
  isUploading = false,
  uploadProgress = {},
  maxFiles = 10,
  disabled = false,
}: DocumentAttachmentsProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      onUpload(files);
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
      onUpload(files);
    }
  };

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

  const getStatusIcon = (status: string, isUploading: boolean, progress?: number) => {
    if (isUploading && progress !== undefined) {
      return <Loader2 className="w-3 h-3 animate-spin text-blue-500" />;
    }
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

  const isMaxFilesReached = documents.length >= maxFiles;

  return (
    <div className="w-full">
      {/* Upload Area */}
      {!disabled && !isMaxFilesReached && (
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-4 mb-4 transition-all
            ${isDragOver 
              ? 'border-primary bg-primary/5' 
              : 'border-border hover:border-muted-foreground/50 bg-muted/20'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.doc,.txt,.md"
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled}
          />
          
          <div className="flex flex-col items-center justify-center space-y-2">
            <motion.div
              animate={isDragOver ? { scale: 1.1 } : { scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <Upload className="w-8 h-8 text-muted-foreground" />
            </motion.div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                {isDragOver ? 'Drop files here' : 'Click to upload or drag and drop'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PDF, DOCX, TXT, MD (max 50MB each, {maxFiles} files total)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Documents List */}
      {documents.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-foreground">
              Documents ({documents.length}/{maxFiles})
            </h4>
            {!disabled && documents.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="h-6 px-2 text-xs"
              >
                <Paperclip className="w-3 h-3 mr-1" />
                Add More
              </Button>
            )}
          </div>
          
          <ScrollArea className="max-h-60">
            <div className="space-y-2">
              <AnimatePresence>
                {documents.map((document) => {
                  const progress = uploadProgress[document.id] || 0;
                  const isCurrentlyUploading = isUploading && progress > 0 && progress < 100;
                  
                  return (
                    <motion.div
                      key={document.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
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
                        </div>
                        
                        {/* Progress Bar */}
                        {(isCurrentlyUploading || document.status === 'processing') && (
                          <div className="mt-2 space-y-1">
                            <Progress value={progress} className="h-1" />
                            <p className="text-xs text-muted-foreground">
                              {document.status === 'processing' ? 'Processing...' : `Uploading... ${Math.round(progress)}%`}
                            </p>
                          </div>
                        )}
                        
                        {/* Status Indicator */}
                        {!isCurrentlyUploading && (
                          <div className="flex items-center gap-1 mt-1">
                            {getStatusIcon(document.status, false)}
                            <span className="text-xs text-muted-foreground capitalize">
                              {document.status}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Remove Button */}
                      {!disabled && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onRemove(document.id)}
                              className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Remove document</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Max Files Warning */}
      {isMaxFilesReached && (
        <div className="text-center p-4 bg-muted/20 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground">
            Maximum {maxFiles} files reached. Remove some files to add more.
          </p>
        </div>
      )}
    </div>
  );
};
