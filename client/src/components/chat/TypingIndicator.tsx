import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';

export const TypingIndicator = () => {
  return (
    <div className="flex gap-2 sm:gap-3 md:gap-4">
      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
        <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
      </div>

      <div className="flex-1 max-w-full sm:max-w-[85%] md:max-w-2xl">
        <div className="inline-block p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-card border border-border shadow-sm dark:shadow-none">
          <div className="flex gap-1 sm:gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-muted-foreground"
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
