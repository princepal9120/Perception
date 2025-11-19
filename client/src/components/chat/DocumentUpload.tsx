import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  File,
  X,
  CheckCircle,
  AlertCircle,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { chatAPI, Document } from "@/lib/chat-api";
import { useToast } from "@/hooks/use-toast";

interface DocumentUploadProps {
  chatId: number;
  token: string;
  onUploadComplete?: (documents: Document[]) => void;
  onUploadError?: (error: string) => void;
}

export const DocumentUpload = ({
  chatId,
  token,
  onUploadComplete,
  onUploadError
}: DocumentUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadStatus, setUploadStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const supportedTypes = [
    ".pdf",
    ".docx",
    ".txt",
    ".md"
  ];

  const maxFileSize = 50 * 1024 * 1024; // 50MB
  const maxFiles = 10;

  const validateFiles = (files: File[]): { valid: File[]; errors: string[] } => {
    const valid: File[] = [];
    const errors: string[] = [];

    if (files.length > maxFiles) {
      errors.push(`Maximum ${maxFiles} files allowed per upload`);
      return { valid, errors };
    }

    files.forEach((file) => {
      // Check file type
      const fileExtension = "." + file.name.split('.').pop()?.toLowerCase();
      if (!supportedTypes.includes(fileExtension)) {
        errors.push(`${file.name}: Unsupported file type. Supported: ${supportedTypes.join(", ")}`);
        return;
      }

      // Check file size
      if (file.size > maxFileSize) {
        errors.push(`${file.name}: File too large. Maximum size is 50MB`);
        return;
      }

      valid.push(file);
    });

    return { valid, errors };
  };

  const handleFiles = async (files: File[]) => {
    const { valid, errors } = validateFiles(files);

    if (errors.length > 0) {
      setUploadStatus({
        type: "error",
        message: errors.join("\n")
      });
      onUploadError?.(errors.join("\n"));
      toast({
        title: "Upload Error",
        description: errors.join("\n"),
        variant: "destructive"
      });
      return;
    }

    if (valid.length === 0) return;

    setUploadedFiles(valid);
    await uploadDocuments(valid);
  };

  const uploadDocuments = async (files: File[]) => {
    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus({ type: null, message: "" });

    try {
      const response = await chatAPI.uploadDocuments(
        chatId,
        files,
        token,
        (progress) => {
          setUploadProgress(Math.round(progress));
        }
      );

      setUploadProgress(100);

      setUploadStatus({
        type: "success",
        message: response.message
      });

      toast({
        title: "Upload Successful",
        description: `${response.documents.length} document(s) uploaded and indexed successfully`,
      });

      onUploadComplete?.(response.documents);

      // Reset state after delay
      setTimeout(() => {
        setIsUploading(false);
        setUploadedFiles([]);
        setUploadProgress(0);
        setUploadStatus({ type: null, message: "" });
      }, 2000);

    } catch (error) {
      setIsUploading(false);
      setUploadProgress(0);

      const errorMessage = error instanceof Error ? error.message : "Upload failed";
      setUploadStatus({
        type: "error",
        message: errorMessage
      });

      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive"
      });

      onUploadError?.(errorMessage);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const removeFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Upload Documents
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50"
            } ${isUploading ? "pointer-events-none opacity-50" : "cursor-pointer"}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={!isUploading ? openFileDialog : undefined}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={supportedTypes.join(",")}
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading}
          />

          <div className="space-y-2">
            <Upload className={`w-12 h-12 mx-auto text-muted-foreground ${isDragging ? "text-primary" : ""
              }`} />
            <div>
              <p className="text-lg font-medium">
                {isUploading ? "Uploading..." : "Drop files here or click to browse"}
              </p>
              <p className="text-sm text-muted-foreground">
                Supported formats: PDF, DOCX, TXT, MD (max 50MB per file)
              </p>
            </div>
          </div>
        </div>

        {/* File List */}
        <AnimatePresence>
          {uploadedFiles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              <p className="text-sm font-medium">Selected Files:</p>
              {uploadedFiles.map((file, index) => (
                <motion.div
                  key={`${file.name}-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center justify-between p-2 bg-muted rounded-md"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <File className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm truncate">{file.name}</span>
                    <Badge variant="secondary" className="ml-auto flex-shrink-0">
                      {formatFileSize(file.size)}
                    </Badge>
                  </div>
                  {!isUploading && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upload Progress */}
        <AnimatePresence>
          {isUploading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-2"
            >
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm font-medium">Processing documents...</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
              <p className="text-xs text-muted-foreground">
                This may take a few moments as we process and index your files
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status Messages */}
        <AnimatePresence>
          {uploadStatus.type && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className={`p-3 rounded-md flex items-center gap-2 ${uploadStatus.type === "success"
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : "bg-red-50 text-red-800 border border-red-200"
                }`}
            >
              {uploadStatus.type === "success" ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              <span className="text-sm">{uploadStatus.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Help Text */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Files are automatically processed and indexed for AI search</p>
          <p>• Duplicate files are detected and skipped automatically</p>
          <p>• Maximum 10 files per upload, 50MB per file</p>
        </div>
      </CardContent>
    </Card>
  );
};
