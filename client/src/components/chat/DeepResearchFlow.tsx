/**
 * Deep Research Flow Component
 * Displays the 4-phase animated research UI:
 * 1. Planning - Research initialized, showing research plan
 * 2. Active Research - Live progress with stats
 * 3. Synthesis - Completing research, generating report
 * 4. Final Report - Formatted report with sources
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Target,
    Clock,
    Zap,
    Search,
    FileText,
    CheckCircle2,
    Loader2,
    Download,
    Share2,
    ChevronDown,
    ChevronUp,
    Globe,
    Sparkles,
    Brain,
    BarChart3,
    ExternalLink
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

// Types
export type ResearchPhase = 'planning' | 'researching' | 'synthesizing' | 'complete';

export interface ResearchArea {
    id: string;
    name: string;
    status: 'pending' | 'in_progress' | 'complete';
}

export interface ResearchFinding {
    id: string;
    text: string;
    timestamp: number;
}

export interface ResearchSource {
    url: string;
    title?: string;
    domain: string;
}

export interface DeepResearchState {
    phase: ResearchPhase;
    topic: string;
    researchAreas: ResearchArea[];
    currentFocus: string;
    progress: number;
    sourcesAnalyzed: number;
    totalSourcesEstimate: number;
    searchesPerformed: number;
    totalSearchesEstimate: number;
    findings: ResearchFinding[];
    sources: ResearchSource[];
    startTime: number;
    report?: string;
}

interface DeepResearchFlowProps {
    state: DeepResearchState;
    isActive: boolean;
}

// Sub-components
const PlanningPhase: React.FC<{ topic: string; areas: ResearchArea[] }> = ({ topic, areas }) => {
    const [showPlan, setShowPlan] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setShowPlan(true), 2000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="space-y-4">
            {/* Initialization Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Card className="p-6 bg-gradient-to-br from-primary/10 via-purple-500/5 to-transparent border-primary/20">
                    <div className="flex items-center gap-3">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center"
                        >
                            <Target className="w-6 h-6 text-primary" />
                        </motion.div>
                        <div>
                            <h3 className="text-lg font-semibold">🎯 Deep Research Initialized</h3>
                            <p className="text-sm text-muted-foreground">
                                {showPlan ? 'Creating research strategy...' : 'Analyzing your question...'}
                            </p>
                        </div>
                    </div>
                </Card>
            </motion.div>

            {/* Research Plan */}
            <AnimatePresence>
                {showPlan && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <Card className="p-6 border-l-4 border-l-primary">
                            <div className="flex items-center gap-2 mb-4">
                                <FileText className="w-5 h-5 text-primary" />
                                <h4 className="font-semibold">📋 Research Plan</h4>
                            </div>
                            <p className="text-sm text-muted-foreground mb-4">
                                I'll investigate the following areas:
                            </p>
                            <div className="space-y-2 mb-4">
                                {areas.map((area, index) => (
                                    <motion.div
                                        key={area.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
                                    >
                                        <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium text-primary">
                                            {index + 1}
                                        </span>
                                        <span className="text-sm">{area.name}</span>
                                    </motion.div>
                                ))}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    <span>Estimated time: 2-4 minutes</span>
                                </div>
                            </div>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1 }}
                                className="mt-4 flex items-center gap-2 text-primary"
                            >
                                <Zap className="w-4 h-4" />
                                <span className="text-sm font-medium">Starting Research...</span>
                                <Loader2 className="w-4 h-4 animate-spin" />
                            </motion.div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const ActiveResearchPhase: React.FC<{
    state: DeepResearchState;
}> = ({ state }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <Card className="p-6 border-l-4 border-l-blue-500">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Search className="w-5 h-5 text-blue-500" />
                        <h4 className="font-semibold">🔍 Deep Research in Progress</h4>
                    </div>
                    <Badge variant="outline" className="animate-pulse">
                        <span className="w-2 h-2 bg-blue-500 rounded-full inline-block mr-2" />
                        Live
                    </Badge>
                </div>

                {/* Current Focus */}
                <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-1">Current Focus:</p>
                    <p className="text-sm font-medium flex items-center gap-2">
                        <span className="text-blue-500">→</span>
                        Searching: {state.currentFocus}
                    </p>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Progress:</span>
                        <span className="font-medium">{Math.round(state.progress)}%</span>
                    </div>
                    <Progress value={state.progress} className="h-2" />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                        <BarChart3 className="w-4 h-4 text-muted-foreground" />
                        <span>Sources analyzed:</span>
                        <span className="font-medium">{state.sourcesAnalyzed}/~{state.totalSourcesEstimate}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <Search className="w-4 h-4 text-muted-foreground" />
                        <span>Searches:</span>
                        <span className="font-medium">{state.searchesPerformed}/{state.totalSearchesEstimate}</span>
                    </div>
                </div>

                {/* Area Status */}
                <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-2">Status by Area:</p>
                    <div className="space-y-1">
                        {state.researchAreas.map((area) => (
                            <div key={area.id} className="flex items-center gap-2 text-sm">
                                {area.status === 'complete' && (
                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                )}
                                {area.status === 'in_progress' && (
                                    <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                                )}
                                {area.status === 'pending' && (
                                    <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />
                                )}
                                <span className={area.status === 'complete' ? 'text-muted-foreground' : ''}>
                                    {area.name}
                                </span>
                                {area.status === 'in_progress' && (
                                    <span className="text-xs text-blue-500">In progress...</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Latest Findings */}
                {state.findings.length > 0 && (
                    <div>
                        <p className="text-sm text-muted-foreground mb-2">Latest Findings:</p>
                        <div className="space-y-1">
                            {state.findings.slice(-3).map((finding) => (
                                <motion.div
                                    key={finding.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-start gap-2 text-sm"
                                >
                                    <span className="text-green-500 mt-1">•</span>
                                    <span>{finding.text}</span>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}
            </Card>
        </motion.div>
    );
};

const SynthesisPhase: React.FC<{ state: DeepResearchState }> = ({ state }) => {
    const elapsedTime = Math.floor((Date.now() - state.startTime) / 1000);
    const minutes = Math.floor(elapsedTime / 60);
    const seconds = elapsedTime % 60;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
        >
            <Card className="p-6 bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-transparent border-green-500/20">
                <div className="text-center mb-6">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center"
                    >
                        <Sparkles className="w-8 h-8 text-green-500" />
                    </motion.div>
                    <h3 className="text-xl font-semibold">✨ Research Complete!</h3>
                </div>

                {/* Final Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-primary">{state.sourcesAnalyzed}</p>
                        <p className="text-xs text-muted-foreground">Sources analyzed</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-primary">{state.searchesPerformed}</p>
                        <p className="text-xs text-muted-foreground">Searches performed</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-primary">{minutes}m {seconds}s</p>
                        <p className="text-xs text-muted-foreground">Time elapsed</p>
                    </div>
                </div>

                {/* Synthesizing */}
                <div className="flex items-center justify-center gap-3">
                    <Brain className="w-5 h-5 text-primary animate-pulse" />
                    <span className="text-sm">Synthesizing findings...</span>
                    <Loader2 className="w-4 h-4 animate-spin" />
                </div>
                <Progress value={100} className="h-2 mt-4" />
            </Card>
        </motion.div>
    );
};

const FinalReportPhase: React.FC<{
    state: DeepResearchState;
    report: string;
}> = ({ state, report }) => {
    const [showAllSources, setShowAllSources] = useState(false);
    const displayedSources = showAllSources ? state.sources : state.sources.slice(0, 5);

    const handleExportPDF = () => {
        // TODO: Implement PDF export
    };

    const handleExportDoc = () => {
        // TODO: Implement Doc export
    };

    const handleShare = () => {
        // TODO: Implement sharing
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
        >
            {/* Report Header */}
            <Card className="p-4 bg-gradient-to-r from-primary/10 to-transparent">
                <div className="flex items-center gap-3">
                    <FileText className="w-6 h-6 text-primary" />
                    <div>
                        <h3 className="font-semibold">📑 RESEARCH REPORT</h3>
                        <p className="text-sm text-muted-foreground">
                            Topic: {state.topic}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Generated: {new Date().toLocaleString()}
                        </p>
                    </div>
                </div>
            </Card>

            {/* Sources Panel */}
            {state.sources.length > 0 && (
                <Card className="p-4">
                    <button
                        onClick={() => setShowAllSources(!showAllSources)}
                        className="w-full flex items-center justify-between"
                    >
                        <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">📚 Sources ({state.sources.length})</span>
                        </div>
                        {showAllSources ? (
                            <ChevronUp className="w-4 h-4" />
                        ) : (
                            <ChevronDown className="w-4 h-4" />
                        )}
                    </button>
                    <AnimatePresence>
                        {(showAllSources || state.sources.length <= 5) && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-3 space-y-2"
                            >
                                {displayedSources.map((source, index) => (
                                    <a
                                        key={index}
                                        href={source.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                                    >
                                        <span className="text-muted-foreground">[{index + 1}]</span>
                                        <span>{source.title || source.domain}</span>
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                ))}
                                {!showAllSources && state.sources.length > 5 && (
                                    <p className="text-sm text-muted-foreground">
                                        ...view all sources
                                    </p>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Card>
            )}

            {/* Report content is rendered in the parent via MarkdownMessage */}

            {/* Action Bar */}
            <Card className="p-3">
                <div className="flex items-center justify-center gap-4">
                    <Button variant="outline" size="sm" onClick={handleExportPDF} className="gap-2">
                        <Download className="w-4 h-4" />
                        Export PDF
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExportDoc} className="gap-2">
                        <FileText className="w-4 h-4" />
                        Export Doc
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
                        <Share2 className="w-4 h-4" />
                        Share
                    </Button>
                </div>
            </Card>

            <p className="text-sm text-center text-muted-foreground">
                ✅ Research complete. Ask follow-up questions anytime.
            </p>
        </motion.div>
    );
};

// Main Component
export const DeepResearchFlow: React.FC<DeepResearchFlowProps> = ({
    state,
    isActive
}) => {
    if (!isActive && state.phase === 'planning') return null;

    return (
        <div className="space-y-4 mb-6">
            <AnimatePresence mode="wait">
                {state.phase === 'planning' && (
                    <motion.div key="planning" exit={{ opacity: 0, y: -20 }}>
                        <PlanningPhase topic={state.topic} areas={state.researchAreas} />
                    </motion.div>
                )}

                {state.phase === 'researching' && (
                    <motion.div key="researching" exit={{ opacity: 0, y: -20 }}>
                        <ActiveResearchPhase state={state} />
                    </motion.div>
                )}

                {state.phase === 'synthesizing' && (
                    <motion.div key="synthesizing" exit={{ opacity: 0, y: -20 }}>
                        <SynthesisPhase state={state} />
                    </motion.div>
                )}

                {state.phase === 'complete' && state.report && (
                    <motion.div key="complete">
                        <FinalReportPhase state={state} report={state.report} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DeepResearchFlow;
