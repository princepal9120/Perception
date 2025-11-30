import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Brain, Search } from 'lucide-react';

interface DeepResearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStartResearch: (config: ResearchConfig) => void;
}

export interface ResearchConfig {
    topic: string;
    depth: number;
    iterations: number;
}

export const DeepResearchModal: React.FC<DeepResearchModalProps> = ({
    isOpen,
    onClose,
    onStartResearch,
}) => {
    const [topic, setTopic] = useState('');
    const [depth, setDepth] = useState(3);
    const [iterations, setIterations] = useState(3);

    const depthLabels = ['Basic', 'Intermediate', 'Advanced', 'Expert', 'Research-Grade'];

    const handleStart = () => {
        if (!topic.trim()) {
            return;
        }

        onStartResearch({
            topic: topic.trim(),
            depth,
            iterations,
        });

        // Reset and close
        setTopic('');
        setDepth(3);
        setIterations(3);
        onClose();
    };

    const handleCancel = () => {
        setTopic('');
        setDepth(3);
        setIterations(3);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5 text-primary" />
                        Deep Research Mode
                    </DialogTitle>
                    <DialogDescription>
                        Configure your research parameters for comprehensive AI-powered analysis
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Topic Input */}
                    <div className="space-y-2">
                        <Label htmlFor="topic">Research Topic</Label>
                        <Input
                            id="topic"
                            placeholder="e.g., Latest advances in quantum computing"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            className="text-base"
                            autoFocus
                        />
                        <p className="text-xs text-muted-foreground">
                            Enter the topic you want to research in depth
                        </p>
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
                            className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Basic</span>
                            <span>Research-Grade</span>
                        </div>
                    </div>

                    {/* Iterations Slider */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <Label>Iterations ({iterations})</Label>
                        </div>
                        <Slider
                            value={[iterations]}
                            onValueChange={(value) => setIterations(value[0])}
                            min={1}
                            max={10}
                            step={1}
                            className="w-full"
                        />
                        <p className="text-xs text-muted-foreground">
                            More iterations = deeper analysis and more refined results
                        </p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 justify-end">
                    <Button variant="outline" onClick={handleCancel}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleStart}
                        disabled={!topic.trim()}
                        className="gap-2"
                    >
                        <Search className="h-4 w-4" />
                        Start Research
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
