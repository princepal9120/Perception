// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';
import { User, Bot, Loader2, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface SearchInfo {
    stages: string[];
    query: string;
    urls: string[];
    error?: string;
}

interface Message {
    id: number;
    content: string;
    isUser: boolean;
    type: string;
    isLoading?: boolean;
    searchInfo?: SearchInfo;
}

interface MessageBubbleProps {
    message: Message;
    isLast: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isLast }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(message.content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    const formatContent = (content: string) => {
        // Simple markdown-like formatting
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">$1</code>');
    };

    if (message.isUser) {
        return (
            <div className="flex justify-end mb-4 group">
                <div className="flex items-end space-x-2 max-w-[80%]">
                    <div className="relative">
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white px-6 py-3 rounded-2xl rounded-br-md shadow-lg">
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                        </div>
                        {/* Tail */}
                        <div className="absolute bottom-0 right-0 w-0 h-0 border-l-8 border-l-blue-600 border-t-8 border-t-transparent transform translate-x-1"></div>
                    </div>
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md flex-shrink-0">
                        <User className="w-4 h-4 text-white" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex justify-start mb-4 group">
            <div className="flex items-start space-x-3 max-w-[85%]">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center shadow-md flex-shrink-0 mt-1">
                    <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="relative flex-1">
                    <div className="bg-white border border-gray-200 px-6 py-4 rounded-2xl rounded-tl-md shadow-sm hover:shadow-md transition-shadow duration-200">
                        {message.isLoading ? (
                            <div className="flex items-center space-x-2 text-gray-500">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-sm">Thinking...</span>
                            </div>
                        ) : (
                            <>
                                {message.content ? (
                                    <div className="prose prose-sm max-w-none">
                                        <p
                                            className="text-gray-800 leading-relaxed whitespace-pre-wrap text-sm mb-0"
                                            dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}
                                        />
                                    </div>
                                ) : (
                                    <div className="flex items-center space-x-2 text-gray-400">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span className="text-sm">Generating response...</span>
                                    </div>
                                )}

                                {/* Copy button */}
                                {message.content && !message.isLoading && (
                                    <button
                                        onClick={handleCopy}
                                        className="absolute top-2 right-2 p-1.5 hover:bg-gray-100 rounded-lg transition-colors duration-200 opacity-0 group-hover:opacity-100"
                                        title="Copy message"
                                    >
                                        {copied ? (
                                            <Check className="w-3.5 h-3.5 text-green-600" />
                                        ) : (
                                            <Copy className="w-3.5 h-3.5 text-gray-400" />
                                        )}
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                    {/* Tail */}
                    <div className="absolute top-4 -left-1 w-0 h-0 border-r-8 border-r-white border-t-8 border-t-transparent"></div>
                    <div className="absolute top-4 -left-2 w-0 h-0 border-r-8 border-r-gray-200 border-t-8 border-t-transparent"></div>
                </div>
            </div>
        </div>
    );
};

export default MessageBubble;