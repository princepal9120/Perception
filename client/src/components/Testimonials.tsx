import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
    {
        name: "Dr. Sarah Chen",
        role: "Research Scientist",
        company: "MIT",
        content: "Perception has transformed how I conduct research. The ability to chat with multiple documents simultaneously saves me hours every week.",
        rating: 5,
        avatar: "SC",
    },
    {
        name: "Michael Rodriguez",
        role: "Content Writer",
        company: "TechCrunch",
        content: "The voice interaction feature is a game-changer. I can brainstorm ideas while walking and get instant, well-researched responses.",
        rating: 5,
        avatar: "MR",
    },
    {
        name: "Emma Thompson",
        role: "PhD Candidate",
        company: "Stanford",
        content: "Best AI research tool I've used. The web search integration with citations makes fact-checking effortless.",
        rating: 5,
        avatar: "ET",
    },
];

export const Testimonials = () => {
    return (
        <section className="py-32 px-4 relative overflow-hidden bg-background">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-b from-secondary/5 via-transparent to-secondary/5 pointer-events-none" />

            <div className="container mx-auto max-w-7xl relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-20"
                >
                    <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
                        Loved by <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Researchers</span>
                    </h2>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        Join thousands of researchers, writers, and knowledge workers who trust Perception.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {testimonials.map((testimonial, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: index * 0.1 }}
                            className="group relative"
                        >
                            <div className="glass-panel p-8 rounded-3xl h-full flex flex-col hover:shadow-glow transition-all duration-500">
                                {/* Quote icon */}
                                <Quote className="w-10 h-10 text-primary/20 mb-6" />

                                {/* Rating */}
                                <div className="flex gap-1 mb-4">
                                    {[...Array(testimonial.rating)].map((_, i) => (
                                        <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                                    ))}
                                </div>

                                {/* Content */}
                                <p className="text-foreground/90 leading-relaxed mb-8 flex-grow">
                                    "{testimonial.content}"
                                </p>

                                {/* Author */}
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold">
                                        {testimonial.avatar}
                                    </div>
                                    <div>
                                        <div className="font-semibold text-foreground">{testimonial.name}</div>
                                        <div className="text-sm text-muted-foreground">
                                            {testimonial.role} at {testimonial.company}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
