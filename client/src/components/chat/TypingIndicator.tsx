import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';

export const TypingIndicator = () => {
  return (
    <div className="flex gap-4">
      <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
        <Bot className="w-5 h-5 text-white" />
      </div>
      
      <div className="flex-1 max-w-2xl">
        <div className="inline-block p-4 rounded-2xl bg-card border border-border shadow-elegant">
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-muted-foreground"
                animate={{
                  opacity: [0.3, 1, 0.3],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: i * 0.15,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
