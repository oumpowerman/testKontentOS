import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PastelWaveBackgroundProps {
    enabled?: boolean;
}

// Preset Premium Pastel Color Schemes with Full-Screen Fluid Blobs
const PASTEL_PALETTES = [
    {
        name: 'Strawberry Milk & Lavender 🍓',
        bg: 'from-[#fff5f6] via-[#fbf0ff] to-[#f0f3ff]',
        blobs: [
            { color: 'rgba(244, 63, 94, 0.24)', radiusMult: 0.65, speedX: 0.4, speedY: -0.3, phaseOffset: 0 },
            { color: 'rgba(168, 85, 247, 0.22)', radiusMult: 0.70, speedX: -0.3, speedY: 0.4, phaseOffset: Math.PI * 0.5 },
            { color: 'rgba(236, 72, 153, 0.20)', radiusMult: 0.60, speedX: 0.2, speedY: -0.5, phaseOffset: Math.PI },
            { color: 'rgba(99, 102, 241, 0.24)', radiusMult: 0.75, speedX: -0.4, speedY: -0.2, phaseOffset: Math.PI * 1.5 }
        ]
    },
    {
        name: 'Mint Gelato & Lemon Sorbet 🍏',
        bg: 'from-[#f0fdf4] via-[#fefce8] to-[#ecfeff]',
        blobs: [
            { color: 'rgba(16, 185, 129, 0.20)', radiusMult: 0.65, speedX: 0.35, speedY: -0.25, phaseOffset: 0 },
            { color: 'rgba(234, 179, 8, 0.18)', radiusMult: 0.70, speedX: -0.25, speedY: 0.35, phaseOffset: Math.PI * 0.5 },
            { color: 'rgba(45, 212, 191, 0.22)', radiusMult: 0.60, speedX: 0.25, speedY: -0.45, phaseOffset: Math.PI },
            { color: 'rgba(14, 165, 233, 0.20)', radiusMult: 0.75, speedX: -0.35, speedY: -0.15, phaseOffset: Math.PI * 1.5 }
        ]
    },
    {
        name: 'Peach Sunset & Lilac Sky 🍑',
        bg: 'from-[#fff7ed] via-[#fff1f2] to-[#faf5ff]',
        blobs: [
            { color: 'rgba(249, 115, 22, 0.20)', radiusMult: 0.68, speedX: 0.3, speedY: -0.3, phaseOffset: 0 },
            { color: 'rgba(168, 85, 247, 0.20)', radiusMult: 0.72, speedX: -0.3, speedY: 0.3, phaseOffset: Math.PI * 0.5 },
            { color: 'rgba(244, 63, 94, 0.22)', radiusMult: 0.62, speedX: 0.2, speedY: -0.4, phaseOffset: Math.PI },
            { color: 'rgba(236, 72, 153, 0.20)', radiusMult: 0.70, speedX: -0.4, speedY: -0.2, phaseOffset: Math.PI * 1.5 }
        ]
    },
    {
        name: 'Dreamy Cyan & Cotton Candy 🍬',
        bg: 'from-[#f0f9ff] via-[#fdf4ff] to-[#f5f3ff]',
        blobs: [
            { color: 'rgba(6, 182, 212, 0.22)', radiusMult: 0.70, speedX: 0.4, speedY: -0.2, phaseOffset: 0 },
            { color: 'rgba(236, 72, 153, 0.24)', radiusMult: 0.65, speedX: -0.3, speedY: 0.4, phaseOffset: Math.PI * 0.5 },
            { color: 'rgba(56, 189, 248, 0.20)', radiusMult: 0.75, speedX: 0.2, speedY: -0.5, phaseOffset: Math.PI },
            { color: 'rgba(217, 70, 239, 0.22)', radiusMult: 0.62, speedX: -0.4, speedY: -0.3, phaseOffset: Math.PI * 1.5 }
        ]
    }
];

