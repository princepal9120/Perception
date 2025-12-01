/**
 * Research Progress Tracker Component
 * Displays real-time progress updates during deep research (Perplexity-style)
 */
import React from 'react';
import { Loader2, Search, FileText, CheckCircle2, AlertCircle, Brain, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ProgressUpdate {
    type: 'progress' | 'iteration';
    step?: 'searching' | 'extracting' | 'verifying' | 'analyzing' | 'synthesizing';
    iteration: number;
    message?: string;
    notes?: string;
    status?: 'in_progress' | 'completed' | 'error';
    data?: Record<string, any>;
}

interface ResearchProgressTrackerProps {
    updates: ProgressUpdate[];
    isResearching: boolean;
}

const stepConfig = {
    searching: {
        icon: Search,
        label: 'Searching',
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/20'
    },
    extracting: {
        icon: FileText,
        label: 'Extracting',
        color: 'text-purple-500',
        bgColor: 'bg-purple-500/10',
        borderColor: 'border-purple-500/20'
    },
    verifying: {
        icon: CheckCircle2,
        label: 'Verifying',
        color: 'text-green-500',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/20'
    },
    analyzing: {
        icon: Brain,
        label: 'Analyzing',
        color: 'text-orange-500',
        bgColor: 'bg-orange-500/10',
        borderColor: 'border-orange-500/20'
    },
    synthesizing: {
        icon: Sparkles,
        label: 'Synthesizing',
        color: 'text-pink-500',
        bgColor: 'bg-pink-500/10',
        borderColor: 'border-pink-500/20'
    }
};

export const ResearchProgressTracker: React.FC<ResearchProgressTrackerProps> = ({
    updates,
    isResearching
}) => {
    // Group updates by iteration
    const groupedUpdates = updates.reduce((acc, update) => {
        const iteration = update.iteration;
        if (!acc[iteration]) {
            acc[iteration] = [];
        }
        acc[iteration].push(update);
        return acc;
    }, {} as Record<number, ProgressUpdate[]>);

    const iterations = Object.keys(groupedUpdates).sort((a, b) => Number(a) - Number(b));

    return (
        <div className="space-y-4">
            {iterations.map((iteration) => {
                const iterationUpdates = groupedUpdates[Number(iteration)];
                const progressUpdates = iterationUpdates.filter(u => u.type === 'progress');

                return (
                    <Card
                        key={iteration}
                        className="p-4 border-l-4 border-l-primary/50 bg-gradient-to-r from-primary/5 to-transparent"
                    >
                        <div className="flex items-center gap-2 mb-3">
                            <Badge variant="outline" className="font-semibold">
                                Iteration {iteration}
                            </Badge>
                            <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
                        </div>

                        <div className="space-y-2">
                            {progressUpdates.map((update, idx) => {
                                if (!update.step) return null;

                                const config = stepConfig[update.step];
                                const Icon = config.icon;
                                const isActive = update.status === 'in_progress';
                                const isCompleted = update.status === 'completed';
                                const isError = update.status === 'error';

                                return (
                                    <div
                                        key={idx}
                                        className={`
                                            flex items-start gap-3 p-3 rounded-lg border transition-all duration-300
                                            ${isActive ? `${config.bgColor} ${config.borderColor} animate-pulse` : ''}
                                            ${isCompleted ? 'bg-muted/30 border-transparent' : ''}
                                            ${isError ? 'bg-destructive/10 border-destructive/20' : ''}
                                            ${!isActive && !isCompleted && !isError ? 'bg-muted/20 border-transparent' : ''}
                                        `}
                                    >
                                        {/* Icon */}
                                        <div className={`
                                            flex-shrink-0 mt-0.5
                                            ${isActive ? config.color : ''}
                                            ${isCompleted ? 'text-muted-foreground' : ''}
                                            ${isError ? 'text-destructive' : ''}
                                        `}>
                                            {isActive && <Loader2 className="h-5 w-5 animate-spin" />}
                                            {isCompleted && <Icon className="h-5 w-5" />}
                                            {isError && <AlertCircle className="h-5 w-5" />}
                                            {!isActive && !isCompleted && !isError && <Icon className="h-5 w-5" />}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`
                                                    text-xs font-semibold uppercase tracking-wide
                                                    ${isActive ? config.color : 'text-muted-foreground'}
                                                `}>
                                                    {config.label}
                                                </span>
                                                {isActive && (
                                                    <div className="flex gap-1">
                                                        <div className={`h-1.5 w-1.5 rounded-full ${config.color} animate-bounce`} style={{ animationDelay: '0ms' }} />
                                                        <div className={`h-1.5 w-1.5 rounded-full ${config.color} animate-bounce`} style={{ animationDelay: '150ms' }} />
                                                        <div className={`h-1.5 w-1.5 rounded-full ${config.color} animate-bounce`} style={{ animationDelay: '300ms' }} />
                                                    </div>
                                                )}
                                            </div>

                                            <p className={`
                                                text-sm
                                                ${isActive ? 'text-foreground font-medium' : 'text-muted-foreground'}
                                            `}>
                                                {update.message || update.notes || 'Processing...'}
                                            </p>

                                            {/* Additional data */}
                                            {update.data && isCompleted && (
                                                <div className="flex gap-2 mt-2">
                                                    {Object.entries(update.data).map(([key, value]) => (
                                                        <Badge key={key} variant="secondary" className="text-xs">
                                                            {key.replace(/_/g, ' ')}: {value}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Status indicator */}
                                        <div className="flex-shrink-0">
                                            {isCompleted && (
                                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                            )}
                                            {isError && (
                                                <AlertCircle className="h-4 w-4 text-destructive" />
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                );
            })}

            {/* Active research indicator */}
            {isResearching && updates.length === 0 && (
                <Card className="p-6 bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
                    <div className="flex items-center gap-3">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <div>
                            <p className="font-medium">Initializing deep research...</p>
                            <p className="text-sm text-muted-foreground">Setting up research parameters and preparing queries</p>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default ResearchProgressTracker;
