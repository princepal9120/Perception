import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  File, 
  Trash2, 
  Download, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  MoreHorizontal
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { chatAPI, Document } from "@/lib/chat-api";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface DocumentListProps {
  chatId: number;
  token: string;
  onDocumentDeleted?: (documentId: number) => void;
  onDocumentsLoaded?: (documents: Document[]) => void;
}

export const DocumentList = ({ 
  chatId, 
  token, 
  onDocumentDeleted,
  onDocumentsLoaded 
}: DocumentListProps) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number[]>([]);
  const [total, setTotal] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    loadDocuments();
  }, [chatId, token]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await chatAPI.getChatDocuments(chatId, token);
      setDocuments(response.documents);
      setTotal(response.total);
      onDocumentsLoaded?.(response.documents);
    } catch (error) {
      console.error("Failed to load documents:", error);
      toast({
        title: "Error",
        description: "Failed to load documents",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (documentId: number) => {
    try {
      setDeleting(prev => [...prev, documentId]);
      
      await chatAPI.deleteDocument(documentId, token);
      
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      setTotal(prev => prev - 1);
      
      toast({
        title: "Document Deleted",
        description: "Document deleted successfully",
      });
      
      onDocumentDeleted?.(documentId);
    } catch (error) {
      console.error("Failed to delete document:", error);
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete document",
        variant: "destructive"
      });
    } finally {
      setDeleting(prev => prev.filter(id => id !== documentId));
    }
  };

  const handleBatchDelete = async (documentIds: number[]) => {
    try {
      setDeleting(prev => [...prev, ...documentIds]);
      
      const results = await chatAPI.batchDeleteDocuments(documentIds, token);
      
      // Filter out successfully deleted documents
      const successfulDeletes = results
        .filter(result => !result.message.includes("Failed"))
        .map(result => result.document_id);
      
      setDocuments(prev => prev.filter(doc => !successfulDeletes.includes(doc.id)));
      setTotal(prev => prev - successfulDeletes.length);
      
      const failedCount = results.length - successfulDeletes.length;
      if (failedCount > 0) {
        toast({
          title: "Partial Success",
          description: `${successfulDeletes.length} documents deleted, ${failedCount} failed`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Documents Deleted",
          description: `${successfulDeletes.length} documents deleted successfully`,
        });
      }
      
      successfulDeletes.forEach(id => onDocumentDeleted?.(id));
    } catch (error) {
      console.error("Failed to batch delete documents:", error);
      toast({
        title: "Batch Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete documents",
        variant: "destructive"
      });
    } finally {
      setDeleting([]);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (extension: string) => {
    const ext = extension.toLowerCase();
    switch (ext) {
      case ".pdf":
        return "📄";
      case ".docx":
        return "📝";
      case ".txt":
        return "📄";
      case ".md":
        return "📄";
      default:
        return "📄";
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return "Unknown";
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <File className="w-5 h-5" />
          Documents ({total})
        </CardTitle>
        {documents.length > 1 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleBatchDelete(documents.map(doc => doc.id))}
            disabled={deleting.length > 0}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete All
          </Button>
        )}
      </CardHeader>
      
      <CardContent className="space-y-3">
        {documents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <File className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No documents uploaded</p>
            <p className="text-sm">Upload documents to get started with AI-powered search</p>
          </div>
        ) : (
          <AnimatePresence>
            {documents.map((document, index) => (
              <motion.div
                key={document.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  {/* File Info */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="text-2xl flex-shrink-0">
                      {getFileIcon(document.file_extension)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate" title={document.original_filename}>
                        {document.original_filename}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {formatFileSize(document.file_size)}
                        </Badge>
                        <Badge 
                          variant={document.indexed ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {document.indexed ? (
                            <div className="flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Indexed
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Processing
                            </div>
                          )}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {document.chunk_count} chunks
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>Uploaded {formatDate(document.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {deleting.includes(document.id) ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-destructive"></div>
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleDelete(document.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>

                {/* Status Indicator */}
                {!document.indexed && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md"
                  >
                    <div className="flex items-center gap-2 text-sm text-yellow-800">
                      <AlertCircle className="w-4 h-4" />
                      <span>Document is being processed and indexed...</span>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {/* Summary */}
        {documents.length > 0 && (
          <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Total: {documents.length} document{documents.length !== 1 ? 's' : ''}</span>
              <span>
                {documents.filter(d => d.indexed).length} indexed, 
                {documents.filter(d => !d.indexed).length} processing
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
