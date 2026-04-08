/**
 * TypeScript types for conversation tree
 */

export type TreeJsonObject = Record<string, unknown>;

export interface TreeToolCall {
    [key: string]: unknown;
}

export interface TreeWorkflowSyncState {
    status: 'draft' | 'updated';
    change_summary: string;
    linked_nodes: string[];
    last_updated: number;
}

export interface NodeMetadata {
    model?: string;
    tokens_used?: number;
    tools_used?: string[];
    search_queries?: string[];
    temperature?: number;
    custom_data?: TreeJsonObject;
    tool_calls?: TreeToolCall[];
    token_count?: number;
}

export interface ConversationNode {
    id: string;
    conversation_id: number;
    parent_id: string | null;
    depth: number;
    user_message: string | null;
    ai_message: string | null;
    metadata: NodeMetadata | null;
    branch_name: string | null;
    is_active: boolean;
    user_id: number;
    checkpoint_id: string | null;
    created_at: string;
    updated_at: string;
}

export interface TreeNodeData {
    id: string;
    parent_id: string | null;
    depth: number;
    user_message: string | null;
    ai_message: string | null;
    branch_name: string | null;
    is_active: boolean;
    created_at: string;
    children_count: number;
    metadata?: NodeMetadata | null;
}

export interface ConversationTreeMetadata {
    id: number;
    chat_id: number;
    user_id: number;
    root_node_id: string;
    active_node_id: string;
    total_nodes: number;
    total_branches: number;
    max_depth: number;
    created_at: string;
    updated_at: string;
}

export interface ConversationTreeStructure {
    tree_metadata: ConversationTreeMetadata;
    nodes: TreeNodeData[];
    adjacency_list: Record<string, string[]>;
}

export interface TreeStatistics {
    total_nodes: number;
    total_branches: number;
    max_depth: number;
    total_user_messages: number;
    total_ai_messages: number;
    branch_points: number;
    leaf_nodes: number;
}

export interface MessageSendRequest {
    node_id: string;
    message: string;
    regenerate?: boolean;
}

export interface StreamEvent {
    type: string;
    data?: TreeJsonObject;
    content?: string;
}

export interface BranchCreateRequest {
    node_id: string;
    branch_name?: string;
}

export interface CompareNodesRequest {
    node_ids: string[];
}

// React Flow types for visualization
export interface TreeNodePosition {
    x: number;
    y: number;
}

export interface ReactFlowNode {
    id: string;
    type: string;
    position: TreeNodePosition;
    data: {
        node: TreeNodeData;
        isActive: boolean;
        hasChildren: boolean;
        onNodeClick: (nodeId: string) => void;
        onFork: (nodeId: string) => void;
        onRegenerate: (nodeId: string) => void;
    };
}

export interface ReactFlowEdge {
    id: string;
    source: string;
    target: string;
    type?: string;
    animated?: boolean;
    style?: TreeJsonObject;
}

export interface TreeStreamNodePayload {
    id?: string;
    type?: string;
    ai_response?: string;
    branch_of?: string | null;
}

export interface TreeStreamEvent {
    type?: string;
    node?: TreeStreamNodePayload;
    workflow_sync?: Omit<TreeWorkflowSyncState, 'last_updated'>;
}

export interface TreeLineageNode {
    id: string;
    parent_id: string | null;
    user_message: string | null;
    ai_message: string | null;
    created_at: string;
    metadata?: NodeMetadata | null;
}

export interface TreeBaseNodeData {
    isActive?: boolean;
    timestamp?: string;
}

export interface UserTreeNodeData extends TreeBaseNodeData {
    label: string;
    hasAI?: boolean;
}

export interface AITreeNodeData extends TreeBaseNodeData {
    label: string;
    isStreaming?: boolean;
    tokens?: number;
}

export interface ToolTreeNodeData extends TreeBaseNodeData {
    toolName?: string;
    status?: 'running' | 'completed' | 'error' | string;
    args?: TreeJsonObject;
    output?: unknown;
}
