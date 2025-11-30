import { motion } from "framer-motion";
import { Check, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
    {
        name: "Free",
        price: "$0",
        period: "forever",
        description: "Perfect for getting started",
        features: [
            "10 conversations per day",
            "Basic web search",
            "1 document upload",
            "Community support",
        ],
        cta: "Get Started",
        popular: false,
    },
    {
        name: "Pro",
        price: "$19",
        period: "per month",
        description: "For serious researchers",
        features: [
            "Unlimited conversations",
            "Advanced web search with citations",
            "Unlimited document uploads",
            "Voice interaction",
            "Priority support",
            "Advanced AI models",
        ],
        cta: "Start Free Trial",
        popular: true,
    },
    {
        name: "Team",
        price: "$49",
        period: "per user/month",
        description: "For research teams",
        features: [
            "Everything in Pro",
            "Shared workspaces",
            "Team collaboration",
            "Admin dashboard",
            "SSO & advanced security",
            "Dedicated support",
        ],
        cta: "Contact Sales",
        popular: false,
    },
];

export const Pricing = () => {
    return (
        <section className="py-32 px-4 relative overflow-hidden bg-secondary/5">
            <div className="container mx-auto max-w-7xl relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-20"
                >
                    <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
                        Simple, <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Transparent Pricing</span>
                    </h2>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        Choose the plan that fits your research needs. Upgrade or downgrade anytime.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: index * 0.1 }}
                            className="relative"
                        >
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary to-accent text-white text-sm font-medium shadow-glow">
                                        <Zap className="w-4 h-4" />
                                        Most Popular
                                    </div>
                                </div>
                            )}

                            <div className={`glass-panel p-8 rounded-3xl h-full flex flex-col transition-all duration-500 ${plan.popular ? 'border-primary/50 shadow-glow scale-105' : 'hover:shadow-glow'
                                }`}>
                                <div className="mb-8">
                                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                                    <p className="text-muted-foreground mb-6">{plan.description}</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                                            {plan.price}
                                        </span>
                                        <span className="text-muted-foreground">/{plan.period}</span>
                                    </div>
                                </div>

                                <ul className="space-y-4 mb-8 flex-grow">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-start gap-3">
                                            <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                            <span className="text-foreground/90">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <Button
                                    size="lg"
                                    className={`w-full rounded-full text-lg font-medium transition-all duration-300 ${plan.popular
                                            ? 'bg-primary text-primary-foreground shadow-glow hover:shadow-lg hover:scale-105'
                                            : 'bg-secondary/50 hover:bg-secondary/80'
                                        }`}
                                >
                                    {plan.cta}
                                </Button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
