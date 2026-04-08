import React from 'react';
import { motion } from 'framer-motion';
import { GitBranch, User, Bot, Sparkles } from 'lucide-react';

export const Demo = () => {
    return (
        <section id="demo" className="py-24 bg-[#050505] relative overflow-hidden">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-medium mb-6 text-white font-serif">
                        Visualize Your <span className="italic text-gradient">Research Graph</span>
                    </h2>
                    <p className="text-gray-400 max-w-2xl mx-auto text-lg font-light">
                        Watch how Perception turns one research question into a branching evidence trail you can revisit, compare, and extend.
                    </p>
                </div>

                <div className="max-w-6xl mx-auto bg-black/40 rounded-2xl border border-white/10 overflow-hidden shadow-2xl relative backdrop-blur-sm">
                    {/* Grid Background */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px]" />

                    <div className="grid grid-cols-1 lg:grid-cols-3 min-h-[700px] relative z-10">

                        {/* Left: Chat Stream (Simulated) */}
                        <div className="col-span-1 border-b lg:border-b-0 lg:border-r border-white/10 bg-black/20 p-6 flex flex-col backdrop-blur-sm">
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                                <div className="w-3 h-3 rounded-full bg-green-500/80" />
                                <span className="ml-auto text-xs text-center text-gray-500 font-mono tracking-widest">LIVE_SYNC</span>
                            </div>

                            <div className="space-y-6 flex-1">
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-white/5 flex-shrink-0 flex items-center justify-center border border-white/10">
                                        <User className="w-4 h-4 text-gray-400" />
                                    </div>
                                    <div className="bg-white/5 rounded-2xl rounded-tl-none p-4 text-sm text-gray-300 border border-white/5">
                                        Explaining Quantum Computing to a 5th grader.
                                    </div>
                                </div>

                                <motion.div
                                    initial={{ opacity: 0 }}
                                    whileInView={{ opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                    className="flex gap-3"
                                >
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-ai-primary to-ai-secondary flex-shrink-0 flex items-center justify-center shadow-glow">
                                        <Bot className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="space-y-3 w-full">
                                        <div className="bg-white/5 rounded-2xl rounded-tr-none p-4 text-sm text-gray-300 border border-white/5">
                                            Imagine a coin spinning on a table...
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        </div>

                        {/* Middle: Realistic Tree Visualization */}
                        <div className="col-span-1 lg:col-span-2 p-8 relative flex flex-col items-center justify-center lg:justify-start">

                            {/* Floating Controls */}
                            <div className="absolute top-4 right-4 flex gap-2 z-20">
                                <div className="bg-black/40 backdrop-blur rounded-lg p-2 border border-white/10 flex gap-2 text-gray-400">
                                    <GitBranch className="w-4 h-4" />
                                    <span className="text-xs font-mono">Branch: Main</span>
                                </div>
                            </div>

                            {/* Tree Structure */}
                            <div className="relative w-full max-w-2xl mt-10 h-auto lg:h-[500px] flex flex-col lg:block items-center">

                                {/* Desktop SVG Lines (Behind nodes) */}
                                <svg className="hidden lg:block absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
                                    {/* Line 1: Root to AI */}
                                    <motion.path
                                        d="M 320 80 C 320 130, 320 130, 320 180"
                                        fill="none"
                                        stroke="#333"
                                        strokeWidth="2"
                                        initial={{ pathLength: 0 }}
                                        whileInView={{ pathLength: 1 }}
                                        transition={{ duration: 1, delay: 0.2 }}
                                    />
                                    {/* Line 2: AI to Branch 1 */}
                                    <motion.path
                                        d="M 320 280 C 320 330, 150 330, 150 380"
                                        fill="none"
                                        stroke="#333"
                                        strokeWidth="2"
                                        initial={{ pathLength: 0 }}
                                        whileInView={{ pathLength: 1 }}
                                        transition={{ duration: 1, delay: 1.5 }}
                                    />
                                    {/* Line 3: AI to Branch 2 */}
                                    <motion.path
                                        d="M 320 280 C 320 330, 490 330, 490 380"
                                        fill="none"
                                        stroke="#FF4500" // Active branch colored orange
                                        strokeWidth="2"
                                        initial={{ pathLength: 0 }}
                                        whileInView={{ pathLength: 1 }}
                                        transition={{ duration: 1, delay: 1.5 }}
                                    />
                                </svg>

                                {/* Mobile Vertical Connecting Lines */}
                                <div className="lg:hidden absolute left-1/2 top-4 bottom-4 w-px bg-white/10 -translate-x-1/2 -z-10" />

                                {/* Root Node (User) */}
                                <motion.div
                                    initial={{ opacity: 0, y: -20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5 }}
                                    className="relative lg:absolute lg:top-0 lg:left-1/2 lg:-translate-x-1/2 w-full max-w-md lg:w-[300px] mb-8 lg:mb-0"
                                >
                                    <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-4 shadow-lg flex items-start gap-3 z-10 relative">
                                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
                                            <User className="w-4 h-4 text-gray-400" />
                                        </div>
                                        <div>
                                            <div className="text-xs font-medium text-gray-500 mb-1">You</div>
                                            <div className="text-sm text-gray-200">Explain Quantum Computing</div>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* AI Node (Parent) */}
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.5, delay: 0.8 }}
                                    className="relative lg:absolute lg:top-[180px] lg:left-1/2 lg:-translate-x-1/2 w-full max-w-md lg:w-[350px] mb-8 lg:mb-0"
                                >
                                    <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-4 shadow-lg flex items-start gap-3 z-10 relative">
                                        <div className="w-8 h-8 rounded-full bg-ai-primary/10 flex items-center justify-center flex-shrink-0 border border-ai-primary/20">
                                            <Bot className="w-4 h-4 text-ai-primary" />
                                        </div>
                                        <div>
                                            <div className="text-xs font-medium text-ai-primary mb-1 flex items-center gap-2">
                                                Perception AI
                                                <Sparkles className="w-3 h-3" />
                                            </div>
                                            <div className="text-sm text-gray-300">
                                                Quantum computing uses qubits instead of bits...
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Container for Branches on Mobile */}
                                <div className="flex flex-col lg:block w-full items-center gap-8 lg:gap-0">
                                    {/* Branch 1 (User Follow-up) */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5, delay: 2 }}
                                        className="relative lg:absolute lg:top-[380px] lg:left-[0px] w-full max-w-md lg:w-[280px]"
                                    >
                                        <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-4 shadow-lg opacity-40 grayscale z-10 relative">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center">
                                                    <User className="w-3 h-3 text-gray-500" />
                                                </div>
                                                <span className="text-xs text-gray-500">Simplify more</span>
                                            </div>
                                        </div>
                                    </motion.div>

                                    {/* Branch 2 (User Follow-up Active) */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5, delay: 2.2 }}
                                        className="relative lg:absolute lg:top-[380px] lg:right-[0px] w-full max-w-md lg:w-[300px]"
                                    >
                                        <div className="bg-ai-primary/5 border border-ai-primary/30 rounded-2xl p-4 shadow-[0_0_30px_-10px_rgba(255,69,0,0.3)] relative z-10">
                                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-ai-primary text-white text-[10px] px-2 py-0.5 rounded-full shadow-glow">
                                                Active Branch
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 rounded-full bg-ai-primary/20 flex items-center justify-center flex-shrink-0">
                                                    <User className="w-4 h-4 text-ai-primary" />
                                                </div>
                                                <div>
                                                    <div className="text-xs font-medium text-ai-primary mb-1">You</div>
                                                    <div className="text-sm text-white">
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
                                            <div className="absolute -left-8 top-0 bottom-0 w-0.5 bg-ai-primary/30" />
                                            <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-4 shadow-lg">
                                                <div className="flex items-center gap-2 text-ai-primary text-xs mb-2">
                                                    <Bot className="w-3 h-3" />
                                                    Running...
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="h-2 bg-white/10 rounded w-full animate-pulse" />
                                                    <div className="h-2 bg-white/10 rounded w-3/4 animate-pulse delay-75" />
                                                </div>
                                            </div>
                                        </motion.div>
                                    </motion.div>
                                </div>

                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </section>
    );
};
