import React, { useEffect } from 'react';
import { useMCPStore } from '@/store/mcpStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Server, Terminal, Play, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export const MCPToolExplorer = () => {
    const { servers, tools, fetchServers, fetchTools, connectServer, isLoading } = useMCPStore();

    useEffect(() => {
        fetchServers();
        fetchTools();
    }, []);

    return (
        <div className="h-full flex flex-col space-y-4 p-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Terminal className="w-6 h-6 text-primary" />
                    MCP Tool Explorer
                </h2>
                <Button variant="outline" size="sm" onClick={() => { fetchServers(); fetchTools(); }} disabled={isLoading}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            <Tabs defaultValue="servers" className="flex-1 flex flex-col">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="servers">Servers ({servers.length})</TabsTrigger>
                    <TabsTrigger value="tools">Tools ({tools.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="servers" className="flex-1 mt-4">
                    <ScrollArea className="h-[calc(100vh-250px)]">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
                            {servers.map((server) => (
                                <motion.div
                                    key={server.name}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <Card className="overflow-hidden border-l-4 border-l-primary">
                                        <CardHeader className="pb-2">
                                            <div className="flex justify-between items-start">
                                                <CardTitle className="text-lg flex items-center gap-2">
                                                    <Server className="w-4 h-4" />
                                                    {server.name}
                                                </CardTitle>
                                                <Badge variant={server.connected ? "default" : "secondary"} className={server.connected ? "bg-green-500" : ""}>
                                                    {server.connected ? "Connected" : "Disconnected"}
                                                </Badge>
                                            </div>
                                            <CardDescription>
                                                {server.tools_count} tools available
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            {server.error && (
                                                <div className="text-xs text-red-500 mb-3 flex items-center gap-1">
                                                    <AlertCircle className="w-3 h-3" />
                                                    {server.error}
                                                </div>
                                            )}
                                            {!server.connected && (
                                                <Button
                                                    size="sm"
                                                    className="w-full"
                                                    onClick={() => connectServer(server.name)}
                                                    disabled={isLoading}
                                                >
                                                    Connect Server
                                                </Button>
                                            )}
                                            {server.connected && (
                                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                                                    Ready to execute tools
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    </ScrollArea>
                </TabsContent>

                <TabsContent value="tools" className="flex-1 mt-4">
                    <ScrollArea className="h-[calc(100vh-250px)]">
                        <div className="grid grid-cols-1 gap-4 pb-4">
                            {tools.map((tool, index) => (
                                <motion.div
                                    key={`${tool.server}-${tool.name}`}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <div className="flex justify-between items-start">
                                                <div className="space-y-1">
                                                    <CardTitle className="text-base font-mono text-primary">
                                                        {tool.name}
                                                    </CardTitle>
                                                    <div className="flex gap-2">
                                                        <Badge variant="outline" className="text-xs">
                                                            {tool.server}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <Button size="icon" variant="ghost">
                                                    <Play className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-muted-foreground mb-3">
                                                {tool.description}
                                            </p>
                                            <div className="bg-muted/50 p-2 rounded-md">
                                                <pre className="text-xs overflow-x-auto">
                                                    {JSON.stringify(tool.input_schema, null, 2)}
                                                </pre>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    </ScrollArea>
                </TabsContent>
            </Tabs>
        </div>
    );
};
