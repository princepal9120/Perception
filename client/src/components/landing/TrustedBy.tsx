import React from 'react';

const companies = [
    "Acme Corp", "Quantum", "Nebula", "Vertex", "Horizon", "Pinnacle"
];

export const TrustedBy = () => {
    return (
        <section className="py-12 border-y border-ai-border/30 bg-black/50 backdrop-blur-sm">
            <div className="container mx-auto px-4 text-center">
                <p className="text-sm text-gray-500 mb-8 uppercase tracking-widest font-medium">Trusted by innovative teams</p>
                <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-50">
                    {companies.map((company, index) => (
                        <div
                            key={index}
                            className="text-xl font-bold text-gray-400 hover:text-white hover:opacity-100 transition-all duration-300 cursor-default hover:shadow-glow px-4 py-2 rounded-lg"
                        >
                            {company}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
