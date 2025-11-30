import { motion } from "framer-motion";
import { MessageSquare, Mic, FileText, Sparkles, Search, Zap } from "lucide-react";

const features = [
  {
    icon: MessageSquare,
    title: "Conversational Intelligence",
    description:
      "Chat naturally with AI that understands context, remembers your conversations, and provides thoughtful responses.",
  },
  {
    icon: Search,
    title: "Web Research",
    description:
      "Access real-time web search results and citations, just like Perplexity, for accurate and up-to-date information.",
  },
  {
    icon: FileText,
    title: "Multi-Document RAG",
    description:
      "Upload and chat with multiple documents simultaneously. Extract insights from PDFs, papers, and reports.",
  },
  {
    icon: Mic,
    title: "Voice Interaction",
    description:
      "Speak your questions and hear AI responses with natural text-to-speech and speech-to-text capabilities.",
  },
  {
    icon: Zap,
    title: "Streaming Responses",
    description:
      "Watch AI think in real-time with token-by-token streaming for a fluid, engaging conversation experience.",
  },
  {
    icon: Sparkles,
    title: "Perception Tools",
    description:
      "AI that can use tools, run web searches, summarize content, and orchestrate complex multi-step tasks.",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0 },
};

export const Features = () => {
  return (
    <section className="py-24 px-4 bg-secondary/5 relative overflow-hidden">
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background pointer-events-none" />

      <div className="container mx-auto max-w-7xl relative z-10">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
            Everything You Need to{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Research & Create
            </span>
          </h2>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Powerful AI features designed for researchers, writers, and knowledge workers.
          </p>
        </motion.div>

        {/* Bento Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-6 gap-8 auto-rows-[260px]"
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;

            // Bento grid span pattern
            const spanMap = [
              "md:col-span-4 ", // Big hero card
              "md:col-span-2",               // Small card
              "md:col-span-3",               // Medium wide
              "md:col-span-3",               // Medium wide
              "md:col-span-2 ", // Tall card
              "md:col-span-4",               // Wide card
            ];

            const spanClass = spanMap[index % spanMap.length];

            return (
              <motion.div
                key={index}
                variants={item}
                className={`group relative p-8 rounded-3xl bg-card border border-border/50 shadow-elegant hover:shadow-glow transition-all duration-500 overflow-hidden ${spanClass}`}
              >
                {/* Hover Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Card Content */}
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div>
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
                      <Icon className="w-7 h-7 text-primary" />
                    </div>

                    <h3 className="text-2xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors duration-300">
                      {feature.title}
                    </h3>

                    <p className="text-muted-foreground leading-relaxed text-lg">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};
