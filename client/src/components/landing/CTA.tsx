import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

// --- Helper Component ---

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

export const CTA = () => {
    return (
        <section className="py-32 relative overflow-hidden bg-[#050505]">
            {/* Background Gradients */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-ai-primary/20 rounded-full blur-[120px] animate-pulse-glow" />

            <div className="container mx-auto px-6 relative z-10">
                {/* Mission Statement */}
                <Reveal>
                    <div className="max-w-4xl mx-auto text-center mb-16">
                        <h2 className="text-3xl md:text-5xl lg:text-6xl leading-tight text-white/90 mb-8 font-serif">
                            We design the negative space where your AI truly lives.
                        </h2>
                        <p className="text-xl md:text-2xl text-gray-500 leading-relaxed font-light">
                            Elegance is execution. We remove the noise so your agent delivers with absolute clarity.
                        </p>
                    </div>
                </Reveal>

                {/* CTA */}
                <Reveal delay={0.2}>
                    <div className="text-center">
                        <Link to="/chat">
                            <Button
                                size="lg"
                                className="bg-white text-black hover:bg-gray-200 h-14 px-10 rounded-full text-lg font-bold transition-all hover:scale-105"
                            >
                                Get Started Now <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                        </Link>
                    </div>
                </Reveal>

                {/* Client Logos */}
                <Reveal delay={0.3}>
                    <div className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-items-center opacity-40 grayscale hover:grayscale-0 hover:opacity-60 transition-all duration-500">
                        {['ANTHROPIC', 'OPENAI', 'GEMINI', 'MISTRAL'].map((logo, i) => (
                            <div key={logo} className="font-bold text-lg tracking-widest text-white/60">
                                {logo}
                            </div>
                        ))}
                    </div>
                </Reveal>
            </div>
        </section>
    );
};
