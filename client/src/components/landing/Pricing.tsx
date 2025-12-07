import React from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const plans = [
    {
        name: "Starter",
        price: "Free",
        description: "Perfect for exploring agentic AI capabilities.",
        features: ["50 queries/month", "Basic web search", "1 active agent", "Community support"],
        gradient: "from-gray-800 to-gray-900",
        buttonVariant: "outline" as const
    },
    {
        name: "Pro",
        price: "$29",
        period: "/month",
        description: "For power users who need serious execution.",
        features: ["Unlimited queries", "Deep research mode", "5 active agents", "Priority support", "MCP Connectors"],
        gradient: "from-ai-primary/20 to-ai-secondary/20",
        border: "border-ai-primary/50",
        buttonVariant: "default" as const,
        popular: true
    },
    {
        name: "Team",
        price: "$99",
        period: "/month",
        description: "Collaborative workspace for your entire team.",
        features: ["Everything in Pro", "Shared workspaces", "Unlimited agents", "SSO & Admin controls", "Custom integrations"],
        gradient: "from-gray-800 to-gray-900",
        buttonVariant: "outline" as const
    }
];

export const Pricing = () => {
    return (
        <section className="py-24 bg-black relative">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">
                        Simple, Transparent <span className="text-gradient">Pricing</span>
                    </h2>
                    <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                        Start for free, scale as you grow.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className={`relative p-8 rounded-2xl border ${plan.border || 'border-ai-border'} bg-gradient-to-b ${plan.gradient} flex flex-col`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-ai rounded-full text-xs font-bold text-white shadow-glow">
                                    MOST POPULAR
                                </div>
                            )}

                            <div className="mb-8">
                                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                                <div className="flex items-baseline gap-1 mb-4">
                                    <span className="text-4xl font-bold">{plan.price}</span>
                                    {plan.period && <span className="text-gray-400 text-sm">{plan.period}</span>}
                                </div>
                                <p className="text-gray-400 text-sm">{plan.description}</p>
                            </div>

                            <div className="flex-1 mb-8">
                                <ul className="space-y-4">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
                                            <Check className="w-4 h-4 text-ai-primary" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <Button
                                variant={plan.buttonVariant}
                                className={`w-full ${plan.buttonVariant === 'default' ? 'bg-gradient-ai hover:opacity-90 border-0 shadow-glow' : 'border-ai-border hover:bg-white/5'}`}
                            >
                                Get Started <ArrowRight className="ml-2 w-4 h-4" />
                            </Button>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
