import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useUserSession } from '../../context/UserSessionContext';
import { format } from 'date-fns';
import { isWorkingDay } from '../../utils/judgeUtils';
import { useMasterData } from '../../hooks/useMasterData';
import { HolidayCozyLounge } from './cozy-lounge/HolidayCozyLounge';

// Modular Sub-components and types
import { 
    RacetrackActiveUser,
    RaceTrackHeader,
    RaceTrackPodium,
    RaceTrackCompactTop3,
    RaceTrack2DDino,
    RaceTrack3DArena
} from './race-parts';
import { getPositionGroup } from './race-parts/utils';

export const WeeklyAttendanceRace: React.FC = () => {
    const { allUsers, currentUserProfile, leaveRequests } = useUserSession();
    const { annualHolidays, calendarExceptions } = useMasterData();
    const [todayLogs, setTodayLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [runningUserId, setRunningUserId] = useState<string | null>(null);

    // Persist viewMode state supporting: '3d' (default), '2d' (Dino) and 'compact' (Top 3 Arrivals)
    const [viewMode, setViewMode] = useState<'3d' | '2d' | 'compact'>(() => {
        try {
            const saved = localStorage.getItem('race_view_mode');
            if (saved === '3d' || saved === '2d' || saved === 'compact') {
                return saved as '3d' | '2d' | 'compact';
            }
            // Fallback for user backward compatibility
            const legacy = localStorage.getItem('race_collapsed');
            return legacy === 'true' ? '2d' : '3d';
        } catch (_) {
            return '3d';
        }
    });

    const [isTrackCollapsed, setIsTrackCollapsed] = useState<boolean>(() => {
        try {
            return localStorage.getItem('race_track_collapsed') === 'true';
        } catch (_) {
            return false;
        }
    });

    const [isPodiumCollapsed, setIsPodiumCollapsed] = useState<boolean>(() => {
        try {
            return localStorage.getItem('race_podium_collapsed') === 'true';
        } catch (_) {
            return false;
        }
    });

    const toggleTrackCollapsed = () => {
        setIsTrackCollapsed(prev => {
            const next = !prev;
            try {
                localStorage.setItem('race_track_collapsed', String(next));
            } catch (_) {}
            return next;
        });
    };

    const togglePodiumCollapsed = () => {
        setIsPodiumCollapsed(prev => {
            const next = !prev;
            try {
                localStorage.setItem('race_podium_collapsed', String(next));
            } catch (_) {}
            return next;
        });
    };

    const handleSetViewMode = (mode: '3d' | '2d' | 'compact') => {
        setViewMode(mode);
        try {
            localStorage.setItem('race_view_mode', mode);
            localStorage.setItem('race_collapsed', mode === '2d' ? 'true' : 'false');
        } catch (_) {}

        if (mode === 'compact') {
            setIsPodiumCollapsed(true);
            try {
                localStorage.setItem('race_podium_collapsed', 'true');
            } catch (_) {}
        }
    };

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

    // Active users list sorted by position group and then name to align teammates on adjacent lanes/tracks
    const sortedProfiles = useMemo(() => {
        if (!allUsers) return [];
        return [...allUsers]
            .filter(u => u.isActive)
            .sort((a, b) => {
                const groupA = getPositionGroup(a.position).name;
                const groupB = getPositionGroup(b.position).name;
                if (groupA !== groupB) {
                    return groupA.localeCompare(groupB);
                }
                return a.name.localeCompare(b.name);
            });
    }, [allUsers]);

    // Track dimensions accommodates exactly the registered active users in the system
    const totalLanes = useMemo(() => Math.max(1, sortedProfiles.length), [sortedProfiles]);

    const racers = useMemo<RacetrackActiveUser[]>(() => {
        const checkedInLogs = [...todayLogs]
            .filter(l => l.check_in_time)
            .sort((a, b) => new Date(a.check_in_time).getTime() - new Date(b.check_in_time).getTime());

        const today = new Date();
        const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
        const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

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

            // Find if there is an active approved/pending leave request for today
            const activeLeaveReq = leaveRequests ? leaveRequests.find(req => {
                if (req.userId !== user.id) return false;
                if (req.status === 'REJECTED') return false;
                try {
                    const start = new Date(req.startDate);
                    const end = new Date(req.endDate);
                    return (start <= endOfToday && end >= startOfToday);
                } catch {
                    return false;
                }
            }) : null;

            return {
                user,
                isCheckedIn,
                checkInTime,
                checkInOrder,
                status: userLog ? userLog.status : 'absent',
                activeLeave: activeLeaveReq ? {
                    id: activeLeaveReq.id,
                    type: activeLeaveReq.type,
                    reason: activeLeaveReq.reason,
                    status: activeLeaveReq.status,
                    startDate: new Date(activeLeaveReq.startDate),
                    endDate: new Date(activeLeaveReq.endDate)
                } : null
            };
        });
    }, [sortedProfiles, todayLogs, leaveRequests]);

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

            {/* Space-saving Collapsible Trigger Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 mt-1 mb-3 bg-slate-50 border-2 border-slate-900 rounded-2xl px-3 py-2 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-600 font-extrabold uppercase tracking-tight">
                    <span>⚡ มุมมองและแผงควบคุม :</span>
                </div>
                <div className="flex flex-wrap gap-1.5 items-center">
                    {/* View mode toggle buttons (Only visible if track is not collapsed) */}
                    {!isTrackCollapsed && (
                        <>
                            <button
                                onClick={() => handleSetViewMode('3d')}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border-2 border-slate-900 font-sans text-[10px] font-black transition-all cursor-pointer ${
                                    viewMode === '3d'
                                        ? 'bg-indigo-600 text-white shadow-[1px_1px_0px_0px_rgba(15,23,42,1)]'
                                        : 'bg-white text-slate-800 hover:bg-slate-50 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-[1px_1px_0px_0px_rgba(15,23,42,1)]'
                                }`}
                            >
                                <span>3D Arena 🏎️</span>
                            </button>
                            <button
                                onClick={() => handleSetViewMode('2d')}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border-2 border-slate-900 font-sans text-[10px] font-black transition-all cursor-pointer ${
                                    viewMode === '2d'
                                        ? 'bg-emerald-600 text-white shadow-[1px_1px_0px_0px_rgba(15,23,42,1)]'
                                        : 'bg-white text-slate-800 hover:bg-slate-50 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-[1px_1px_0px_0px_rgba(15,23,42,1)]'
                                }`}
                            >
                                <span>2D Dino 🦖</span>
                            </button>
                            <button
                                onClick={() => handleSetViewMode('compact')}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border-2 border-slate-900 font-sans text-[10px] font-black transition-all cursor-pointer ${
                                    viewMode === 'compact'
                                        ? 'bg-slate-800 text-white shadow-[1px_1px_0px_0px_rgba(15,23,42,1)]'
                                        : 'bg-white text-slate-800 hover:bg-slate-50 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-[1px_1px_0px_0px_rgba(15,23,42,1)]'
                                }`}
                            >
                                <span>เรียบง่าย (Top 3) 🥇</span>
                            </button>
                            <div className="w-[1px] h-4 bg-slate-300 mx-1"></div>
                        </>
                    )}

                    {/* Section Expand/Collapse switches */}
                    <button
                        onClick={toggleTrackCollapsed}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border-2 border-slate-900 font-sans text-[10px] font-black transition-all cursor-pointer ${
                            !isTrackCollapsed
                                ? 'bg-amber-100 text-slate-900 hover:bg-amber-200 shadow-[1px_1px_0px_0px_rgba(15,23,42,1)]'
                                : 'bg-slate-200 text-slate-600 hover:bg-slate-300 border-slate-300'
                        }`}
                        title="คลิกเพื่อยืด/หดหน้าจอกระดานพล็อตสนามวิ่ง"
                    >
                        <span>{isTrackCollapsed ? '👀 แสดงสนามวิ่ง' : '🙈 หดสนามวิ่ง'}</span>
                    </button>

                    <button
                        onClick={togglePodiumCollapsed}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border-2 border-slate-900 font-sans text-[10px] font-black transition-all cursor-pointer ${
                            !isPodiumCollapsed
                                ? 'bg-amber-100 text-slate-900 hover:bg-amber-200 shadow-[1px_1px_0px_0px_rgba(15,23,42,1)]'
                                : 'bg-slate-200 text-slate-600 hover:bg-slate-300 border-slate-300'
                        }`}
                        title="คลิกเพื่อยืด/หดกระดานรายชื่อผู้สำเร็จเข้าเส้นชัย"
                    >
                        <span>{isPodiumCollapsed ? '👀 แสดงบอร์ด Finish' : '🙈 หดบอร์ด Finish'}</span>
                    </button>
                </div>
            </div>

            {/* Grid Layout: Left is Racetrack, Right is Finishers Board */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mt-1 items-stretch">
                {isTrackCollapsed ? (
                    <div className="lg:col-span-3 border-2 border-slate-900 bg-slate-50 rounded-2xl p-4 flex items-center justify-between shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] min-h-[75px] relative z-20 overflow-hidden">
                        {/* Background subtle retro grid accent */}
                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none select-none" style={{ backgroundImage: 'radial-gradient(#0f172a 1px, transparent 1px)', backgroundSize: '12px 12px' }}></div>
                        
                        <div className="flex items-center gap-2.5 relative z-10">
                            <span className="text-xl select-none">🏎️</span>
                            <div className="flex flex-col">
                                <span className="font-sans text-xs font-black text-slate-800 uppercase tracking-tight">
                                    มุมมองสนาม {viewMode === '3d' ? '3D Arena' : viewMode === '2d' ? '2D Dino' : 'Top 3 Arrivals'} ถูกพับย่อส่วนอยู่
                                </span>
                                <span className="text-[9px] text-slate-400 font-bold font-sans">
                                    มีสมาชิกพร้อมวิ่ง {idleRacers.length} คน / วิ่งเช็คอินสำเร็จแล้ว {checkedInRacers.length} คน
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={toggleTrackCollapsed}
                            className="px-3 py-1 bg-white hover:bg-slate-50 text-slate-800 text-[10px] font-black rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] transition-all cursor-pointer relative z-10"
                        >
                            แสดงสนามวิ่ง 🗺️
                        </button>
                    </div>
                ) : (
                    <>
                        {viewMode === 'compact' && (
                            <RaceTrackCompactTop3 checkedInRacers={checkedInRacers} />
                        )}
                        {viewMode === '2d' && (
                            <RaceTrack2DDino
                                idleRacers={idleRacers}
                                checkedInRacers={checkedInRacers}
                                runningUserId={runningUserId}
                            />
                        )}
                        {viewMode === '3d' && (
                            <RaceTrack3DArena
                                idleRacers={idleRacers}
                                checkedInRacers={checkedInRacers}
                                totalLanes={totalLanes}
                                sortedProfiles={sortedProfiles}
                                runningUserId={runningUserId}
                            />
                        )}
                    </>
                )}

                {/* Right: Finished Racers Leaderboard Panel (takes 1/4 depth on desktop) */}
                <div className="lg:col-span-1 flex flex-col">
                    <RaceTrackPodium 
                        checkedInRacers={checkedInRacers} 
                        allRacersCount={racers.length}
                        isCollapsed={isPodiumCollapsed}
                        onToggleCollapse={togglePodiumCollapsed}
                        viewMode={viewMode}
                    />
                </div>
            </div>
        </div>
    );
};

export default WeeklyAttendanceRace;
