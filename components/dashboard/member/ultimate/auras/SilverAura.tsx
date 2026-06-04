import React from 'react';
import { motion } from 'framer-motion';

export const SilverAura: React.FC = () => {
    // Elegant floating cosmic elements drifting up
    const particles = Array.from({ length: 5 }, (_, i) => i);

    return (
        <div className="relative w-0 h-0 flex items-center justify-center">
            {/* 1. Isometric Ground Aura Ring (2:1 scale for isometric alignment) */}
            <motion.div
                initial={{ scale: 0.8, opacity: 0.1 }}
                animate={{ 
                    scale: [0.8, 1.25, 0.8], 
                    opacity: [0.2, 0.65, 0.2] 
                }}
                transition={{
                    duration: 3.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="absolute w-16 h-8 rounded-full border border-teal-400/50 bg-teal-500/10 shadow-[0_0_15px_rgba(45,212,191,0.3)]"
                style={{ transform: 'translateY(-4px)' }}
            />

            <motion.div
                initial={{ scale: 1.1, opacity: 0.1 }}
                animate={{ 
                    scale: [1.1, 0.75, 1.1], 
                    opacity: [0.15, 0.45, 0.15] 
                }}
                transition={{
                    duration: 4.2,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="absolute w-20 h-10 rounded-full border border-sky-300/30 bg-transparent shadow-[0_0_20px_rgba(125,211,252,0.15)]"
                style={{ transform: 'translateY(-4px)' }}
            />

            {/* 2. Soft Ambient Back-glow */}
            <div 
                className="absolute w-14 h-24 rounded-full bg-gradient-to-t from-teal-500/10 via-sky-400/5 to-transparent blur-xl"
                style={{ transform: 'translateY(-24px)' }}
            />

            {/* 3. Rising sparkles/runes with randomized drift offsets */}
            {particles.map(id => {
                const startX = (id * 14) - 28; // Spread horizontally
                const animDuration = 2.4 + (id * 0.4);
                const animDelay = id * 0.55;

                return (
                    <motion.span
                        key={id}
                        initial={{ x: startX, y: 0, opacity: 0, scale: 0.4 }}
                        animate={{ 
                            y: [-5, -45 - (id * 4)], 
                            opacity: [0, 0.85, 0],
                            scale: [0.4, 1.1, 0.4]
                        }}
                        transition={{
                            duration: animDuration,
                            delay: animDelay,
                            repeat: Infinity,
                            ease: "easeOut"
                        }}
                        className="absolute text-[9px] text-teal-200 select-none pointer-events-none filter drop-shadow-[0_0_3px_#2dd4bf]"
                    >
                        ✦
                    </motion.span>
                );
            })}
        </div>
    );
};

export default SilverAura;
