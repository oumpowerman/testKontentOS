import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RacetrackActiveUser } from '../types';
import { StickRacer } from '../StickRacer';

interface RaceTrack2DDinoProps {
    idleRacers: RacetrackActiveUser[];
    checkedInRacers: RacetrackActiveUser[];
    runningUserId: string | null;
}

export const RaceTrack2DDino: React.FC<RaceTrack2DDinoProps> = ({
    idleRacers,
    checkedInRacers,
    runningUserId
}) => {
    return (
        <div className="lg:col-span-3 h-[160px] border-2 border-slate-900 bg-[#f8f9fa] rounded-2xl relative overflow-hidden flex flex-col justify-end pb-6 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] z-20">
            {/* Micro Pixelated Clouds Floating in the background */}
            <motion.div 
                animate={{ x: [-40, 800] }} 
                transition={{ repeat: Infinity, duration: 45, ease: "linear" }}
                className="absolute top-2.5 left-0 text-sm opacity-15 select-none pointer-events-none"
            >
                ☁️
            </motion.div>
            <motion.div 
                animate={{ x: [250, 1050] }} 
                transition={{ repeat: Infinity, duration: 38, ease: "linear" }}
                className="absolute top-5 left-0 text-xs opacity-10 select-none pointer-events-none"
            >
                ☁️
            </motion.div>

            {/* Cacti scattered on the path to make it look like the offline chrome game */}
            <span className="absolute bottom-[44px] left-[32%] text-xs opacity-20 select-none pointer-events-none">🌵</span>
            <span className="absolute bottom-[44px] left-[54%] text-[10px] opacity-15 select-none pointer-events-none">🌵</span>
            <span className="absolute bottom-[44px] left-[78%] text-xs opacity-20 select-none pointer-events-none">🌵</span>
            <span className="absolute bottom-[44.5px] left-[44%] text-[8px] opacity-10 select-none pointer-events-none">🪨</span>

            {/* Ground Flat Line */}
            <div className="absolute left-0 right-0 bottom-[44px] border-b-2 border-dashed border-slate-900 opacity-60"></div>

            {/* 2D Start Post */}
            <div className="absolute left-[11%] bottom-[44px] flex flex-col items-center">
                <span className="text-xs select-none">🚩</span>
                <span className="text-[6.5px] font-mono font-black text-slate-400 uppercase leading-none mt-0.5">START</span>
            </div>

            {/* 2D Finish checker Post */}
            <div className="absolute right-[11%] bottom-[44px] flex flex-col items-center">
                <span className="text-xs select-none">🏁</span>
                <span className="text-[6.5px] font-mono font-black text-slate-800 uppercase leading-none mt-0.5">GOAL</span>
            </div>

            {/* 1) SLEEPING / IDLE RACERS IN 2D */}
            {idleRacers.map((racer, index) => {
                const dinoX = 2 + (index * 2); 
                const dinoY = 44;
                
                return (
                    <motion.div
                        key={`dino-idle-${racer.user.id}`}
                        className="absolute pointer-events-auto origin-bottom"
                        style={{
                            bottom: `${dinoY}px`,
                            left: `${dinoX}%`,
                            zIndex: 10 + index
                        }}
                        initial={{ opacity: 0, scale: 0.72 }}
                        animate={{ opacity: 1, scale: 0.72 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="relative flex flex-col items-center group cursor-pointer">
                            <StickRacer 
                                user={racer.user}
                                pose="sleeping"
                                isWinner={false}
                                checkInTime={null}
                                order={999}
                                scale={1.0}
                                status={racer.status}
                                activeLeave={racer.activeLeave}
                            />
                            
                            {/* Hover Badge */}
                            <div className="absolute bottom-[110%] left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-y-1 group-hover:translate-y-0 z-50 bg-slate-900/95 backdrop-blur-sm border border-slate-700/50 text-white rounded-xl p-2 shadow-lg whitespace-nowrap flex flex-col items-center gap-1 scale-90 sm:scale-100">
                                <div className="font-bold text-xs sm:text-sm flex items-center gap-1 text-slate-200">
                                    <span className="text-sm">💤</span> {racer.user.name}
                                </div>
                                <div className="text-[10px] sm:text-xs text-slate-400 font-medium">
                                    กำลังรอเช็คอิน (Waiting)
                                </div>
                                <div className="w-1.5 h-1.5 bg-slate-900 rotate-45 border-r border-b border-slate-700/50 -mb-2.5 mt-0.5"></div>
                            </div>
                        </div>
                    </motion.div>
                );
            })}

            {/* 2) DELIGHTFUL RUNNING RACERS IN 2D */}
            <AnimatePresence>
                {checkedInRacers.map((racer, index) => {
                    const isCurrentRacerDashing = runningUserId === racer.user.id;
                    const isFirst = index === 0;
                    
                    // Beautiful staggered alignment near the Goal line to prevent piling
                    const finishPercent = isFirst ? 86 : Math.max(16, 82 - (index * 4.5));
                    const targetPct = isCurrentRacerDashing ? 13 : finishPercent;
                    
                    const dinoY = 44;

                    return (
                        <motion.div
                            key={`dino-active-${racer.user.id}`}
                            className="absolute pointer-events-auto origin-bottom"
                            style={{
                                bottom: `${dinoY}px`,
                                zIndex: 40 + index
                            }}
                            initial={{ left: isCurrentRacerDashing ? '12%' : `${targetPct}%`, scale: 0.72 }}
                            animate={{ left: `${targetPct}%`, scale: 0.72 }}
                            transition={isCurrentRacerDashing ? { 
                                duration: 4.2, 
                                ease: [0.16, 1, 0.3, 1] 
                            } : { duration: 0.2 }}
                        >
                            <div className="relative flex flex-col items-center group cursor-pointer">
                                <StickRacer 
                                    user={racer.user}
                                    pose={isCurrentRacerDashing ? 'running' : 'idle'}
                                    isWinner={isFirst}
                                    checkInTime={racer.checkInTime}
                                    order={racer.checkInOrder}
                                    scale={1.0}
                                    status={racer.status}
                                    activeLeave={racer.activeLeave}
                                />

                                {/* Hover Detail Badge */}
                                <div className="absolute bottom-[110%] left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-y-1 group-hover:translate-y-0 z-50 bg-slate-950/95 backdrop-blur-sm border border-slate-700/50 text-white rounded-xl p-2 sm:p-2.5 shadow-xl whitespace-nowrap flex flex-col items-center gap-1 scale-90 sm:scale-100 min-w-[120px]">
                                    {/* Line 1: Medal + Name */}
                                    <div className="font-black text-xs sm:text-sm flex items-center gap-1.5">
                                        {racer.checkInOrder === 1 ? (
                                            <span className="text-yellow-400 drop-shadow-[0_0_4px_rgba(250,204,21,0.6)]">🏆 🥇</span>
                                        ) : racer.checkInOrder === 2 ? (
                                            <span className="text-slate-300 drop-shadow-[0_0_4px_rgba(203,213,225,0.6)]">🥈</span>
                                        ) : racer.checkInOrder === 3 ? (
                                            <span className="text-amber-600 drop-shadow-[0_0_4px_rgba(217,119,6,0.6)]">🥉</span>
                                        ) : (
                                            <span className="text-teal-400">🏅</span>
                                        )}
                                        <span className="text-white tracking-tight">{racer.user.name}</span>
                                    </div>

                                    {/* Line 2: Order & Time details */}
                                    <div className="flex items-center gap-1.5 text-[9px] sm:text-[11px] text-slate-300 font-medium">
                                        <span className="bg-slate-800 px-1.5 py-0.5 rounded font-bold text-slate-300">
                                            เช็คอิน #{racer.checkInOrder}
                                        </span>
                                        <span className="text-slate-500">•</span>
                                        <span className="font-mono text-slate-400 font-semibold">
                                            {racer.checkInTime}
                                        </span>
                                    </div>
                                    
                                    {/* Arrow */}
                                    <div className="w-1.5 h-1.5 bg-slate-950 rotate-45 border-r border-b border-slate-700/50 -mb-2.5 mt-0.5"></div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
};
