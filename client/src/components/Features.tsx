import { motion } from "framer-motion";
import { MessageSquare, Mic, FileText, Sparkles, Search, Zap } from "lucide-react";

const features = [
  {
    icon: MessageSquare,
    title: "Conversational Intelligence",
    description: "Chat naturally with AI that understands context, remembers your conversations, and provides thoughtful responses.",
  },
  {
    icon: Search,
    title: "Web Research",
    description: "Access real-time web search results and citations, just like Perplexity, for accurate and up-to-date information.",
  },
  {
    icon: FileText,
    title: "Multi-Document RAG",
    description: "Upload and chat with multiple documents simultaneously. Extract insights from PDFs, papers, and reports.",
  },
  {
    icon: Mic,
    title: "Voice Interaction",
    description: "Speak your questions and hear AI responses with natural text-to-speech and speech-to-text capabilities.",
  },
  {
    icon: Zap,
    title: "Streaming Responses",
    description: "Watch AI think in real-time with token-by-token streaming for a fluid, engaging conversation experience.",
  },
  {
    icon: Sparkles,
    title: "Perception Tools",
    description: "AI that can use tools, run web searches, summarize content, and orchestrate complex multi-step tasks.",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0 },
};

export const Features = () => {
  return (
    <section className="py-24 px-4 bg-card relative overflow-hidden">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/50 to-background pointer-events-none" />

      <div className="container mx-auto max-w-7xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Everything You Need to <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Research & Create</span>
          </h2>
          <p className="text-xl text-secondary max-w-2xl mx-auto">
            Powerful AI features designed for researchers, writers, and knowledge workers.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                variants={item}
                whileHover={{ scale: 1.03, y: -4 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="group p-6 rounded-2xl bg-card border border-border shadow-elegant hover:shadow-glow hover:border-primary/50 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};
