import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitBranch, RefreshCw, CheckCircle, FileText } from 'lucide-react';
import { useTreeStore } from '../../store/treeStore';

export const WorkflowSyncVisualizer: React.FC = () => {
    const { workflowSyncState } = useTreeStore();

    if (!workflowSyncState) return null;

    const { status, change_summary, linked_nodes } = workflowSyncState;
    const isUpdating = status === 'draft';

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -20, x: 20 }}
                animate={{ opacity: 1, y: 0, x: 0 }}
                exit={{ opacity: 0, y: -20, x: 20 }}
                className="absolute top-4 right-4 z-50 w-72 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
            >
                {/* Header */}
                <div className="bg-zinc-50/50 dark:bg-zinc-800/50 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <GitBranch className="w-4 h-4 text-primary" />
                        <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100">Workflow Sync</span>
                    </div>
                    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${isUpdating
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                            : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        }`}>
                        {isUpdating ? (
                            <>
                                <RefreshCw className="w-3 h-3 animate-spin" />
                                <span>Syncing</span>
                            </>
                        ) : (
                            <>
                                <CheckCircle className="w-3 h-3" />
                                <span>Synced</span>
                            </>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                    {/* Change Summary */}
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-semibold">
                            <FileText className="w-3 h-3" />
                            <span>Last Change</span>
                        </div>
                        <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-snug">
                            {change_summary || "No recent changes"}
                        </p>
                    </div>

                    {/* Linked Nodes */}
                    {linked_nodes && linked_nodes.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                            <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-semibold">
                                <GitBranch className="w-3 h-3" />
                                <span>Linked Nodes</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {linked_nodes.map((nodeId, index) => (
                                    <span
                                        key={`${nodeId}-${index}`}
                                        className="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-xs font-mono text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700"
                                    >
                                        #{nodeId.substring(0, 8)}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Progress Bar (if updating) */}
                {isUpdating && (
                    <motion.div
                        className="h-1 bg-primary/20 w-full"
                    >
                        <motion.div
                            className="h-full bg-primary"
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{
                                repeat: Infinity,
                                duration: 1.5,
                                ease: "linear"
                            }}
                        />
                    </motion.div>
                )}
            </motion.div>
        </AnimatePresence>
    );
};
