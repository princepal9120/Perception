/**
 * Message Action Buttons - Fork, Regenerate, Copy
 * Shows on hover for desktop, always visible on mobile (touch devices)
 */
import React, { memo } from 'react';
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

export const MessageActions: React.FC<MessageActionsProps> = memo(({
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
        // Visible by default on mobile (sm:opacity-0), shows on hover for desktop
        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" role="group" aria-label="Message actions">
            {/* Copy Button */}
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 sm:h-7 sm:w-7"
                        onClick={handleCopy}
                        aria-label={copied ? 'Copied to clipboard' : 'Copy message'}
                    >
                        {copied ? (
                            <Check className="h-4 w-4 sm:h-3.5 sm:w-3.5 text-green-500" />
                        ) : (
                            <Copy className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                        )}
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    {copied ? 'Copied!' : 'Copy message'}
                </TooltipContent>
            </Tooltip>

            {/* Fork Button - Always available to start a branch */}
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 sm:h-7 sm:w-7"
                        onClick={onFork}
                        aria-label="Branch conversation from here"
                    >
                        <GitBranch className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    Branch out from here
                </TooltipContent>
            </Tooltip>

            {/* Regenerate Button - Only for AI messages in tree mode */}
            {isTreeMode && role === 'assistant' && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 sm:h-7 sm:w-7"
                            onClick={onRegenerate}
                            aria-label="Regenerate response"
                        >
                            <RefreshCw className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        Regenerate response
                    </TooltipContent>
                </Tooltip>
            )}
        </div>
    );
});

MessageActions.displayName = 'MessageActions';
