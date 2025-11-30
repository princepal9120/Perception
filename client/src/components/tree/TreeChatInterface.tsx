/**
 * Tree-enabled chat interface
 * Combines traditional chat view with tree branching capabilities
 */
import React, { useState, useEffect } from 'react';
import { useTreeStore } from '../../store/treeStore';
import { TreeVisualization } from './TreeVisualization';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { ScrollArea } from '../ui/scroll-area';
import {
    Network,
    MessageSquare,
    GitBranch,
    Send,
    RefreshCw,
    BarChart3,
} from 'lucide-react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Separator } from '../ui/separator';

interface TreeChatInterfaceProps {
    chatId: number;
}

export const TreeChatInterface: React.FC<TreeChatInterfaceProps> = ({ chatId }) => {
    const {
        treeStructure,
        activeNodeId,
        statistics,
        isLoading,
        error,
        isStreaming,
        streamingContent,
        loadTree,
        loadStatistics,
        sendMessage,
        getActiveLineage,
        getNodeChildren,
    } = useTreeStore();

    const [message, setMessage] = useState('');
    const [activeTab, setActiveTab] = useState<'chat' | 'tree' | 'stats'>('chat');

    // Load tree and stats on mount
    useEffect(() => {
        loadTree(chatId);
        loadStatistics(chatId);
    }, [chatId, loadTree, loadStatistics]);

    const activeLineage = getActiveLineage();
    const currentNode = activeNodeId
        ? treeStructure?.nodes.find((n) => n.id === activeNodeId)
        : null;
    const currentChildren = activeNodeId ? getNodeChildren(activeNodeId) : [];

    const handleSendMessage = async () => {
        if (!message.trim() || !activeNodeId) return;

        await sendMessage(activeNodeId, message.trim());
        setMessage('');
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="border-b bg-card p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold">Conversation Tree</h2>
                        <p className="text-sm text-muted-foreground">
                            Branch and explore different conversation paths
                        </p>
                    </div>

                    {statistics && (
                        <div className="flex gap-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold">{statistics.total_nodes}</p>
                                <p className="text-xs text-muted-foreground">Nodes</p>
                            </div>
                            <Separator orientation="vertical" />
                            <div className="text-center">
                                <p className="text-2xl font-bold">{statistics.total_branches}</p>
                                <p className="text-xs text-muted-foreground">Branches</p>
                            </div>
                            <Separator orientation="vertical" />
                            <div className="text-center">
                                <p className="text-2xl font-bold">{statistics.max_depth}</p>
                                <p className="text-xs text-muted-foreground">Max Depth</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Current branch indicator */}
                {currentNode && (
                    <div className="mt-3 flex items-center gap-2">
                        <Badge variant="outline">
                            <GitBranch className="w-3 h-3 mr-1" />
                            {currentNode.branch_name || 'Main'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                            Depth: {currentNode.depth}
                        </span>
                        {currentChildren.length > 0 && (
                            <Badge variant="secondary">
                                {currentChildren.length} {currentChildren.length === 1 ? 'child' : 'children'}
                            </Badge>
                        )}
                    </div>
                )}
            </div>

            {/* Main content */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
                <TabsList className="mx-4 mt-4">
                    <TabsTrigger value="chat">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Chat View
                    </TabsTrigger>
                    <TabsTrigger value="tree">
                        <Network className="w-4 h-4 mr-2" />
                        Tree View
                    </TabsTrigger>
                    <TabsTrigger value="stats">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Statistics
                    </TabsTrigger>
                </TabsList>

                {/* Chat view */}
                <TabsContent value="chat" className="flex-1 flex flex-col mt-0">
                    <ScrollArea className="flex-1 p-4">
                        <div className="space-y-4 max-w-3xl mx-auto">
                            {activeLineage.map((node, index) => (
                                <div key={node.id} className="space-y-2">
                                    {/* User message */}
                                    {node.user_message && (
                                        <div className="flex justify-end">
                                            <div className="bg-primary text-primary-foreground rounded-lg px-4 py-2 max-w-[80%]">
                                                <p className="text-sm">{node.user_message}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* AI message */}
                                    {node.ai_message && (
                                        <div className="flex justify-start">
                                            <div className="bg-muted rounded-lg px-4 py-2 max-w-[80%]">
                                                <p className="text-sm whitespace-pre-wrap">{node.ai_message}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Branch indicator */}
                                    {index < activeLineage.length - 1 && node.children_count > 1 && (
                                        <div className="flex justify-center">
                                            <Badge variant="outline" className="text-xs">
                                                <GitBranch className="w-3 h-3 mr-1" />
                                                Branch point ({node.children_count} paths)
                                            </Badge>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* Streaming content */}
                            {isStreaming && streamingContent && (
                                <div className="flex justify-start">
                                    <div className="bg-muted rounded-lg px-4 py-2 max-w-[80%]">
                                        <p className="text-sm whitespace-pre-wrap">{streamingContent}</p>
                                        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                                            <div className="animate-pulse">●</div>
                                            <span>AI is typing...</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>

                    {/* Input area */}
                    <div className="border-t p-4">
                        <div className="max-w-3xl mx-auto">
                            {error && (
                                <div className="mb-2 p-2 bg-destructive/10 text-destructive text-sm rounded">
                                    {error}
                                </div>
                            )}

                            <div className="flex gap-2">
                                <Textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
                                    className="min-h-[60px] max-h-[200px]"
                                    disabled={isStreaming || !activeNodeId}
                                />
                                <div className="flex flex-col gap-2">
                                    <Button
                                        onClick={handleSendMessage}
                                        disabled={!message.trim() || isStreaming || !activeNodeId}
                                        size="icon"
                                    >
                                        <Send className="h-4 w-4" />
                                    </Button>
                                    {currentNode?.ai_message && (
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            disabled={isStreaming}
                                            title="Regenerate response"
                                        >
                                            <RefreshCw className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* Tree view */}
                <TabsContent value="tree" className="flex-1 mt-0">
                    <div className="h-full">
                        <TreeVisualization chatId={chatId} />
                    </div>
                </TabsContent>

                {/* Statistics view */}
                <TabsContent value="stats" className="flex-1 p-4 overflow-auto">
                    <div className="max-w-4xl mx-auto space-y-4">
                        {statistics && (
                            <>
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Tree Overview</CardTitle>
                                        <CardDescription>
                                            Statistics about your conversation tree
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Total Nodes</p>
                                            <p className="text-2xl font-bold">{statistics.total_nodes}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Branches</p>
                                            <p className="text-2xl font-bold">{statistics.total_branches}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Max Depth</p>
                                            <p className="text-2xl font-bold">{statistics.max_depth}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Branch Points</p>
                                            <p className="text-2xl font-bold">{statistics.branch_points}</p>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Message Statistics</CardTitle>
                                    </CardHeader>
                                    <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        <div>
                                            <p className="text-sm text-muted-foreground">User Messages</p>
                                            <p className="text-2xl font-bold">{statistics.total_user_messages}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">AI Messages</p>
                                            <p className="text-2xl font-bold">{statistics.total_ai_messages}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Leaf Nodes</p>
                                            <p className="text-2xl font-bold">{statistics.leaf_nodes}</p>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Current Branch</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {currentNode && (
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <Badge>{currentNode.branch_name || 'Main'}</Badge>
                                                    <span className="text-sm text-muted-foreground">
                                                        Depth: {currentNode.depth}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    {currentChildren.length} child node{currentChildren.length !== 1 ? 's' : ''}
                                                </p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};
