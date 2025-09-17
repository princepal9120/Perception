"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { Bot } from "lucide-react"
import { motion } from "framer-motion"

export function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="flex gap-3 group justify-start"
    >
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1, duration: 0.2 }}>
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarFallback className="bg-primary text-primary-foreground">
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      </motion.div>

      <div className="flex flex-col gap-1 max-w-[80%] sm:max-w-[70%] items-start">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.25 }}
        >
          <Card className="p-4 rounded-2xl shadow-sm bg-card text-card-foreground border-border">
            <div className="flex items-center gap-1">
              <div className="flex gap-1">
                <motion.div
                  className="w-2 h-2 bg-muted-foreground rounded-full"
                  animate={{ y: [0, -4, 0] }}
                  transition={{
                    duration: 0.6,
                    repeat: Number.POSITIVE_INFINITY,
                    delay: 0,
                  }}
                />
                <motion.div
                  className="w-2 h-2 bg-muted-foreground rounded-full"
                  animate={{ y: [0, -4, 0] }}
                  transition={{
                    duration: 0.6,
                    repeat: Number.POSITIVE_INFINITY,
                    delay: 0.2,
                  }}
                />
                <motion.div
                  className="w-2 h-2 bg-muted-foreground rounded-full"
                  animate={{ y: [0, -4, 0] }}
                  transition={{
                    duration: 0.6,
                    repeat: Number.POSITIVE_INFINITY,
                    delay: 0.4,
                  }}
                />
              </div>
              <motion.span
                className="text-xs text-muted-foreground ml-2"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
              >
                Thinking...
              </motion.span>
            </div>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
