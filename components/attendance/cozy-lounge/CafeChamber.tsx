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

interface CafeChamberProps {
    residents: Resident[];
    selectedUser: User | null;
    setSelectedUser: (user: User | null) => void;
    activeHoverZone: number | null;
    setActiveHoverZone: (zoneIdx: number | null) => void;
}

export const CafeChamber: React.FC<CafeChamberProps> = ({
    residents,
    selectedUser,
    setSelectedUser,
    activeHoverZone,
    setActiveHoverZone
}) => {
    return (
        <div 
            className="relative w-full h-[320px] bg-gradient-to-b from-amber-50/40 to-transparent flex flex-col justify-end"
            onMouseEnter={() => setActiveHoverZone(0)}
            onMouseLeave={() => setActiveHoverZone(null)}
        >
            <span className="absolute left-3 top-12 font-mono text-[8px] font-bold text-amber-500/50 uppercase tracking-widest leading-none">CAFE BAR</span>
            
            {/* Open Neon Sign */}
            <div className="absolute left-[8%] bottom-[125px] border-2 border-slate-900 bg-amber-400 text-slate-950 font-black text-[7px] px-1.5 py-0.5 rounded shadow-[1.5px_1.5px_0px_#000] rotate-[-5deg] z-10 pointer-events-none select-none">
                OPEN ☕
            </div>

            {/* SVG BACKGROUND DESIGN */}
            <svg 
                className="absolute inset-0 w-full h-full pointer-events-none z-0" 
                viewBox="0 0 250 320" 
                preserveAspectRatio="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* Cafe Wall Shelf with cups */}
                <path d="M 80 100 H 170" stroke="#0f172a" strokeWidth="2.2" strokeLinecap="round" />
                <rect x="90" y="86" width="10" height="14" rx="1.5" fill="#fef3c7" stroke="#0f172a" strokeWidth="1.5" />
                <rect x="110" y="86" width="10" height="14" rx="1.5" fill="#fcd34d" stroke="#0f172a" strokeWidth="1.5" />
                <rect x="140" y="88" width="16" height="12" rx="1.5" fill="#fb923c" stroke="#0f172a" strokeWidth="1.5" />

                {/* STOOL 1 */}
                <line x1="72" y1="210" x2="72" y2="280" stroke="#0f172a" strokeWidth="2.5" />
                <line x1="72" y1="235" x2="92" y2="280" stroke="#0f172a" strokeWidth="1.5" />
                <ellipse cx="72" cy="210" rx="14" ry="4" fill="#f59e0b" stroke="#0f172a" strokeWidth="2" />

                {/* STOOL 2 */}
                <line x1="142" y1="210" x2="142" y2="280" stroke="#0f172a" strokeWidth="2.5" />
                <line x1="142" y1="235" x2="122" y2="280" stroke="#0f172a" strokeWidth="1.5" />
                <ellipse cx="142" cy="210" rx="14" ry="4" fill="#f59e0b" stroke="#0f172a" strokeWidth="2" />

                {/* THE ESPRESSO BAR/COUNTER */}
                <rect x="88" y="222" width="54" height="58" rx="3" fill="#d97706" stroke="#0f172a" strokeWidth="2" />
                <line x1="100" y1="228" x2="100" y2="274" stroke="#78350f" strokeWidth="1.2" />
                <line x1="108" y1="228" x2="108" y2="274" stroke="#78350f" strokeWidth="1.2" />
                <line x1="116" y1="228" x2="116" y2="274" stroke="#78350f" strokeWidth="1.2" />
                <line x1="124" y1="228" x2="124" y2="274" stroke="#78350f" strokeWidth="1.2" />
                
                {/* Espresso Machine on top */}
                <rect x="94" y="200" width="28" height="22" rx="2" fill="#94a3b8" stroke="#0f172a" strokeWidth="2" />
                <rect x="98" y="210" width="10" height="12" fill="#475569" stroke="#0f172a" strokeWidth="1.5" />
                <path d="M 120 208 H 125 V 215" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M 124 194 Q 126 186 122 178 M 121 193 Q 123 188 120 182" stroke="#cbd5e1" strokeWidth="1" strokeLinecap="round" />
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
                                {/* Floating Balloon name/avatar and activity indicator */}
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
