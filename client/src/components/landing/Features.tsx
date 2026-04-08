import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Search, GitBranch, Mic, FileText, Zap, Bot } from 'lucide-react';

// --- Helper Components ---

const Reveal = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => {
    return (
        <motion.div
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
            viewport={{ once: true, margin: "-10%" }}
        >
            {children}
        </motion.div>
    );
};

const ParallaxCard = ({
    children,
    offset = 50,
    rotate = 0,
    className = ""
}: {
    children: React.ReactNode;
    offset?: number;
    rotate?: number;
    className?: string;
}) => {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"]
    });

    const y = useTransform(scrollYProgress, [0, 1], [offset, -offset]);
    const rotation = useTransform(scrollYProgress, [0, 1], [rotate - 5, rotate + 5]);

    return (
        <motion.div ref={ref} style={{ y, rotate: rotation }} className={className}>
            {children}
        </motion.div>
    );
};

// --- Feature Data ---

const features = [
    {
        title: "BYO Model Runtime",
        description: "Point Perception at your own OpenAI-compatible endpoint or swap providers without rewriting the app.",
        icon: Mic,
        accentColor: "violet",
    },
    {
        title: "Multi-Document RAG",
        description: "Upload PDFs, docs, and txt files. Chat with your entire knowledge base simultaneously.",
        icon: FileText,
        accentColor: "indigo",
    },
    {
        title: "Agentic Search",
        description: "Run Tavily or DuckDuckGo-backed search flows with citations and transparent progress updates.",
        icon: Zap,
        accentColor: "yellow",
    },
    {
        title: "Agentic Reasoning",
        description: "Powered by LangGraph. Agents that plan, execute, and adapt to solve complex tasks.",
        icon: Bot,
        accentColor: "cyan",
    },
];

// --- Main Component ---

export const Features = () => {
    return (
        <section id="features" className="py-40 relative overflow-hidden bg-[#050505]">
            <div className="container mx-auto px-6 relative z-10">
                {/* Section Title */}
                <Reveal>
                    <h2 className="text-5xl md:text-7xl text-center mb-8 font-serif">
                        Open-Source <br />
                        <span className="italic text-gradient">Research Infrastructure</span>
                    </h2>
                </Reveal>

                <Reveal delay={0.1}>
                    <p className="text-center text-gray-500 text-lg max-w-2xl mx-auto mb-24">
                        Built for self-hosted research workflows. Perception combines deep research, document search, branching conversations, and tool-using agents in one OSS workspace.
                    </p>
                </Reveal>

                {/* Feature Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-32">
                    {/* Card 1 - Primary Accent */}
                    <ParallaxCard rotate={-3} offset={40} className="relative z-10">
                        <div className="bg-gradient-ai rounded-3xl p-8 md:p-12 aspect-[4/5] flex flex-col justify-between shadow-2xl glow-accent transition-shadow duration-500 group cursor-pointer">
                            <div className="flex justify-between items-start">
                                <div className="w-12 h-12 rounded-full bg-black/10 flex items-center justify-center group-hover:rotate-45 transition-transform duration-500">
                                    <GitBranch className="text-white w-6 h-6" />
                                </div>
                                <span className="text-white/80 font-medium text-sm border border-white/20 px-3 py-1 rounded-full">01</span>
                            </div>

                            <div>
                                <h3 className="text-4xl md:text-5xl text-white mb-4 leading-none tracking-tight font-serif">
                                    Branch-Your-LLM <br />Workflows
                                </h3>
                                <p className="text-white/70 text-lg leading-snug">
                                    Fork any conversation instantly. Explore alternative research directions without losing your original context or evidence trail.
                                </p>
                            </div>

                            <div className="w-full h-px bg-white/10 mt-8" />
                        </div>
                    </ParallaxCard>

                    {/* Card 2 - Dark */}
                    <ParallaxCard rotate={3} offset={-40} className="relative z-0 mt-20 md:mt-0">
                        <div className="bg-[#111] border border-white/10 rounded-3xl p-8 md:p-12 aspect-[4/5] flex flex-col justify-between shadow-2xl group cursor-pointer hover:border-ai-primary/50 transition-colors duration-500">
                            <div className="flex justify-between items-start">
                                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                                    <Search className="text-white w-6 h-6 -rotate-45" />
                                </div>
                                <span className="text-white/50 font-medium text-sm border border-white/10 px-3 py-1 rounded-full">02</span>
                            </div>

                            <div>
                                <h3 className="text-4xl md:text-5xl text-white mb-4 leading-none tracking-tight font-serif">
                                    Deep Research <br />Mode
                                </h3>
                                <p className="text-gray-400 text-lg leading-snug">
                                    Iterative, evidence-backed research with citations, progress tracking, and configurable model plus search providers.
                                </p>
                            </div>

                            <div className="w-full h-px bg-white/10 mt-8" />
                        </div>
                    </ParallaxCard>
                </div>

                {/* Feature List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                    {features.map((feature, index) => (
                        <Reveal key={feature.title} delay={index * 0.1}>
                            <div className="glass-card rounded-2xl p-6 hover:border-ai-primary/30 transition-all duration-300 group cursor-pointer h-full">
                                <div className="w-10 h-10 rounded-xl bg-ai-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                    <feature.icon className="w-5 h-5 text-ai-primary" />
                                </div>
                                <h4 className="text-lg font-semibold text-white mb-2">{feature.title}</h4>
                                <p className="text-sm text-gray-400 leading-relaxed">{feature.description}</p>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </div>

            {/* Background Elements */}
            <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] opacity-[0.03] pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle, #333 1px, transparent 1px)', backgroundSize: '40px 40px' }}
            />
        </section>
    );
};
