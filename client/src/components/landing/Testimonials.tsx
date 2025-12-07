import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const testimonials = [
    {
        quote: "Perception has completely transformed how I handle research. It's like having a team of analysts working 24/7.",
        author: "Sarah Chen",
        role: "Product Lead at TechFlow",
        avatar: "SC"
    },
    {
        quote: "The branching conversation feature is a game changer. I can explore multiple hypothesis without losing my original train of thought.",
        author: "Marcus Rodriguez",
        role: "Senior Dev at CodeScale",
        avatar: "MR"
    },
    {
        quote: "Finally, an AI agent that actually executes. The MCP integration allows me to connect my database and get real work done.",
        author: "Elena Kim",
        role: "Founder at DataMind",
        avatar: "EK"
    }
];

export const Testimonials = () => {
    return (
        <section className="py-24 bg-ai-background relative overflow-hidden">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">
                        Loved by <span className="text-gradient">Builders</span>
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {testimonials.map((t, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="glass-card p-8 rounded-2xl border border-ai-border/50 relative"
                        >
                            <div className="flex gap-1 mb-6">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                ))}
                            </div>

                            <p className="text-gray-300 mb-8 leading-relaxed">"{t.quote}"</p>

                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-ai-primary to-ai-secondary flex items-center justify-center text-white font-bold text-sm">
                                    {t.avatar}
                                </div>
                                <div>
                                    <div className="font-semibold text-white">{t.author}</div>
                                    <div className="text-xs text-gray-400">{t.role}</div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
