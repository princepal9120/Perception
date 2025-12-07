import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const CTA = () => {
    return (
        <section className="py-32 relative overflow-hidden flex items-center justify-center">
            {/* Background Gradients */}
            <div className="absolute inset-0 bg-ai-background z-0" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-ai-primary/20 rounded-full blur-[120px] animate-pulse-glow z-0" />

            <div className="container mx-auto px-4 relative z-10 text-center">
                <motion.h2
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 tracking-tight"
                >
                    The Agent That <br />
                    <span className="text-gradient">Actually Executes.</span>
                </motion.h2>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto"
                >
                    Stop chatting and start building. Join thousands of developers using Perception to automate their workflows.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                >
                    <Button
                        size="lg"
                        className="bg-white text-black hover:bg-gray-200 h-14 px-10 rounded-full text-lg font-bold shadow-glow transition-all hover:scale-105"
                    >
                        Get Started Now <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                </motion.div>
            </div>
        </section>
    );
};
