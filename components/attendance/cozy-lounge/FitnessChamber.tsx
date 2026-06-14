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

interface FitnessChamberProps {
    residents: Resident[];
    selectedUser: User | null;
    setSelectedUser: (user: User | null) => void;
    activeHoverZone: number | null;
    setActiveHoverZone: (zoneIdx: number | null) => void;
}

export const FitnessChamber: React.FC<FitnessChamberProps> = ({
    residents,
    selectedUser,
    setSelectedUser,
    activeHoverZone,
    setActiveHoverZone
}) => {
    return (
        <div 
            className="relative w-full h-[320px] bg-gradient-to-b from-emerald-50/40 to-transparent flex flex-col justify-end"
            onMouseEnter={() => setActiveHoverZone(2)}
            onMouseLeave={() => setActiveHoverZone(null)}
        >
            <span className="absolute left-3 top-12 font-mono text-[8px] font-bold text-emerald-500/50 uppercase tracking-widest leading-none">FITNESS BOX</span>
            
            {/* SVG BACKGROUND DESIGN */}
            <svg 
                className="absolute inset-0 w-full h-full pointer-events-none z-0" 
                viewBox="0 0 250 320" 
                preserveAspectRatio="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* Hanging punching box bag (lowered to align with boxer) */}
                <line x1="35" y1="0" x2="35" y2="180" stroke="#475569" strokeWidth="1.8" />
                <rect x="22" y="180" width="26" height="72" rx="6" fill="#ef4444" stroke="#0f172a" strokeWidth="2.2" />
                <rect x="22" y="202" width="26" height="15" fill="#ffffff" stroke="#0f172a" strokeWidth="1.5" />

                {/* GREEN/YOGA MAT FLAT */}
                <rect x="92" y="274" width="46" height="6" rx="2" fill="#10b981" stroke="#0f172a" strokeWidth="1.8" />

                {/* BENCH PRESS SYSTEM */}
                {/* Upright metal safety rack sticks */}
                <line x1="180" y1="210" x2="180" y2="280" stroke="#334155" strokeWidth="3" />
                <line x1="212" y1="210" x2="212" y2="280" stroke="#334155" strokeWidth="3" />
                <path d="M 175 210 H 185 M 207 210 H 217" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
                
                {/* Horizontal Bench padded deck red/black */}
                <rect x="168" y="245" width="56" height="11" rx="2.5" fill="#dc2626" stroke="#0f172a" strokeWidth="2" />
                
                {/* Bench support metal leg */}
                <line x1="196" y1="256" x2="196" y2="280" stroke="#0f172a" strokeWidth="2" />
                
                {/* Barbell resting on the rack hooks */}
                <line x1="162" y1="210" x2="230" y2="210" stroke="#475569" strokeWidth="2.5" />
                {/* Plate weights */}
                <rect x="156" y="200" width="6" height="20" rx="1.5" fill="#1e293b" stroke="#0f172a" strokeWidth="1.8" />
                <rect x="230" y="200" width="6" height="20" rx="1.5" fill="#1e293b" stroke="#0f172a" strokeWidth="1.8" />
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
