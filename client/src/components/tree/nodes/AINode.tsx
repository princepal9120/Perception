import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Bot, Sparkles, RefreshCw, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const AINode = ({ data }: { data: any }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(data.label);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="relative group">
            <Handle type="target" position={Position.Top} className="!bg-primary !w-2 !h-2" />

            <div className={cn(
                "flex items-start gap-3 bg-white dark:bg-zinc-900 border rounded-2xl p-4 shadow-sm min-w-[300px] max-w-[500px] transition-all duration-200",
                data.isActive ? "border-primary ring-1 ring-primary shadow-md" : "border-zinc-200 dark:border-zinc-800"
            )}>
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-primary" />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                        <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                            Perception AI
                            {data.isStreaming && (
                                <span className="flex items-center gap-1 text-xs text-primary font-normal bg-primary/10 px-2 py-0.5 rounded-full">
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                    Generating...
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={handleCopy}
                            >
                                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            </Button>
                        </div>
                    </div>

                    <div className="prose prose-sm dark:prose-invert max-w-none text-zinc-600 dark:text-zinc-300">
                        <ReactMarkdown>{data.label}</ReactMarkdown>
                    </div>

                    {data.timestamp && (
                        <div className="text-xs text-zinc-400 mt-2 flex items-center gap-2">
                            {new Date(data.timestamp).toLocaleTimeString()}
                            {data.tokens && (
                                <>
                                    <span>•</span>
                                    <span>{data.tokens} tokens</span>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <Handle type="source" position={Position.Bottom} className="!bg-primary !w-2 !h-2" />
        </div>
    );
};

export default memo(AINode);
