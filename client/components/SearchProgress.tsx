import React, { useState } from 'react';
import {
    Search,
    FileText,
    PenTool,
    AlertCircle,
    CheckCircle,
    Globe,
    ExternalLink,
    ChevronDown,
    ChevronUp,
    Copy,
    Check
} from 'lucide-react';

interface SearchInfo {
    stages: string[];
    query: string;
    urls: string[];
    error?: string;
}

interface SearchProgressProps {
    searchInfo: SearchInfo;
}

const SearchProgress: React.FC<SearchProgressProps> = ({ searchInfo }) => {
    const { stages = [], query = '', urls = [], error } = searchInfo;
    const [showAllUrls, setShowAllUrls] = useState(false);
    const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

    // Extract domain from URL for better display
    const getDomainFromUrl = (url: string): string => {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname.replace('www.', '');
        } catch {
            return url;
        }
    };

    // Get favicon URL for better visual representation
    const getFaviconUrl = (url: string): string => {
        try {
            const urlObj = new URL(url);
            return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=16`;
        } catch {
            return '';
        }
    };

    // Copy URL to clipboard
    const copyToClipboard = async (url: string) => {
        try {
            await navigator.clipboard.writeText(url);
            setCopiedUrl(url);
            setTimeout(() => setCopiedUrl(null), 2000);
        } catch (err) {
            console.error('Failed to copy URL:', err);
        }
    };

    const getStageInfo = (stage: string): {
        icon: React.ComponentType<{ className?: string }>;
        label: string;
        description: string;
        color: string;
        bgColor: string;
        borderColor: string;
    } => {
        switch (stage) {
            case 'searching':
                return {
                    icon: Search,
                    label: 'Searching',
                    description: `Searching for: "${query}"`,
                    color: 'text-blue-600',
                    bgColor: 'bg-blue-50',
                    borderColor: 'border-blue-200',
                };
            case 'reading':
                return {
                    icon: FileText,
                    label: 'Reading',
                    description: `Reading ${urls.length} sources`,
                    color: 'text-orange-600',
                    bgColor: 'bg-orange-50',
                    borderColor: 'border-orange-200',
                };
            case 'writing':
                return {
                    icon: PenTool,
                    label: 'Writing',
                    description: 'Generating response',
                    color: 'text-green-600',
                    bgColor: 'bg-green-50',
                    borderColor: 'border-green-200',
                };
            case 'error':
                return {
                    icon: AlertCircle,
                    label: 'Error',
                    description: error || 'An error occurred',
                    color: 'text-red-600',
                    bgColor: 'bg-red-50',
                    borderColor: 'border-red-200',
                };
            default:
                return {
                    icon: Search,
                    label: stage,
                    description: '',
                    color: 'text-gray-600',
                    bgColor: 'bg-gray-50',
                    borderColor: 'border-gray-200',
                };
        }
    };

    const isCompleted = (stage: string, index: number) => {
        const currentIndex = stages.length - 1;
        return index < currentIndex || (index === currentIndex && stage === 'writing');
    };

    const isActive = (stage: string, index: number) => {
        const currentIndex = stages.length - 1;
        return index === currentIndex && stage !== 'writing';
    };

    const urlsToShow = showAllUrls ? urls : urls.slice(0, 3);

    return (
        <div className="bg-gradient-to-br from-gray-50/80 to-white/80 backdrop-blur-sm rounded-xl p-5 border border-gray-200/50 mb-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                    <Globe className="w-4 h-4 text-blue-500" />
                    <span>Search Progress</span>
                </h4>
                {query && (
                    <div className="text-xs text-gray-600 bg-white/80 px-3 py-1.5 rounded-full border border-gray-200 shadow-sm">
                        <span className="text-gray-500">Query:</span> <span className="font-medium">{query}</span>
                    </div>
                )}
            </div>

            {/* Progress steps */}
            <div className="flex items-center space-x-3 overflow-x-auto pb-2 mb-4">
                {stages.map((stage, index) => {
                    const stageInfo = getStageInfo(stage);
                    const Icon = stageInfo.icon;
                    const completed = isCompleted(stage, index);
                    const active = isActive(stage, index);

                    return (
                        <div
                            key={`${stage}-${index}`}
                            className="flex items-center space-x-3 flex-shrink-0"
                        >
                            <div
                                className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg border transition-all duration-300 shadow-sm ${completed
                                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 text-green-700 shadow-green-100'
                                    : active
                                        ? `${stageInfo.bgColor} ${stageInfo.borderColor} ${stageInfo.color} shadow-lg`
                                        : 'bg-gray-100 border-gray-200 text-gray-500'
                                    }`}
                            >
                                <div className="relative">
                                    {completed ? (
                                        <CheckCircle className="w-4 h-4" />
                                    ) : (
                                        <Icon className={`w-4 h-4 ${active ? 'animate-pulse' : ''}`} />
                                    )}
                                </div>
                                <span className="text-xs font-medium whitespace-nowrap">
                                    {stageInfo.label}
                                </span>
                            </div>

                            {/* Connector line */}
                            {index < stages.length - 1 && (
                                <div
                                    className={`w-8 h-0.5 rounded-full ${completed ? 'bg-gradient-to-r from-green-300 to-emerald-300' : 'bg-gray-300'
                                        } transition-all duration-300`}
                                />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Current stage description */}
            {stages.length > 0 && (
                <div className="mb-4 p-3 bg-white/60 rounded-lg border border-gray-100">
                    <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        <p className="text-sm text-gray-700 font-medium">
                            {getStageInfo(stages[stages.length - 1]).description}
                        </p>
                    </div>
                </div>
            )}

            {/* Enhanced URLs section */}
            {urls.length > 0 && (
                <div className="bg-white/60 rounded-lg border border-gray-100 p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                            <Globe className="w-4 h-4 text-blue-500" />
                            <span className="text-sm font-semibold text-gray-700">
                                Sources
                            </span>
                            <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">
                                {urls.length}
                            </span>
                        </div>
                        {urls.length > 3 && (
                            <button
                                onClick={() => setShowAllUrls(!showAllUrls)}
                                className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
                            >
                                <span>{showAllUrls ? 'Show less' : 'Show all'}</span>
                                {showAllUrls ? (
                                    <ChevronUp className="w-3 h-3" />
                                ) : (
                                    <ChevronDown className="w-3 h-3" />
                                )}
                            </button>
                        )}
                    </div>

                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        {urlsToShow.map((url, index) => (
                            <div
                                key={index}
                                className="group flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-all duration-200 hover:shadow-sm"
                            >
                                <div className="flex items-center space-x-3 flex-1 min-w-0">
                                    <img
                                        src={getFaviconUrl(url)}
                                        alt=""
                                        className="w-4 h-4 flex-shrink-0"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                        }}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <a
                                            href={url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors group"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <div className="font-medium text-sm truncate">
                                                    {getDomainFromUrl(url)}
                                                </div>
                                                <div className="text-xs text-gray-500 truncate">
                                                    {url}
                                                </div>
                                            </div>
                                            <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </a>
                                    </div>
                                </div>

                                <button
                                    onClick={() => copyToClipboard(url)}
                                    className="ml-2 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-all opacity-0 group-hover:opacity-100"
                                    title="Copy URL"
                                >
                                    {copiedUrl === url ? (
                                        <Check className="w-3 h-3 text-green-500" />
                                    ) : (
                                        <Copy className="w-3 h-3" />
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>

                    {!showAllUrls && urls.length > 3 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                            <button
                                onClick={() => setShowAllUrls(true)}
                                className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                            >
                                View {urls.length - 3} more sources
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchProgress;