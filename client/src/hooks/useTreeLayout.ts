import { useCallback } from 'react';
import dagre from 'dagre';
import { Node, Edge, Position } from 'reactflow';

const nodeWidth = 350;
const nodeHeight = 150;

const useTreeLayout = () => {
    const getLayoutedElements = useCallback(
        (nodes: Node[], edges: Edge[], direction = 'TB') => {
            const dagreGraph = new dagre.graphlib.Graph();
            dagreGraph.setDefaultEdgeLabel(() => ({}));

            const isHorizontal = direction === 'LR';
            dagreGraph.setGraph({ rankdir: direction });

            nodes.forEach((node) => {
                // Adjust dimensions based on node type if needed
                const width = node.type === 'tool' ? 300 : nodeWidth;
                const height = node.type === 'tool' ? 80 : nodeHeight;
                dagreGraph.setNode(node.id, { width, height });
            });

            edges.forEach((edge) => {
                dagreGraph.setEdge(edge.source, edge.target);
            });

            dagre.layout(dagreGraph);

            const layoutedNodes = nodes.map((node) => {
                const nodeWithPosition = dagreGraph.node(node.id);

                // We are shifting the dagre node position (anchor=center center) to the top left
                // so it matches the React Flow node anchor point (top left).
                const width = node.type === 'tool' ? 300 : nodeWidth;
                const height = node.type === 'tool' ? 80 : nodeHeight;

                node.targetPosition = isHorizontal ? Position.Left : Position.Top;
                node.sourcePosition = isHorizontal ? Position.Right : Position.Bottom;

                // Add some randomness/offset to prevent perfect stacking if dagre fails
                const x = nodeWithPosition.x - width / 2;
                const y = nodeWithPosition.y - height / 2;

                return {
                    ...node,
                    position: { x, y },
                };
            });

            return { nodes: layoutedNodes, edges };
        },
        []
    );

    return { getLayoutedElements };
};

export default useTreeLayout;
