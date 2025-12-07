import React from 'react';
import { motion } from 'framer-motion';
import { Mic, FileText, Upload, Headphones } from 'lucide-react';

export const VoiceDocs = () => {
    return (
        <section className="py-24 bg-ai-background relative">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* Voice Intelligence Tile */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="glass-card p-8 rounded-3xl border border-ai-border relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 p-32 bg-ai-primary/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 group-hover:bg-ai-primary/20 transition-colors" />

                        <div className="relative z-10">
                            <div className="w-14 h-14 rounded-2xl bg-ai-primary/10 flex items-center justify-center mb-6 border border-ai-primary/20">
                                <Mic className="w-7 h-7 text-ai-primary" />
                            </div>

                            <h3 className="text-2xl font-bold mb-4">Voice Intelligence</h3>
                            <p className="text-gray-400 mb-8 leading-relaxed">
                                Speak naturally to your agent. Advanced STT and TTS models allow for fluid, hands-free conversations.
                            </p>

                            {/* Audio Wave Visualization */}
                            <div className="flex items-center justify-center gap-1 h-16 bg-black/30 rounded-xl border border-ai-border/50">
                                {[...Array(12)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        animate={{ height: ["20%", "80%", "20%"] }}
                                        transition={{
                                            duration: 1,
                                            repeat: Infinity,
                                            delay: i * 0.1,
                                            ease: "easeInOut"
                                        }}
                                        className="w-1.5 bg-ai-primary rounded-full"
                                    />
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    {/* Document Intelligence Tile */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="glass-card p-8 rounded-3xl border border-ai-border relative overflow-hidden group"
                    >
                        <div className="absolute bottom-0 left-0 p-32 bg-ai-secondary/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2 group-hover:bg-ai-secondary/20 transition-colors" />

                        <div className="relative z-10">
                            <div className="w-14 h-14 rounded-2xl bg-ai-secondary/10 flex items-center justify-center mb-6 border border-ai-secondary/20">
                                <FileText className="w-7 h-7 text-ai-secondary" />
                            </div>

                            <h3 className="text-2xl font-bold mb-4">Multi-Document RAG</h3>
                            <p className="text-gray-400 mb-8 leading-relaxed">
                                Upload PDFs, reports, and codebases. Chat with your entire knowledge base simultaneously.
                            </p>

                            {/* Document Stack Visualization */}
                            <div className="relative h-32 flex items-center justify-center">
                                <motion.div
                                    whileHover={{ y: -5, rotate: -5 }}
                                    className="absolute w-24 h-32 bg-gray-800 rounded-lg border border-gray-700 shadow-lg transform -rotate-6 -translate-x-4"
                                />
                                <motion.div
                                    whileHover={{ y: -5, rotate: 5 }}
                                    className="absolute w-24 h-32 bg-gray-800 rounded-lg border border-gray-700 shadow-lg transform rotate-6 translate-x-4"
                                />
                                <motion.div
                                    whileHover={{ y: -10 }}
                                    className="absolute w-24 h-32 bg-gray-900 rounded-lg border border-ai-secondary/50 shadow-xl flex items-center justify-center"
                                >
                                    <Upload className="w-8 h-8 text-ai-secondary opacity-50" />
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>

                </div>
            </div>
        </section>
    );
};
