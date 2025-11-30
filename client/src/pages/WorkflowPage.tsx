import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TreeVisualization } from '@/components/tree/TreeVisualization';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const WorkflowPage: React.FC = () => {
    const { chatId } = useParams<{ chatId: string }>();
    const navigate = useNavigate();

    if (!chatId) {
        return (
            <div className="flex flex-col items-center justify-center h-screen">
                <p className="text-lg text-muted-foreground mb-4">No chat selected</p>
                <Button onClick={() => navigate('/chat')}>Go to Chat</Button>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-background">
            <header className="border-b p-4 flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(`/chat`)}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-xl font-semibold">Workflow Visualization</h1>
            </header>
            <div className="flex-1 overflow-hidden">
                <TreeVisualization chatId={parseInt(chatId)} />
            </div>
        </div>
    );
};

export default WorkflowPage;
