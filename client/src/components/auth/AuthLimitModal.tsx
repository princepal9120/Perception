// src/components/auth/AuthLimitModal.tsx
// Modal shown when OSS users hit the free chat limit and need to bring their own key

import { motion, AnimatePresence } from 'framer-motion';
import { X, KeyRound, Sparkles, Cpu, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AuthLimitModalProps {
    isOpen: boolean;
    onClose: () => void;
    turnsUsed: number;
    onOpenRuntimeSettings: () => void;
}

export function AuthLimitModal({ isOpen, onClose, turnsUsed, onOpenRuntimeSettings }: AuthLimitModalProps) {
    const handleClose = () => {
        onClose();
    };

    const handleOpenRuntimeSettings = () => {
        onOpenRuntimeSettings();
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
                        onClick={handleClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        onClick={(e) => e.target === e.currentTarget && handleClose()}
                    >
                        <div className="relative w-full max-w-md bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-800 overflow-hidden">
                            {/* Close button */}
                            <button
                                onClick={handleClose}
                                className="absolute top-4 right-4 p-2 rounded-full hover:bg-zinc-800 transition-colors z-10"
                            >
                                <X className="w-5 h-5 text-zinc-400" />
                            </button>

                            <div className="p-8">
                                <div className="text-center mb-8">
                                    <div className="mx-auto w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-violet-500/25">
                                        <KeyRound className="w-8 h-8 text-white" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-white mb-2">
                                        Add your key to keep chatting
                                    </h2>
                                    <p className="text-zinc-400">
                                        You have used {turnsUsed} free OSS chat turns in this browser. Bring your own model key to keep using Perception without any sign-in flow.
                                    </p>
                                </div>

                                <div className="space-y-3 mb-8">
                                    {[
                                        { icon: Sparkles, text: 'Keep the open-source onboarding friction low' },
                                        { icon: Cpu, text: 'Choose your own model provider and model name' },
                                        { icon: Search, text: 'Add Tavily too if you want stronger web research' },
                                    ].map((benefit, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-violet-900/30 flex items-center justify-center">
                                                <benefit.icon className="w-4 h-4 text-violet-400" />
                                            </div>
                                            <span className="text-sm font-medium text-zinc-300">
                                                {benefit.text}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-3">
                                    <Button
                                        onClick={handleOpenRuntimeSettings}
                                        className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg shadow-violet-500/25 py-6 text-lg font-medium"
                                    >
                                        Add API key
                                    </Button>
                                    <Button
                                        onClick={handleClose}
                                        variant="outline"
                                        className="w-full py-6 text-lg font-medium border-zinc-700 text-zinc-100 hover:bg-zinc-800"
                                    >
                                        Maybe later
                                    </Button>
                                </div>

                                <p className="text-center text-xs text-zinc-500 mt-6">
                                    Perception stores runtime settings locally in this browser and uses them for future chat + research requests.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
