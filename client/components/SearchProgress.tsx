 
import React from 'react';
import { Search, FileText, PenTool, AlertCircle, CheckCircle, Globe } from 'lucide-react';

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
    const { stages, query, urls, error } = searchInfo;

    const getStageInfo = (stage: string) => {
        switch (stage) {
            case 'searching':
                return {
                    icon: Search,
                    label: 'Searching',
                    description: `Searching for: "${query}"`,
                    color: 'text-blue-600',
                    bgColor: 'bg-blue-50',
                    borderColor: 'border-blue-200'
                };
            case 'reading':
                return {
                    icon: FileText,
                    label: 'Reading',
                    description: `Reading ${urls.length} sources`,
                    color: 'text-orange-600',
                    bgColor: 'bg-orange-50',
                    borderColor: 'border-orange-200'
                };
            case 'writing':
                return {
                    icon: PenTool,
                    label: 'Writing',
                    description: 'Generating response',
                    color: 'text-green-600',
                    bgColor: 'bg-green-50',
                    borderColor: 'border-green-200'
                };
            case 'error':
                return {
                    icon: AlertCircle,
                    label: 'Error',
                    description: error || 'An error occurred',
                    color: 'text-red-600',
                    bgColor: 'bg-red-50',
                    borderColor: 'border-red-200'
                };
            default:
                return {
                    icon: Search,
                    label: stage,
                    description: '',
                    color: 'text-gray-600',
                    bgColor: 'bg-gray-50',
                    borderColor: 'border-gray-200'
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

    return (
        <div className="bg-gray-50/50 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 mb-4">
            <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                    <Globe className="w-4 h-4" />
                    <span>Search Progress</span>
                </h4>
                {query && (
                    <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full border">
                        Query: {query}
                    </div>
                )}
            </div>

            {/* Progress steps */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-2">
                {stages.map((stage, index) => {
                    const stageInfo = getStageInfo(stage);
                    const Icon = stageInfo.icon;
                    const completed = isCompleted(stage, index);
                    const active = isActive(stage, index);

                    return (
                        <div key={`${stage}-${index}`} className="flex items-center space-x-2 flex-shrink-0">
                            <div
                                className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-all duration-300 ${completed
                                        ? 'bg-green-50 border-green-200 text-green-700'
                                        : active
                                            ? `${stageInfo.bgColor} ${stageInfo.borderColor} ${stageInfo.color}`
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
                                <div className={`w-8 h-0.5 ${completed ? 'bg-green-300' : 'bg-gray-300'} transition-colors duration-300`} />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Current stage description */}
            {stages.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        <p className="text-xs text-gray-600">
                            {getStageInfo(stages[stages.length - 1]).description}
                        </p>
                    </div>
                </div>
            )}

            {/* URLs preview */}
            {urls.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center space-x-2 mb-2">
                        <Globe className="w-3 h-3 text-gray-500" />
                        <span className="text-xs font-medium text-gray-600">Sources ({urls.length})</span>
                    </div>
                    <div className="grid grid-cols-1 gap-1 max-h-20 overflow-y-auto">
                        {urls.slice(0, 3).map((url, index) => (
                            <div key={index} className="text-xs text-blue-600 hover:text-blue-800 truncate">
                                {url}
                            </div>
                        ))}
                        {urls.length > 3 && (
                            <div className="text-xs text-gray-500">
                                +{urls.length - 3} more sources
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchProgress;