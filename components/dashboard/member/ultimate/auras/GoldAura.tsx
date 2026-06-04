import React from 'react';
import { motion } from 'framer-motion';

export const GoldAura: React.FC = () => {
    // Generate rising ember arrays
    const embers = Array.from({ length: 7 }, (_, i) => i);
    // Generate horizontal flame streams
    const streams = Array.from({ length: 4 }, (_, i) => i);

    return (
        <div className="relative w-0 h-0 flex items-center justify-center">
            {/* 1. Concentric Golden Double Rings under feet */}
            <motion.div
                animate={{ 
                    scale: [0.9, 1.35, 0.9],
                    opacity: [0.3, 0.8, 0.3],
                    rotate: 360
                }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "linear"
                }}
                className="absolute w-20 h-10 rounded-full border-2 border-dashed border-amber-500 bg-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.4)]"
                style={{ transform: 'translateY(-4px)' }}
            />

            <motion.div
                animate={{ 
                    scale: [1.2, 0.95, 1.2],
                    opacity: [0.2, 0.6, 0.2] 
                }}
                transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="absolute w-24 h-12 rounded-full border border-yellow-400 bg-transparent shadow-[0_0_25px_rgba(253,224,71,0.25)]"
                style={{ transform: 'translateY(-4px)' }}
            />

            {/* 2. Intense Burning Amber Backdrop Glow */}
            <motion.div
                animate={{
                    opacity: [0.65, 0.9, 0.65],
                    scale: [0.95, 1.1, 0.95]
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="absolute w-16 h-28 rounded-full bg-gradient-to-t from-orange-600/20 via-amber-400/15 to-transparent blur-xl"
                style={{ transform: 'translateY(-30px)' }}
            />

            {/* 3. Rising Flame Streams (Super Saiyan Power Flares) */}
            {streams.map(id => {
                const rotation = (id * 15) - 22.5; // Fan outwards
                const scaleX = 0.85 + (id * 0.1);
                const translationX = (id * 12) - 18;

                return (
                    <motion.div
                        key={`stream-${id}`}
                        animate={{
                            height: [20, 65, 20],
                            opacity: [0.3, 0.9, 0.3],
                            y: [0, -10, 0]
                        }}
                        transition={{
                            duration: 1.8 + (id * 0.3),
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: id * 0.2
                        }}
                        className="absolute bottom-0 w-3 rounded-full bg-gradient-to-t from-orange-500/40 via-yellow-400/40 to-transparent blur-[3px]"
                        style={{
                            left: `${translationX}px`,
                            originY: 1,
                            transform: `rotate(${rotation}deg) scaleX(${scaleX})`,
                            bottom: '2px'
                        }}
                    />
                );
            })}

            {/* 4. Tiny sparkles & embers rising up in spiral trajectories */}
            {embers.map(id => {
                const spreadX = (id * 12) - 36;
                const animDuration = 1.6 + (id * 0.25);
                const animDelay = id * 0.35;

                return (
                    <motion.div
                        key={`ember-${id}`}
                        initial={{ x: spreadX, y: 0, opacity: 0, scale: 0.5 }}
                        animate={{ 
                            y: [-4, -60 - (id * 2)], 
                            opacity: [0, 1, 0],
                            x: [spreadX, spreadX + (id % 2 === 0 ? 16 : -16), spreadX],
                            scale: [0.5, 1.25, 0.5]
                        }}
                        transition={{
                            duration: animDuration,
                            delay: animDelay,
                            repeat: Infinity,
                            ease: "easeOut"
                        }}
                        className="absolute text-orange-400 pointer-events-none filter drop-shadow-[0_0_4px_rgba(249,115,22,0.8)]"
                    >
                        {id % 2 === 0 ? '🔥' : '✦'}
                    </motion.div>
                );
            })}

            {/* 5. Electric crackle sparks ("Z" lightning feel) */}
            <motion.div
                animate={{
                    opacity: [0, 0.9, 0, 0.7, 0],
                    scale: [0.4, 1.1, 0.8, 1.3, 0.4],
                    rotate: [0, 20, -10, 40, 0]
                }}
                transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="absolute text-yellow-300 text-xs font-bold font-mono filter drop-shadow-[0_0_6px_rgba(253,224,71,1)] select-none pointer-events-none"
                style={{ transform: 'translate(-12px, -35px)' }}
            >
                ⚡
            </motion.div>

            <motion.div
                animate={{
                    opacity: [0, 0.8, 0, 0.9, 0],
                    scale: [0.4, 0.9, 0.4, 1.2, 0.4],
                    rotate: [25, -15, 30, 0, 25]
                }}
                transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.8
                }}
                className="absolute text-amber-200 text-xs font-bold font-mono filter drop-shadow-[0_0_6px_rgba(245,158,11,1)] select-none pointer-events-none"
                style={{ transform: 'translate(14px, -20px)' }}
            >
                ⚡
            </motion.div>
        </div>
    );
};

export default GoldAura;
