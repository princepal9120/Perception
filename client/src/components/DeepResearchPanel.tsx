/**
 * Deep Research Panel Component
 * Provides UI for Deep Research Mode with SSE streaming
 */
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Search, CheckCircle2, AlertCircle, FileText, Brain } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface IterationUpdate {
    type: 'iteration';
    iteration: number;
    notes: string;
}

interface ResearchReport {
    topic: string;
    depth: number;
    iterations: number;
    report: {
        executive_summary: string;
        background: string;
        key_findings: string[];
        technical_details: string;
        opportunities_risks: string;
        applications: string;
        references: string[];
        research_log: Array<{
            iteration: number;
            focus: string;
            findings: string;
            gaps_identified: string;
        }>;
    };
}

interface SSEEvent {
    type: 'start' | 'iteration' | 'final' | 'complete' | 'error';
    message?: string;
    iteration?: number;
    notes?: string;
    report?: ResearchReport;
}

export const DeepResearchPanel: React.FC = () => {
    // Form state
    const [topic, setTopic] = useState('');
    const [depth, setDepth] = useState(3);
    const [iterations, setIterations] = useState(3);

    // Research state
    const [isResearching, setIsResearching] = useState(false);
    const [iterationUpdates, setIterationUpdates] = useState<IterationUpdate[]>([]);
    const [finalReport, setFinalReport] = useState<ResearchReport | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Refs
    const eventSourceRef = useRef<EventSource | null>(null);
    const logScrollRef = useRef<HTMLDivElement>(null);

    const { toast } = useToast();

    // Auto-scroll log
    useEffect(() => {
        if (logScrollRef.current) {
            logScrollRef.current.scrollTop = logScrollRef.current.scrollHeight;
        }
    }, [iterationUpdates]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }
        };
    }, []);

    const startResearch = async () => {
        if (!topic.trim()) {
            toast({
                title: 'Topic required',
                description: 'Please enter a research topic',
                variant: 'destructive',
            });
            return;
        }

        // Reset state
        setIsResearching(true);
        setIterationUpdates([]);
        setFinalReport(null);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Not authenticated');
            }

            // Create SSE connection
            const url = new URL('/api/v1/deep-research/stream', import.meta.env.VITE_API_URL || 'http://localhost:8000');

            // For POST with SSE, we need to use fetch with ReadableStream
            const response = await fetch(url.toString(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    topic,
                    depth,
                    iterations,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            if (!response.body) {
                throw new Error('No response body');
            }

            // Read SSE stream
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();

                if (done) {
                    break;
                }

                // Decode chunk
                buffer += decoder.decode(value, { stream: true });

                // Process complete SSE messages
                const lines = buffer.split('\n');
                buffer = lines.pop() || ''; // Keep incomplete line in buffer

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);

                        try {
                            const event: SSEEvent = JSON.parse(data);

                            switch (event.type) {
                                case 'start':
                                    toast({
                                        title: 'Research Started',
                                        description: event.message,
                                    });
                                    break;

                                case 'iteration':
                                    setIterationUpdates(prev => [
                                        ...prev,
                                        {
                                            type: 'iteration',
                                            iteration: event.iteration || 0,
                                            notes: event.notes || '',
                                        },
                                    ]);
                                    break;

                                case 'final':
                                    if (event.report) {
                                        setFinalReport(event.report);
                                    }
                                    break;

                                case 'complete':
                                    toast({
                                        title: 'Research Complete',
                                        description: 'Your research report is ready',
                                    });
                                    setIsResearching(false);
                                    break;

                                case 'error':
                                    setError(event.message || 'Unknown error');
                                    setIsResearching(false);
                                    toast({
                                        title: 'Research Failed',
                                        description: event.message,
                                        variant: 'destructive',
                                    });
                                    break;
                            }
                        } catch (e) {
                            console.error('Failed to parse SSE event:', e);
                        }
                    }
                }
            }

        } catch (err) {
            console.error('Research error:', err);
            setError(err instanceof Error ? err.message : 'Unknown error');
            setIsResearching(false);
            toast({
                title: 'Connection Error',
                description: err instanceof Error ? err.message : 'Failed to connect',
                variant: 'destructive',
            });
        }
    };

    const stopResearch = () => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }
        setIsResearching(false);
        toast({
            title: 'Research Stopped',
            description: 'Research has been cancelled',
        });
    };

    const depthLabels = ['Basic', 'Intermediate', 'Advanced', 'Expert', 'Research-Grade'];

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Brain className="h-8 w-8 text-primary" />
                <div>
                    <h1 className="text-3xl font-bold">Deep Research Mode</h1>
                    <p className="text-muted-foreground">
                        Iterative AI-powered research with evidence-backed analysis
                    </p>
                </div>
            </div>

            {/* Input Form */}
            <Card>
                <CardHeader>
                    <CardTitle>Research Parameters</CardTitle>
                    <CardDescription>
                        Configure your research topic and depth
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Topic Input */}
                    <div className="space-y-2">
                        <Label htmlFor="topic">Research Topic</Label>
                        <Input
                            id="topic"
                            placeholder="e.g., Latest advances in quantum computing"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            disabled={isResearching}
                            className="text-base"
                        />
                    </div>

                    {/* Depth Slider */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <Label>Research Depth</Label>
                            <Badge variant="outline">{depthLabels[depth - 1]}</Badge>
                        </div>
                        <Slider
                            value={[depth]}
                            onValueChange={(value) => setDepth(value[0])}
                            min={1}
                            max={5}
                            step={1}
                            disabled={isResearching}
                            className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Basic</span>
                            <span>Research-Grade</span>
                        </div>
                    </div>

                    {/* Iterations Input */}
                    <div className="space-y-2">
                        <Label htmlFor="iterations">
                            Iterations ({iterations})
                        </Label>
                        <Slider
                            value={[iterations]}
                            onValueChange={(value) => setIterations(value[0])}
                            min={1}
                            max={10}
                            step={1}
                            disabled={isResearching}
                            className="w-full"
                        />
                        <p className="text-xs text-muted-foreground">
                            More iterations = deeper analysis (1-10)
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <Button
                            onClick={startResearch}
                            disabled={isResearching || !topic.trim()}
                            className="flex-1"
                            size="lg"
                        >
                            {isResearching ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Researching...
                                </>
                            ) : (
                                <>
                                    <Search className="mr-2 h-4 w-4" />
                                    Start Research
                                </>
                            )}
                        </Button>
                        {isResearching && (
                            <Button
                                onClick={stopResearch}
                                variant="destructive"
                                size="lg"
                            >
                                Stop
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Progress Log */}
            {(iterationUpdates.length > 0 || isResearching) && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Loader2 className={`h-5 w-5 ${isResearching ? 'animate-spin' : ''}`} />
                            Research Progress
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-64" ref={logScrollRef}>
                            <div className="space-y-3">
                                {iterationUpdates.map((update, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                                    >
                                        <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1">
                                            <div className="font-medium">
                                                Iteration {update.iteration}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {update.notes}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {isResearching && iterationUpdates.length === 0 && (
                                    <div className="flex items-center gap-3 p-3">
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        <span className="text-muted-foreground">
                                            Initializing research...
                                        </span>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            )}

            {/* Error Display */}
            {error && (
                <Card className="border-destructive">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-destructive">
                            <AlertCircle className="h-5 w-5" />
                            Error
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm">{error}</p>
                    </CardContent>
                </Card>
            )}

            {/* Final Report */}
            {finalReport && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Research Report
                        </CardTitle>
                        <CardDescription>
                            Topic: {finalReport.topic} | Depth: {depthLabels[finalReport.depth - 1]} |
                            Iterations: {finalReport.iterations}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Executive Summary */}
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Executive Summary</h3>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {finalReport.report.executive_summary}
                            </p>
                        </div>

                        {/* Background */}
                        {finalReport.report.background && (
                            <div>
                                <h3 className="text-lg font-semibold mb-2">Background</h3>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                    {finalReport.report.background}
                                </p>
                            </div>
                        )}

                        {/* Key Findings */}
                        {finalReport.report.key_findings?.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold mb-2">Key Findings</h3>
                                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                                    {finalReport.report.key_findings.map((finding, idx) => (
                                        <li key={idx}>{finding}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Technical Details */}
                        {finalReport.report.technical_details && (
                            <div>
                                <h3 className="text-lg font-semibold mb-2">Technical Details</h3>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                    {finalReport.report.technical_details}
                                </p>
                            </div>
                        )}

                        {/* Opportunities & Risks */}
                        {finalReport.report.opportunities_risks && (
                            <div>
                                <h3 className="text-lg font-semibold mb-2">Opportunities & Risks</h3>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                    {finalReport.report.opportunities_risks}
                                </p>
                            </div>
                        )}

                        {/* Applications */}
                        {finalReport.report.applications && (
                            <div>
                                <h3 className="text-lg font-semibold mb-2">Applications</h3>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                    {finalReport.report.applications}
                                </p>
                            </div>
                        )}

                        {/* References */}
                        {finalReport.report.references?.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold mb-2">References</h3>
                                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                                    {finalReport.report.references.map((ref, idx) => (
                                        <li key={idx}>{ref}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Research Log */}
                        {finalReport.report.research_log?.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold mb-2">Research Log</h3>
                                <div className="space-y-3">
                                    {finalReport.report.research_log.map((log, idx) => (
                                        <div key={idx} className="p-3 rounded-lg bg-muted/50">
                                            <div className="font-medium text-sm mb-1">
                                                Iteration {log.iteration}
                                            </div>
                                            <div className="text-xs text-muted-foreground space-y-1">
                                                <div><strong>Focus:</strong> {log.focus}</div>
                                                <div><strong>Findings:</strong> {log.findings}</div>
                                                <div><strong>Gaps:</strong> {log.gaps_identified}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default DeepResearchPanel;
