import React from 'react';
import { motion } from 'framer-motion';
import { User } from '../../../types';
import { getDeterministicEmoji } from '../../../constants/emojis';

export interface StickRacerProps {
    user: User;
    pose: 'idle' | 'running' | 'sleeping';
    isWinner: boolean;
    checkInTime: string | null;
    order: number;
    isDashing?: boolean;
    scale?: number;
    status?: string | null;
    activeLeave?: {
        id: string;
        type: string;
        reason: string;
        status: string;
        startDate: Date;
        endDate: Date;
    } | null;
}

const getLeaveMiniIcon = (type: string) => {
    switch (type) {
        case 'SICK': return '🤒';
        case 'VACATION': return '✈️';
        case 'PERSONAL': return '💼';
        case 'EMERGENCY': return '🚨';
        case 'WFH': return '🏠';
        case 'UNPAID': return '🔇';
        default: return '⏳';
    }
};

export const StickRacer: React.FC<StickRacerProps> = ({ 
    user, 
    pose, 
    isWinner, 
    checkInTime, 
    order, 
    isDashing = false,
    scale = 1.0,
    status = null,
    activeLeave = null
}) => {
    // Custom keyframe animations for the pure emoji (bounce, sway, or hover) and premium status auras
    const rawAnimationStyles = `
        @keyframes emoji-bob-idle {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-3px); }
        }
        @keyframes emoji-run-bounce {
            0%, 100% { transform: translateY(0px) rotate(-5deg); }
            50% { transform: translateY(-7px) rotate(5deg) scale(1.05); }
        }
        @keyframes emoji-sleep-sway {
            0%, 100% { transform: rotate(-12deg) translateY(0px); }
            50% { transform: rotate(-18deg) translateY(-2px); }
        }
        @keyframes aura-pulse-gold {
            0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.35; }
            50% { transform: scale(1.3) rotate(180deg); opacity: 0.75; }
        }
        @keyframes aura-flame-flicker {
            0%, 100% { transform: scale(1.05, 0.95) translateY(0px); opacity: 0.5; filter: blur(5px); }
            50% { transform: scale(0.95, 1.2) translateY(-3px); opacity: 0.8; filter: blur(4px); }
        }
        @keyframes aura-sparkle-up-1 {
            0% { transform: translate(0px, 12px) scale(0.5); opacity: 0; }
            30% { opacity: 0.9; }
            100% { transform: translate(-8px, -24px) scale(0.2); opacity: 0; }
        }
        @keyframes aura-sparkle-up-2 {
            0% { transform: translate(-3px, 14px) scale(0.6); opacity: 0; }
            30% { opacity: 1; }
            100% { transform: translate(6px, -20px) scale(0.3); opacity: 0; }
        }
        @keyframes aura-sparkle-up-3 {
            0% { transform: translate(5px, 10px) scale(0.4); opacity: 0; }
            30% { opacity: 0.8; }
            100% { transform: translate(-3px, -28px) scale(0.15); opacity: 0; }
        }
        @keyframes aura-mist-flow {
            0%, 100% { transform: scale(1.0) translate(0px, 0px); opacity: 0.35; filter: blur(7px); }
            33% { transform: scale(1.15) translate(-3px, -2px); opacity: 0.6; filter: blur(9px); }
            66% { transform: scale(1.08) translate(2px, -3px); opacity: 0.5; filter: blur(8px); }
        }
        @keyframes aura-ring-spin {
            0% { transform: rotate(0deg) scale(0.95); }
            50% { transform: rotate(180deg) scale(1.05); }
            100% { transform: rotate(360deg) scale(0.95); }
        }
        @keyframes aura-bronze-pulse {
            0%, 100% { transform: scale(1); opacity: 0.3; filter: blur(6px); }
            50% { transform: scale(1.15); opacity: 0.6; filter: blur(8px); }
        }
    `;

    // Dynamic glow effects based on status
    const glowStyle = isWinner && pose !== 'sleeping'
        ? {
            filter: 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.75)) drop-shadow(0 0 12px rgba(245, 158, 11, 0.44)) drop-shadow(1px 1.5px 0px rgba(0, 0, 0, 0.2))'
          }
        : pose === 'sleeping'
        ? {
            filter: 'drop-shadow(0 0 4px rgba(148, 163, 184, 0.4)) drop-shadow(1px 1px 0px rgba(0, 0, 0, 0.15))'
          }
        : {
            filter: 'drop-shadow(0 0 8px rgba(99, 102, 241, 0.6)) drop-shadow(0 0 12px rgba(99, 102, 241, 0.3)) drop-shadow(1px 1.5px 0px rgba(0, 0, 0, 0.2))'
          };

    return (
        <div className="relative flex flex-col items-center transition-all duration-300 origin-bottom" style={{ transform: `scale(${scale})` }}>
            {/* Inject animations dynamically */}
            <style dangerouslySetInnerHTML={{ __html: rawAnimationStyles }} />

            {/* Status indicators */}
            {pose === 'sleeping' && (
                <div className="absolute -top-6 flex items-center justify-center select-none pointer-events-none z-30">
                    <motion.span
                        animate={{ 
                            y: [0, -10], 
                            x: [0, 3, -1, 1], 
                            opacity: [0, 0.9, 0] 
                        }}
                        transition={{ 
                            repeat: Infinity, 
                            duration: 2.5, 
                            ease: 'easeOut' 
                        }}
                        className="font-mono text-[9px] font-black text-[#58a6ff] tracking-wider"
                    >
                        {activeLeave ? '💤(Leave)' : 'Zzz'}
                    </motion.span>
                </div>
            )}

            {/* Character structure: Pure Emoji (Frame & Limb Elements are cleanly omitted) */}
            <div 
                className="relative flex items-center justify-center origin-bottom transition-all duration-300 select-none"
                style={{
                    animation: pose === 'running' 
                        ? 'emoji-run-bounce 0.24s infinite ease-in-out' 
                        : pose === 'sleeping' 
                            ? 'emoji-sleep-sway 2.2s infinite ease-in-out' 
                            : 'emoji-bob-idle 2.4s infinite ease-in-out'
                }}
            >
                <div className="relative">
                    {/* The Aura for rank 1, 2, 3 */}
                    {pose !== 'sleeping' && order >= 1 && order <= 3 && (
                        <div className="absolute inset-0 pointer-events-none select-none z-0">
                            {/* RANK 1: Golden Flame 🌟 */}
                            {order === 1 && (
                                <>
                                    {/* Layer 1: Wide Outer Glow */}
                                    <div 
                                        className="absolute rounded-full blur-lg mix-blend-screen bg-gradient-to-r from-yellow-500/25 via-amber-500/10 to-yellow-400/20"
                                        style={{
                                            width: '200%',
                                            height: '200%',
                                            left: '-50%',
                                            top: '-50%',
                                            animation: 'aura-pulse-gold 4s infinite ease-in-out'
                                        }}
                                    />
                                    {/* Layer 2: Core Golden Flame */}
                                    <div 
                                        className="absolute rounded-b-full mix-blend-screen bg-gradient-to-t from-orange-500/40 via-yellow-400/30 to-amber-200/5"
                                        style={{
                                            width: '140%',
                                            height: '170%',
                                            left: '-20%',
                                            top: '-50%',
                                            transformOrigin: 'bottom center',
                                            animation: 'aura-flame-flicker 1.8s infinite ease-in-out'
                                        }}
                                    />
                                    {/* Layer 3: Golden Sparking Particles */}
                                    <div className="absolute w-2 h-2 rounded-full bg-yellow-300 shadow-[0_0_5px_#f59e0b]" style={{ left: '10%', bottom: '20%', animation: 'aura-sparkle-up-1 2.2s infinite linear' }} />
                                    <div className="absolute w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_4px_#fbbf24]" style={{ left: '50%', bottom: '15%', animation: 'aura-sparkle-up-2 1.8s infinite linear', animationDelay: '0.4s' }} />
                                    <div className="absolute w-1 h-1 rounded-full bg-yellow-200 shadow-[0_0_3px_#fffbeb]" style={{ right: '15%', bottom: '25%', animation: 'aura-sparkle-up-3 2.5s infinite linear', animationDelay: '0.9s' }} />
                                </>
                            )}

                            {/* RANK 2: Silver Mist 🥈 */}
                            {order === 2 && (
                                <>
                                    {/* Layer 1: Wide Outer Glow */}
                                    <div 
                                        className="absolute rounded-full mix-blend-screen bg-gradient-to-r from-blue-300/20 via-slate-400/15 to-indigo-300/25"
                                        style={{
                                            width: '190%',
                                            height: '190%',
                                            left: '-45%',
                                            top: '-45%',
                                            animation: 'aura-mist-flow 4.5s infinite ease-in-out'
                                        }}
                                    />
                                    {/* Layer 2: Spinning Silver Ring */}
                                    <div 
                                        className="absolute rounded-full border border-dashed border-slate-300/45 mix-blend-screen"
                                        style={{
                                            width: '150%',
                                            height: '150%',
                                            left: '-25%',
                                            top: '-25%',
                                            animation: 'aura-ring-spin 6s infinite linear'
                                        }}
                                    />
                                    {/* Layer 3: Soft Silver Mist Particles */}
                                    <div className="absolute w-1.5 h-1.5 rounded-full bg-blue-100 shadow-[0_0_4px_#93c5fd]" style={{ left: '15%', bottom: '15%', animation: 'aura-sparkle-up-1 2.4s infinite linear' }} />
                                    <div className="absolute w-1 h-1 rounded-full bg-slate-200 shadow-[0_0_3px_#e2e8f0]" style={{ right: '20%', bottom: '20%', animation: 'aura-sparkle-up-3 2.1s infinite linear', animationDelay: '0.6s' }} />
                                </>
                            )}

                            {/* RANK 3: Bronze Spark 🥉 */}
                            {order === 3 && (
                                <>
                                    {/* Layer 1: Wide Outer Glow */}
                                    <div 
                                        className="absolute rounded-full mix-blend-screen bg-gradient-to-r from-orange-500/20 via-amber-800/10 to-orange-400/15"
                                        style={{
                                            width: '180%',
                                            height: '180%',
                                            left: '-40%',
                                            top: '-40%',
                                            animation: 'aura-bronze-pulse 3.8s infinite ease-in-out'
                                        }}
                                    />
                                    {/* Layer 2: Core Bronze Sparkle */}
                                    <div 
                                        className="absolute rounded-full mix-blend-screen bg-gradient-to-br from-orange-600/25 to-amber-700/15"
                                        style={{
                                            width: '125%',
                                            height: '125%',
                                            left: '-12.5%',
                                            top: '-12.5%',
                                            animation: 'aura-bronze-pulse 2.2s infinite ease-in-out'
                                        }}
                                    />
                                    {/* Layer 3: Warm Bronze Sparks */}
                                    <div className="absolute w-1 h-1 rounded-full bg-orange-400 shadow-[0_0_4px_#f97316]" style={{ left: '25%', bottom: '10%', animation: 'aura-sparkle-up-1 2.3s infinite linear' }} />
                                    <div className="absolute w-1 h-1 rounded-full bg-amber-500 shadow-[0_0_4px_#d97706]" style={{ right: '25%', bottom: '15%', animation: 'aura-sparkle-up-3 2.0s infinite linear', animationDelay: '0.8s' }} />
                                </>
                            )}
                        </div>
                    )}

                    {/* The main character emoji */}
                    <span 
                        className="relative z-10 leading-none transition-all duration-300 transform group-hover:scale-115 text-[24px] sm:text-[28px] md:text-[32px] block"
                        style={{ 
                            ...glowStyle,
                            imageRendering: 'pixelated'
                        }}
                    >
                        {user.emoji || getDeterministicEmoji(user.id)}
                    </span>

                    {/* Corner overlay: Active/Pending leave badge */}
                    {activeLeave && (
                        <div 
                            className={`absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full border border-slate-900 flex items-center justify-center text-[7.5px] font-bold shadow-md select-none pointer-events-none z-40 ${
                                activeLeave.status === 'APPROVED' 
                                    ? 'bg-emerald-550 text-white animate-pulse' 
                                    : 'bg-amber-500 text-white'
                            }`}
                            style={{
                                backgroundColor: activeLeave.status === 'APPROVED' ? '#10b981' : '#f59e0b',
                                filter: 'drop-shadow(0px 1px 1px rgba(0,0,0,0.3))'
                            }}
                        >
                            {getLeaveMiniIcon(activeLeave.type)}
                        </div>
                    )}

                    {/* Corner overlay: Came Late (⏱️) */}
                    {status === 'LATE' && (
                        <div 
                            className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-rose-550 text-white border border-slate-900 flex items-center justify-center text-[7px] shadow-sm select-none pointer-events-none z-40 animate-bounce"
                            style={{ backgroundColor: '#ef4444' }}
                        >
                            ⏱️
                        </div>
                    )}

                    {/* Corner overlay: Action Required (⚠️) */}
                    {status === 'ACTION_REQUIRED' && (
                        <div 
                            className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-orange-550 text-white border border-slate-900 flex items-center justify-center text-[7px] shadow-sm select-none pointer-events-none z-40"
                            style={{ backgroundColor: '#f97316' }}
                        >
                            ⚠️
                        </div>
                    )}
                </div>
            </div>

            {/* Time stamp indicator or Status text */}
            <div className="absolute top-full mt-2.5 z-10 flex flex-col items-center">
                {checkInTime ? (
                    <div className="px-2.5 py-1 rounded-xl bg-slate-900/95 border border-slate-700/50 text-[10px] sm:text-xs font-mono font-black text-white leading-none shadow-md whitespace-nowrap flex items-center gap-1">
                        {order && order <= 100 && (
                            <span className="text-yellow-400 font-extrabold mr-0.5">#{order}</span>
                        )}
                        <span>{checkInTime}</span>
                    </div>
                ) : activeLeave ? (
                    <div className={`px-2 py-0.5 rounded-lg text-[9px] sm:text-[10px] font-bold leading-none shadow-sm whitespace-nowrap ${
                        activeLeave.status === 'APPROVED' 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}>
                        {activeLeave.status === 'APPROVED' ? 'APPROVED' : 'PENDING'}
                    </div>
                ) : (
                    <div className="px-1.5 py-0.5 rounded bg-slate-200/60 border border-slate-300/40 text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase tracking-tighter leading-none shadow-sm">
                        OFFLINE
                    </div>
                )}
            </div>
        </div>
    );
};
