import React from 'react';
import { motion } from 'framer-motion';
import {
    Search,
    Database,
    GitBranch,
    Shield,
    Mic,
    Network,
    FileText,
    MessageSquare,
    Globe,
    Lock,
    Cpu,
    Share2
} from 'lucide-react';
import { BentoGrid, BentoGridItem } from '@/components/ui/bento-grid';

// --- Custom Graphic Components ---

const DeepResearchGraphic = () => (
    <div className="w-full h-full bg-gradient-to-br from-blue-900/20 to-slate-900/20 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <motion.div
            initial={{ width: "40%" }}
            whileInView={{ width: "80%" }}
            transition={{ duration: 1, ease: "easeInOut" }}
            className="h-8 bg-white/10 rounded-full border border-white/10 flex items-center px-3 mb-4 relative z-10 backdrop-blur-sm"
        >
            <Search className="w-3 h-3 text-blue-400 mr-2" />
            <div className="h-1.5 w-20 bg-white/20 rounded-full" />
        </motion.div>

        <div className="w-full max-w-[80%] space-y-2 relative z-10">
            {[1, 2, 3].map((i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + (i * 0.2) }}
                    className="h-12 bg-black/40 border border-white/5 rounded-lg p-2 flex items-center gap-3"
                >
                    <div className="w-8 h-8 rounded bg-blue-500/20 flex items-center justify-center">
                        <Globe className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="space-y-1 flex-1">
                        <div className="h-1.5 w-3/4 bg-white/10 rounded-full" />
                        <div className="h-1.5 w-1/2 bg-white/5 rounded-full" />
                    </div>
                </motion.div>
            ))}
        </div>
    </div>
);

const ConnectivityGraphic = () => (
    <div className="w-full h-full bg-gradient-to-br from-purple-900/20 to-indigo-900/20 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="w-[140%] h-[140%] border border-dashed border-purple-500/20 rounded-full absolute"
            />
            <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="w-[100%] h-[100%] border border-dashed border-indigo-500/20 rounded-full absolute"
            />
        </div>

        <div className="relative z-10">
            <div className="w-16 h-16 bg-purple-500/10 rounded-2xl border border-purple-500/30 flex items-center justify-center backdrop-blur-md shadow-[0_0_30px_rgba(168,85,247,0.2)]">
                <Database className="w-8 h-8 text-purple-400" />
            </div>

            {/* Orbiting Icons */}
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 w-full h-full"
            >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-8 h-8 bg-black/60 border border-white/10 rounded-full flex items-center justify-center">
                    <Share2 className="w-4 h-4 text-white" />
                </div>
            </motion.div>
        </div>
    </div>
);

const BranchingGraphic = () => (
    <div className="w-full h-full bg-gradient-to-br from-green-900/20 to-emerald-900/20 flex items-center justify-center relative overflow-hidden">
        <svg className="w-full h-full absolute inset-0" viewBox="0 0 200 200">
            <motion.path
                d="M 20 100 L 80 100 C 100 100 100 60 120 60 L 180 60"
                fill="none"
                stroke="rgba(34, 197, 94, 0.3)"
                strokeWidth="2"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                transition={{ duration: 1.5 }}
            />
            <motion.path
                d="M 80 100 C 100 100 100 140 120 140 L 180 140"
                fill="none"
                stroke="rgba(34, 197, 94, 0.3)"
                strokeWidth="2"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                transition={{ duration: 1.5, delay: 0.5 }}
            />

            {/* Moving dots */}
            <motion.circle r="3" fill="#4ade80">
                <animateMotion
                    dur="3s"
                    repeatCount="indefinite"
                    path="M 20 100 L 80 100 C 100 100 100 60 120 60 L 180 60"
                />
            </motion.circle>
            <motion.circle r="3" fill="#4ade80">
                <animateMotion
                    dur="3s"
                    repeatCount="indefinite"
                    begin="1.5s"
                    path="M 80 100 C 100 100 100 140 120 140 L 180 140"
                />
            </motion.circle>
        </svg>

        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-green-500/10 rounded-lg border border-green-500/30 flex items-center justify-center z-10">
            <MessageSquare className="w-5 h-5 text-green-400" />
        </div>
        <div className="absolute right-4 top-[30%] -translate-y-1/2 w-8 h-8 bg-green-500/10 rounded-lg border border-green-500/30 flex items-center justify-center z-10">
            <div className="w-2 h-2 bg-green-400 rounded-full" />
        </div>
        <div className="absolute right-4 top-[70%] -translate-y-1/2 w-8 h-8 bg-green-500/10 rounded-lg border border-green-500/30 flex items-center justify-center z-10">
            <div className="w-2 h-2 bg-green-400 rounded-full" />
        </div>
    </div>
);

