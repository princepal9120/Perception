/**
 * Tree visualization component using ReactFlow
 * Displays the conversation tree as an interactive graph
 */
import React, { useCallback, useMemo, useEffect } from 'react';
import ReactFlow, {
    Node,
    Edge,
    Controls,
    Background,
    MiniMap,
    useNodesState,
    useEdgesState,
    MarkerType,
    Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useTreeStore } from '../../store/treeStore';
import type { TreeNodeData } from '../../types/tree';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
    GitBranch,
    MessageSquare,
    Bot,
    MoreVertical,
    RefreshCw,
    Copy,
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../ui/dropdown-menu';

// Custom node component
const TreeNode = ({ data }: { data: any }) => {
    const { node, isActive, hasChildren, onNodeClick, onFork, onRegenerate } = data;

    return (
        <div
            className={`
        relative px-4 py-3 rounded-lg border-2 min-w-[200px] max-w-[300px]
        transition-all duration-200 cursor-pointer
        ${isActive
                    ? 'border-primary bg-primary/10 shadow-lg'
                    : 'border-border bg-card hover:border-primary/50'
                }
      `}
            onClick={() => onNodeClick(node.id)}
        >
            {/* Branch badge */}
            {node.branch_name && (
                <Badge
                    variant="outline"
                    className="absolute -top-2 -left-2 text-xs"
                >
                    <GitBranch className="w-3 h-3 mr-1" />
                    {node.branch_name}
                </Badge>
            )}

            {/* Node actions */}
            <div className="absolute -top-2 -right-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6 rounded-full"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <MoreVertical className="h-3 w-3" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onFork(node.id)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Fork Branch
                        </DropdownMenuItem>
                        {node.ai_message && (
                            <DropdownMenuItem onClick={() => onRegenerate(node.id)}>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Regenerate
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* User message */}
            {node.user_message && (
                <div className="mb-2">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                        <MessageSquare className="w-3 h-3" />
                        <span>User</span>
                    </div>
                    <p className="text-sm line-clamp-2">{node.user_message}</p>
                </div>
            )}

            {/* AI message */}
            {node.ai_message && (
                <div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                        <Bot className="w-3 h-3" />
                        <span>AI</span>
                    </div>
                    <p className="text-sm line-clamp-2">{node.ai_message}</p>
                </div>
            )}

            {/* Children indicator */}
            {hasChildren && (
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                    <Badge variant="secondary" className="text-xs px-2 py-0">
                        {node.children_count}
                    </Badge>
                </div>
            )}

            {/* Depth indicator */}
            <div className="absolute bottom-1 right-1 text-xs text-muted-foreground">
                D{node.depth}
            </div>
        </div>
    );
};

const nodeTypes = {
    treeNode: TreeNode,
};

interface TreeVisualizationProps {
    chatId: number;
}

export const TreeVisualization: React.FC<TreeVisualizationProps> = ({ chatId }) => {
    const {
        treeStructure,
        activeNodeId,
        loadTree,
        setActiveNode,
        forkNode,
        regenerateResponse,
    } = useTreeStore();

    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    // Load tree on mount
    useEffect(() => {
        loadTree(chatId);
    }, [chatId, loadTree]);

    // Handle node click
    const handleNodeClick = useCallback(
        (nodeId: string) => {
            setActiveNode(nodeId);
        },
        [setActiveNode]
    );

    // Handle fork
    const handleFork = useCallback(
        async (nodeId: string) => {
            await forkNode(nodeId);
        },
        [forkNode]
    );

    // Handle regenerate
    const handleRegenerate = useCallback(
        async (nodeId: string) => {
            await regenerateResponse(nodeId);
        },
        [regenerateResponse]
    );

    // Convert tree structure to ReactFlow nodes and edges
    useEffect(() => {
        if (!treeStructure) return;

        const { nodes: treeNodes, adjacency_list } = treeStructure;

        // Calculate layout using a simple tree layout algorithm
        const nodePositions = new Map<string, { x: number; y: number }>();
        const levelNodes = new Map<number, TreeNodeData[]>();

        // Group nodes by depth
        treeNodes.forEach((node) => {
            if (!levelNodes.has(node.depth)) {
                levelNodes.set(node.depth, []);
            }
            levelNodes.get(node.depth)!.push(node);
        });

        // Position nodes
        const horizontalSpacing = 350;
        const verticalSpacing = 200;

        levelNodes.forEach((nodesAtLevel, depth) => {
            const totalWidth = (nodesAtLevel.length - 1) * horizontalSpacing;
            const startX = -totalWidth / 2;

            nodesAtLevel.forEach((node, index) => {
                nodePositions.set(node.id, {
                    x: startX + index * horizontalSpacing,
                    y: depth * verticalSpacing,
                });
            });
        });

        // Create ReactFlow nodes
        const flowNodes: Node[] = treeNodes.map((node) => {
            const position = nodePositions.get(node.id) || { x: 0, y: 0 };
            const hasChildren = (adjacency_list[node.id] || []).length > 0;

            return {
                id: node.id,
                type: 'treeNode',
                position,
                data: {
                    node,
                    isActive: node.id === activeNodeId,
                    hasChildren,
                    onNodeClick: handleNodeClick,
                    onFork: handleFork,
                    onRegenerate: handleRegenerate,
                },
                sourcePosition: Position.Bottom,
                targetPosition: Position.Top,
            };
        });

        // Create ReactFlow edges
        const flowEdges: Edge[] = [];
        Object.entries(adjacency_list).forEach(([parentId, childIds]) => {
            childIds.forEach((childId, index) => {
                flowEdges.push({
                    id: `${parentId}-${childId}`,
                    source: parentId,
                    target: childId,
                    type: 'smoothstep',
                    animated: childId === activeNodeId,
                    style: {
                        stroke: childId === activeNodeId ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                        strokeWidth: childId === activeNodeId ? 2 : 1,
                    },
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                        color: childId === activeNodeId ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                    },
                });
            });
        });

        setNodes(flowNodes);
        setEdges(flowEdges);
    }, [treeStructure, activeNodeId, handleNodeClick, handleFork, handleRegenerate, setNodes, setEdges]);

    if (!treeStructure) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <p className="text-muted-foreground">Loading tree...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full w-full">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                fitView
                minZoom={0.1}
                maxZoom={1.5}
                defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
                className="bg-background"
            >
                <Background />
                <Controls />
                <MiniMap
                    nodeColor={(node) => {
                        return node.data.isActive ? 'hsl(var(--primary))' : 'hsl(var(--muted))';
                    }}
                    className="bg-card border border-border"
                />
            </ReactFlow>
        </div>
    );
};
