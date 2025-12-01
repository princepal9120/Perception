/**
 * Tree Debug Panel - Shows tree state for debugging
 */
import React from 'react';
import { useTreeStore } from '../../store/treeStore';
import { Button } from '../ui/button';
import { RefreshCw } from 'lucide-react';

interface TreeDebugProps {
    chatId: number;
}

export const TreeDebug: React.FC<TreeDebugProps> = ({ chatId }) => {
    const {
        treeStructure,
        activeNodeId,
        isLoading,
        error,
        isStreaming,
        loadTree,
    } = useTreeStore();

    return (
        <div className="p-4 bg-zinc-100 dark:bg-zinc-900 rounded-lg space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold">Tree Debug Info</h3>
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => loadTree(chatId)}
                >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reload Tree
                </Button>
            </div>

            <div className="space-y-2 text-sm">
                <div>
                    <strong>Chat ID:</strong> {chatId}
                </div>
                <div>
                    <strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}
                </div>
                <div>
                    <strong>Streaming:</strong> {isStreaming ? 'Yes' : 'No'}
                </div>
                <div>
                    <strong>Error:</strong> {error || 'None'}
                </div>
                <div>
                    <strong>Active Node:</strong> {activeNodeId || 'None'}
                </div>
                <div>
                    <strong>Tree Loaded:</strong> {treeStructure ? 'Yes' : 'No'}
                </div>
                {treeStructure && (
                    <>
                        <div>
                            <strong>Total Nodes:</strong> {treeStructure.nodes.length}
                        </div>
                        <div>
                            <strong>Root Node:</strong> {treeStructure.tree_metadata.root_node_id}
                        </div>
                        <div>
                            <strong>Max Depth:</strong> {treeStructure.tree_metadata.max_depth}
                        </div>
                    </>
                )}
            </div>

            {treeStructure && (
                <details className="mt-4">
                    <summary className="cursor-pointer font-semibold">
                        View Raw Tree Data
                    </summary>
                    <pre className="mt-2 p-2 bg-black text-green-400 rounded text-xs overflow-auto max-h-96">
                        {JSON.stringify(treeStructure, null, 2)}
                    </pre>
                </details>
            )}
        </div>
    );
};
