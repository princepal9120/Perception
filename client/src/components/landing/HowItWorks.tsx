import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Brain, Zap, ArrowRight } from 'lucide-react';

const steps = [
    {
        id: 1,
        icon: CheckCircle,
        title: "Select Task",
        description: "Define your objective or simply ask a question. The agent understands intent and context.",
        color: "text-blue-400"
    },
    {
        id: 2,
        icon: Brain,
        title: "Agent Plans",
        description: "Perception breaks down complex goals into actionable steps, researching and reasoning along the way.",
        color: "text-purple-400"
    },
    {
        id: 3,
        icon: Zap,
        title: "Agent Executes",
        description: "The agent uses tools, writes code, and connects to APIs to deliver the final result.",
        color: "text-yellow-400"
    }
];

export const HowItWorks = () => {
    return (
        <section className="py-24 bg-black/50 relative overflow-hidden">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">
                        How <span className="text-gradient">Perception</span> Works
                    </h2>
                    <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                        From intent to execution in three simple steps.
                    </p>
                </div>

                <div className="relative max-w-5xl mx-auto">
                    {/* Connecting Line (Desktop) - Animated Progress Bar */}
                    <div className="hidden md:block absolute top-10 left-0 w-full h-1 bg-gray-800 -translate-y-1/2 z-0 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: "0%" }}
                            whileInView={{ width: "100%" }}
                            viewport={{ once: true }}
                            transition={{ duration: 1.5, ease: "easeInOut", delay: 0.2 }}
                            className="h-full bg-gradient-to-r from-ai-primary via-purple-500 to-ai-secondary"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
                        {steps.map((step, index) => (
                            <motion.div
                                key={step.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.2 }}
                                className="flex flex-col items-center text-center group"
                            >
                                <div className="relative mb-6">
                                    <div className="w-20 h-20 rounded-full glass-card flex items-center justify-center border border-ai-border group-hover:border-ai-primary/50 transition-colors shadow-glow">
                                        <step.icon className={`w-8 h-8 ${step.color}`} />
                                    </div>
                                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-ai-primary flex items-center justify-center text-white font-bold text-sm border-2 border-black">
                                        {step.id}
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold mb-3 text-white">{step.title}</h3>
                                <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
                                    {step.description}
                                </p>

                                {/* Mobile Arrow */}
                                {index < steps.length - 1 && (
                                    <div className="md:hidden mt-8 text-ai-border">
                                        <ArrowRight className="w-6 h-6 rotate-90" />
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};
