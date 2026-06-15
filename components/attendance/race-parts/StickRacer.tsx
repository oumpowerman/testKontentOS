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
}

// getDeterministicEmoji is imported from central constants

export const StickRacer: React.FC<StickRacerProps> = ({ 
    user, 
    pose, 
    isWinner, 
    checkInTime, 
    order, 
    isDashing = false,
    scale = 1.0
}) => {
    // Custom keyframe animations for the pure emoji (bounce, sway, or hover)
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
                        Zzz
                    </motion.span>
                </div>
            )}

            {isWinner && pose !== 'sleeping' && (
                <div className="absolute -top-8 z-30 select-none pointer-events-none">
                    <motion.div
                        animate={{ y: [0, -3, 0], scale: [1, 1.15, 1] }}
                        transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                        className="text-amber-500 text-lg filter drop-shadow-sm font-bold"
                    >
                        👑
                    </motion.div>
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
                <span 
                    className="leading-none transition-all duration-300 transform group-hover:scale-115 text-[24px] sm:text-[28px] md:text-[32px]"
                    style={{ 
                        ...glowStyle,
                        imageRendering: 'pixelated'
                    }}
                >
                    {user.emoji || getDeterministicEmoji(user.id)}
                </span>
            </div>

            {/* Time stamp indicator or Status text */}
            {checkInTime ? (
                <div className="mt-2 px-1.5 py-0.5 rounded bg-slate-900 text-[7.5px] font-mono font-black text-white leading-none shadow-sm whitespace-nowrap z-10">
                    {checkInTime}
                </div>
            ) : (
                <div className="mt-2 text-[7.5px] font-bold text-slate-400 uppercase tracking-tighter z-10">
                    OFFLINE
                </div>
            )}
        </div>
    );
};
