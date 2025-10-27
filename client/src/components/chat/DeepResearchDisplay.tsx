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
        if (currentStage === 'searching') return 'Searching';
        if (currentStage === 'reading') return 'Reading';
        if (currentStage === 'writing') return 'Writing';
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
                <div className="flex items-start gap-2 mb-4">
                    <Search className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm text-muted-foreground">Searching for:</p>
                        <p className="text-base font-medium text-foreground mt-1">"{searchInfo.query}"</p>
                    </div>
                </div>
            )}

            {/* Progress Steps - Linear Flow (Perplexity Style) */}
            {(isStreaming || !hasCompleted) && (
                <div className="mb-4">
                    <div className="flex items-center gap-2">
                        {getProgressSteps().map((step, index) => (
                            <>
                                <div
                                    key={step.id}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-full transition-all ${step.done
                                        ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                                        : currentStage === step.id
                                            ? 'bg-primary/10 text-primary'
                                            : 'bg-muted/50 text-muted-foreground'
                                        }`}
                                >
                                    <div className={`flex items-center justify-center w-5 h-5 rounded-full flex-shrink-0 ${step.done
                                        ? 'bg-green-500 text-white'
                                        : currentStage === step.id
                                            ? 'bg-transparent'
                                            : 'bg-transparent'
                                        }`}>
                                        {step.done ? (
                                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        ) : currentStage === step.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <step.icon className="w-4 h-4" />
                                        )}
                                    </div>
                                    <span className="text-sm font-medium">
                                        {step.label}
                                    </span>
                                </div>
                                {index < getProgressSteps().length - 1 && (
                                    <div className={`w-6 h-[2px] rounded-full transition-colors ${step.done ? 'bg-green-500' : 'bg-border'
                                        }`} />
                                )}
                            </>
                        ))}
                    </div>
                </div>
            )}

            {/* Sources Section */}
            {searchInfo.urls && searchInfo.urls.length > 0 && (
                <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium text-foreground">
                                {searchInfo.urls.length} {searchInfo.urls.length === 1 ? 'Source' : 'Sources'}
                            </span>
                        </div>

                        {searchInfo.urls.length > 5 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowAllSources(!showAllSources)}
                                className="h-8 text-xs gap-1 text-primary hover:text-primary"
                            >
                                {showAllSources ? 'Show less' : 'Show all'}
                                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAllSources ? 'rotate-180' : ''}`} />
                            </Button>
                        )}
                    </div>

                    <div className="space-y-1">
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
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -5 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="group flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="w-5 h-5 rounded flex items-center justify-center bg-background border border-border flex-shrink-0 overflow-hidden mt-0.5">
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
                                            <p className="text-sm font-medium text-primary group-hover:underline">
                                                {domain}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                                                {urlObj.href}
                                            </p>
                                        </div>
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
