import React from 'react';
import { Github, Twitter, Linkedin } from 'lucide-react';

export const Footer = () => {
    return (
        <footer className="py-12 border-t border-ai-border bg-black text-sm">
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">

                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-gradient-ai" />
                        <span className="font-bold text-white">Perception</span>
                    </div>

                    <div className="flex gap-8 text-gray-400">
                        <a href="#" className="hover:text-white transition-colors">Features</a>
                        <a href="#" className="hover:text-white transition-colors">Pricing</a>
                        <a href="#" className="hover:text-white transition-colors">Docs</a>
                        <a href="#" className="hover:text-white transition-colors">Blog</a>
                    </div>

                    <div className="flex gap-4">
                        <a href="#" className="text-gray-500 hover:text-white transition-colors">
                            <Github className="w-5 h-5" />
                        </a>
                        <a href="#" className="text-gray-500 hover:text-white transition-colors">
                            <Twitter className="w-5 h-5" />
                        </a>
                        <a href="#" className="text-gray-500 hover:text-white transition-colors">
                            <Linkedin className="w-5 h-5" />
                        </a>
                    </div>
                </div>

                <div className="mt-12 text-center text-gray-600 text-xs">
                    © {new Date().getFullYear()} Perception AI. All rights reserved.
                </div>
            </div>
        </footer>
    );
};
