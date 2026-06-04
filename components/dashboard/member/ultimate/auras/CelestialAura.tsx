import React from 'react';
import { motion } from 'framer-motion';

export const CelestialAura: React.FC = () => {
    // Orbs/Spheres revolving around the wizard body
    const runicGlyphs = Array.from({ length: 3 }, (_, i) => i);
    const starbursts = Array.from({ length: 8 }, (_, i) => i);

    return (
        <div className="relative w-0 h-0 flex items-center justify-center">
            {/* 1. Deep Space Nebular Back-glow Layer (Purple & Indigo & Pink Nebula) */}
            <motion.div
                animate={{
                    scale: [1, 1.25, 1],
                    opacity: [0.75, 0.95, 0.75],
                }}
                transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="absolute w-24 h-32 rounded-full bg-gradient-to-t from-fuchsia-950/40 via-violet-900/30 to-sky-500/10 blur-2xl"
                style={{ transform: 'translateY(-35px)' }}
            />

            {/* 2. Mystical Rotating Magic Circles under feet (Isometric 2:1 projection) */}
            <motion.div
                animate={{ 
                    rotate: 360,
                    scale: [0.95, 1.15, 0.95],
                }}
                transition={{
                    duration: 12,
                    repeat: Infinity,
                    ease: "linear"
                }}
                className="absolute w-24 h-12 rounded-full border-2 border-indigo-400/60 bg-transparent shadow-[0_0_35px_rgba(129,140,248,0.5)] flex items-center justify-center"
                style={{ transform: 'translateY(-4px)' }}
            >
                {/* Inner ring */}
                <div className="w-[85%] h-[85%] rounded-full border border-pink-400/40 border-dotted" />
            </motion.div>

            <motion.div
                animate={{ 
                    rotate: -360,
                    scale: [1.1, 0.85, 1.1],
                }}
                transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "linear"
                }}
                className="absolute w-28 h-14 rounded-full border border-dashed border-rose-400/35 bg-pink-500/5 shadow-[0_0_20px_rgba(244,63,94,0.2)]"
                style={{ transform: 'translateY(-4px)' }}
            />

            {/* 3. Orbiting Astral Spheres (Revolving 3D-like orbits around their torso) */}
            {runicGlyphs.map(id => {
                const angleOffset = (id * (360 / runicGlyphs.length));
                
                return (
                    <motion.div
                        key={`orb-${id}`}
                        animate={{
                            rotate: [0, 360],
                        }}
                        transition={{
                            duration: 4.5 + (id * 1.5),
                            repeat: Infinity,
                            ease: "linear"
                        }}
                        className="absolute w-12 h-6 pointer-events-none"
                        style={{
                            transform: `translateY(-24px) rotate(${angleOffset}deg)`,
                            transformOrigin: 'center center'
                        }}
                    >
                        <motion.div 
                            animate={{
                                scale: [0.75, 1.3, 0.75],
                                opacity: [0.55, 1, 0.55]
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            className={`w-2.5 h-2.5 rounded-full filter blur-[1px] ${
                                id === 0 ? 'bg-fuchsia-400 shadow-[0_0_8px_#f53fd3]' :
                                id === 1 ? 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]' :
                                'bg-yellow-400 shadow-[0_0_8px_#facc15]'
                            }`}
                            style={{ 
                                position: 'absolute', 
                                top: '0px', 
                                left: '50%',
                                transform: 'translateX(-50%)' 
                            }}
                        />
                    </motion.div>
                );
            })}

            {/* 4. Falling and rising cosmological star sparks */}
            {starbursts.map(id => {
                const spreadX = (id * 10) - 35;
                const animDuration = 2 + (id * 0.3);
                const animDelay = id * 0.45;

                return (
                    <motion.span
                        key={`star-${id}`}
                        initial={{ x: spreadX, y: 0, opacity: 0, scale: 0.4 }}
                        animate={{ 
                            y: [-12, -74 - (id * 3)], 
                            opacity: [0, 1, 0],
                            scale: [0.4, 1.4, 0.4],
                            rotate: [0, 180]
                        }}
                        transition={{
                            duration: animDuration,
                            delay: animDelay,
                            repeat: Infinity,
                            ease: "easeOut"
                        }}
                        className={`absolute text-[10px] pointer-events-none filter drop-shadow-[0_0_5px_rgba(255,255,255,0.9)] ${
                            id % 3 === 0 ? 'text-indigo-200' :
                            id % 3 === 1 ? 'text-fuchsia-200' :
                            'text-cyan-200'
                        }`}
                    >
                        ✦
                    </motion.span>
                );
            })}

            {/* 5. Pure Light Rings Pulsing Up (Super Saiyan God rising flares) */}
            <motion.div
                animate={{
                    y: [10, -50],
                    scale: [0.6, 1.3],
                    opacity: [0, 0.7, 0]
                }}
                transition={{
                    duration: 2.2,
                    repeat: Infinity,
                    ease: "easeOut"
                }}
                className="absolute w-12 h-6 border-t-2 border-cyan-400/90 rounded-full blur-[1px]"
                style={{ transform: 'translateY(-10px)' }}
            />

            <motion.div
                animate={{
                    y: [10, -50],
                    scale: [0.6, 1.3],
                    opacity: [0, 0.7, 0]
                }}
                transition={{
                    duration: 2.2,
                    repeat: Infinity,
                    ease: "easeOut",
                    delay: 1.1
                }}
                className="absolute w-12 h-6 border-t-2 border-fuchsia-400/90 rounded-full blur-[1px]"
                style={{ transform: 'translateY(-10px)' }}
            />
        </div>
    );
};

export default CelestialAura;
