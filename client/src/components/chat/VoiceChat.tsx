import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, X, Loader2, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

interface VoiceChatProps {
    isOpen: boolean;
    onClose: () => void;
    onTranscript: (text: string) => void;
    isStreaming: boolean;
    lastMessage?: string;
}

export const VoiceChat = ({ isOpen, onClose, onTranscript, isStreaming, lastMessage }: VoiceChatProps) => {
    const [status, setStatus] = useState<"idle" | "listening" | "processing" | "speaking">("idle");
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const audioChunks = useRef<Blob[]>([]);
    const { token } = useAuth();
    const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
    const [hasSpokenLastMessage, setHasSpokenLastMessage] = useState(false);

    // Initialize audio player
    useEffect(() => {
        audioPlayerRef.current = new Audio();
        audioPlayerRef.current.onended = () => setStatus("idle");
        return () => {
            if (audioPlayerRef.current) {
                audioPlayerRef.current.pause();
                audioPlayerRef.current = null;
            }
        };
    }, []);

    // Start recording when opened
    useEffect(() => {
        if (isOpen && status === "idle") {
            startRecording();
        } else if (!isOpen) {
            stopRecording();
            setStatus("idle");
        }
    }, [isOpen]);

    // Handle AI response synthesis
    useEffect(() => {
        if (isOpen && !isStreaming && lastMessage && !hasSpokenLastMessage && status === "processing") {
            synthesizeAudio(lastMessage);
            setHasSpokenLastMessage(true);
        }
    }, [isOpen, isStreaming, lastMessage, hasSpokenLastMessage, status]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    audioChunks.current.push(e.data);
                }
            };

            recorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks.current, { type: "audio/webm" });
                audioChunks.current = []; // Reset chunks
                await transcribeAudio(audioBlob);
            };

            recorder.start();
            setMediaRecorder(recorder);
            setStatus("listening");
            setHasSpokenLastMessage(false);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            onClose();
        }
    };

    const stopRecording = () => {
        if (mediaRecorder && mediaRecorder.state !== "inactive") {
            mediaRecorder.stop();
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
            setMediaRecorder(null);
            setStatus("processing");
        }
    };

    const transcribeAudio = async (audioBlob: Blob) => {
        if (!token) return;

        const formData = new FormData();
        formData.append("file", audioBlob, "voice_input.webm");

        try {
            const response = await fetch(`${API_BASE_URL}/voice/transcribe`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) throw new Error("Transcription failed");

            const data = await response.json();
            if (data.text) {
                onTranscript(data.text);
                // Status remains "processing" while we wait for AI response (isStreaming)
            } else {
                setStatus("idle");
            }

        } catch (error) {
            console.error("Transcription error:", error);
            setStatus("idle");
        }
    };

    const synthesizeAudio = async (text: string) => {
        if (!token) return;

        try {
            const response = await fetch(`${API_BASE_URL}/voice/synthesize`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ text })
            });

            if (!response.ok) throw new Error("Synthesis failed");

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);

            if (audioPlayerRef.current) {
                setStatus("speaking");
                audioPlayerRef.current.src = audioUrl;
                audioPlayerRef.current.play();
            }

        } catch (error) {
            console.error("Synthesis error:", error);
            setStatus("idle");
        }
    };

    const handleToggle = () => {
        if (status === "listening") {
            stopRecording();
        } else if (status === "idle" || status === "speaking") {
            if (audioPlayerRef.current) {
                audioPlayerRef.current.pause();
            }
            startRecording();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-md"
                >
                    <div className="relative flex flex-col items-center gap-8 p-8 w-full max-w-md">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-0 right-0"
                            onClick={onClose}
                        >
                            <X className="w-6 h-6" />
                        </Button>

                        <div className="text-center space-y-4">
                            <h2 className="text-2xl font-semibold">Voice Mode</h2>
                            <p className="text-muted-foreground text-lg min-h-[2rem]">
                                {status === "listening" && "Listening..."}
                                {status === "processing" && "Thinking..."}
                                {status === "speaking" && "Speaking..."}
                                {status === "idle" && "Tap to speak"}
                            </p>
                        </div>

                        {/* Visualizer / Button */}
                        <motion.button
                            onClick={handleToggle}
                            className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 ${status === "listening" ? "bg-red-500/20 scale-110" :
                                    status === "speaking" ? "bg-primary/20 scale-110" :
                                        status === "processing" ? "bg-muted animate-pulse" : "bg-muted"
                                }`}
                        >
                            {/* Ripple effect */}
                            {(status === "listening" || status === "speaking") && (
                                <>
                                    <motion.div
                                        initial={{ scale: 1, opacity: 0.5 }}
                                        animate={{ scale: 1.5, opacity: 0 }}
                                        transition={{ repeat: Infinity, duration: 2 }}
                                        className={`absolute inset-0 rounded-full ${status === "listening" ? "bg-red-500" : "bg-primary"
                                            }`}
                                    />
                                    <motion.div
                                        initial={{ scale: 1, opacity: 0.5 }}
                                        animate={{ scale: 1.3, opacity: 0 }}
                                        transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
                                        className={`absolute inset-0 rounded-full ${status === "listening" ? "bg-red-500" : "bg-primary"
                                            }`}
                                    />
                                </>
                            )}

                            <div className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-colors duration-300 ${status === "listening" ? "bg-red-500 text-white shadow-lg shadow-red-500/30" :
                                    status === "speaking" ? "bg-primary text-white shadow-lg shadow-primary/30" :
                                        "bg-card border-2 border-border"
                                }`}>
                                {status === "processing" ? (
                                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                                ) : status === "speaking" ? (
                                    <Volume2 className="w-10 h-10" />
                                ) : (
                                    <Mic className="w-10 h-10" />
                                )}
                            </div>
                        </motion.button>

                        <p className="text-sm text-muted-foreground text-center">
                            {status === "listening" ? "Tap to stop" :
                                status === "speaking" ? "Tap to interrupt" : "Tap to speak"}
                        </p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
