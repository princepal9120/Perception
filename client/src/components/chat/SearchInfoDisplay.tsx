import { motion } from "framer-motion";
import { Search, BookOpen, Pencil, AlertCircle, CheckCircle } from "lucide-react";
import { SearchInfo } from "@/lib/chat-api";
import { Badge } from "@/components/ui/badge";

interface SearchInfoDisplayProps {
    searchInfo: SearchInfo;
}

export const SearchInfoDisplay = ({ searchInfo }: SearchInfoDisplayProps) => {
    const getStageIcon = (stage: string) => {
        switch (stage) {
            case 'searching':
                return <Search className="w-4 h-4 animate-spin" />;
            case 'reading':
                return <BookOpen className="w-4 h-4" />;
            case 'writing':
                return <Pencil className="w-4 h-4" />;
            case 'error':
                return <AlertCircle className="w-4 h-4 text-destructive" />;
            default:
                return <CheckCircle className="w-4 h-4" />;
        }
    };

    const getStageLabel = (stage: string) => {
        switch (stage) {
            case 'searching':
                return 'Searching the web';
            case 'reading':
                return 'Reading sources';
            case 'writing':
                return 'Writing response';
            case 'error':
                return 'Search error';
            default:
                return stage;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-2 sm:mb-3 space-y-1.5 sm:space-y-2"
        >
            {/* Search Query */}
            {searchInfo.query && (
                <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground flex-wrap">
                    <Search className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="font-medium">Searching:</span>
                    <span className="italic break-words">"{searchInfo.query}"</span>
                </div>
            )}

            {/* Stages */}
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {searchInfo.stages.map((stage, index) => (
                    <Badge
                        key={`${stage}-${index}`}
                        variant={stage === 'error' ? 'destructive' : 'secondary'}
                        className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs px-2 py-0.5"
                    >
                        {getStageIcon(stage)}
                        <span>{getStageLabel(stage)}</span>
                    </Badge>
                ))}
            </div>

            {/* URLs */}
            {searchInfo.urls && searchInfo.urls.length > 0 && (
                <div className="space-y-1">
                    <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">Sources:</p>
                    <div className="space-y-0.5 sm:space-y-1">
                        {searchInfo.urls.slice(0, 3).map((url, index) => (
                            <a
                                key={index}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block text-[10px] sm:text-xs text-primary hover:underline truncate"
                            >
                                {index + 1}. {url}
                            </a>
                        ))}
                        {searchInfo.urls.length > 3 && (
                            <p className="text-[10px] sm:text-xs text-muted-foreground">
                                +{searchInfo.urls.length - 3} more sources
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Error */}
            {searchInfo.error && (
                <div className="flex items-start gap-1.5 sm:gap-2 p-2 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-destructive flex-shrink-0 mt-0.5" />
                    <p className="text-[10px] sm:text-xs text-destructive break-words">{searchInfo.error}</p>
                </div>
            )}
        </motion.div>
    );
};
