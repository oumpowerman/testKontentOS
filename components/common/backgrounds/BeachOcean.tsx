import React from 'react';
import { motion } from 'framer-motion';

// Generate cloud properties for beach sky
const clouds = Array.from({ length: 4 }).map((_, i) => ({
    id: `beach-cloud-${i}`,
    y: `${10 + Math.random() * 20}%`,
    scale: Math.random() * 0.4 + 0.6,
    duration: Math.random() * 35 + 45,
    delay: Math.random() * -30,
    opacity: Math.random() * 0.25 + 0.5
}));

const BeachOcean: React.FC = () => {
    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-gradient-to-b from-sky-200 via-sky-100 to-amber-50">
            <style>{`
                @keyframes beach-cloud-move {
                    0% { transform: translateX(-50vw); }
                    100% { transform: translateX(120vw); }
                }
                @keyframes boat-sway {
                    0%, 100% { transform: translateY(0) rotate(-2deg); }
                    50% { transform: translateY(-4px) rotate(3deg); }
                }
                @keyframes wave-ebb-flow-1 {
                    0%, 100% { transform: scaleY(1) translateY(0); }
                    50% { transform: scaleY(1.08) translateY(-6px); }
                }
                @keyframes wave-ebb-flow-2 {
                    0%, 100% { transform: scaleY(1.05) translateY(-3px) translateX(-10px); }
                    50% { transform: scaleY(0.95) translateY(3px) translateX(10px); }
                }
                @keyframes wave-ebb-flow-3 {
                    0%, 100% { transform: scaleY(1) translateY(4px) translateX(15px); }
                    50% { transform: scaleY(1.15) translateY(-8px) translateX(-15px); }
                }
                @keyframes palm-sway {
                    0%, 100% { transform: rotate(0deg); }
                    50% { transform: rotate(3deg); }
                }
                @keyframes sparkles-fade {
                    0%, 100% { opacity: 0.2; transform: scale(0.8); }
                    50% { opacity: 0.8; transform: scale(1.2); }
                }
            `}</style>

            {/* Glowing Sun */}
            <motion.div 
                className="absolute top-16 left-1/4 w-24 h-24 bg-amber-100 rounded-full blur-[1px] shadow-[0_0_60px_rgba(251,191,36,0.5)]"
                animate={{ scale: [1, 1.04, 1], opacity: [0.85, 0.95, 0.85] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Drifting Sky Clouds */}
            {clouds.map((cloud) => (
                <div
                    key={cloud.id}
                    className="absolute"
                    style={{ 
                        top: cloud.y, 
                        transform: `scale(${cloud.scale})`, 
                        opacity: cloud.opacity,
                        animation: `beach-cloud-move ${cloud.duration}s linear infinite`,
                        animationDelay: `${cloud.delay}s`
                    }}
                >
                    <svg width="180" height="50" viewBox="0 0 200 60" fill="white" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-sm opacity-90">
                        <path d="M50 30 C 50 12, 90 12, 90 30 C 90 2, 150 2, 150 30 C 180 30, 180 58, 150 58 L 50 58 C 20 58, 20 30, 50 30 Z" />
                    </svg>
                </div>
            ))}

            {/* Little Sailboat floating on the horizon */}
            <div 
                className="absolute top-[45%] right-[25%] w-10 h-10 select-none opacity-80"
                style={{ animation: 'boat-sway 5s ease-in-out infinite' }}
            >
                <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                    <path d="M15 65 L85 65 L75 80 L25 80 Z" fill="#64748b" />
                    <path d="M50 15 L50 65" stroke="#475569" strokeWidth="3" />
                    <path d="M50 18 Q30 35 50 55 Z" fill="#f8fafc" />
                    <path d="M52 23 Q68 38 52 50 Z" fill="#e2e8f0" />
                </svg>
            </div>

            {/* Ocean Layer 1 - Deep Blue / Far horizon */}
            <div className="absolute inset-x-0 bottom-0 top-[50%] bg-gradient-to-b from-sky-400/80 to-blue-500/60 z-0">
                {/* Sparkles on far water */}
                <div className="absolute inset-0 opacity-40">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div 
                            key={`beach-sparkle-${i}`}
                            className="absolute w-1 h-1 bg-white rounded-full"
                            style={{
                                top: `${20 + Math.random() * 50}%`,
                                left: `${5 + Math.random() * 90}%`,
                                animation: `sparkles-fade ${2 + Math.random() * 3}s infinite ease-in-out`,
                                animationDelay: `${Math.random() * 2}s`
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* Ocean Layer 2 - Wave Transition (Teal) */}
            <div 
                className="absolute inset-x-0 bottom-0 h-[45%] origin-bottom z-1 pointer-events-none"
                style={{
                    animation: 'wave-ebb-flow-1 8s ease-in-out infinite'
                }}
            >
                <svg viewBox="0 0 1440 160" preserveAspectRatio="none" className="w-full h-24 text-teal-400/60 fill-current">
                    <path d="M0,96 C280,128 560,32 840,64 C1120,96 1280,128 1440,96 L1440,160 L0,160 Z" />
                </svg>
                <div className="absolute inset-x-0 bottom-0 top-16 bg-teal-400/60" />
            </div>

            {/* Ocean Layer 3 - Gentle Shoreline wave (Mint / Cream froth) */}
            <div 
                className="absolute inset-x-0 bottom-0 h-[38%] origin-bottom z-2 pointer-events-none"
                style={{
                    animation: 'wave-ebb-flow-2 9s ease-in-out infinite'
                }}
            >
                <svg viewBox="0 0 1440 160" preserveAspectRatio="none" className="w-full h-28 text-emerald-300/40 fill-current">
                    <path d="M0,64 C320,112 640,16 960,80 C1280,144 1360,32 1440,64 L1440,160 L0,160 Z" />
                </svg>
                <div className="absolute inset-x-0 bottom-0 top-20 bg-emerald-300/40" />
            </div>

            {/* Ocean Layer 4 - Beach Foam overlay */}
            <div 
                className="absolute inset-x-0 bottom-0 h-[30%] origin-bottom z-3 pointer-events-none"
                style={{
                    animation: 'wave-ebb-flow-3 7s ease-in-out infinite'
                }}
            >
                <svg viewBox="0 0 1440 160" preserveAspectRatio="none" className="w-full h-28 text-sky-100/50 fill-current">
                    <path d="M0,80 C400,20 800,120 1200,40 C1320,15 1380,45 1440,80 L1440,160 L0,160 Z" />
                </svg>
                <div className="absolute inset-x-0 bottom-0 top-24 bg-sky-100/50" />
            </div>

            {/* Soft Warm Sand Layer at the very bottom */}
            <div className="absolute inset-x-0 bottom-0 h-[20%] bg-gradient-to-b from-amber-100 to-amber-200/90 z-4">
                {/* Wet Sand Glow Line */}
                <div className="absolute inset-x-0 top-0 h-1.5 bg-amber-50/60 blur-[3px]" />
            </div>

            {/* Silhouette Palm tree sway on the left side */}
            <div 
                className="absolute -bottom-10 -left-10 w-48 h-80 z-5 select-none opacity-40 origin-bottom-left"
                style={{ animation: 'palm-sway 8s ease-in-out infinite' }}
            >
                <svg viewBox="0 0 120 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                    {/* Trunk */}
                    <path d="M30 200 Q 40 120 70 50" stroke="#78350f" strokeWidth="12" strokeLinecap="round" />
                    {/* Palm Leaves */}
                    <path d="M70 50 Q 10 30 5 80" stroke="#047857" strokeWidth="8" strokeLinecap="round" />
                    <path d="M70 50 Q 40 10 100 50" stroke="#059669" strokeWidth="8" strokeLinecap="round" />
                    <path d="M70 50 Q 110 20 130 90" stroke="#047857" strokeWidth="8" strokeLinecap="round" />
                    <path d="M70 50 Q 90 90 100 130" stroke="#10b981" strokeWidth="7" strokeLinecap="round" />
                    <path d="M70 50 Q 50 80 20 120" stroke="#065f46" strokeWidth="7" strokeLinecap="round" />
                </svg>
            </div>
        </div>
    );
};

export default BeachOcean;
