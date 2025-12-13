import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const plans = [
    {
        name: 'Starter',
        description: 'Perfect for exploring agentic AI capabilities.',
        monthly: 'Free',
        yearly: 'Free',
        features: ['50 queries/month', 'Basic web search', '1 active agent', 'Community support'],
        gradient: 'from-gray-800 to-gray-900',
        buttonVariant: 'outline' as const,
    },
    {
        name: 'Pro',
        description: 'For power users who need serious execution.',
        monthly: '$12',
        yearly: '$120', // 2 months free
        periodMonthly: '/month',
        periodYearly: '/year',
        features: ['Unlimited queries', 'Deep research mode', '5 active agents', 'Priority support', 'MCP Connectors'],
        gradient: 'from-ai-primary/20 to-ai-secondary/20',
        border: 'border-ai-primary/50',
        buttonVariant: 'default' as const,
        popular: true,
    },
    {
        name: 'Team',
        description: 'Collaborative workspace for your entire team.',
        monthly: '$39',
        yearly: '$390',
        periodMonthly: '/month',
        periodYearly: '/year',
        features: ['Everything in Pro', 'Shared workspaces', 'Unlimited agents', 'SSO & Admin controls', 'Custom integrations'],
        gradient: 'from-gray-800 to-gray-900',
        buttonVariant: 'outline' as const,
    },
];

export const Pricing = () => {
    const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');

    return (
        <section className="py-24 bg-black relative">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">
                        Simple, Transparent <span className="text-gradient">Pricing</span>
                    </h2>
                    <p className="text-gray-400 max-w-2xl mx-auto text-lg mb-8">
                        Start for free, scale as you grow.
                    </p>

                    {/* Billing Toggle */}
                    <div className="inline-flex items-center gap-2 p-1 rounded-full border border-ai-border bg-white/5">
                        <button
                            onClick={() => setBilling('monthly')}
                            className={`px-4 py-2 rounded-full text-sm transition-all ${billing === 'monthly' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setBilling('yearly')}
                            className={`px-4 py-2 rounded-full text-sm transition-all ${billing === 'yearly' ? 'bg-gradient-ai text-white shadow-glow' : 'text-gray-400 hover:text-white'}`}
                        >
                            Yearly
                            <span className="ml-2 text-xs text-ai-primary">Save 20%</span>
                        </button>
                    </div>
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
                                    <span className="text-4xl font-bold">
                                        {billing === 'monthly' ? plan.monthly : plan.yearly}
                                    </span>
                                    {(plan.periodMonthly || plan.periodYearly) && (
                                        <span className="text-gray-400 text-sm">
                                            {billing === 'monthly' ? plan.periodMonthly : plan.periodYearly}
                                        </span>
                                    )}
                                </div>
                                {billing === 'yearly' && plan.monthly !== 'Free' && (
                                    <p className="text-xs text-ai-primary mb-2">2 months free with yearly billing</p>
                                )}
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
