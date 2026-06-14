
import React, { useState, useMemo, useEffect } from 'react';
import { useAttendanceStatus } from '../../../hooks/attendance/useAttendanceStatus';
import { useAttendanceStats } from '../../../hooks/attendance/useAttendanceStats';
import { useCalendarExceptions } from '../../../hooks/useCalendarExceptions';
import { useAnnualHolidays } from '../../../hooks/useAnnualHolidays';
import { User, MasterOption, ViewMode } from '../../../types';
import { MapPin, Clock, LogOut, Camera, CheckCircle2, Cloud, Sparkles, Coffee, Calendar, Flame, Briefcase, PartyPopper, Palmtree, Zap } from 'lucide-react';
import { format } from 'date-fns';
import th from 'date-fns/locale/th';

interface SmartAttendanceProps {
    user: User;
    masterOptions: MasterOption[]; // Receive from parent
    onNavigate: (view: ViewMode) => void;
    hFull?: boolean;
}

const SmartAttendance: React.FC<SmartAttendanceProps> = ({ user, masterOptions, onNavigate, hFull = false }) => {
    const { todayLog, isLoading } = useAttendanceStatus(user.id);
    const { stats } = useAttendanceStats(user.id);
    
    // --- HOLIDAY LOGIC HOOKS ---
    const { exceptions } = useCalendarExceptions();
    const { annualHolidays } = useAnnualHolidays();

    const [time, setTime] = useState(new Date());

    // Live Clock
    useEffect(() => {
        const timer = setInterval(() => {
            setTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // --- CHECK HOLIDAY & SPECIAL WORK STATUS ---
    const dayStatus = useMemo(() => {
        // Use 'time' state instead of new Date() to ensure sync with UI clock
        const currentCheckDate = time; 
        const todayStr = format(currentCheckDate, 'yyyy-MM-dd');
        const dayOfWeek = currentCheckDate.getDay(); // 0 = Sun, 6 = Sat
        
        // 1. Check Exception (Highest Priority)
        const exception = exceptions.find(e => e.date === todayStr);
        if (exception) {
            if (exception.type === 'HOLIDAY') {
                return { mode: 'HOLIDAY', name: exception.description || 'วันหยุดพิเศษ' };
            }
            if (exception.type === 'WORK_DAY') {
                // Forced workday (Special Event)
                return { mode: 'SPECIAL_WORK', name: exception.description || 'วันทำงานพิเศษ' };
            }
        }

        // 2. Check Annual Holiday
        const annual = annualHolidays.find(h => h.isActive && h.day === currentCheckDate.getDate() && h.month === (currentCheckDate.getMonth() + 1));
        if (annual) {
            return { mode: 'HOLIDAY', name: annual.name };
        }

        // 3. Check Weekend (Sat/Sun)
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            return { mode: 'HOLIDAY', name: dayOfWeek === 0 ? 'วันอาทิตย์' : 'วันเสาร์' };
        }

        return { mode: 'NORMAL', name: '' };
    }, [exceptions, annualHolidays, time]); // Add time to dependency

    // 2.5 NOT CHECKED IN (Config-driven Pastel Card)
    const config = useMemo(() => {
        const mode = dayStatus.mode;
        
        // Default (NORMAL)
        const base = {
            mode: 'NORMAL',
            bg: 'bg-gradient-to-br from-indigo-50 via-white to-blue-50',
            border: 'border-indigo-100',
            shadow: 'shadow-indigo-100/50',
            badgeBg: 'bg-indigo-100',
            badgeText: 'text-indigo-600',
            badgeIcon: Calendar,
            badgeLabel: format(time, 'EEEE, d MMM', { locale: th }),
            title: 'พร้อมลุยไหม?',
            description: 'เริ่มต้นวันใหม่ด้วยพลัง! ไปที่หน้าลงเวลาเพื่อเช็คอิน',
            accentColor: 'text-indigo-500',
            icon: Sparkles,
            btnText: 'ไปหน้าลงเวลา',
            btnBg: 'bg-indigo-600',
            btnShadow: 'shadow-indigo-200',
            btnHover: 'hover:bg-indigo-700',
            showBtn: true,
            titleColor: 'text-slate-800'
        };

        if (mode === 'SPECIAL_WORK') {
            return {
                ...base,
                mode: 'SPECIAL_WORK',
                bg: 'bg-gradient-to-br from-amber-50 via-white to-orange-50',
                border: 'border-orange-100',
                shadow: 'shadow-orange-100/50',
                badgeBg: 'bg-orange-100',
                badgeText: 'text-orange-600',
                badgeIcon: Zap,
                badgeLabel: dayStatus.name || 'วันทำงานพิเศษ',
                title: 'ลุยงานพิเศษ!',
                description: 'วันนี้วันพิเศษ สู้ๆ นะครับ! ไปเช็คอินกันเลย',
                accentColor: 'text-orange-500',
                btnBg: 'bg-orange-600',
                btnShadow: 'shadow-orange-200',
                btnHover: 'hover:bg-orange-700',
                titleColor: 'text-orange-900'
            };
        }

        if (mode === 'HOLIDAY') {
            return {
                ...base,
                mode: 'HOLIDAY',
                bg: 'bg-gradient-to-br from-rose-50 via-white to-pink-50',
                border: 'border-rose-100',
                shadow: 'shadow-rose-100/50',
                badgeBg: 'bg-rose-100',
                badgeText: 'text-rose-600',
                badgeIcon: PartyPopper,
                badgeLabel: format(time, 'EEEE, d MMM', { locale: th }),
                title: 'สุขสันต์วันหยุด!',
                description: `วันนี้ "${dayStatus.name}" พักผ่อนให้เต็มที่นะครับ ไม่ต้องลงเวลานะ`,
                accentColor: 'text-rose-500',
                icon: Palmtree,
                btnText: 'แต่ฉันจะทำงาน',
                btnBg: 'bg-rose-500',
                btnShadow: 'shadow-rose-100',
                btnHover: 'hover:bg-rose-600',
                showBtn: true,
                titleColor: 'text-rose-900'
            };
        }

        // Future modes (SICK, WFH, etc.) can be added here easily
        
        return base;
    }, [dayStatus, time]);


    if (isLoading) return <div className="h-28 bg-gray-100 rounded-[2.5rem] animate-pulse w-full"></div>;

    const isCheckedIn = !!todayLog;
    const isCheckedOut = !!todayLog?.checkOutTime;
    
    // Safety check for Leave logs that have no time
    const isLeaveLog = todayLog?.status === 'LEAVE' || todayLog?.workType === 'LEAVE';

    // --- RENDER STATES ---

    // 0. ON LEAVE / WFH (Approved without Time)
    if (isLeaveLog) {
        return (
            <div className={`bg-blue-50/50 border border-blue-100 rounded-[2.5rem] p-6 flex flex-col md:flex-row items-center justify-between shadow-sm relative overflow-hidden w-full ${hFull ? 'h-full' : ''}`}>
                <div className="flex items-center gap-4 relative z-10">
                    <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 shadow-inner">
                        <Briefcase className="w-7 h-7" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-blue-800 flex items-center gap-2">
                            อนุมัติแล้ว (On Leave/WFH)
                        </h3>
                        <p className="text-sm text-blue-600 mt-0.5 font-medium">
                            {todayLog?.note ? todayLog.note.replace(/\[.*?\]/g, '').trim() : 'ได้รับอนุญาตวันนี้'}
                        </p>
                    </div>
                </div>
                <div className="mt-4 md:mt-0 relative z-10">
                    <button 
                        onClick={() => onNavigate('ATTENDANCE')}
                        className="px-4 py-2 bg-white text-blue-600 rounded-xl text-xs font-bold border border-blue-100 shadow-sm hover:bg-blue-50 transition-colors"
                    >
                        ดูรายละเอียด
                    </button>
                </div>
            </div>
        );
    }

    // 1. FINISHED WORK (Pastel Green)
    if (isCheckedOut) {
        return (
            <div 
                onClick={() => onNavigate('ATTENDANCE')}
                className={`bg-emerald-50/50 border border-emerald-100 rounded-[2.5rem] p-6 flex flex-col md:flex-row items-center justify-between shadow-sm relative overflow-hidden group gap-4 w-full cursor-pointer hover:bg-emerald-100 transition-all ${hFull ? 'h-full' : ''}`}
            >
                <div className="absolute right-0 top-0 opacity-10 transform translate-x-4 -translate-y-4">
                    <CheckCircle2 className="w-32 h-32 text-emerald-500" />
                </div>
                
                <div className="relative z-10 flex items-center gap-4">
                    <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 shadow-inner">
                        <Coffee className="w-7 h-7" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-emerald-800 flex items-center gap-2">
                            เลิกงานแล้ว! 🎉
                        </h3>
                        <p className="text-sm text-emerald-600 mt-0.5 font-medium">พักผ่อนให้เต็มที่ เจอกันพรุ่งนี้ครับ</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 relative z-10">
                    <div className="text-right">
                        <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wide mb-0.5">เข้างาน</p>
                        <p className="text-sm font-bold text-emerald-700 font-mono bg-white/50 px-2 py-1 rounded-lg">
                            {todayLog?.checkInTime ? format(new Date(todayLog.checkInTime), 'HH:mm') : '--:--'}
                        </p>
                    </div>
                    <div className="h-8 w-px bg-emerald-200"></div>
                    <div className="text-right">
                        <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wide mb-0.5">ออกงาน</p>
                        <p className="text-xl font-bold text-emerald-700 font-mono bg-white/80 px-3 py-1 rounded-xl shadow-sm">
                            {todayLog?.checkOutTime ? format(new Date(todayLog.checkOutTime), 'HH:mm') : '--:--'}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // 2. WORKING NOW (Gradient Border + Glow)
    if (isCheckedIn) {
        return (
            <div className={`relative p-[2px] rounded-[2.5rem] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-indigo-100/50 w-full ${hFull ? 'h-full' : ''} flex flex-col`}>
                <div className={`bg-white rounded-[2.4rem] p-5 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden ${hFull ? 'h-full' : ''} w-full justify-between`}>
                    
                    {/* Pulsing Dot */}
                    <div className="absolute top-4 right-4 flex items-center gap-2">
                         <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                        <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Active</span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 flex items-center gap-5 w-full relative z-10">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-50 to-purple-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0 border border-indigo-100 shadow-inner">
                            <Clock className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">
                                Check-in at {todayLog?.checkInTime ? format(new Date(todayLog.checkInTime), 'HH:mm') : '--:--'}
                            </p>
                            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                กำลังทำงาน 👨‍💻
                            </h3>
                            <div className="flex items-center gap-2 mt-1.5">
                                <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-lg border border-indigo-100 flex items-center">
                                    <MapPin className="w-3 h-3 mr-1" /> {todayLog?.workType}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Clock Out Button - Redirects to Attendance View */}
                    <button 
                        onClick={() => onNavigate('ATTENDANCE')}
                        className="group w-full md:w-auto px-6 py-3.5 bg-red-50 hover:bg-red-500 text-red-500 hover:text-white border-2 border-red-100 hover:border-red-500 rounded-2xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 relative z-10 overflow-hidden"
                    >
                        <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> 
                        <span>เลิกงาน (Clock Out)</span>
                    </button>
                </div>
            </div>
        );
    }

    // 2.5 NOT CHECKED IN (Config-driven Pastel Card)
    return (
        <div className={`w-full ${hFull ? 'h-full' : ''}`}>
            <div className={`
                rounded-[2.5rem] p-6 shadow-xl relative overflow-hidden group border-4 border-white w-full transition-all duration-500 flex flex-col justify-between
                ${hFull ? 'h-full' : ''}
                ${config.bg} ${config.shadow}
            `}>
                {/* Dynamic Background Blobs */}
                <div className="absolute -right-10 -top-10 w-64 h-64 bg-white opacity-40 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-white opacity-30 rounded-full blur-2xl"></div>
                
                {/* STREAK INDICATOR */}
                {stats.currentStreak > 0 && config.mode !== 'HOLIDAY' && (
                    <div className="absolute top-4 right-4 bg-white/60 backdrop-blur-md border border-white rounded-full px-3 py-1 flex items-center gap-1.5 shadow-sm">
                        <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-orange-600">
                            {stats.currentStreak} Day Streak!
                        </span>
                    </div>
                )}

                <div className="flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
                    <div className="flex-1 text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                            <span className={`${config.badgeBg} ${config.badgeText} px-3 py-1 rounded-full text-[10px] font-black border border-white tracking-wider flex items-center shadow-sm`}>
                                <config.badgeIcon className="w-3 h-3 mr-1.5" />
                                {config.badgeLabel}
                            </span>
                        </div>
                        <h3 className={`text-3xl font-bold tracking-tight mt-1 flex items-center justify-center md:justify-start gap-2 ${config.titleColor}`}>
                            {config.title} <config.icon className={`w-7 h-7 ${config.accentColor} animate-pulse`} />
                        </h3>
                        <p className="text-slate-500 text-sm mt-1.5 font-medium max-w-md">
                            {config.description}
                        </p>
                    </div>

                    {config.showBtn && (
                        <button 
                            onClick={() => onNavigate('ATTENDANCE')}
                            className={`group/btn relative px-8 py-4 ${config.btnBg} text-white rounded-2xl font-black shadow-lg ${config.btnShadow} ${config.btnHover} hover:scale-105 active:scale-95 transition-all flex items-center gap-3 overflow-hidden w-full md:w-auto justify-center`}
                        >
                            <Camera className="w-6 h-6 relative z-10 group-hover/btn:rotate-12 transition-transform" />
                            <span className="relative z-10 text-base">{config.btnText}</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SmartAttendance;
