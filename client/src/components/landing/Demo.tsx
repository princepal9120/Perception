import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Database, GitBranch, FileText } from 'lucide-react';

export const Demo = () => {
    return (
        <section className="py-24 bg-ai-background relative overflow-hidden">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">
                        See it in <span className="text-gradient">Action</span>
                    </h2>
                </div>

                <div className="max-w-6xl mx-auto glass-card rounded-2xl border border-ai-border overflow-hidden shadow-2xl">
                    <div className="grid grid-cols-1 lg:grid-cols-3 min-h-[600px]">

                        {/* Left: Chat Interface */}
                        <div className="col-span-1 border-r border-ai-border/30 bg-black/20 p-6 flex flex-col">
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-ai-border/30">
                                <div className="w-3 h-3 rounded-full bg-red-500" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                <div className="w-3 h-3 rounded-full bg-green-500" />
                                <span className="ml-auto text-xs text-gray-500">Chat Session</span>
                            </div>

                            <div className="space-y-6 flex-1">
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-700 flex-shrink-0" />
                                    <div className="bg-white/5 rounded-2xl rounded-tl-none p-4 text-sm text-gray-300">
                                        Research the latest trends in Agentic AI and summarize key players.
                                    </div>
                                </div>

                                <motion.div
                                    initial={{ opacity: 0 }}
                                    whileInView={{ opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                    className="flex gap-3"
                                >
                                    <div className="w-8 h-8 rounded-full bg-gradient-ai flex-shrink-0 flex items-center justify-center text-xs font-bold">AI</div>
                                    <div className="space-y-3 w-full">
                                        <div className="flex items-center gap-2 text-xs text-ai-primary">
                                            <Database className="w-3 h-3" />
                                            <span>Searching Web...</span>
                                        </div>
                                        <div className="bg-ai-primary/10 rounded-2xl rounded-tr-none p-4 text-sm text-gray-200 border border-ai-primary/20">
                                            I've found several key trends in Agentic AI. Here's a summary...
                                        </div>
                                    </div>
                                </motion.div>
                            </div>

                            <div className="mt-6 pt-4 border-t border-ai-border/30">
                                <div className="h-10 bg-white/5 rounded-lg w-full" />
                            </div>
                        </div>

                        {/* Middle: Execution Tree */}
                        <div className="col-span-1 lg:col-span-2 bg-black/40 p-6 relative overflow-hidden">
                            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px]" />

                            <div className="relative z-10 h-full flex items-center justify-center">
                                <div className="relative w-full max-w-lg aspect-video">
                                    {/* Tree Visualization */}
                                    <svg className="w-full h-full" viewBox="0 0 400 300">
                                        <motion.path
                                            d="M 50 150 L 150 150"
                                            stroke="#4285FF"
                                            strokeWidth="2"
                                            initial={{ pathLength: 0 }}
                                            whileInView={{ pathLength: 1 }}
                                            transition={{ duration: 1 }}
                                        />
                                        <motion.path
                                            d="M 150 150 L 250 100"
                                            stroke="#7B61FF"
                                            strokeWidth="2"
                                            initial={{ pathLength: 0 }}
                                            whileInView={{ pathLength: 1 }}
                                            transition={{ duration: 1, delay: 1 }}
                                        />
                                        <motion.path
                                            d="M 150 150 L 250 200"
                                            stroke="#7B61FF"
                                            strokeWidth="2"
                                            initial={{ pathLength: 0 }}
                                            whileInView={{ pathLength: 1 }}
                                            transition={{ duration: 1, delay: 1 }}
                                        />

                                        {/* Nodes */}
                                        <circle cx="50" cy="150" r="6" fill="#4285FF" />
                                        <circle cx="150" cy="150" r="6" fill="#4285FF" />
                                        <circle cx="250" cy="100" r="6" fill="#7B61FF" />
                                        <circle cx="250" cy="200" r="6" fill="#7B61FF" />

                                        {/* Labels */}
                                        <text x="40" y="135" fill="white" fontSize="10" textAnchor="middle">Start</text>
                                        <text x="150" y="135" fill="white" fontSize="10" textAnchor="middle">Research</text>
                                        <text x="260" y="90" fill="white" fontSize="10" textAnchor="start">Summarize</text>
                                        <text x="260" y="220" fill="white" fontSize="10" textAnchor="start">Extract Data</text>
                                    </svg>

                                    {/* Floating Cards */}
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 1.5 }}
                                        className="absolute top-10 right-10 p-3 glass-card rounded-lg border border-ai-primary/30 flex items-center gap-2"
                                    >
                                        <GitBranch className="w-4 h-4 text-ai-primary" />
                                        <span className="text-xs font-mono text-gray-300">Branch Created</span>
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
