import React from 'react';
import { Github, Twitter, Linkedin } from 'lucide-react';

export const Footer = () => {
    return (
        <footer className="py-20 border-t border-white/5 bg-[#050505] relative overflow-hidden">
            <div className="container mx-auto px-6 relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-12">
                    {/* Large Watermark Brand */}
                    <div>
                        <h2 className="text-[10vw] md:text-[12vw] leading-[0.8] tracking-tighter text-white/[0.03] font-bold select-none pointer-events-none font-serif">
                            PERCEPTION.
                        </h2>
                    </div>

                    {/* Links & Social */}
                    <div className="flex flex-col gap-8 text-right">
                        <div className="flex flex-col gap-4 text-gray-400">
                            <a href="#" className="hover:text-white transition-colors duration-300">Features</a>
                            <a href="#" className="hover:text-white transition-colors duration-300">Pricing</a>
                            <a href="#" className="hover:text-white transition-colors duration-300">Documentation</a>
                        </div>

                        <div className="flex justify-end gap-4">
                            <a href="#" className="text-gray-500 hover:text-white transition-colors duration-300">
                                <Github className="w-5 h-5" />
                            </a>
                            <a href="#" className="text-gray-500 hover:text-white transition-colors duration-300">
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a href="#" className="text-gray-500 hover:text-white transition-colors duration-300">
                                <Linkedin className="w-5 h-5" />
                            </a>
                        </div>

                        <p className="text-sm text-gray-600">© {new Date().getFullYear()} Perception AI. All rights reserved.</p>
                    </div>
                </div>
            </div>
        </footer>
    );
};
