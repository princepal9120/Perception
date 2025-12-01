/**
 * Message Action Buttons - Fork, Regenerate, Copy
 */
import React from 'react';
import { Button } from '../ui/button';
import { GitBranch, RefreshCw, Copy, Check } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '../ui/tooltip';
import { useState } from 'react';

interface MessageActionsProps {
    messageId: number;
    role: 'user' | 'assistant';
    content: string;
    onFork?: () => void;
    onRegenerate?: () => void;
    isTreeMode?: boolean;
}

export const MessageActions: React.FC<MessageActionsProps> = ({
    messageId,
    role,
    content,
    onFork,
    onRegenerate,
    isTreeMode = false,
}) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Copy Button */}
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={handleCopy}
                    >
                        {copied ? (
                            <Check className="h-3.5 w-3.5 text-green-500" />
                        ) : (
                            <Copy className="h-3.5 w-3.5" />
                        )}
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    {copied ? 'Copied!' : 'Copy message'}
                </TooltipContent>
            </Tooltip>

            {/* Fork Button - Only in tree mode */}
            {isTreeMode && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={onFork}
                        >
                            <GitBranch className="h-3.5 w-3.5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        Branch out from here
                    </TooltipContent>
                </Tooltip>
            )}

            {/* Regenerate Button - Only for AI messages in tree mode */}
            {isTreeMode && role === 'assistant' && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={onRegenerate}
                        >
                            <RefreshCw className="h-3.5 w-3.5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        Regenerate response
                    </TooltipContent>
                </Tooltip>
            )}
        </div>
    );
};
