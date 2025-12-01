import { memo, useState } from 'react';
import { Handle, Position } from 'reactflow';
import { Wrench, ChevronDown, ChevronUp, ExternalLink, Search, Calculator, Database, Code } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const getToolIcon = (toolName: string) => {
    const name = toolName.toLowerCase();
    if (name.includes('search') || name.includes('tavily') || name.includes('duck')) return Search;
    if (name.includes('calculator')) return Calculator;
    if (name.includes('sql') || name.includes('db')) return Database;
    if (name.includes('code') || name.includes('python')) return Code;
    return Wrench;
};

const ToolNode = ({ data }: { data: any }) => {
    const [expanded, setExpanded] = useState(false);
    const Icon = getToolIcon(data.toolName || '');

    const isError = data.status === 'error';
    const isRunning = data.status === 'running';

    return (
        <div className="relative group">
            <Handle type="target" position={Position.Top} className="!bg-blue-500 !w-2 !h-2" />

            <div className={cn(
                "bg-white dark:bg-zinc-900 border rounded-xl shadow-sm min-w-[280px] max-w-[350px] overflow-hidden transition-all duration-200",
                isError ? "border-red-200 dark:border-red-900" : "border-blue-100 dark:border-blue-900/30",
                data.isActive && "ring-1 ring-blue-500"
            )}>
                {/* Header */}
                <div
                    className="flex items-center gap-3 p-3 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                    onClick={() => setExpanded(!expanded)}
                >
                    <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                        isError ? "bg-red-100 text-red-600" : "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                    )}>
                        <Icon className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                            <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                                {data.toolName}
                            </div>
                            <Badge variant={isError ? "destructive" : "secondary"} className="text-[10px] h-5 px-1.5">
                                {data.status || 'completed'}
                            </Badge>
                        </div>
                        <div className="text-xs text-zinc-500 truncate mt-0.5">
                            {isRunning ? 'Executing...' : 'Completed'}
                        </div>
                    </div>

                    <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-400">
                        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </Button>
                </div>

                {/* Expanded Content */}
                {expanded && (
                    <div className="border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 p-3 text-xs font-mono">
                        <div className="space-y-2">
                            <div>
                                <div className="text-zinc-400 mb-1">Input</div>
                                <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded p-2 overflow-x-auto">
                                    <pre className="text-zinc-700 dark:text-zinc-300">
                                        {JSON.stringify(data.args, null, 2)}
                                    </pre>
                                </div>
                            </div>

                            <div>
                                <div className="text-zinc-400 mb-1">Output</div>
                                <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded p-2 overflow-x-auto max-h-[200px]">
                                    <pre className="text-zinc-700 dark:text-zinc-300">
                                        {typeof data.output === 'string' ? data.output : JSON.stringify(data.output, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <Handle type="source" position={Position.Bottom} className="!bg-blue-500 !w-2 !h-2" />
        </div>
    );
};

export default memo(ToolNode);
