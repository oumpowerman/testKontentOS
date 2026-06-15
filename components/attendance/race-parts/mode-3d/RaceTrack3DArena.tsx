import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { RacetrackActiveUser } from '../types';
import { User } from '../../../../types/core';
import { RaceTrackBackground } from './RaceTrackBackground';
import { RaceTrackParticipant } from './RaceTrackParticipant';

interface RaceTrack3DArenaProps {
    idleRacers: RacetrackActiveUser[];
    checkedInRacers: RacetrackActiveUser[];
    totalLanes: number;
    sortedProfiles: User[];
    runningUserId: string | null;
}

export const RaceTrack3DArena: React.FC<RaceTrack3DArenaProps> = ({
    idleRacers,
    checkedInRacers,
    totalLanes,
    sortedProfiles,
    runningUserId
}) => {
    return (
        <div className="lg:col-span-3 overflow-x-auto scrollbar-thin rounded-2xl border-2 border-slate-900 bg-white p-2 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
            <div className="relative min-w-[760px] lg:min-w-0 w-full h-[360px] flex flex-col justify-end pb-3 overflow-visible z-20">
                
                {/* Programmable Isometric 3D Racetrack SVG vectors drawing the lanes */}
                <RaceTrackBackground totalLanes={totalLanes} />

                {/* 1) RENDER SLEEPING / IDLE RACERS */}
                <div className="absolute inset-0 pointer-events-none overflow-visible">
                    {idleRacers.map((racer) => {
                        const profileIndex = sortedProfiles.findIndex(u => u.id === racer.user.id);
                        const safeIndex = profileIndex === -1 ? 0 : profileIndex;
                        return (
                            <RaceTrackParticipant 
                                key={`racer-idle-${racer.user.id}`}
                                racer={racer}
                                totalLanes={totalLanes}
                                safeIndex={safeIndex}
                                runningUserId={runningUserId}
                            />
                        );
                    })}
                </div>

                {/* 2) RENDER ACTIVE / RUNNING RACERS */}
                <div className="absolute inset-0 pointer-events-none overflow-visible">
                    <AnimatePresence>
                        {checkedInRacers.map((racer) => {
                            const profileIndex = sortedProfiles.findIndex(u => u.id === racer.user.id);
                            const safeIndex = profileIndex === -1 ? 0 : profileIndex;
                            return (
                                <RaceTrackParticipant 
                                    key={`racer-active-${racer.user.id}`}
                                    racer={racer}
                                    totalLanes={totalLanes}
                                    safeIndex={safeIndex}
                                    runningUserId={runningUserId}
                                />
                            );
                        })}
                    </AnimatePresence>
                </div>

            </div>
        </div>
    );
};
