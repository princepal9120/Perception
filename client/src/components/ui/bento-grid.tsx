import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export const BentoGrid = ({
    className,
    children,
}: {
    className?: string;
    children?: React.ReactNode;
}) => {
    return (
        <div
            className={cn(
                "grid md:auto-rows-[20rem] grid-cols-1 md:grid-cols-3 gap-4 max-w-7xl mx-auto ",
                className
            )}
        >
            {children}
        </div>
    );
};

export const BentoGridItem = ({
    className,
    title,
    description,
    header,
    icon,
}: {
    className?: string;
    title?: string | React.ReactNode;
    description?: string | React.ReactNode;
    header?: React.ReactNode;
    icon?: React.ReactNode;
}) => {
    return (
        <div
            className={cn(
                "row-span-1 rounded-xl group/bento hover:shadow-xl transition duration-200 shadow-input dark:shadow-none p-4 dark:bg-black dark:border-white/[0.2] bg-white border border-transparent justify-between flex flex-col space-y-4",
                "glass-card border-ai-border/50 bg-black/40 overflow-hidden relative",
                className
            )}
        >
            {/* Header / Graphic Area */}
            <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl overflow-hidden relative">
                {header}

                {/* Overlay gradient for text readability if needed, though we separate text usually */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover/bento:opacity-100 transition-opacity duration-300" />
            </div>

            {/* Content Area */}
            <div className="group-hover/bento:translate-x-2 transition duration-200 relative z-10">
                <div className="mb-2 w-fit p-2 rounded-lg bg-ai-surface border border-ai-border/50 text-ai-primary">
                    {icon}
                </div>
                <div className="font-sans font-bold text-neutral-200 mb-2 mt-2 text-lg">
                    {title}
                </div>
                <div className="font-sans font-normal text-neutral-400 text-sm dark:text-neutral-300 leading-relaxed">
                    {description}
                </div>
            </div>

            {/* Hover Effect Background */}
            <div className="absolute inset-0 bg-ai-primary/5 opacity-0 group-hover/bento:opacity-100 transition-opacity duration-500 pointer-events-none" />
        </div>
    );
};
