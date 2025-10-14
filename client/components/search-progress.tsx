"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Clock, CheckCircle, XCircle } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export interface SearchStep {
    id: string
    title: string
    status: "pending" | "active" | "completed" | "error"
    description?: string
    duration?: number
}

interface SearchProgressProps {
    isVisible: boolean
    steps: SearchStep[]
    onClose?: () => void
}

export function SearchProgress({ isVisible, steps, onClose }: SearchProgressProps) {
    const [currentStep, setCurrentStep] = useState(0)

    useEffect(() => {
        const activeStepIndex = steps.findIndex(step => step.status === "active")
        if (activeStepIndex !== -1) {
            setCurrentStep(activeStepIndex)
        }
    }, [steps])

    const getStepIcon = (status: SearchStep["status"]) => {
        switch (status) {
            case "pending":
                return <Clock className="h-4 w-4 text-muted-foreground" />
            case "active":
                return (
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                        <Search className="h-4 w-4 text-primary" />
                    </motion.div>
                )
            case "completed":
                return <CheckCircle className="h-4 w-4 text-green-500" />
            case "error":
                return <XCircle className="h-4 w-4 text-red-500" />
        }
    }

    const getStatusColor = (status: SearchStep["status"]) => {
        switch (status) {
            case "pending":
                return "secondary"
            case "active":
                return "default"
            case "completed":
                return "default"
            case "error":
                return "destructive"
        }
    }

    if (!isVisible) return null

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="fixed top-4 right-4 z-50 w-80"
            >
                <Card className="p-4 shadow-lg backdrop-blur-sm bg-background/95 border">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Search className="h-4 w-4 text-primary" />
                            <h3 className="font-semibold text-sm">AI Search Progress</h3>
                        </div>
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                                ×
                            </button>
                        )}
                    </div>

                    <div className="space-y-3">
                        {steps.map((step, index) => (
                            <motion.div
                                key={step.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="flex items-start gap-3"
                            >
                                <div className="flex-shrink-0 mt-0.5">
                                    {getStepIcon(step.status)}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="text-sm font-medium truncate">{step.title}</p>
                                        <Badge variant={getStatusColor(step.status)} className="text-xs px-1 py-0">
                                            {step.status}
                                        </Badge>
                                    </div>

                                    {step.description && (
                                        <p className="text-xs text-muted-foreground">{step.description}</p>
                                    )}

                                    {step.duration && step.status === "completed" && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Completed in {step.duration}ms
                                        </p>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Progress bar */}
                    <div className="mt-4">
                        <div className="w-full bg-secondary rounded-full h-1.5">
                            <motion.div
                                className="bg-primary h-1.5 rounded-full"
                                initial={{ width: "0%" }}
                                animate={{
                                    width: `${(steps.filter(s => s.status === "completed").length / steps.length) * 100}%`
                                }}
                                transition={{ duration: 0.5, ease: "easeInOut" }}
                            />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>{steps.filter(s => s.status === "completed").length} of {steps.length} completed</span>
                            <span>
                                {steps.some(s => s.status === "active")
                                    ? "Searching..."
                                    : steps.every(s => s.status === "completed")
                                        ? "Complete"
                                        : "Pending"
                                }
                            </span>
                        </div>
                    </div>
                </Card>
            </motion.div>
        </AnimatePresence>
    )
}