import { motion } from "framer-motion";
import { Bot, Zap, TrendingUp, BookOpen, Code, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WelcomeScreenProps {
    onSuggestedPrompt: (prompt: string, deepResearch?: boolean) => void;
    onOpenRuntimeSettings?: () => void;
    remainingFreeTurns?: number;
    hasRuntimeConfig?: boolean;
}

export const WelcomeScreen = ({
    onSuggestedPrompt,
    onOpenRuntimeSettings,
    remainingFreeTurns = 3,
    hasRuntimeConfig = false,
}: WelcomeScreenProps) => {
    const suggestedPrompts = [
        {
            icon: TrendingUp,
            title: "Latest Tech News",
            prompt: "What are the latest developments in AI and technology this week?",
            deepResearch: true,
            gradient: "from-blue-500 to-cyan-500"
        },
        {
            icon: BookOpen,
            title: "Explain a Concept",
            prompt: "Explain quantum computing in simple terms",
            deepResearch: false,
            gradient: "from-purple-500 to-pink-500"
        },
        {
            icon: Code,
            title: "Code Help",
            prompt: "How do I implement authentication in a React app?",
            deepResearch: true,
            gradient: "from-green-500 to-emerald-500"
        },
        {
            icon: Lightbulb,
            title: "Research Topic",
            prompt: "Compare renewable energy sources and their efficiency",
            deepResearch: true,
            gradient: "from-orange-500 to-yellow-500"
        }
    ];

    return (
        <div className="flex flex-col items-center justify-center h-full min-h-[50vh] px-4 py-8">
            {/* Hero Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center space-y-4 mb-8"
            >
                <div className="relative inline-block">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent blur-2xl opacity-30 animate-pulse" />
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl gradient-primary flex items-center justify-center shadow-2xl">
                        <Bot className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                        Welcome to Perception
                    </h1>
                    <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
                        Open-source research copilot onboarding: try a few chats immediately, then bring your own key when you're ready.
                    </p>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 }}
                className="w-full max-w-3xl mb-6"
            >
                <div className="rounded-2xl border border-primary/10 bg-primary/5 p-4 sm:p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm font-semibold text-foreground">Best OSS onboarding path</p>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                                1. Ask up to 3 free chat turns. 2. Open Runtime settings. 3. Add your own key and keep going.
                            </p>
                        </div>
                        <div className="rounded-full bg-background/80 px-3 py-1 text-xs font-medium text-foreground border border-border/60">
                            {hasRuntimeConfig ? "Your runtime settings are active" : `${remainingFreeTurns} free chat turns left`}
                        </div>
                    </div>
                </div>
            </motion.div>

            {!hasRuntimeConfig && onOpenRuntimeSettings && (
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="w-full max-w-3xl mb-6"
                >
                    <div className="rounded-2xl border border-border/60 bg-card/80 p-4 sm:p-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm font-semibold text-foreground">Want to start with your own model?</p>
                                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                                    Open Runtime settings now and add your API key before you send the first message.
                                </p>
                            </div>
                            <Button onClick={onOpenRuntimeSettings} className="sm:min-w-40">
                                Add API key
                            </Button>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Suggested Prompts */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="w-full max-w-3xl"
            >
                <div className="flex items-center gap-2 mb-4">
                    <Lightbulb className="w-4 h-4 text-primary" />
                    <h2 className="text-sm font-semibold text-foreground">Try asking:</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {suggestedPrompts.map((suggestion, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                        >
                            <Button
                                variant="outline"
                                onClick={() => onSuggestedPrompt(suggestion.prompt, suggestion.deepResearch)}
                                className="w-full h-auto p-4 flex flex-col items-start gap-3 hover:shadow-lg hover:border-primary/50 transition-all group"
                            >
                                <div className="flex items-center gap-3 w-full">
                                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${suggestion.gradient} flex items-center justify-center flex-shrink-0 shadow-md`}>
                                        <suggestion.icon className="w-5 h-5 text-white" />
                                    </div>

                                    <div className="flex-1 text-left">
                                        <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                                            {suggestion.title}
                                        </h3>
                                    </div>

                                    {suggestion.deepResearch && (
                                        <div className="flex items-center gap-1 px-2 py-0.5 bg-primary/10 rounded-full">
                                            <Zap className="w-2.5 h-2.5 text-primary fill-primary" />
                                            <span className="text-[10px] font-medium text-primary">Research</span>
                                        </div>
                                    )}
                                </div>

                                <p className="text-xs text-muted-foreground text-left line-clamp-2">
                                    {suggestion.prompt}
                                </p>
                            </Button>
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* Features */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="mt-8 flex flex-wrap justify-center gap-4 text-xs text-muted-foreground"
            >
                <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <span>Real-time web search</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span>Multi-source analysis</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                    <span>Streaming responses</span>
                </div>
            </motion.div>
        </div>
    );
};
