import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { RacetrackActiveUser } from '../types';
import { StickRacer } from '../StickRacer';
import { RacerTooltip } from './RacerTooltip';
import { get3DCoordinates } from './projection';

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
    const [isHovered, setIsHovered] = useState(false);

    // Dynamic 3D Coordinates
    const startCoords = get3DCoordinates(safeIndex, 0, totalLanes);
    const targetProgress = Math.max(0.15, 1.0 - (racer.checkInOrder - 1) * 0.05);
    const targetCoords = get3DCoordinates(safeIndex, targetProgress, totalLanes);

    const startLeft = `${(startCoords.x / 1000) * 100}%`;
    const startTop = `${(startCoords.y / 360) * 100}%`;

    const targetLeft = `${(targetCoords.x / 1000) * 100}%`;
    const targetTop = `${(targetCoords.y / 360) * 100}%`;

    const currentZIndex = isHovered ? 20000 : (40 + targetCoords.zIndex);

    if (!racer.isCheckedIn) {
        // IDLE / SLEEPING (stays at start line, i.e. progress = 0)
        const leftPct = (startCoords.x / 1000) * 100;
        const bottomYValue = 360 - startCoords.y;

        return (
            <div 
                className="absolute pointer-events-auto group origin-bottom transition-all -translate-x-1/2 -translate-y-full"
                style={{
                    left: `${leftPct}%`,
                    top: `${(startCoords.y / 360) * 105}%`, // slightly offset below line for resting comfort
                    zIndex: isHovered ? 20000 : (10 + startCoords.zIndex)
                }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <div className="relative flex flex-col items-center">
                    <StickRacer 
                        user={racer.user} 
                        pose="sleeping" 
                        isWinner={false} 
                        checkInTime={null} 
                        order={999}
                        scale={startCoords.scale}
                    />
                    <RacerTooltip 
                        racer={racer}
                        safeIndex={safeIndex}
                        pctPosition={leftPct}
                        bottomY={bottomYValue}
                    />
                </div>
            </div>
        );
    }

    // CHECKED IN / RUNNING
    const pctPosition = (targetCoords.x / 1000) * 100;
    const bottomYValue = 360 - targetCoords.y;

    return (
        <motion.div
            className="absolute pointer-events-auto group origin-bottom -translate-x-1/2 -translate-y-[calc(100%-8px)]"
            style={{ 
                zIndex: currentZIndex
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            initial={isCurrentRacerDashing ? { 
                left: startLeft, 
                top: startTop,
                scale: startCoords.scale
            } : { 
                left: targetLeft, 
                top: targetTop,
                scale: targetCoords.scale
            }}
            animate={{ 
                left: targetLeft, 
                top: targetTop,
                scale: targetCoords.scale
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
                    scale={1.1} // Base scale factor inside StickRacer
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
                    pctPosition={pctPosition}
                    bottomY={bottomYValue}
                />
            </div>
        </motion.div>
    );
};
