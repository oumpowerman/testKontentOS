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
                className="absolute pointer-events-auto group origin-bottom transition-all -translate-x-1/2 -translate-y-[calc(100%-8px)]"
                style={{
                    left: `${leftPct}%`,
                    top: `${(startCoords.y / 360) * 80}%`,
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
                        status={racer.status}
                        activeLeave={racer.activeLeave}
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
                    status={racer.status}
                    activeLeave={racer.activeLeave}
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
                {/* ป้ายแสดงชื่อตัวละคร (แสดงเฉพาะคนที่ออกตัว/เข้าเส้นชัยแล้วเท่านั้น) */}
                {(() => {
                    let badgeClass = "bg-slate-900/80 border-white/10 text-white shadow-sm";
                    if (racer.checkInOrder === 1) {
                        badgeClass = "bg-amber-950/85 border-amber-400 text-amber-200 shadow-[0_0_8px_rgba(245,158,11,0.5)] animate-pulse";
                    } else if (racer.checkInOrder === 2) {
                        badgeClass = "bg-slate-900/85 border-slate-300 text-blue-100 shadow-[0_0_8px_rgba(203,213,225,0.4)]";
                    } else if (racer.checkInOrder === 3) {
                        badgeClass = "bg-orange-950/85 border-orange-600/70 text-orange-100 shadow-[0_0_8px_rgba(234,88,12,0.3)]";
                    }
                    return (
                        <span className={`absolute -top-[28px] px-1.5 py-0.5 rounded-full backdrop-blur-sm font-black text-[12px] border whitespace-nowrap z-30 leading-none tracking-tight transition-all duration-300 ${badgeClass}`}>
                            {racer.user.name}
                        </span>
                    );
                })()}

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
