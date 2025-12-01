import React, { useCallback, useEffect, useMemo } from 'react';
import ReactFlow, {
    Node,
    Edge,
    Controls,
    Background,
    MiniMap,
    useNodesState,
    useEdgesState,
    MarkerType,
    ConnectionLineType,
    Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useTreeStore } from '../../store/treeStore';
import useTreeLayout from '../../hooks/useTreeLayout';
import UserNode from './nodes/UserNode';
import AINode from './nodes/AINode';
import ToolNode from './nodes/ToolNode';
import { DeepResearchLoader } from './DeepResearchLoader';
import { Button } from '../ui/button';
import { Layout, ZoomIn, ZoomOut, Maximize, Network } from 'lucide-react';

import { useChatStore } from '../../store/chatStore';
import { treeApi } from '../../lib/tree-api';

const nodeTypes = {
    user: UserNode,
    ai: AINode,
    tool: ToolNode,
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
        isStreaming,
    } = useTreeStore();
    const { setMessages } = useChatStore();

    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const { getLayoutedElements } = useTreeLayout();

    // Load tree on mount
    useEffect(() => {
        loadTree(chatId);
    }, [chatId, loadTree]);

    // Handle node click
    const onNodeClick = useCallback(
        async (_: React.MouseEvent, node: Node) => {
            // If it's a user or AI node, we can set it as active
            // The ID format is likely `${dbNodeId}_user` or `${dbNodeId}_ai`
            const dbNodeId = node.id.split('_')[0];

            // 1. Set active node in tree store
            await setActiveNode(dbNodeId);

            // 2. Fetch lineage and update chat
            try {
                const lineage = await treeApi.getNodeLineage(dbNodeId);

                // Convert lineage to chat messages
                const messages = lineage.flatMap((node: any, index: number) => {
                    const msgs = [];
                    if (node.user_message) {
                        msgs.push({
                            id: index * 2, // Temporary ID
                            role: 'user',
                            content: node.user_message,
                            created_at: node.created_at,
                            metadata: { ...node.metadata, nodeId: node.id, parentId: node.parent_id, isUserNode: true }
                        });
                    }
                    if (node.ai_message) {
                        msgs.push({
                            id: index * 2 + 1, // Temporary ID
                            role: 'assistant',
                            content: node.ai_message,
                            created_at: node.created_at,
                            metadata: { ...node.metadata, nodeId: node.id, parentId: node.parent_id, isUserNode: false }
                        });
                    }
                    return msgs;
                });

                setMessages(messages as any);
            } catch (error) {
                console.error('Failed to load branch:', error);
            }
        },
        [setActiveNode, setMessages]
    );

    // Transform tree structure to React Flow elements
    useEffect(() => {
        if (!treeStructure) return;

        const flowNodes: Node[] = [];
        const flowEdges: Edge[] = [];
        const { nodes: treeNodes } = treeStructure;

        console.log('[TreeViz] Processing tree:', {
            totalNodes: treeNodes.length,
            activeNodeId: treeStructure.tree_metadata.active_node_id,
            adjacencyList: treeStructure.adjacency_list
        });

        treeNodes.forEach((node) => {
            // Only render nodes that have a user message (questions)
            // We skip empty root nodes or nodes that are just AI responses without user query (rare in this model)
            if (!node.user_message) return;

            const isNodeActive = node.id === activeNodeId;

            // Create User Node
            // We use the raw node.id so edges work naturally with parent_id
            flowNodes.push({
                id: node.id,
                type: 'user',
                data: {
                    label: node.user_message,
                    timestamp: node.created_at,
                    isActive: isNodeActive,
                    // Pass metadata to show if it has AI response, tools, etc.
                    hasAI: !!node.ai_message,
                    aiMessage: node.ai_message,
                    metadata: node.metadata
                },
                position: { x: 0, y: 0 },
            });

            // Create Edge from Parent
            // We only create an edge if the parent also exists in our filtered list (has user_message)
            // OR if the parent is the root (which might be empty).
            // If parent is root and root is hidden, this node is a root in the viz.
            if (node.parent_id) {
                const parentNode = treeNodes.find(n => n.id === node.parent_id);
                // If parent exists and has user message, connect to it
                if (parentNode && parentNode.user_message) {
                    flowEdges.push({
                        id: `${node.parent_id}-${node.id}`,
                        source: node.parent_id,
                        target: node.id,
                        type: 'smoothstep',
                        animated: isNodeActive,
                        style: { stroke: isNodeActive ? '#3b82f6' : '#e4e4e7', strokeWidth: 2 },
                    });
                }
                // If parent is root (no user message), we don't connect it, so this becomes a root in viz
            }
        });

        console.log('[TreeViz] Created nodes and edges:', {
            flowNodesCount: flowNodes.length,
            flowEdgesCount: flowEdges.length,
            flowNodes: flowNodes
        });

        const layouted = getLayoutedElements(flowNodes, flowEdges);
        // The following lines were causing a syntax error and are now correctly placed/removed.
        // nodesCount: layouted.nodes.length,
        // edgesCount: layouted.edges.length,
        // firstNodePos: layouted.nodes[0]?.position
        // }); // This closing brace was misplaced

        setNodes(layouted.nodes);
        setEdges(layouted.edges);

    }, [treeStructure, activeNodeId, isStreaming, getLayoutedElements, setNodes, setEdges]);

    // Show loader if streaming and no nodes yet (initial deep research)
    const showLoader = isStreaming && (!treeStructure || treeStructure.nodes.length <= 1);

    if (showLoader) {
        return (
            <div className="h-full w-full flex items-center justify-center bg-zinc-50/50 dark:bg-zinc-900/50 backdrop-blur-sm">
                <DeepResearchLoader />
            </div>
        );
    }

    // Show empty state if no nodes to display
    if (nodes.length === 0) {
        return (
            <div className="h-full w-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
                <div className="text-center max-w-md p-8">
                    <div className="mb-4">
                        <Network className="w-16 h-16 mx-auto text-zinc-400 dark:text-zinc-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                        No Conversation Tree Yet
                    </h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                        Click the "Sync Chat to Tree" button above to convert your chat messages into a branching conversation tree.
                    </p>
                    {treeStructure && (
                        <div className="text-xs text-zinc-400 dark:text-zinc-600 mt-4 p-3 bg-zinc-100 dark:bg-zinc-900 rounded">
                            <p>Debug Info:</p>
                            <p>Total nodes in tree: {treeStructure.nodes.length}</p>
                            <p>Nodes with messages: {treeStructure.nodes.filter(n => n.user_message || n.ai_message).length}</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="h-full w-full relative bg-zinc-50 dark:bg-zinc-950">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={onNodeClick}
                nodeTypes={nodeTypes}
                connectionLineType={ConnectionLineType.SmoothStep}
                fitView
                minZoom={0.1}
                maxZoom={2}
                defaultEdgeOptions={{
                    type: 'smoothstep',
                    animated: false,
                }}
            >
                <Background color="#e4e4e7" gap={16} />
                <Controls />
                <MiniMap
                    nodeColor={(node) => {
                        switch (node.type) {
                            case 'user':
                                return '#71717a';
                            case 'ai':
                                return '#3b82f6';
                            case 'tool':
                                return '#f97316';
                            default:
                                return '#e4e4e7';
                        }
                    }}
                    maskColor="rgba(0, 0, 0, 0.1)"
                />
                <Panel position="top-right" className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-2">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                            const layouted = getLayoutedElements(nodes, edges);
                            setNodes(layouted.nodes);
                            setEdges(layouted.edges);
                        }}
                    >
                        <Layout className="w-4 h-4 mr-2" />
                        Auto Layout
                    </Button>
                </Panel>
            </ReactFlow>
        </div>
    );
};
