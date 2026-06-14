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

interface SleeperChamberProps {
    residents: Resident[];
    selectedUser: User | null;
    setSelectedUser: (user: User | null) => void;
    activeHoverZone: number | null;
    setActiveHoverZone: (zoneIdx: number | null) => void;
}

export const SleeperChamber: React.FC<SleeperChamberProps> = ({
    residents,
    selectedUser,
    setSelectedUser,
    activeHoverZone,
    setActiveHoverZone
}) => {
    return (
        <div 
            className="relative w-full h-[320px] bg-gradient-to-b from-blue-50/40 to-transparent flex flex-col justify-end"
            onMouseEnter={() => setActiveHoverZone(1)}
            onMouseLeave={() => setActiveHoverZone(null)}
        >
            <span className="absolute left-3 top-12 font-mono text-[8px] font-bold text-blue-500/50 uppercase tracking-widest leading-none">SLEEPER AREA</span>
            
            {/* SVG BACKGROUND DESIGN */}
            <svg 
                className="absolute inset-0 w-full h-full pointer-events-none z-0" 
                viewBox="0 0 250 320" 
                preserveAspectRatio="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* Grid Window */}
                <rect x="65" y="55" width="45" height="50" rx="4" fill="#bae6fd" stroke="#0f172a" strokeWidth="2.2" />
                <line x1="87.5" y1="55" x2="87.5" y2="105" stroke="#0f172a" strokeWidth="1.5" />
                <line x1="65" y1="80" x2="110" y2="80" stroke="#0f172a" strokeWidth="1.5" />
                
                {/* Cute yellow window curtain */}
                <path d="M 65 55 Q 75 75 75 105 Q 65 105 65 55" fill="#fef08a" stroke="#0f172a" strokeWidth="1.5" />
                <path d="M 110 55 Q 100 75 100 105 Q 110 105 110 55" fill="#fef08a" stroke="#0f172a" strokeWidth="1.5" />

                {/* COZY BED */}
                {/* Wooden bed headstand panel */}
                <rect x="14" y="215" width="10" height="65" rx="2" fill="#7c2d12" stroke="#0f172a" strokeWidth="2" />
                {/* Bed base bottom structure */}
                <rect x="24" y="246" width="70" height="34" rx="2" fill="#a16207" stroke="#0f172a" strokeWidth="2" />
                {/* Double Bed soft pink thick mattress */}
                <rect x="24" y="232" width="67" height="15" rx="3" fill="#ffe4e6" stroke="#0f172a" strokeWidth="2" />
                {/* Soft white fluffy pillow */}
                <rect x="27" y="222" width="18" height="11" rx="4" fill="#fafafa" stroke="#0f172a" strokeWidth="1.8" />
                {/* Cosy blanket throw folded down */}
                <path d="M 54 232 H 91 V 247 H 54 Q 58 238 54 232 Z" fill="#60a5fa" stroke="#0f172a" strokeWidth="1.8" />

                {/* COZY PLUSH BEANBAG CUSHION */}
                <ellipse cx="112" cy="275" rx="18" ry="6" fill="#f97316" stroke="#0f172a" strokeWidth="1.8" />
                <ellipse cx="112" cy="271" rx="14" ry="5" fill="#fdba74" stroke="#0f172a" strokeWidth="1.5" />
                <path d="M 104 270 Q 112 274 120 270" stroke="#0f172a" strokeWidth="1.2" fill="none" />

                {/* COZY SOFA (Side-profile comfy couch view) */}
                {/* Back shadow/wooden legs */}
                <line x1="146" y1="274" x2="144" y2="280" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="194" y1="274" x2="196" y2="280" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
                {/* Backrest body frame */}
                <rect x="194" y="222" width="16" height="44" rx="4" fill="#0f766e" stroke="#0f172a" strokeWidth="2" />
                <rect x="190" y="226" width="12" height="34" rx="3" fill="#14b8a6" stroke="#0f172a" strokeWidth="1.8" />
                {/* Cushion base seat */}
                <rect x="146" y="258" width="56" height="18" rx="2" fill="#0d9488" stroke="#0f172a" strokeWidth="2" />
                <rect x="148" y="246" width="50" height="12" rx="3" fill="#14b8a6" stroke="#0f172a" strokeWidth="1.8" />
                {/* Left/front armrest */}
                <rect x="140" y="240" width="10" height="24" rx="3" fill="#14b8a6" stroke="#0f172a" strokeWidth="2" />
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

                                {/* Floating "Zzz" Sleep Indicator */}
                                {(resident.pose === 'sleeping' || resident.pose === 'sleeping_bed') && (
                                    <div className="absolute -top-[30px] -right-[15px] pointer-events-none select-none z-10">
                                        <motion.span
                                            animate={{ 
                                                y: [0, -12], 
                                                x: [0, 4, -2, 2], 
                                                opacity: [0, 1, 0] 
                                            }}
                                            transition={{ 
                                                repeat: Infinity, 
                                                duration: 3.5, 
                                                ease: 'easeOut' 
                                            }}
                                            className="font-mono text-[9px] font-black text-sky-450 block drop-shadow-sm"
                                        >
                                            Zzz
                                        </motion.span>
                                    </div>
                                )}

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
