import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const CTA = () => {
    const navigate = useNavigate();

    return (
        <section className="py-32 px-4 relative overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/10 to-primary/10 animate-shimmer bg-[length:200%_200%]" />

            <div className="container mx-auto max-w-5xl relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="glass-panel p-12 md:p-16 rounded-3xl text-center"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
                        <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                        <span className="text-sm font-medium text-primary">Start Your Research Journey</span>
                    </div>

                    <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
                        
                        <br />
                        <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                            Research Workflow?
                        </span>
                    </h2>

                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
                        
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Button
                            size="lg"
                            onClick={() => navigate("/signup")}
                            className="relative h-14 px-8 rounded-full bg-primary text-primary-foreground text-lg font-medium shadow-glow hover:shadow-lg hover:scale-105 transition-all duration-300 overflow-hidden group"
                        >
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                            <span className="relative flex items-center gap-2">
                                Get Started Free
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </span>
                        </Button>

                        <Button
                            variant="outline"
                            size="lg"
                            onClick={() => navigate("/chat")}
                            className="h-14 px-8 rounded-full border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/80 text-lg font-medium transition-all duration-300"
                        >
                            Try Demo
                        </Button>
                    </div>

                    <p className="text-sm text-muted-foreground mt-8">
                        Free plan available • No credit card required • Cancel anytime
                    </p>
                </motion.div>
            </div>
        </section>
    );
};
