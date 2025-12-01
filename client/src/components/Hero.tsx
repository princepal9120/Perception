import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background selection:bg-primary/20">
      {/* Dynamic Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-primary/10 blur-[120px] animate-slow-spin" />
        <div className="absolute top-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-accent/10 blur-[120px] animate-float" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-gradient-to-t from-background to-transparent z-10" />
      </div>

      <div className="container relative z-20 px-4 mx-auto max-w-6xl">
        <div className="text-center space-y-8">
          {/* Premium Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel"
          >
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-sm font-medium bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              AI Research Copilot
            </span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
            className="text-6xl md:text-8xl font-bold tracking-tight leading-tight"
          >
            Research Smarter.
            <br />
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] bg-clip-text text-transparent animate-shimmer">
                Branch Deeper.
              </span>
            </span>
          </motion.h1>

          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
          >
            Explore every possibility with visual conversation trees.
            Fork, branch, and navigate your AI chats like never before.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-4"
          >
            <Button
              size="lg"
              onClick={() => navigate("/chat")}
              className="relative h-14 px-8 rounded-full bg-primary text-primary-foreground text-lg font-medium shadow-glow hover:shadow-lg hover:scale-105 transition-all duration-300 overflow-hidden group"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <span className="relative flex items-center gap-2">
                Start Branching
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="h-14 px-8 rounded-full border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/80 text-lg font-medium transition-all duration-300"
            >
              View Demo
            </Button>
          </motion.div>

          {/* Stats or Social Proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="flex flex-wrap gap-8 justify-center items-center pt-16 text-sm font-medium text-muted-foreground/80"
          >
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/30 backdrop-blur-sm border border-white/5">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span>Visual Tree Navigation</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/30 backdrop-blur-sm border border-white/5">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span>Branching Conversations</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/30 backdrop-blur-sm border border-white/5">
              <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
              <span>Deep Research</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
