import React, { useEffect, useState, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useUserSession } from '../../context/UserSessionContext';
import { format } from 'date-fns';
import { isWorkingDay } from '../../utils/judgeUtils';
import { useMasterData } from '../../hooks/useMasterData';
import { HolidayCozyLounge } from './cozy-lounge/HolidayCozyLounge';

// Modular Sub-components and types
import { RacetrackActiveUser } from './race-parts/types';
import { RaceTrackHeader } from './race-parts/RaceTrackHeader';
import { RaceTrackBackground } from './race-parts/RaceTrackBackground';
import { RaceTrackParticipant } from './race-parts/RaceTrackParticipant';
import { RaceTrackPodium } from './race-parts/RaceTrackPodium';

export const WeeklyAttendanceRace: React.FC = () => {
    const { allUsers, currentUserProfile } = useUserSession();
    const { annualHolidays, calendarExceptions } = useMasterData();
    const [todayLogs, setTodayLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [runningUserId, setRunningUserId] = useState<string | null>(null);

    const todayDateStr = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);

    const isSpecialDay = useMemo(() => {
        if (!annualHolidays) return false;
        return !isWorkingDay(new Date(), annualHolidays, calendarExceptions || [], null);
    }, [annualHolidays, calendarExceptions]);

    const fetchTodayLogs = async () => {
        try {
            const { data, error } = await supabase
                .from('attendance_logs')
                .select('user_id, check_in_time, status')
                .eq('date', todayDateStr);

            if (error) throw error;
            setTodayLogs(data || []);
        } catch (err) {
            console.error('Error fetching today\'s race logs:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTodayLogs();

        const channel = supabase
            .channel('public:attendance_logs_race')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'attendance_logs', filter: `date=eq.${todayDateStr}` },
                (payload) => {
                    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                        const newLog = payload.new;
                        if (currentUserProfile && newLog.user_id === currentUserProfile.id) {
                            setRunningUserId(currentUserProfile.id);
                            setTimeout(() => {
                                setRunningUserId(null);
                            }, 4500);
                        }
                        fetchTodayLogs();
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [todayDateStr, currentUserProfile?.id]);

    // Active users list sorted alphabetically to maintain solid lane locking
    const sortedProfiles = useMemo(() => {
        if (!allUsers) return [];
        return [...allUsers]
            .filter(u => u.isActive)
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [allUsers]);

    // Track dimensions accommodates exactly the registered active users in the system
    const totalLanes = useMemo(() => Math.max(1, sortedProfiles.length), [sortedProfiles]);

    const racers = useMemo<RacetrackActiveUser[]>(() => {
        const checkedInLogs = [...todayLogs]
            .filter(l => l.check_in_time)
            .sort((a, b) => new Date(a.check_in_time).getTime() - new Date(b.check_in_time).getTime());

        return sortedProfiles.map((user) => {
            const userLog = todayLogs.find(l => l.user_id === user.id);
            const isCheckedIn = !!userLog;

            let checkInTime = null;
            let checkInOrder = 999;

            if (userLog && userLog.check_in_time) {
                const idx = checkedInLogs.findIndex(l => l.user_id === user.id);
                checkInOrder = idx !== -1 ? idx + 1 : 999;

                try {
                    checkInTime = format(new Date(userLog.check_in_time), 'HH:mm:ss');
                } catch {
                    checkInTime = userLog.check_in_time;
                }
            }

            return {
                user,
                isCheckedIn,
                checkInTime,
                checkInOrder,
                status: userLog ? userLog.status : 'absent'
            };
        });
    }, [sortedProfiles, todayLogs]);

    const idleRacers = useMemo(() => racers.filter(r => !r.isCheckedIn), [racers]);
    const checkedInRacers = useMemo(() => 
        racers
            .filter(r => r.isCheckedIn)
            .sort((a, b) => a.checkInOrder - b.checkInOrder), 
        [racers]
    );

    if (isSpecialDay) {
        return <HolidayCozyLounge users={sortedProfiles} />;
    }

    if (loading) {
        return (
            <div className="w-full h-[230px] flex items-center justify-center border-b border-slate-900 border-dashed">
                <span className="font-mono text-[10px] text-slate-500 animate-pulse uppercase">กำลังเตรียมสนามกิจกรรม...</span>
            </div>
        );
    }

    return (
        <div className="w-full py-2 select-none">
            {/* Header / Info bar - Clean sub-component header */}
            <RaceTrackHeader checkedInRacers={checkedInRacers} />

            {/* Grid Layout: Left is Racetrack, Right is Finishers Board */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mt-3 items-stretch">
                {/* Left: The Track (takes 3/4 depth on desktop, full width on mobile) */}
                <div className="lg:col-span-3 relative w-full h-[240px] flex flex-col justify-end pb-3 overflow-visible border-b-2 border-slate-900 z-20">
                    {/* 3D Wireframe Perspective Grid Background */}
                    <RaceTrackBackground totalLanes={totalLanes} />

                    {/* 1) SLEEPING / IDLE RACERS: Positioned in their corresponding lanes at the Start Gate line */}
                    {idleRacers.map((racer) => {
                        const laneIndex = sortedProfiles.findIndex(p => p.id === racer.user.id);
                        const safeIndex = laneIndex >= 0 ? laneIndex : 0;
                        
                        return (
                            <RaceTrackParticipant 
                                key={`idle-${racer.user.id}`}
                                racer={racer}
                                totalLanes={totalLanes}
                                safeIndex={safeIndex}
                                runningUserId={runningUserId}
                            />
                        );
                    })}

                    {/* 2) DELIGHTFUL RACING / FINISHED RACERS: Moved along their custom lanes */}
                    <AnimatePresence>
                        {checkedInRacers.map((racer) => {
                            const laneIndex = sortedProfiles.findIndex(p => p.id === racer.user.id);
                            const safeIndex = laneIndex >= 0 ? laneIndex : 0;
                            
                            return (
                                <RaceTrackParticipant 
                                    key={`active-${racer.user.id}`}
                                    racer={racer}
                                    totalLanes={totalLanes}
                                    safeIndex={safeIndex}
                                    runningUserId={runningUserId}
                                />
                            );
                        })}
                    </AnimatePresence>
                </div>

                {/* Right: Finished Racers Leaderboard Panel (takes 1/4 depth on desktop) */}
                <div className="lg:col-span-1 flex flex-col">
                    <RaceTrackPodium 
                        checkedInRacers={checkedInRacers} 
                        allRacersCount={racers.length}
                    />
                </div>
            </div>
        </div>
    );
};

export default WeeklyAttendanceRace;
