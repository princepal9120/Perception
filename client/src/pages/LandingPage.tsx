import React from 'react';
import { Navbar } from '@/components/landing/Navbar';
import { Hero } from '@/components/landing/Hero';
import { Features } from '@/components/landing/Features';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { Demo } from '@/components/landing/Demo';
import { Pricing } from '@/components/landing/Pricing';
import { Testimonials } from '@/components/landing/Testimonials';
import { CTA } from '@/components/landing/CTA';
import { Footer } from '@/components/landing/Footer';

const LandingPage = () => {
    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#FF4500] selection:text-white relative">
            {/* Global Noise Overlay */}
            <div className="fixed inset-0 z-[100] pointer-events-none opacity-[0.03] mix-blend-overlay noise-overlay" />

            <Navbar />
            <Hero />
            <Features />
            <HowItWorks />
            <Demo />
            <Pricing />
            <Testimonials />
            <CTA />
            <Footer />
        </div>
    );
};

export default LandingPage;
