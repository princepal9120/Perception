import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export const Navbar = () => {
    const [isScrolled, setIsScrolled] = React.useState(false);

    React.useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <motion.nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled ? 'py-4 bg-[#050505]/80 backdrop-blur-md border-b border-white/5' : 'py-6 bg-transparent'}`}
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
            <div className="container mx-auto px-6 flex items-center justify-between">
                {/* Brand */}
                <Link to="/" className="text-2xl font-bold tracking-tighter font-serif">
                    Perception.
                </Link>

                {/* Navigation Links */}
                <div className="hidden md:flex items-center space-x-8">
                    {['Features', 'Pricing', 'Documentation'].map((item) => (
                        <a
                            key={item}
                            href={`#${item.toLowerCase()}`}
                            className="text-sm text-gray-400 hover:text-white transition-colors duration-300"
                        >
                            {item}
                        </a>
                    ))}
                </div>

                {/* CTA Button */}
                <Link to="/chat">
                    <Button className="bg-white text-black hover:bg-gray-200 rounded-full px-6 py-2 text-sm font-medium transition-all hover:scale-105">
                        Get Started
                    </Button>
                </Link>
            </div>
        </motion.nav>
    );
};