export const PastelWaveBackground: React.FC<PastelWaveBackgroundProps> = ({ enabled = true }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Randomize a premium pastel palette on mount
    const [selectedPalette, setSelectedPalette] = useState(() => {
        const randomIndex = Math.floor(Math.random() * PASTEL_PALETTES.length);
        return PASTEL_PALETTES[randomIndex];
    });

    useEffect(() => {
        if (!enabled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let width = (canvas.width = containerRef.current?.offsetWidth || window.innerWidth);
        let height = (canvas.height = containerRef.current?.offsetHeight || window.innerHeight);

        // Keep canvas pixel-ratio responsive
        const handleResize = () => {
            if (!containerRef.current || !canvas) return;
            width = canvas.width = containerRef.current.offsetWidth;
            height = canvas.height = containerRef.current.offsetHeight;
        };

        const resizeObserver = new ResizeObserver(handleResize);
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        // Initialize drifting full-screen circular liquid color clouds with independent sways
        const blobs = selectedPalette.blobs.map((config, index) => {
            // Distribute starting coordinates across corners and center
            const startPositions = [
                { x: width * 0.2, y: height * 0.2 },
                { x: width * 0.8, y: height * 0.25 },
                { x: width * 0.3, y: height * 0.75 },
                { x: width * 0.75, y: height * 0.8 }
            ];
            const startPos = startPositions[index % startPositions.length];
            return {
                x: startPos.x,
                y: startPos.y,
                vx: config.speedX,
                vy: config.speedY,
                baseRadius: Math.max(width, height) * config.radiusMult * 0.5,
                phase: config.phaseOffset,
                phaseSpeed: 0.0015,
                color: config.color
            };
        });

        // Core Render Loop Engine for Fluid Jelly Color Mesh Gradient
        const animate = (time: number) => {
            ctx.clearRect(0, 0, width, height);

            // Draw full-screen ultra-smooth morphing color fields
            blobs.forEach((blob) => {
                // Update position (smooth infinite screen bounding bounce/retrace)
                blob.x += blob.vx;
                blob.y += blob.vy;

                // Margins allow blob to drift partially off-screen so colors wrap nicely
                const margin = blob.baseRadius * 0.8;
                if (blob.x < -margin) { blob.x = -margin; blob.vx *= -1; }
                if (blob.x > width + margin) { blob.x = width + margin; blob.vx *= -1; }
                if (blob.y < -margin) { blob.y = -margin; blob.vy *= -1; }
                if (blob.y > height + margin) { blob.y = height + margin; blob.vy *= -1; }

                blob.phase += blob.phaseSpeed;

                // Pulsate the size of each jellyfish color cloud organically
                const pulse = 1 + Math.sin(blob.phase * 2) * 0.18;
                const activeRadius = blob.baseRadius * pulse;

                // Draw soft glowing radial gradient centered at the blob's position
                const radialGrad = ctx.createRadialGradient(
                    blob.x,
                    blob.y,
                    0,
                    blob.x,
                    blob.y,
                    activeRadius
                );
                
                radialGrad.addColorStop(0, blob.color);
                // Create intermediate smooth falloff
                radialGrad.addColorStop(0.5, blob.color.replace(/[\d\.]+\)$/, '0.12)'));
                radialGrad.addColorStop(0.8, blob.color.replace(/[\d\.]+\)$/, '0.04)'));
                radialGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

                ctx.fillStyle = radialGrad;
                ctx.beginPath();
                ctx.arc(blob.x, blob.y, activeRadius, 0, Math.PI * 2);
                ctx.fill();
            });

            animationFrameId = requestAnimationFrame(animate);
        };

        animationFrameId = requestAnimationFrame(animate);

        return () => {
            cancelAnimationFrame(animationFrameId);
            resizeObserver.disconnect();
        };
    }, [enabled, selectedPalette]);

    // Switch color palette beautifully
    const cyclePalette = () => {
        setSelectedPalette((prev) => {
            const currentIndex = PASTEL_PALETTES.findIndex(p => p.name === prev.name);
            const nextIndex = (currentIndex + 1) % PASTEL_PALETTES.length;
            return PASTEL_PALETTES[nextIndex];
        });
    };

    return (
        <div 
            ref={containerRef} 
            className="fixed inset-0 w-full h-full pointer-events-none overflow-hidden select-none z-0 transition-all duration-[1200ms] ease-out-quint"
        >
            <AnimatePresence>
                {enabled ? (
                    <motion.div
                        key="canvas-container"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.2 }}
                        className={`absolute inset-0 bg-gradient-to-tr ${selectedPalette.bg} transition-colors duration-[1500ms] w-full h-full`}
                    >
                        <canvas 
                            ref={canvasRef} 
                            className="absolute top-0 left-0 w-full h-full opacity-90"
                        />
                        
                        {/* Switch color scheme buttons */}
                        <div className="absolute bottom-4 right-16 pointer-events-auto z-10">
                            <button
                                type="button"
                                onClick={cyclePalette}
                                title={`เปลี่ยนคู่สีพาสเทล: ${selectedPalette.name}`}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/70 hover:bg-white/95 border border-white/50 backdrop-blur-md rounded-full shadow-sm hover:shadow text-[9.5px] text-indigo-700 font-extrabold transition-all duration-300 transform scale-90 hover:scale-95 active:scale-90"
                            >
                                <span className="flex h-2 w-2 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
                                </span>
                                {selectedPalette.name} (สุ่มคู่สีคู่ถัดไป)
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="fallback-bg"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-50/50 w-full h-full transition-colors duration-[1500ms]"
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default PastelWaveBackground;
