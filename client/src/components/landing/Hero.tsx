import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const Hero = () => {
    return (
        <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-ai-background pt-20 pb-32">
            {/* Background Gradients */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-ai-primary/20 rounded-full blur-[120px] -z-10 opacity-50 animate-pulse-glow" />
            <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-ai-secondary/10 rounded-full blur-[100px] -z-10" />

            <div className="container mx-auto px-4 z-10 flex flex-col items-center text-center">

                {/* Badge */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-8"
                >
                    <Sparkles className="w-4 h-4 text-ai-primary" />
                    <span className="text-sm font-medium text-gray-300">The Future of Agentic AI is Here</span>
                </motion.div>

                {/* Headline */}
                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6 max-w-5xl"
                >
                    Scale your content <br className="hidden md:block" />
                    output with <span className="text-gradient glow-text">Agentic AI</span>
                </motion.h1>

                {/* Subheadline */}
                <motion.p
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-lg md:text-xl text-gray-400 max-w-2xl mb-10 leading-relaxed"
                >
                    Your central hub for repurposing. An intelligent agent that searches, executes, and branches conversations to deliver actual results, not just chat.
                </motion.p>

                {/* CTA Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
                >
                    <Button
                        size="lg"
                        className="bg-gradient-ai hover:opacity-90 text-white border-0 h-14 px-8 rounded-full text-lg font-semibold shadow-glow transition-all hover:scale-105 w-full sm:w-auto"
                    >
                        Start Free Trial <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                    <Button
                        variant="outline"
                        size="lg"
                        className="h-14 px-8 rounded-full text-lg font-medium border-ai-border text-gray-300 hover:bg-white/5 hover:text-white transition-all w-full sm:w-auto"
                    >
                        <Play className="mr-2 w-5 h-5" /> Watch Demo
                    </Button>
                </motion.div>

                {/* Mockup Container */}
                <motion.div
                    initial={{ opacity: 0, y: 60, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="mt-20 w-full max-w-6xl relative"
                >
                    {/* Glow behind mockup */}
                    <div className="absolute inset-0 bg-gradient-to-t from-ai-primary/20 to-transparent blur-3xl -z-10" />

                    {/* Mockup Frame */}
                    <div className="glass-card rounded-xl border border-ai-border/50 overflow-hidden shadow-2xl">
                        <div className="h-12 border-b border-ai-border/30 bg-black/20 flex items-center px-4 gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                            <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
                            <div className="ml-4 px-3 py-1 rounded-md bg-white/5 text-xs text-gray-500 font-mono">perception-agent.exe</div>
                        </div>

                        {/* Mockup Content - Abstract Representation of Agent Work */}
                        <div className="p-8 bg-black/40 min-h-[400px] md:min-h-[600px] relative font-mono text-sm">
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-gradient-ai flex items-center justify-center text-xs font-bold text-white">AI</div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-white/10 rounded w-3/4 animate-pulse" />
                                        <div className="h-4 bg-white/10 rounded w-1/2 animate-pulse delay-75" />
                                    </div>
                                </div>

                                {/* Agent Actions Visualization */}
                                <div className="ml-12 mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 1.2 }}
                                        className="p-4 rounded-lg border border-ai-primary/30 bg-ai-primary/5"
                                    >
                                        <div className="flex items-center gap-2 text-ai-primary mb-2">
                                            <Sparkles className="w-4 h-4" />
                                            <span className="font-semibold">Researching</span>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="h-2 bg-ai-primary/20 rounded w-full" />
                                            <div className="h-2 bg-ai-primary/20 rounded w-5/6" />
                                        </div>
                                    </motion.div>

                                    <motion.div
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 1.5 }}
                                        className="p-4 rounded-lg border border-ai-secondary/30 bg-ai-secondary/5"
                                    >
                                        <div className="flex items-center gap-2 text-ai-secondary mb-2">
                                            <Play className="w-4 h-4" />
                                            <span className="font-semibold">Executing Code</span>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="h-2 bg-ai-secondary/20 rounded w-full" />
                                            <div className="h-2 bg-ai-secondary/20 rounded w-4/6" />
                                        </div>
                                    </motion.div>
                                </div>
                            </div>

                            {/* Floating Elements */}
                            <motion.div
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute top-1/4 right-10 p-4 glass-card rounded-lg border-l-4 border-l-green-500 max-w-xs hidden md:block"
                            >
                                <div className="text-xs text-gray-400 mb-1">Status</div>
                                <div className="text-green-400 font-semibold">Task Completed</div>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};
