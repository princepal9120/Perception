// src/components/auth/AuthLimitModal.tsx
// Modal shown when unauthenticated users reach the chat limit

import { useState } from 'react';
import { SignIn, SignUp } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle, Sparkles, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isClerkAuthEnabled } from '@/lib/auth-config';

interface AuthLimitModalProps {
    isOpen: boolean;
    onClose: () => void;
    messagesUsed: number;
}

type AuthView = 'choice' | 'sign-in' | 'sign-up';

export function AuthLimitModal({ isOpen, onClose, messagesUsed }: AuthLimitModalProps) {
    const [view, setView] = useState<AuthView>('choice');

    const handleClose = () => {
        setView('choice');
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

                            {view === 'choice' && (
                                <div className="p-8">
                                    {/* Header */}
                                    <div className="text-center mb-8">
                                        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-violet-500/25">
                                            <MessageCircle className="w-8 h-8 text-white" />
                                        </div>
                                        <h2 className="text-2xl font-bold text-white mb-2">
                                            Guest session limit reached
                                        </h2>
                                        <p className="text-zinc-400">
                                            You have used {messagesUsed} guest messages in this browser. Sign in to keep your chats, lift the guest cap, and continue in a saved workspace.
                                        </p>
                                    </div>

                                    {/* Benefits */}
                                    <div className="space-y-3 mb-8">
                                        {[
                                            { icon: Sparkles, text: 'Continue beyond the guest cap' },
                                            { icon: MessageCircle, text: 'Keep your conversation history' },
                                            { icon: Lock, text: 'Use a protected workspace session' },
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

                                    {/* CTA Buttons */}
                                    <div className="space-y-3">
                                        <Button
                                            onClick={() => setView('sign-up')}
                                            className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg shadow-violet-500/25 py-6 text-lg font-medium"
                                        >
                                            Create Workspace Account
                                        </Button>
                                        <Button
                                            onClick={() => setView('sign-in')}
                                            variant="outline"
                                            className="w-full py-6 text-lg font-medium border-zinc-700 text-zinc-100 hover:bg-zinc-800"
                                        >
                                            Sign In
                                        </Button>
                                    </div>

                                    <p className="text-center text-xs text-zinc-500 mt-6">
                                        Local OSS mode does not need this screen. This prompt only appears when the app is running with hosted or JWT auth.
                                    </p>
                                </div>
                            )}

                            {view === 'sign-in' && isClerkAuthEnabled && (
                                <div className="p-4">
                                    <button
                                        onClick={() => setView('choice')}
                                        className="mb-4 text-sm text-violet-400 hover:underline"
                                    >
                                        ← Back
                                    </button>
                                    <SignIn
                                        routing="hash"
                                        signUpUrl="#sign-up"
                                        afterSignInUrl="/chat"
                                        appearance={{
                                            elements: {
                                                rootBox: 'w-full',
                                                card: 'shadow-none bg-transparent',
                                            },
                                        }}
                                    />
                                </div>
                            )}

                            {view === 'sign-up' && isClerkAuthEnabled && (
                                <div className="p-4">
                                    <button
                                        onClick={() => setView('choice')}
                                        className="mb-4 text-sm text-violet-400 hover:underline"
                                    >
                                        ← Back
                                    </button>
                                    <SignUp
                                        routing="hash"
                                        signInUrl="#sign-in"
                                        afterSignUpUrl="/chat"
                                        appearance={{
                                            elements: {
                                                rootBox: 'w-full',
                                                card: 'shadow-none bg-transparent',
                                            },
                                        }}
                                    />
                                </div>
                            )}

                            {!isClerkAuthEnabled && view !== 'choice' && (
                                <div className="p-8 text-center">
                                    <h3 className="text-lg font-semibold text-white mb-2">
                                        Auth UI is not enabled in this build
                                    </h3>
                                    <p className="text-sm text-zinc-400 mb-6">
                                        Switch `VITE_AUTH_MODE` to `clerk` to use hosted sign-in, or keep local mode enabled for the OSS demo flow.
                                    </p>
                                    <Button
                                        onClick={() => setView('choice')}
                                        variant="outline"
                                        className="border-zinc-700 text-zinc-100 hover:bg-zinc-800"
                                    >
                                        Back
                                    </Button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
