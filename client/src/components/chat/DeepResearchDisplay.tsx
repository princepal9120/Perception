import { motion, AnimatePresence } from "framer-motion";
import { Search, Globe, FileText, Loader2, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { SearchInfo } from "@/lib/chat-api";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface DeepResearchDisplayProps {
  searchInfo: SearchInfo;
  isStreaming?: boolean;
}

export const DeepResearchDisplay = ({ searchInfo, isStreaming = false }: DeepResearchDisplayProps) => {
  const [showAllSources, setShowAllSources] = useState(false);
  
  const currentStage = searchInfo.stages[searchInfo.stages.length - 1];
  const hasCompleted = searchInfo.stages.includes('writing');
  
  const getStageText = () => {
    if (currentStage === 'searching') return 'Searching the web...';
    if (currentStage === 'reading') return 'Reading and analyzing sources...';
    if (currentStage === 'writing') return 'Generating answer';
    return 'Processing...';
  };

  const getProgressSteps = () => {
    return [
      { id: 'searching', label: 'Search', icon: Search, done: searchInfo.stages.includes('searching') },
      { id: 'reading', label: 'Read', icon: FileText, done: searchInfo.stages.includes('reading') },
      { id: 'writing', label: 'Answer', icon: Globe, done: searchInfo.stages.includes('writing') }
    ];
  };

  const displayedUrls = showAllSources ? searchInfo.urls : searchInfo.urls?.slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="mb-4 space-y-3"
    >
      {/* Search Query Header */}
      {searchInfo.query && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-border/50">
          <Search className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground mb-1">Searching for:</p>
            <p className="text-sm font-medium text-foreground break-words">"{searchInfo.query}"</p>
          </div>
        </div>
      )}

      {/* Progress Steps */}
      {isStreaming && !hasCompleted && (
        <div className="flex items-center justify-between gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
          <div className="flex items-center gap-2 flex-1">
            <Loader2 className="w-4 h-4 text-primary animate-spin flex-shrink-0" />
            <span className="text-sm text-foreground font-medium">{getStageText()}</span>
          </div>
          
          <div className="flex items-center gap-1.5">
            {getProgressSteps().map((step, index) => (
              <div key={step.id} className="flex items-center gap-1">
                <div className={`flex items-center justify-center w-6 h-6 rounded-full transition-colors ${
                  step.done 
                    ? 'bg-primary text-primary-foreground' 
                    : currentStage === step.id
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {step.done ? (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <step.icon className="w-3 h-3" />
                  )}
                </div>
                {index < getProgressSteps().length - 1 && (
                  <div className={`w-4 h-0.5 rounded-full transition-colors ${
                    step.done ? 'bg-primary' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sources Section */}
      {searchInfo.urls && searchInfo.urls.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">
                {searchInfo.urls.length} {searchInfo.urls.length === 1 ? 'Source' : 'Sources'}
              </span>
            </div>
            
            {searchInfo.urls.length > 5 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllSources(!showAllSources)}
                className="h-6 text-xs gap-1"
              >
                {showAllSources ? (
                  <>Show Less <ChevronUp className="w-3 h-3" /></>
                ) : (
                  <>Show All <ChevronDown className="w-3 h-3" /></>
                )}
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-1.5">
            <AnimatePresence>
              {displayedUrls?.map((url, index) => {
                const urlObj = new URL(url);
                const domain = urlObj.hostname.replace('www.', '');
                const favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
                
                return (
                  <motion.a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ delay: index * 0.05 }}
                    className="group flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 border border-transparent hover:border-border/50 transition-all"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="w-5 h-5 rounded flex items-center justify-center bg-muted flex-shrink-0 overflow-hidden">
                        <img 
                          src={favicon} 
                          alt="" 
                          className="w-4 h-4"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate group-hover:text-primary transition-colors">
                          {domain}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {urlObj.pathname !== '/' ? urlObj.pathname : urlObj.href}
                        </p>
                      </div>
                    </div>
                    
                    <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  </motion.a>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Error Display */}
      {searchInfo.error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20"
        >
          <div className="w-5 h-5 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-3 h-3 text-destructive" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-destructive mb-1">Search Error</p>
            <p className="text-xs text-destructive/80">{searchInfo.error}</p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};
