import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocumentUpload } from "./DocumentUpload";
import { DocumentList } from "./DocumentList";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Upload,
} from "lucide-react";
import { motion } from "framer-motion";
import { Document } from "@/lib/chat-api";
import { useChat } from "@/hooks/use-chat";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface DocumentManagerProps {
  isOpen: boolean;
  onClose: () => void;
  chatId: number;
  token: string;
}

export const DocumentManager = ({ 
  isOpen, 
  onClose, 
  chatId, 
  token 
}: DocumentManagerProps) => {
  const [activeTab, setActiveTab] = useState<"upload" | "list">("upload");
  const [documents, setDocuments] = useState<Document[]>([]);
  const { currentChat } = useChat();

  const handleUploadComplete = (uploadedDocs: Document[]) => {
    setDocuments(prev => [...uploadedDocs, ...prev]);
    setActiveTab("list");
  };

  const handleDocumentDeleted = (documentId: number) => {
    setDocuments(prev => prev.filter(doc => doc.id !== documentId));
  };

  const handleDocumentsLoaded = (loadedDocs: Document[]) => {
    setDocuments(loadedDocs);
  };

  const getDocumentStats = () => {
    const indexed = documents.filter(doc => doc.indexed).length;
    const processing = documents.filter(doc => !doc.indexed).length;
    const totalSize = documents.reduce((sum, doc) => sum + doc.file_size, 0);
    
    return {
      total: documents.length,
      indexed,
      processing,
      totalSize,
    };
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const stats = getDocumentStats();

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:w-[600px] sm:max-w-[90vw]">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              <SheetTitle>Document Manager</SheetTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          </div>
          <SheetDescription>
            Upload and manage documents for AI-powered search and analysis
          </SheetDescription>
        </SheetHeader>

        {/* Document Stats */}
        {documents.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 bg-muted/30 rounded-lg border"
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="space-y-1">
                <div className="text-2xl font-bold text-primary">{stats.total}</div>
                <div className="text-xs text-muted-foreground">Total Docs</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-green-600">{stats.indexed}</div>
                <div className="text-xs text-muted-foreground">Indexed</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-yellow-600">{stats.processing}</div>
                <div className="text-xs text-muted-foreground">Processing</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold">{formatFileSize(stats.totalSize)}</div>
                <div className="text-xs text-muted-foreground">Total Size</div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Indexing Progress</span>
                <span>{stats.total > 0 ? Math.round((stats.indexed / stats.total) * 100) : 0}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <motion.div
                  className="bg-gradient-to-r from-yellow-500 to-green-500 h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ 
                    width: stats.total > 0 ? `${(stats.indexed / stats.total) * 100}%` : "0%"
                  }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "upload" | "list")} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Manage ({documents.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-4">
            <DocumentUpload
              chatId={chatId}
              token={token}
              onUploadComplete={handleUploadComplete}
            />
          </TabsContent>

          <TabsContent value="list" className="mt-4">
            <DocumentList
              chatId={chatId}
              token={token}
              onDocumentDeleted={handleDocumentDeleted}
              onDocumentsLoaded={handleDocumentsLoaded}
            />
          </TabsContent>
        </Tabs>

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {currentChat?.title && `Chat: ${currentChat.title}`}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
            {documents.length > 0 && (
              <Button 
                size="sm" 
                onClick={() => setActiveTab("upload")}
                className="gradient-primary"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload More
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
