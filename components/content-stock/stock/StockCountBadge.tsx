
import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform, animate, AnimatePresence } from 'framer-motion';
import { Layers } from 'lucide-react';

interface CounterProps {
    value: number;
}

const Counter: React.FC<CounterProps> = ({ value }) => {
    const count = useMotionValue(0);
    const rounded = useTransform(count, (latest) => Math.round(latest));

    useEffect(() => {
        const controls = animate(count, value, { 
            duration: 1.2, 
            ease: [0.16, 1, 0.3, 1] // Custom easeOutExpo
        });
        return controls.stop;
    }, [value, count]);

    return <motion.span>{rounded}</motion.span>;
};

interface StockCountBadgeProps {
    count: number;
    isLoading?: boolean;
}

const StockCountBadge: React.FC<StockCountBadgeProps> = ({ count, isLoading }) => {
    const [isBouncing, setIsBouncing] = useState(false);

    // Trigger bounce effect when count changes
    useEffect(() => {
        if (count > 0) {
            setIsBouncing(true);
            const timer = setTimeout(() => setIsBouncing(false), 600);
            return () => clearTimeout(timer);
        }
    }, [count]);

    return (
        <motion.div 
            initial={{ opacity: 0, x: -20, scale: 0.8 }}
            animate={{ 
                opacity: 1, 
                x: 0, 
                scale: isBouncing ? [1, 1.15, 1] : 1,
                y: [0, -2, 0] // Subtle floating
            }}
            transition={{
                scale: { duration: 0.4, ease: "easeOut" },
                y: { duration: 3, repeat: Infinity, ease: "easeInOut" }
            }}
            whileHover={{ scale: 1.05, y: -4 }}
            className={`
                inline-flex items-center gap-1.5 sm:gap-2 px-2 py-1 sm:px-4 sm:py-1.5 ml-2 sm:ml-4 rounded-xl sm:rounded-2xl
                bg-gradient-to-br from-indigo-500/10 to-violet-500/10
                backdrop-blur-md border border-indigo-200/50
                shadow-[0_4px_12px_rgba(79,70,229,0.1)]
                transition-all duration-500 cursor-default group
                ${isLoading ? 'opacity-60 grayscale' : 'opacity-100'}
            `}
        >
            <div className="relative">
                <motion.div
                    animate={isBouncing ? { rotate: [0, -20, 20, 0] } : {}}
                    transition={{ duration: 0.5 }}
                >
                    <Layers className={`w-4 h-4 text-indigo-600 ${isLoading ? 'animate-pulse' : 'group-hover:rotate-12 transition-transform'}`} />
                </motion.div>
                
                {/* Decorative glow behind icon */}
                <div className="absolute inset-0 bg-indigo-400/20 blur-lg rounded-full -z-10 animate-pulse" />
            </div>

            <div className="flex items-center gap-1.5">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={count}
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -10, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-lg font-bold text-indigo-800 tabular-nums tracking-tight"
                    >
                        <Counter value={count} />
                    </motion.div>
                </AnimatePresence>
                
                <div className="hidden sm:flex flex-col space-y-0.5">
                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest leading-none">
                        Items
                    </span>
                    <span className="text-[8px] font-bold text-indigo-300 uppercase tracking-tighter leading-none">
                        In Stock
                    </span>
                </div>
            </div>

            {isLoading && (
                <div className="flex gap-0.5 ml-1">
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            animate={{ 
                                scale: [1, 1.5, 1],
                                opacity: [0.3, 1, 0.3]
                            }}
                            transition={{ 
                                duration: 0.8, 
                                repeat: Infinity, 
                                delay: i * 0.15 
                            }}
                            className="w-1 h-1 rounded-full bg-indigo-500"
                        />
                    ))}
                </div>
            )}
            
            {/* Subtle shine effect */}
            <motion.div 
                className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 -translate-x-full"
                animate={{ translateX: ['100%', '-100%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 2 }}
            />
        </motion.div>
    );
};

export default StockCountBadge;