const SecureGraphic = () => (
    <div className="w-full h-full bg-gradient-to-br from-red-900/20 to-orange-900/20 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px]" />

        <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="relative z-10"
        >
            <div className="w-20 h-24 bg-gradient-to-b from-red-500/20 to-red-900/20 border border-red-500/30 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Lock className="w-8 h-8 text-red-400" />
            </div>

            {/* Scanning effect */}
            <motion.div
                animate={{ top: ["0%", "100%", "0%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute left-0 right-0 h-1 bg-red-400/50 blur-[2px] w-full"
            />
        </motion.div>
    </div>
);

const VoiceGraphic = () => (
    <div className="w-full h-full bg-gradient-to-br from-yellow-900/20 to-amber-900/20 flex items-center justify-center gap-1 relative overflow-hidden">
        {[...Array(8)].map((_, i) => (
            <motion.div
                key={i}
                animate={{ height: ["20%", "80%", "20%"] }}
                transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: i * 0.1,
                    ease: "easeInOut"
                }}
                className="w-2 bg-yellow-400/60 rounded-full"
                style={{ height: "40%" }}
            />
        ))}
    </div>
);

const MCPGraphic = () => (
    <div className="w-full h-full bg-gradient-to-br from-cyan-900/20 to-blue-900/20 flex items-center justify-center relative overflow-hidden">
        <div className="grid grid-cols-2 gap-4 relative z-10">
            <motion.div
                whileHover={{ scale: 1.1 }}
                className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/30 rounded-lg flex items-center justify-center"
            >
                <Database className="w-5 h-5 text-cyan-400" />
            </motion.div>
            <motion.div
                whileHover={{ scale: 1.1 }}
                className="w-12 h-12 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-center justify-center"
            >
                <Cpu className="w-5 h-5 text-blue-400" />
            </motion.div>
            <motion.div
                whileHover={{ scale: 1.1 }}
                className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/30 rounded-lg flex items-center justify-center"
            >
                <Globe className="w-5 h-5 text-indigo-400" />
            </motion.div>
            <motion.div
                whileHover={{ scale: 1.1 }}
                className="w-12 h-12 bg-teal-500/10 border border-teal-500/30 rounded-lg flex items-center justify-center"
            >
                <Share2 className="w-5 h-5 text-teal-400" />
            </motion.div>
        </div>

        {/* Connecting lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <line x1="50%" y1="50%" x2="35%" y2="35%" stroke="rgba(6,182,212,0.2)" strokeWidth="2" />
            <line x1="50%" y1="50%" x2="65%" y2="35%" stroke="rgba(59,130,246,0.2)" strokeWidth="2" />
            <line x1="50%" y1="50%" x2="35%" y2="65%" stroke="rgba(99,102,241,0.2)" strokeWidth="2" />
            <line x1="50%" y1="50%" x2="65%" y2="65%" stroke="rgba(20,184,166,0.2)" strokeWidth="2" />
        </svg>

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-black border border-white/20 rounded-full flex items-center justify-center z-20">
            <Network className="w-4 h-4 text-white" />
        </div>
    </div>
);

const RAGGraphic = () => (
    <div className="w-full h-full bg-gradient-to-br from-pink-900/20 to-rose-900/20 flex items-center justify-center relative overflow-hidden">
        <div className="relative w-24 h-32">
            <motion.div
                animate={{ rotate: -5, y: -2 }}
                transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                className="absolute inset-0 bg-pink-500/10 border border-pink-500/20 rounded-lg"
            />
            <motion.div
                animate={{ rotate: 5, y: -4 }}
                transition={{ duration: 2.5, repeat: Infinity, repeatType: "reverse" }}
                className="absolute inset-0 bg-rose-500/10 border border-rose-500/20 rounded-lg"
            />
            <div className="absolute inset-0 bg-black/40 border border-pink-500/30 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <FileText className="w-8 h-8 text-pink-400" />
            </div>
        </div>
    </div>
);

const TreeGraphic = () => (
    <div className="w-full h-full bg-gradient-to-br from-orange-900/20 to-red-900/20 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px]" />

        <div className="relative w-full h-full flex items-center justify-center scale-125">
            <svg className="w-full h-full" viewBox="0 0 400 200">
                {/* Edges */}
                <motion.path d="M 200 40 L 140 100" stroke="rgba(251,146,60,0.3)" strokeWidth="2" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} transition={{ duration: 1 }} />
                <motion.path d="M 200 40 L 260 100" stroke="rgba(251,146,60,0.3)" strokeWidth="2" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} transition={{ duration: 1 }} />
                <motion.path d="M 140 100 L 100 160" stroke="rgba(251,146,60,0.3)" strokeWidth="2" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} transition={{ duration: 1, delay: 0.5 }} />
                <motion.path d="M 140 100 L 180 160" stroke="rgba(251,146,60,0.3)" strokeWidth="2" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} transition={{ duration: 1, delay: 0.5 }} />
                <motion.path d="M 260 100 L 220 160" stroke="rgba(251,146,60,0.3)" strokeWidth="2" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} transition={{ duration: 1, delay: 0.5 }} />
                <motion.path d="M 260 100 L 300 160" stroke="rgba(251,146,60,0.3)" strokeWidth="2" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} transition={{ duration: 1, delay: 0.5 }} />

                {/* Nodes */}
                <circle cx="200" cy="40" r="12" fill="#fb923c" fillOpacity="0.2" stroke="#fb923c" />
                <circle cx="140" cy="100" r="10" fill="#fb923c" fillOpacity="0.2" stroke="#fb923c" />
                <circle cx="260" cy="100" r="10" fill="#fb923c" fillOpacity="0.2" stroke="#fb923c" />

                <circle cx="100" cy="160" r="8" fill="#fb923c" fillOpacity="0.1" stroke="#fb923c" strokeOpacity="0.5" />
                <circle cx="180" cy="160" r="8" fill="#fb923c" fillOpacity="0.1" stroke="#fb923c" strokeOpacity="0.5" />
                <circle cx="220" cy="160" r="8" fill="#fb923c" fillOpacity="0.1" stroke="#fb923c" strokeOpacity="0.5" />
                <circle cx="300" cy="160" r="8" fill="#fb923c" fillOpacity="0.1" stroke="#fb923c" strokeOpacity="0.5" />
            </svg>
        </div>
    </div>
);

