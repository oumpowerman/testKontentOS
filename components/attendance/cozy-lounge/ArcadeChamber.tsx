import React from 'react';
import { motion } from 'framer-motion';
import { User } from '../../../types/core';
import { SideProfileCharacter } from './SideProfileCharacter';

interface Resident {
    user: User;
    posX: string;
    posY: string;
    direction: 'left' | 'right';
    pose: 'idle' | 'sleeping' | 'drinking' | 'gaming' | 'singing' | 'stretching' | 'lifting' | 'sitting' | 'sleeping_bed' | 'lifting_bench' | 'punching';
    actionText: string;
    statusIcon: string;
    zoneIdx: number;
}

interface ArcadeChamberProps {
    residents: Resident[];
    selectedUser: User | null;
    setSelectedUser: (user: User | null) => void;
    activeHoverZone: number | null;
    setActiveHoverZone: (zoneIdx: number | null) => void;
}

export const ArcadeChamber: React.FC<ArcadeChamberProps> = ({
    residents,
    selectedUser,
    setSelectedUser,
    activeHoverZone,
    setActiveHoverZone
}) => {
    return (
        <div 
            className="relative w-full h-[320px] bg-gradient-to-b from-purple-50/40 to-transparent flex flex-col justify-end"
            onMouseEnter={() => setActiveHoverZone(3)}
            onMouseLeave={() => setActiveHoverZone(null)}
        >
            <span className="absolute left-3 top-12 font-mono text-[8px] font-bold text-purple-500/50 uppercase tracking-widest leading-none">RETRO LOUNGE</span>
            
            {/* SVG BACKGROUND DESIGN */}
            <svg 
                className="absolute inset-0 w-full h-full pointer-events-none z-0" 
                viewBox="0 0 250 320" 
                preserveAspectRatio="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <linearGradient id="pendant-glow-local" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#fbbf24" />
                        <stop offset="100%" stopColor="#fafaf9" stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* Retro Glowing Neon hanging stars */}
                <polygon points="35,55 38,62 45,63 40,68 41,75 35,71 29,75 30,68 25,63 32,62" fill="#f43f5e" stroke="#0f172a" strokeWidth="1.2" />
                <polygon points="190,40 193,47 200,48 195,53 196,60 190,56 184,60 185,53 180,48 187,47" fill="#a855f7" stroke="#0f172a" strokeWidth="1.2" />

                {/* RETRO ARCADE CABINET */}
                <path d="M 20 280 V 180 L 34 170 H 58 L 64 185 L 45 210 H 64 V 280 Z" fill="#312e81" stroke="#0f172a" strokeWidth="2.2" />
                {/* Lightup marquee banner */}
                <path d="M 34 170 H 58 L 54 182 H 38 Z" fill="#ec4899" stroke="#0f172a" strokeWidth="1.5" />
                {/* Glowing 8bit CRT Game Screen */}
                <polygon points="38,187 54,187 50,206 41,206" fill="#06b6d4" stroke="#0f172a" strokeWidth="1.5" />
                {/* Control deck joystick panel sticking out */}
                <rect x="36" y="208" width="22" height="6" rx="1.5" fill="#facc15" stroke="#0f172a" strokeWidth="1.5" />

                {/* COMPACT STAGE BOARD GRID */}
                <rect x="110" y="268" width="115" height="12" rx="3" fill="#b45309" stroke="#0f172a" strokeWidth="2.2" />
                {/* Stage Front plank steps texture */}
                <line x1="130" y1="268" x2="130" y2="280" stroke="#78350f" strokeWidth="1.5" />
                <line x1="160" y1="268" x2="160" y2="280" stroke="#78350f" strokeWidth="1.5" />
                <line x1="190" y1="268" x2="190" y2="280" stroke="#78350f" strokeWidth="1.5" />

                {/* Stage Spotlight Cones overlay */}
                <polygon points="165,0 175,0 220,268 120,268" fill="url(#pendant-glow-local)" opacity="0.12" />

                {/* Professional Standing Microphone Stand on Stage (Adjusted scale and facing right to mouth of singer facing left) */}
                <line x1="114" y1="232" x2="114" y2="268" stroke="#0f172a" strokeWidth="1.8" />
                {/* Round iron weight baseline circle */}
                <ellipse cx="114" cy="268" rx="8" ry="2" fill="#475569" stroke="#0f172a" strokeWidth="1.5" />
                {/* Boom arm angle pointing right towards singer */}
                <line x1="114" y1="232" x2="126" y2="225" stroke="#0f172a" strokeWidth="2" />
                {/* Microphone head capsule */}
                <circle cx="128" cy="223" r="2.5" fill="#94a3b8" stroke="#0f172a" strokeWidth="1.5" />
            </svg>

            {/* CHARACTER RENDERING LAYER */}
            <div className="absolute inset-0 z-10 pointer-events-auto">
                {residents.map((resident) => {
                    const isDeepSelected = selectedUser?.id === resident.user.id;
                    return (
                        <div
                            key={resident.user.id}
                            className="absolute cursor-pointer transition-all duration-500 ease-out z-[90] group text-center"
                            style={{
                                left: resident.posX,
                                top: resident.posY,
                                transform: `translate(-50%, -100%) scale(${isDeepSelected ? 1.15 : 1.0})`,
                                zIndex: isDeepSelected ? 200 : 100
                            }}
                            onClick={() => setSelectedUser(resident.user)}
                        >
                            <motion.div
                                whileHover={{ y: -3.5 }}
                                className="relative flex flex-col items-center"
                            >
                                {/* Floating Balloon */}
                                <div className="absolute -top-[16px] bg-slate-900 border border-slate-700 text-[8px] text-white px-1.5 py-[1.5px] rounded-full flex items-center justify-center gap-1 shadow-md scale-95 opacity-90 group-hover:scale-105 group-hover:opacity-100 transition-all select-none">
                                    <span>{resident.statusIcon}</span>
                                    <span className="font-bold">{resident.user.name}</span>
                                </div>

                                <SideProfileCharacter
                                    user={resident.user}
                                    pose={resident.pose}
                                    direction={resident.direction}
                                    scale={0.88}
                                />

                                {/* Hover tooltip bubble card */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-5 hidden group-hover:block bg-slate-950 text-white text-[9.5px] font-black px-2.5 py-1.5 rounded-lg shadow-xl border border-slate-800 whitespace-nowrap z-[300]">
                                    <div className="flex items-center gap-1">
                                        <span className="text-amber-400 font-bold">{resident.user.name}</span>
                                        {resident.user.emoji && <span className="text-slate-400 font-normal">{resident.user.emoji}</span>}
                                    </div>
                                    <div className="text-[8px] text-slate-300 font-normal mt-0.5 max-w-[180px] whitespace-normal leading-tight">
                                        {resident.actionText}
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
