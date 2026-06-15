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
        <div className="lg:col-span-3 h-[145px] border-2 border-slate-900 bg-[#f8f9fa] rounded-2xl relative overflow-hidden flex flex-col justify-end pb-6 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] z-20">
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
            <span className="absolute bottom-[24px] left-[32%] text-xs opacity-20 select-none pointer-events-none">🌵</span>
            <span className="absolute bottom-[24px] left-[54%] text-[10px] opacity-15 select-none pointer-events-none">🌵</span>
            <span className="absolute bottom-[24px] left-[78%] text-xs opacity-20 select-none pointer-events-none">🌵</span>
            <span className="absolute bottom-[24.5px] left-[44%] text-[8px] opacity-10 select-none pointer-events-none">🪨</span>

            {/* Ground Flat Line */}
            <div className="absolute left-0 right-0 bottom-[24px] border-b-2 border-dashed border-slate-900 opacity-60"></div>

            {/* 2D Start Post */}
            <div className="absolute left-[11%] bottom-[24px] flex flex-col items-center">
                <span className="text-xs select-none">🚩</span>
                <span className="text-[6.5px] font-mono font-black text-slate-400 uppercase leading-none mt-0.5">START</span>
            </div>

            {/* 2D Finish checker Post */}
            <div className="absolute right-[11%] bottom-[24px] flex flex-col items-center">
                <span className="text-xs select-none">🏁</span>
                <span className="text-[6.5px] font-mono font-black text-slate-800 uppercase leading-none mt-0.5">GOAL</span>
            </div>

            {/* 1) SLEEPING / IDLE RACERS IN 2D */}
            {idleRacers.map((racer, index) => {
                const dinoX = 2 + (index * 2); 
                const dinoY = 24 + (index % 2) * 5;
                
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
                            />
                            
                            {/* Hover Badge */}
                            <span className="absolute -top-3.5 scale-75 opacity-0 group-hover:opacity-100 transition-opacity duration-150 bg-slate-950 text-white text-[7.5px] font-bold px-1.5 py-0.5 rounded pointer-events-none whitespace-nowrap w-max min-w-max leading-none z-50 shadow-md">
                                {racer.user.name} (Waiting)
                            </span>
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
                    
                    const dinoY = 24 + (index % 3) * 6;

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
                                />

                                {/* Order Sticker */}
                                <span className="absolute -top-[14px] px-1 py-0.2 rounded bg-slate-900 text-white font-mono text-[7px] font-black transform scale-[0.8] leading-none z-30">
                                    #{racer.checkInOrder}
                                </span>

                                {/* Hover Detail Badge */}
                                <span className="absolute -top-7 scale-75 opacity-0 group-hover:opacity-100 transition-opacity duration-150 bg-slate-950 text-white text-[7.5px] font-bold px-1.5 py-0.5 rounded pointer-events-none whitespace-nowrap w-max min-w-max leading-none z-50 shadow-md">
                                    {racer.user.name} ({racer.checkInTime})
                                </span>
                            </div>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
};