// --- Main Component ---

const features = [
    {
        title: "Deep Research",
        description: "Access real-time web search results and citations for accurate and up-to-date information.",
        header: <DeepResearchGraphic />,
        icon: <Search className="h-4 w-4 text-blue-400" />,
        className: "md:col-span-2",
    },
    {
        title: "Universal Connectivity",
        description: "Connect any data source—Postgres, Slack, GitHub—directly to your LLM context via MCP.",
        header: <ConnectivityGraphic />,
        icon: <Database className="h-4 w-4 text-purple-400" />,
        className: "md:col-span-1",
    },
    {
        title: "Branching Conversations",
        description: "Fork any message to explore different paths. Create parallel conversation timelines without losing context.",
        header: <BranchingGraphic />,
        icon: <GitBranch className="h-4 w-4 text-green-400" />,
        className: "md:col-span-1",
    },
    {
        title: "Secure Execution",
        description: "Granular permissions and local execution ensure your data stays safe while using powerful tools.",
        header: <SecureGraphic />,
        icon: <Shield className="h-4 w-4 text-red-400" />,
        className: "md:col-span-2",
    },
    {
        title: "Voice Intelligence",
        description: "Speak your questions and hear AI responses with natural text-to-speech capabilities.",
        header: <VoiceGraphic />,
        icon: <Mic className="h-4 w-4 text-yellow-400" />,
        className: "md:col-span-1",
    },
    {
        title: "MCP Connectors",
        description: "Standardized protocol to connect any data source directly to your LLM context.",
        header: <MCPGraphic />,
        icon: <Network className="h-4 w-4 text-cyan-400" />,
        className: "md:col-span-1",
    },
    {
        title: "Multi-Document RAG",
        description: "Upload and chat with multiple documents simultaneously. Extract insights from PDFs and reports.",
        header: <RAGGraphic />,
        icon: <FileText className="h-4 w-4 text-pink-400" />,
        className: "md:col-span-1",
    },
    {
        title: "Visual Tree Navigation",
        description: "Visualize your entire conversation history as an interactive tree. Navigate complex discussions with ease.",
        header: <TreeGraphic />,
        icon: <MessageSquare className="h-4 w-4 text-orange-400" />,
        className: "md:col-span-3",
    },
];

export const Features = () => {
    return (
        <section className="py-24 relative bg-ai-background overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-ai-primary/5 rounded-full blur-[120px] -translate-y-1/2" />

            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">
                        <span className="text-gradient">Agentic Capabilities</span>
                    </h2>
                    <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                        Everything you need to build, deploy, and manage intelligent agents that actually get work done.
                    </p>
                </div>

                <BentoGrid className="max-w-6xl mx-auto">
                    {features.map((item, i) => (
                        <BentoGridItem
                            key={i}
                            title={item.title}
                            description={item.description}
                            header={item.header}
                            icon={item.icon}
                            className={item.className}
                        />
                    ))}
                </BentoGrid>
            </div>
        </section>
    );
};
