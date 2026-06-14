import React from 'react';
import { motion } from 'framer-motion';
import { RacetrackActiveUser } from './types';
import { StickRacer } from '../StickRacer';
import { RacerTooltip } from './RacerTooltip';

interface RaceTrackParticipantProps {
    racer: RacetrackActiveUser;
    totalLanes: number;
    safeIndex: number;
    runningUserId: string | null;
}

export const RaceTrackParticipant: React.FC<RaceTrackParticipantProps> = ({
    racer,
    totalLanes,
    safeIndex,
    runningUserId,
}) => {
    const isCurrentRacerDashing = runningUserId === racer.user.id;

    // Scale perspective: racers near the top look smaller, near the bottom look larger
    const bottomY = 12 + (safeIndex / (totalLanes - 1 || 1)) * 140;
    const scale = 0.72 + (safeIndex / (totalLanes - 1 || 1)) * 0.28;
    
    const startPct = 12 + (safeIndex / (totalLanes - 1 || 1)) * 14;

    if (!racer.isCheckedIn) {
        // IDLE / SLEEPING
        return (
            <div 
                className="absolute pointer-events-auto group hover:z-[250] origin-bottom transition-all"
                style={{
                    left: `${startPct}%`,
                    bottom: `${bottomY}px`,
                    zIndex: 10 + safeIndex
                }}
            >
                <StickRacer 
                    user={racer.user} 
                    pose="sleeping" 
                    isWinner={false} 
                    checkInTime={null} 
                    order={999}
                    scale={scale}
                />
                <RacerTooltip 
                    racer={racer}
                    safeIndex={safeIndex}
                    pctPosition={startPct}
                    bottomY={bottomY}
                />
            </div>
        );
    }

    // CHECKED IN / RUNNING
    const finishBase = 78 + (safeIndex / (totalLanes - 1 || 1)) * 10;
    const xOffset = (racer.checkInOrder - 1) * 3.2; // stagger
    const targetPct = Math.max(startPct + 10, finishBase - xOffset);

    return (
        <motion.div
            className="absolute pointer-events-auto group hover:z-[250] origin-bottom"
            style={{ 
                bottom: `${bottomY}px`,
                zIndex: 40 + safeIndex
            }}
            initial={isCurrentRacerDashing ? { left: `${startPct}%` } : { left: `${targetPct}%` }}
            animate={{ 
                left: `${targetPct}%` 
            }}
            transition={isCurrentRacerDashing ? { 
                duration: 4.2, 
                ease: [0.16, 1, 0.3, 1] 
            } : { duration: 0.2 }}
        >
            <div className="relative flex flex-col items-center">
                <StickRacer 
                    user={racer.user}
                    pose={isCurrentRacerDashing ? 'running' : 'idle'}
                    isWinner={racer.checkInOrder === 1}
                    checkInTime={racer.checkInTime}
                    order={racer.checkInOrder}
                    isDashing={isCurrentRacerDashing}
                    scale={scale}
                />

                {/* Wind particles during dash */}
                {isCurrentRacerDashing && (
                    <div className="absolute -left-8 right-full top-1/2 -translate-y-1/2 flex gap-1 items-center pointer-events-none">
                        <motion.span 
                            animate={{ opacity: [1, 0], scaleX: [1, 1.6] }}
                            transition={{ repeat: Infinity, duration: 0.35 }}
                            className="h-[1.5px] bg-slate-900 w-5 rounded block"
                        ></motion.span>
                        <motion.span 
                            animate={{ opacity: [1, 0], scaleX: [1, 1.3] }}
                            transition={{ repeat: Infinity, duration: 0.4, delay: 0.15 }}
                            className="h-[1px] bg-slate-400 w-3 rounded block"
                        ></motion.span>
                    </div>
                )}

                {/* Floating order number badge */}
                <span className="absolute -top-[14px] px-1 py-0.2 rounded bg-slate-900 text-white font-mono text-[7px] font-black transform scale-[0.8] leading-none z-30">
                    #{racer.checkInOrder}
                </span>

                <RacerTooltip 
                    racer={racer}
                    safeIndex={safeIndex}
                    pctPosition={targetPct}
                    bottomY={bottomY}
                />
            </div>
        </motion.div>
    );
};
