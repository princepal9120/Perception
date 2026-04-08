import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { User } from 'lucide-react';
import type { UserTreeNodeData } from '@/types/tree';

const UserNode = ({ data }: { data: UserTreeNodeData }) => {
    return (
        <div className="relative group">
            <Handle type="target" position={Position.Top} className="!bg-muted-foreground !w-2 !h-2" />

            <div className={`flex items-start gap-3 rounded-2xl p-4 shadow-sm min-w-[250px] max-w-[350px] transition-all duration-200
                ${data.isActive
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500 shadow-md transform scale-105'
                    : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                }
            `}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                    ${data.isActive ? 'bg-blue-100 dark:bg-blue-800' : 'bg-zinc-100 dark:bg-zinc-800'}
                `}>
                    <User className={`w-4 h-4 ${data.isActive ? 'text-blue-600 dark:text-blue-300' : 'text-zinc-600 dark:text-zinc-400'}`} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1 flex justify-between items-center">
                        <span>You</span>
                        {data.hasAI && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                                Answered
                            </span>
                        )}
                    </div>
                    <div className="text-sm text-zinc-600 dark:text-zinc-300 line-clamp-3">
                        {data.label}
                    </div>
                    {data.timestamp && (
                        <div className="text-xs text-zinc-400 mt-2">
                            {new Date(data.timestamp).toLocaleTimeString()}
                        </div>
                    )}
                </div>
            </div>

            <Handle type="source" position={Position.Bottom} className="!bg-muted-foreground !w-2 !h-2" />
        </div>
    );
};

export default memo(UserNode);
