/**
 * Tree Panel - Shows only the tree visualization
 * Used in the side panel view
 */
import React, { useEffect } from 'react';
import { useTreeStore } from '../../store/treeStore';
import { TreeVisualization } from './TreeVisualization';
import { TreeDebug } from './TreeDebug';
import { Loader2 } from 'lucide-react';

interface TreePanelProps {
    chatId: number;
}

export const TreePanel: React.FC<TreePanelProps> = ({ chatId }) => {
    const { loadTree, error, isLoading, treeStructure } = useTreeStore();

    useEffect(() => {
        console.log('[TreePanel] Loading tree for chat:', chatId);
        loadTree(chatId);
    }, [chatId, loadTree]);

    if (isLoading && !treeStructure) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-zinc-500 dark:text-zinc-400">Loading conversation tree...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-6 gap-4">
                <div className="text-center max-w-md">
                    <p className="text-red-500 dark:text-red-400 font-semibold mb-2">Error loading tree</p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">{error}</p>
                </div>
                <TreeDebug chatId={chatId} />
            </div>
        );
    }

    return (
        <div className="h-full w-full flex flex-col">
          
            {/* Tree Visualization */}
            <div className="flex-1 overflow-hidden">
                <TreeVisualization chatId={chatId} />
            </div>
        </div>
    );
};
