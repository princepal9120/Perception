import { motion } from "framer-motion";
import { MessageSquare, Mic, FileText, Sparkles, Search, Zap, GitBranch, Network, Workflow, BrainCircuit } from "lucide-react";

const features = [
  {
    icon: GitBranch,
    title: "Branching Conversations",
    description:
      "Fork any message to explore different paths. Create parallel conversation timelines without losing context.",
  },
  {
    icon: Search,
    title: "Deep Research",
    description:
      "Access real-time web search results and citations for accurate and up-to-date information.",
  },
  {
    icon: Network,
    title: "Visual Tree Navigation",
    description:
      "Visualize your entire conversation history as an interactive tree. Navigate complex discussions with ease.",
  },
  {
    icon: Mic,
    title: "Voice Interaction",
    description:
      "Speak your questions and hear AI responses with natural text-to-speech capabilities.",
  },
  {
    icon: Zap,
    title: "Streaming Responses",
    description:
      "Watch AI think in real-time with token-by-token streaming for a fluid experience.",
  },
  {
    icon: FileText,
    title: "Multi-Document RAG",
    description:
      "Upload and chat with multiple documents simultaneously. Extract insights from PDFs and reports.",
  },
  {
    icon: Workflow,
    title: "Workflow Automation",
    description:
      "Automate complex research tasks with custom workflows and agentic chains that work for you.",
  },
  {
    icon: BrainCircuit,
    title: "Adaptive Intelligence",
    description:
      "The system automatically selects the best AI model for each specific task to optimize speed and quality.",
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
          className="grid grid-cols-1 md:grid-cols-6 gap-6 auto-rows-[280px]"
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;

            // Bento grid span pattern for 8 items (Total 4 rows of 6 cols)
            const spanMap = [
              "md:col-span-4", // Row 1: 4
              "md:col-span-2", // Row 1: 2
              "md:col-span-3", // Row 2: 3
              "md:col-span-3", // Row 2: 3
              "md:col-span-2", // Row 3: 2
              "md:col-span-4", // Row 3: 4
              "md:col-span-3", // Row 4: 3
              "md:col-span-3", // Row 4: 3
            ];

            const spanClass = spanMap[index % spanMap.length];

            return (
              <motion.div
                key={index}
                variants={item}
                whileHover={{ y: -5, scale: 1.01 }}
                className={`group relative p-8 rounded-3xl bg-card border border-border/50 shadow-elegant hover:shadow-2xl transition-all duration-300 overflow-hidden ${spanClass}`}
              >
                {/* Hover Gradient & Glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-500" />

                {/* Card Content */}
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div>
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 group-hover:bg-primary/20 transition-all duration-300">
                      <Icon className="w-7 h-7 text-primary" />
                    </div>

                    <h3 className="text-2xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors duration-300">
                      {feature.title}
                    </h3>

                    <p className="text-muted-foreground leading-relaxed text-lg group-hover:text-foreground/80 transition-colors">
                      {feature.description}
                    </p>
                  </div>

                  {/* Micro-interaction Arrow */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
                    <div className="w-8 h-8 rounded-full border border-primary/20 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    </div>
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
