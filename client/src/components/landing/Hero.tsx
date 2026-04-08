import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

// --- Helper Components ---

const Reveal = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => {
    return (
        <motion.div
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
            viewport={{ once: true, margin: "-10%" }}
        >
            {children}
        </motion.div>
    );
};

export const Hero = () => {
    const containerRef = useRef(null);
    const { scrollY } = useScroll();
    const y1 = useTransform(scrollY, [0, 500], [0, 200]);
    const opacity = useTransform(scrollY, [0, 300], [1, 0]);

    return (
        <section
            ref={containerRef}
            className="relative min-h-screen flex items-center justify-center overflow-hidden pt-32 pb-20 bg-[#050505]"
        >
            {/* --- Atmospheric Background (Red Fog) --- */}
            <div className="absolute inset-0 z-0 pointer-events-none select-none">
                {/* Main Red/Orange Atmospheric Fog */}
                <div className="absolute top-0 left-0 w-full h-full opacity-60 mix-blend-screen">
                    <img
                        src="https://framerusercontent.com/images/9zvwRJAavKKacVyhFCwHyXW1U.png?width=1536&height=1024"
                        alt="Atmosphere"
                        className="w-full h-full object-cover object-center opacity-80"
                    />
                </div>

                {/* Gradient Overlay to blend bottom */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#050505] z-10" />
            </div>

            {/* --- Floating Hands (Surrealist Elements) --- */}
            <motion.div
                className="absolute -left-[10%] top-[-10%] md:left-[-5%] md:top-[-15%] w-[50vw] md:w-[40vw] max-w-[800px] z-10 pointer-events-none mix-blend-hard-light opacity-80"
                animate={{ y: [0, -15, 0], rotate: [0, 2, 0] }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            >
                <img
                    src="https://framerusercontent.com/images/KNhiA5A2ykNYqNkj04Hk6BVg5A.png?width=1540&height=1320"
                    alt="Hand Reaching"
                    className="w-full h-auto object-contain"
                />
            </motion.div>

            <motion.div
                className="absolute -right-[10%] bottom-[-10%] md:right-[-5%] md:bottom-[-5%] w-[45vw] md:w-[35vw] max-w-[700px] z-10 pointer-events-none mix-blend-hard-light opacity-80"
                animate={{ y: [0, 20, 0], rotate: [0, -2, 0] }}
                transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            >
                <img
                    src="https://framerusercontent.com/images/X89VFCABCEjjZ4oLGa3PjbOmsA.png?width=1542&height=1002"
                    alt="Hand Receiving"
                    className="w-full h-auto object-contain"
                />
            </motion.div>

            {/* --- Main Content --- */}
            <div className="container mx-auto px-6 relative z-20 text-center flex flex-col items-center justify-center h-full mt-10 md:mt-0">
                <motion.div style={{ y: y1, opacity }} className="max-w-5xl mx-auto">
                    {/* Badge */}
                    <Reveal>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-8">
                            <Sparkles className="w-4 h-4 text-ai-primary" />
                            <span className="text-sm font-medium text-gray-300">Open-Source Deep Research Workspace</span>
                        </div>
                    </Reveal>

                    {/* Headline */}
                    <Reveal delay={0.1}>
                        <h1
                            className="text-5xl md:text-7xl lg:text-8xl font-medium leading-[1.1] tracking-tight mb-6 font-serif text-[#ffe0e0] mix-blend-overlay"
                            style={{ textShadow: '0 0 12px rgba(255,255,255,0.71)' }}
                        >
                            Perception. <br />
                            <span className="italic font-light text-[#ffe0e0]">Bring your own model. Run your own research.</span>
                        </h1>
                    </Reveal>

                    {/* Subheadline */}
                    <Reveal delay={0.2}>
                        <p
                            className="text-base md:text-xl text-[#ffe0e0]/90 max-w-2xl mx-auto mb-12 font-light tracking-wide leading-relaxed mix-blend-overlay"
                            style={{ textShadow: '0 0 12px rgba(255,255,255,0.71)' }}
                        >
                            An open-source workspace for agentic search, document-grounded chat, and deep research. Self-host it, point it at your own model endpoint, and ship evidence-backed workflows locally.
                        </p>
                    </Reveal>

                    {/* CTA Buttons */}
                    <Reveal delay={0.3}>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                            <Link to="/chat">
                                <Button
                                    size="lg"
                                    className="bg-white text-black hover:bg-gray-100 h-14 px-8 rounded-full text-lg font-semibold transition-all hover:scale-105"
                                >
                                    Launch Local Demo <ArrowRight className="ml-2 w-5 h-5" />
                                </Button>
                            </Link>
                            <a href="https://github.com/princepal9120/Perception" target="_blank" rel="noopener noreferrer" className="relative group cursor-pointer">
                                <div className="absolute inset-0 bg-[#FF4500]/20 blur-xl rounded-full opacity-0 group-hover:opacity-50 transition-opacity duration-500" />
                                <div className="relative border border-white/20 bg-white/5 backdrop-blur-sm px-6 py-3 rounded-full flex items-center gap-3 text-sm text-white/80 uppercase tracking-widest hover:bg-white/10 transition-colors duration-300">
                                    <span>View on GitHub</span>
                                </div>
                            </a>
                        </div>
                    </Reveal>

                    {/* Metadata */}
                    <Reveal delay={0.4}>
                        <div className="flex items-center justify-center gap-4 text-xs text-white/40 uppercase tracking-widest font-mono">
                            <span>Agentic AI</span>
                            <span className="w-px h-3 bg-white/20" />
                            <span>Deep Research</span>
                            <span className="w-px h-3 bg-white/20" />
                            <span>BYO Model</span>
                        </div>
                    </Reveal>
                </motion.div>
            </div>

            {/* Noise Texture Overlay */}
            <div className="absolute inset-0 z-30 pointer-events-none opacity-[0.05] mix-blend-overlay noise-overlay" />
        </section>
    );
};
