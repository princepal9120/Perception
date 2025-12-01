import { motion } from 'framer-motion';
import { Brain, Search, FileText, PenTool, CheckCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';

const steps = [
    { id: 'understanding', label: 'Understanding prompt', icon: Brain },
    { id: 'planning', label: 'Planning research', icon: Search },
    { id: 'querying', label: 'Querying sources', icon: FileText },
    { id: 'synthesizing', label: 'Synthesizing knowledge', icon: PenTool },
    { id: 'drafting', label: 'Writing draft', icon: CheckCircle2 },
];

export const DeepResearchLoader = () => {
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
        }, 1500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-zinc-900 dark:to-zinc-950 rounded-2xl border border-blue-100 dark:border-zinc-800 shadow-lg max-w-md mx-auto">
            {/* Rotating Wheel */}
            <div className="relative w-24 h-24 mb-8">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 rounded-full border-4 border-t-blue-500 border-r-indigo-500 border-b-purple-500 border-l-transparent"
                />
                <div className="absolute inset-2 bg-white dark:bg-zinc-900 rounded-full flex items-center justify-center shadow-inner">
                    <Brain className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
            </div>

            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-6">
                Initializing Deep Research...
            </h3>

            {/* Steps */}
            <div className="w-full space-y-4">
                {steps.map((step, index) => {
                    const Icon = step.icon;
                    const isActive = index === currentStep;
                    const isCompleted = index < currentStep;

                    return (
                        <motion.div
                            key={step.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${isActive ? 'bg-white dark:bg-zinc-800 shadow-sm' : ''
                                }`}
                        >
                            <div className={`
                w-6 h-6 rounded-full flex items-center justify-center transition-colors
                ${isCompleted ? 'bg-green-500 text-white' : isActive ? 'bg-blue-500 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400'}
              `}>
                                {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                            </div>
                            <span className={`text-sm font-medium ${isActive || isCompleted ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-400 dark:text-zinc-600'
                                }`}>
                                {step.label}
                            </span>
                            {isActive && (
                                <motion.div
                                    layoutId="active-indicator"
                                    className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500"
                                />
                            )}
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};
