import React from 'react';
import { Hero } from '@/components/landing/Hero';
import { TrustedBy } from '@/components/landing/TrustedBy';
import { Features } from '@/components/landing/Features';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { Demo } from '@/components/landing/Demo';
import { VoiceDocs } from '@/components/landing/VoiceDocs';
import { Pricing } from '@/components/landing/Pricing';
import { Testimonials } from '@/components/landing/Testimonials';
import { CTA } from '@/components/landing/CTA';
import { Footer } from '@/components/landing/Footer';

const LandingPage = () => {
    return (
        <div className="min-h-screen bg-ai-background text-white font-sans selection:bg-ai-primary/30">
            <Hero />
            <TrustedBy />
            <Features />
            <HowItWorks />
            <Demo />
            <VoiceDocs />
            <Pricing />
            <Testimonials />
            <CTA />
            <Footer />
        </div>
    );
};

export default LandingPage;
