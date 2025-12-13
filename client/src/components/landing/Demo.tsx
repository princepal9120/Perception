import React from 'react';
import { motion } from 'framer-motion';
import { Database, GitBranch, User, Bot, Sparkles, RefreshCw, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const Demo = () => {
    return (
        <section className="py-24 bg-zinc-950 relative overflow-hidden">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">
                        Visualize Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-400">Thinking</span>
                    </h2>
                    <p className="text-zinc-400 max-w-2xl mx-auto">
                        Watch how Perception turns linear chats into branching trees of exploration.
                    </p>
                </div>

                <div className="max-w-6xl mx-auto bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl relative">
                    {/* Grid Background */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px]" />

                    <div className="grid grid-cols-1 lg:grid-cols-3 min-h-[700px] relative z-10">

                        {/* Left: Chat Stream (Simulated) */}
                        <div className="col-span-1 border-r border-zinc-800 bg-zinc-950/50 p-6 flex flex-col backdrop-blur-sm">
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-800">
                                <div className="w-3 h-3 rounded-full bg-red-500" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                <div className="w-3 h-3 rounded-full bg-green-500" />
                                <span className="ml-auto text-xs text-zinc-500 font-mono">LIVE_TREE_SYNC</span>
                            </div>

                            <div className="space-y-6 flex-1">
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex-shrink-0 flex items-center justify-center">
                                        <User className="w-4 h-4 text-zinc-400" />
                                    </div>
                                    <div className="bg-zinc-800 rounded-2xl rounded-tl-none p-4 text-sm text-zinc-300">
                                        Explaining Quantum Computing to a 5th grader.
                                    </div>
                                </div>

                                <motion.div
                                    initial={{ opacity: 0 }}
                                    whileInView={{ opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                    className="flex gap-3"
                                >
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex-shrink-0 flex items-center justify-center">
                                        <Bot className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="space-y-3 w-full">
                                        <div className="bg-zinc-800/50 rounded-2xl rounded-tr-none p-4 text-sm text-zinc-300 border border-zinc-700/50">
                                            Imagine a coin spinning on a table...
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        </div>

                        {/* Middle: Realistic Tree Visualization */}
                        <div className="col-span-1 lg:col-span-2 p-8 relative flex flex-col items-center">

                            {/* Floating Controls */}
                            <div className="absolute top-4 right-4 flex gap-2">
                                <div className="bg-zinc-800/80 backdrop-blur rounded-lg p-2 border border-zinc-700 flex gap-2 text-zinc-400">
                                    <GitBranch className="w-4 h-4" />
                                    <span className="text-xs font-mono">Branch: Main</span>
                                </div>
                            </div>

                            {/* Tree Structure */}
                            <div className="relative w-full max-w-2xl mt-10 h-[500px]">
                                {/* SVG Lines (Behind nodes) */}
                                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
                                    {/* Line 1: Root to AI */}
                                    <motion.path
                                        d="M 320 80 C 320 130, 320 130, 320 180"
                                        fill="none"
                                        stroke="#52525b"
                                        strokeWidth="2"
                                        initial={{ pathLength: 0 }}
                                        whileInView={{ pathLength: 1 }}
                                        transition={{ duration: 1, delay: 0.2 }}
                                    />
                                    {/* Line 2: AI to Branch 1 */}
                                    <motion.path
                                        d="M 320 280 C 320 330, 150 330, 150 380"
                                        fill="none"
                                        stroke="#52525b"
                                        strokeWidth="2"
                                        initial={{ pathLength: 0 }}
                                        whileInView={{ pathLength: 1 }}
                                        transition={{ duration: 1, delay: 1.5 }}
                                    />
                                    {/* Line 3: AI to Branch 2 */}
                                    <motion.path
                                        d="M 320 280 C 320 330, 490 330, 490 380"
                                        fill="none"
                                        stroke="#3b82f6" // Active branch colored blue
                                        strokeWidth="2"
                                        initial={{ pathLength: 0 }}
                                        whileInView={{ pathLength: 1 }}
                                        transition={{ duration: 1, delay: 1.5 }}
                                    />
                                </svg>

                                {/* Root Node (User) */}
                                <motion.div
                                    initial={{ opacity: 0, y: -20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5 }}
                                    className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px]"
                                >
                                    <div className="bg-white dark:bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-lg flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
                                            <User className="w-4 h-4 text-zinc-400" />
                                        </div>
                                        <div>
                                            <div className="text-xs font-medium text-zinc-500 mb-1">You</div>
                                            <div className="text-sm text-zinc-200">Explain Quantum Computing</div>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* AI Node (Parent) */}
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.5, delay: 0.8 }}
                                    className="absolute top-[180px] left-1/2 -translate-x-1/2 w-[350px]"
                                >
                                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-lg flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-full bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                                            <Bot className="w-4 h-4 text-violet-400" />
                                        </div>
                                        <div>
                                            <div className="text-xs font-medium text-violet-400 mb-1 flex items-center gap-2">
                                                Perception AI
                                                <Sparkles className="w-3 h-3" />
                                            </div>
                                            <div className="text-sm text-zinc-300">
                                                Quantum computing uses qubits instead of bits...
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Branch 1 (User Follow-up) */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: 2 }}
                                    className="absolute top-[380px] left-[0px] w-[280px]"
                                >
                                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-lg opacity-60">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center">
                                                <User className="w-3 h-3 text-zinc-500" />
                                            </div>
                                            <span className="text-xs text-zinc-500">Simplify more</span>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Branch 2 (User Follow-up Active) */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: 2.2 }}
                                    className="absolute top-[380px] right-[0px] w-[300px]"
                                >
                                    <div className="bg-blue-950/30 border-2 border-blue-500/50 rounded-2xl p-4 shadow-lg shadow-blue-500/10 relative">
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                                            Active Branch
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                                                <User className="w-4 h-4 text-blue-400" />
                                            </div>
                                            <div>
                                                <div className="text-xs font-medium text-blue-400 mb-1">You</div>
                                                <div className="text-sm text-blue-100">
                                                    Give me a real-world analogy
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Streaming AI Response to Branch 2 */}
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        whileInView={{ opacity: 1, height: 'auto' }}
                                        transition={{ duration: 0.5, delay: 3 }}
                                        className="mt-8 ml-8 relative"
                                    >
                                        <div className="absolute -left-8 top-0 bottom-0 w-0.5 bg-blue-500/30" />
                                        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-lg">
                                            <div className="flex items-center gap-2 text-violet-400 text-xs mb-2">
                                                <Bot className="w-3 h-3" />
                                                Running...
                                            </div>
                                            <div className="space-y-2">
                                                <div className="h-2 bg-zinc-800 rounded w-full animate-pulse" />
                                                <div className="h-2 bg-zinc-800 rounded w-3/4 animate-pulse delay-75" />
                                            </div>
                                        </div>
                                    </motion.div>
                                </motion.div>

                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </section>
    );
};
