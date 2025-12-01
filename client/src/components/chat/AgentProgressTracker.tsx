/**
 * Agent Progress Tracker Component
 * Displays real-time AI agent progress (thinking, searching, analyzing) in chat
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Search, Brain, CheckCircle2, Globe, FileText } from 'lucide-react';

export interface AgentProgressStep {
    type: 'thinking' | 'searching' | 'analyzing' | 'reading' | 'completed';
    message: string;
    query?: string;
    sources?: string[];
    timestamp?: number;
}

interface AgentProgressTrackerProps {
    steps: AgentProgressStep[];
    isActive: boolean;
}

const stepConfig = {
    thinking: {
        icon: Brain,
        label: 'Thinking',
        color: 'text-purple-500',
        bgColor: 'bg-purple-500/10',
    },
    searching: {
        icon: Search,
        label: 'Searching',
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10',
    },
    analyzing: {
        icon: Brain,
        label: 'Analyzing',
        color: 'text-orange-500',
        bgColor: 'bg-orange-500/10',
    },
    reading: {
        icon: FileText,
        label: 'Reading',
        color: 'text-green-500',
        bgColor: 'bg-green-500/10',
    },
    completed: {
        icon: CheckCircle2,
        label: 'Completed',
        color: 'text-green-500',
        bgColor: 'bg-green-500/10',
    },
};

export const AgentProgressTracker: React.FC<AgentProgressTrackerProps> = ({
    steps,
    isActive
}) => {
    if (steps.length === 0 && !isActive) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 space-y-2"
        >
            <AnimatePresence mode="popLayout">
                {steps.map((step, index) => {
                    const config = stepConfig[step.type];
                    const Icon = config.icon;
                    const isLast = index === steps.length - 1;
                    const isCompleted = step.type === 'completed';

                    return (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.2, delay: index * 0.05 }}
                            className={`
                                flex items-start gap-3 p-3 rounded-lg border transition-all
                                ${isLast && isActive && !isCompleted ? `${config.bgColor} border-${step.type === 'thinking' ? 'purple' : step.type === 'searching' ? 'blue' : step.type === 'analyzing' ? 'orange' : 'green'}-500/20` : 'bg-muted/30 border-transparent'}
                            `}
                        >
                            {/* Icon */}
                            <div className={`flex-shrink-0 mt-0.5 ${config.color}`}>
                                {isLast && isActive && !isCompleted ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Icon className="h-4 w-4" />
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-xs font-semibold uppercase tracking-wide ${config.color}`}>
                                        {config.label}
                                    </span>
                                    {isLast && isActive && !isCompleted && (
                                        <div className="flex gap-1">
                                            <div className={`h-1 w-1 rounded-full ${config.color} animate-bounce`} style={{ animationDelay: '0ms' }} />
                                            <div className={`h-1 w-1 rounded-full ${config.color} animate-bounce`} style={{ animationDelay: '150ms' }} />
                                            <div className={`h-1 w-1 rounded-full ${config.color} animate-bounce`} style={{ animationDelay: '300ms' }} />
                                        </div>
                                    )}
                                </div>

                                <p className="text-sm text-muted-foreground">
                                    {step.message}
                                </p>

                                {/* Query display for search steps */}
                                {step.query && (
                                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground bg-background/50 rounded px-2 py-1">
                                        <Search className="h-3 w-3" />
                                        <span className="font-mono">{step.query}</span>
                                    </div>
                                )}

                                {/* Sources display */}
                                {step.sources && step.sources.length > 0 && (
                                    <div className="mt-2 space-y-1">
                                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Globe className="h-3 w-3" />
                                            <span>Reviewing {step.sources.length} sources</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            {step.sources.slice(0, 3).map((source, idx) => {
                                                const domain = new URL(source).hostname.replace('www.', '');
                                                return (
                                                    <span
                                                        key={idx}
                                                        className="text-xs bg-background/70 border border-border rounded px-2 py-0.5 font-mono"
                                                    >
                                                        {domain}
                                                    </span>
                                                );
                                            })}
                                            {step.sources.length > 3 && (
                                                <span className="text-xs text-muted-foreground px-2 py-0.5">
                                                    +{step.sources.length - 3} more
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </AnimatePresence>

            {/* Active indicator when no steps yet */}
            {steps.length === 0 && isActive && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20"
                >
                    <Loader2 className="h-4 w-4 text-purple-500 animate-spin" />
                    <span className="text-sm text-muted-foreground">Initializing...</span>
                </motion.div>
            )}
        </motion.div>
    );
};

export default AgentProgressTracker;
