import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles, Play, Search, Globe, CheckCircle2, Bot, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Simulated chat messages for the demo
const chatSequence = [
    {
        type: 'user',
        content: 'Research the latest trends in AI-powered content creation for 2024',
        delay: 0,
    },
    {
        type: 'thinking',
        content: 'Analyzing your request...',
        delay: 1500,
    },
    {
        type: 'agent-action',
        action: 'Searching',
        icon: Search,
        content: 'Searching across 50+ sources...',
        delay: 2500,
    },
    {
        type: 'agent-action',
        action: 'Reading',
        icon: Globe,
        content: 'Analyzing industry reports and articles',
        delay: 4000,
    },
    {
        type: 'assistant',
        content: "Based on my research, here are the key AI content trends for 2024:\n\n**1. Agentic AI Systems** - AI that can autonomously execute multi-step tasks\n\n**2. Multimodal Generation** - Combined text, image, and video creation\n\n**3. Personalization at Scale** - Hyper-targeted content using AI insights",
        delay: 5500,
    },
    {
        type: 'complete',
        content: 'Research completed • 47 sources analyzed',
        delay: 8000,
    },
];

// Typing effect component
const TypingText = ({ text, speed = 20 }: { text: string; speed?: number }) => {
    const [displayedText, setDisplayedText] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (currentIndex < text.length) {
            const timer = setTimeout(() => {
                setDisplayedText(prev => prev + text[currentIndex]);
                setCurrentIndex(prev => prev + 1);
            }, speed);
            return () => clearTimeout(timer);
        }
    }, [currentIndex, text, speed]);

    return <span>{displayedText}<span className="animate-pulse">|</span></span>;
};

export const Hero = () => {
    const [visibleMessages, setVisibleMessages] = useState<number[]>([]);
    const [cycleKey, setCycleKey] = useState(0);

    useEffect(() => {
        // Reset and start the animation sequence
        setVisibleMessages([]);

        chatSequence.forEach((msg, index) => {
            setTimeout(() => {
                setVisibleMessages(prev => [...prev, index]);
            }, msg.delay);
        });

        // Restart the animation after it completes
        const totalDuration = chatSequence[chatSequence.length - 1].delay + 4000;
        const resetTimer = setTimeout(() => {
            setCycleKey(prev => prev + 1);
        }, totalDuration);

        return () => clearTimeout(resetTimer);
    }, [cycleKey]);

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
                    className="mt-20 w-full max-w-5xl relative"
                >
                    {/* Glow behind mockup */}
                    <div className="absolute inset-0 bg-gradient-to-t from-ai-primary/20 to-transparent blur-3xl -z-10" />

                    {/* Mockup Frame */}
                    <div className="glass-card rounded-2xl border border-ai-border/50 overflow-hidden shadow-2xl">
                        {/* Window Header */}
                        <div className="h-12 border-b border-ai-border/30 bg-zinc-900/80 flex items-center px-4 gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500" />
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                            <div className="flex-1 flex justify-center">
                                <div className="px-4 py-1 rounded-lg bg-zinc-800 text-xs text-gray-400 font-medium flex items-center gap-2">
                                    <Bot className="w-3 h-3" />
                                    Perception AI Agent
                                </div>
                            </div>
                        </div>

                        {/* Chat Interface */}
                        <div className="bg-zinc-950 min-h-[400px] md:min-h-[500px] relative overflow-hidden">
                            {/* Chat Messages */}
                            <div className="p-6 space-y-4 max-h-[450px] overflow-y-auto" key={cycleKey}>
                                <AnimatePresence mode="sync">
                                    {chatSequence.map((message, index) => (
                                        visibleMessages.includes(index) && (
                                            <motion.div
                                                key={`${cycleKey}-${index}`}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.4 }}
                                            >
                                                {message.type === 'user' && (
                                                    <div className="flex gap-3 justify-end">
                                                        <div className="max-w-md">
                                                            <div className="bg-violet-600 text-white px-4 py-3 rounded-2xl rounded-br-md text-sm">
                                                                {message.content}
                                                            </div>
                                                            <div className="text-xs text-gray-500 mt-1 text-right">Just now</div>
                                                        </div>
                                                        <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center flex-shrink-0">
                                                            <User className="w-4 h-4 text-gray-300" />
                                                        </div>
                                                    </div>
                                                )}

                                                {message.type === 'thinking' && (
                                                    <div className="flex gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                                                            <Bot className="w-4 h-4 text-white" />
                                                        </div>
                                                        <div className="flex items-center gap-2 text-gray-400 text-sm">
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                            {message.content}
                                                        </div>
                                                    </div>
                                                )}

                                                {message.type === 'agent-action' && (
                                                    <div className="flex gap-3 ml-11">
                                                        <motion.div
                                                            className="flex items-center gap-3 px-4 py-2 bg-zinc-800/50 rounded-lg border border-zinc-700/50"
                                                            initial={{ scale: 0.95 }}
                                                            animate={{ scale: 1 }}
                                                        >
                                                            <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center">
                                                                {message.icon && <message.icon className="w-3 h-3 text-violet-400" />}
                                                            </div>
                                                            <div>
                                                                <div className="text-xs text-violet-400 font-medium">{message.action}</div>
                                                                <div className="text-xs text-gray-400">{message.content}</div>
                                                            </div>
                                                            <div className="flex gap-0.5">
                                                                <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-pulse" />
                                                                <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-pulse delay-75" />
                                                                <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-pulse delay-150" />
                                                            </div>
                                                        </motion.div>
                                                    </div>
                                                )}

                                                {message.type === 'assistant' && (
                                                    <div className="flex gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                                                            <Bot className="w-4 h-4 text-white" />
                                                        </div>
                                                        <div className="max-w-lg">
                                                            <div className="bg-zinc-800 text-gray-100 px-4 py-3 rounded-2xl rounded-bl-md text-sm whitespace-pre-line">
                                                                {message.content}
                                                            </div>
                                                            <div className="text-xs text-gray-500 mt-1">Perception AI</div>
                                                        </div>
                                                    </div>
                                                )}

                                                {message.type === 'complete' && (
                                                    <motion.div
                                                        className="flex items-center justify-center gap-2 py-2"
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                    >
                                                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                                                        <span className="text-xs text-green-400 font-medium">{message.content}</span>
                                                    </motion.div>
                                                )}
                                            </motion.div>
                                        )
                                    ))}
                                </AnimatePresence>
                            </div>

                            {/* Chat Input */}
                            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-zinc-950 via-zinc-950/95 to-transparent">
                                <div className="flex items-center gap-3 bg-zinc-800/80 rounded-xl px-4 py-3 border border-zinc-700/50">
                                    <input
                                        type="text"
                                        placeholder="Ask Perception anything..."
                                        className="flex-1 bg-transparent text-sm text-gray-300 placeholder-gray-500 outline-none"
                                        disabled
                                    />
                                    <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white rounded-lg px-4">
                                        <ArrowRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};
