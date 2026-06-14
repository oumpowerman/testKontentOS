
import React from 'react';
import { PartyPopper, Coffee, CalendarClock, Clock, Sun, Sparkles } from 'lucide-react';
import { format, differenceInCalendarDays } from 'date-fns';
import th from 'date-fns/locale/th';
import { Duty, User, ViewMode } from '../../../../types';
import DutyGuardians from './DutyGuardians';
import { motion } from 'framer-motion';

interface IdleStateProps {
    todayStatus: { isHoliday: boolean; name: string };
    nextDuty?: Duty;
    todaysDuties: Duty[];
    users: User[];
    onNavigate: (view: ViewMode) => void;
}

const IdleState: React.FC<IdleStateProps> = ({ todayStatus, nextDuty, todaysDuties, users, onNavigate }) => {
    const today = new Date();
    today.setHours(0,0,0,0);

    const isHoliday = todayStatus.isHoliday;

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -5, boxShadow: "0 20px 40px rgba(0,0,0,0.05)" }}
            onClick={() => onNavigate('DUTY')}
            className={`relative overflow-hidden rounded-[3rem] p-8 h-full flex flex-col justify-between items-center text-center group border transition-all duration-500 cursor-pointer ${
            isHoliday 
                ? 'bg-gradient-to-br from-emerald-50/80 via-teal-100/60 to-emerald-100/40 backdrop-blur-xl border-emerald-200/50 shadow-[0_10px_30px_rgba(16,185,129,0.1)] border-4' 
                : 'bg-gradient-to-br from-indigo-50/80 via-sky-50/60 to-violet-50/40 backdrop-blur-xl border-white/60 shadow-[0_10px_30px_rgba(99,102,241,0.05)] border-4'
        }`}>
            {/* 3D Glass Blobs */}
            <div className={`absolute top-[-20%] left-[-10%] w-48 h-48 rounded-full blur-3xl pointer-events-none animate-pulse opacity-40 ${
                isHoliday ? 'bg-emerald-200' : 'bg-indigo-200'
            }`} />
            <div className={`absolute bottom-[-20%] right-[-10%] w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-30 ${
                isHoliday ? 'bg-teal-200' : 'bg-purple-200'
            }`} />

            <div className="relative z-10 flex flex-col items-center gap-5 w-full my-auto">
                <motion.div 
                    whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                    transition={{ rotate: { duration: 0.5, ease: "easeInOut" } }}
                    className={`w-16 h-16 rounded-2xl backdrop-blur-md border shadow-xl flex items-center justify-center shrink-0 relative overflow-hidden ${
                        isHoliday 
                            ? 'bg-gradient-to-br from-emerald-400 to-teal-500 border-emerald-300/50 text-white' 
                            : 'bg-gradient-to-br from-indigo-500 to-violet-600 border-indigo-400/50 text-white'
                    }`}
                >
                    {/* Shine effect */}
                    <motion.div 
                        animate={{ x: ['-100%', '200%'] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
                    />
                    
                    {isHoliday ? (
                        <PartyPopper className="w-8 h-8 drop-shadow-md" />
                    ) : (
                        nextDuty ? <CalendarClock className="w-8 h-8 drop-shadow-md" /> : <Sun className="w-8 h-8 drop-shadow-md" />
                    )}
                </motion.div>

                <div className="flex flex-col items-center">
                    {isHoliday ? (
                        <>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="bg-emerald-500/10 text-emerald-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-sm flex items-center border border-emerald-200/50">
                                    <Coffee className="w-3.5 h-3.5 mr-1.5" /> HOLIDAY MODE
                                </span>
                                <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                                    <Sparkles className="w-3 h-3 text-amber-400 fill-amber-400" />
                                </motion.div>
                            </div>
                            <h3 className="text-2xl font-bold text-slate-800 tracking-tight leading-none">
                                {todayStatus.name}
                            </h3>
                            <p className="text-emerald-700/70 text-xs mt-2 font-bold max-w-[240px]">
                                วันนี้ไม่มีเวร พักผ่อนให้เต็มที่นะครับ ✨
                            </p>
                        </>
                    ) : nextDuty ? (
                        <>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="bg-indigo-500/10 text-indigo-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-sm flex items-center border border-indigo-200/50">
                                    <Clock className="w-3.5 h-3.5 mr-1.5" /> NEXT MISSION
                                </span>
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none">
                                อีก <span className="text-indigo-600">{differenceInCalendarDays(new Date(nextDuty.date), today)}</span> วัน ถึงคิวคุณ
                            </h3>
                            <div className="flex items-center justify-center gap-2 mt-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                                <p className="text-indigo-700/70 text-xs font-bold truncate max-w-[220px]">
                                    {format(new Date(nextDuty.date), 'd MMM', { locale: th })}: {nextDuty.title}
                                </p>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="bg-amber-500/10 text-amber-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-sm flex items-center border border-amber-200/50">
                                    <Sun className="w-3.5 h-3.5 mr-1.5" /> FREE TIME
                                </span>
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 tracking-tight leading-none font-sans">
                                ยังไม่มีเวรเร็วๆ นี้
                            </h3>
                            <p className="text-slate-550 text-xs mt-2 font-bold font-sans">
                                พักผ่อนให้เต็มที่นะครับ
                            </p>
                        </>
                    )}
                </div>
            </div>

            <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className={`w-full bg-white/40 backdrop-blur-md p-4 rounded-[2rem] border border-white/60 shadow-inner flex justify-center ${isHoliday ? 'border-emerald-200/30' : 'border-indigo-200/30'}`}
            >
                <DutyGuardians todaysDuties={todaysDuties} users={users} />
            </motion.div>
        </motion.div>
    );
};

export default IdleState;
