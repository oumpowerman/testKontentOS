
import React from 'react';
import { CheckCircle2, Sparkles, Clock, CalendarClock } from 'lucide-react';
import { format, differenceInCalendarDays } from 'date-fns';
import th from 'date-fns/locale/th';
import { Duty, User, ViewMode } from '../../../../types';
import DutyGuardians from './DutyGuardians';

interface CompletedStateProps {
    completedDuty: Duty;
    nextDuty?: Duty;
    todaysDuties: Duty[];
    users: User[];
    onNavigate: (view: ViewMode) => void;
}

const CompletedState: React.FC<CompletedStateProps> = ({ completedDuty, nextDuty, todaysDuties, users, onNavigate }) => {
    const today = new Date();
    today.setHours(0,0,0,0);

    return (
        <div 
            onClick={() => onNavigate('DUTY')}
            className="relative overflow-hidden bg-gradient-to-br from-pink-100 via-purple-100 to-sky-100 rounded-[2.5rem] p-8 text-indigo-900 shadow-lg shadow-purple-100/50 h-full flex flex-col justify-between items-center text-center group border-4 border-white cursor-pointer transition-all hover:shadow-xl active:scale-[0.98] animate-in fade-in"
        >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-30 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

            <div className="relative z-10 flex flex-col items-center gap-5 w-full my-auto">
                <div className="w-16 h-16 bg-white/50 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white shadow-inner shrink-0">
                    <CheckCircle2 className="w-9 h-9 text-emerald-500 drop-shadow-sm animate-pulse" />
                </div>

                <div className="flex flex-col items-center">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="bg-emerald-500/10 text-emerald-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center border border-emerald-200/50">
                            <Sparkles className="w-3.5 h-3.5 mr-1" /> Mission Clear
                        </span>
                    </div>
                    <h3 className="text-2xl font-extrabold tracking-tight mb-2 text-indigo-950">
                        ทำเวรเสร็จแล้ว!
                    </h3>

                    {nextDuty ? (
                        <div className="flex items-center gap-1.5 text-indigo-850 text-xs font-bold bg-white/40 border border-white/50 px-3 py-1.5 rounded-xl">
                            <Clock className="w-3.5 h-3.5 text-indigo-600" />
                            เวรครั้งหน้า: อีก {differenceInCalendarDays(new Date(nextDuty.date), today)} วัน ({format(new Date(nextDuty.date), 'd MMM', { locale: th })})
                        </div>
                    ) : (
                        <p className="text-indigo-800 text-xs font-semibold mt-1">
                            ขอบคุณที่ช่วยดูแลความสะอาดกิลด์ครับ ✨
                        </p>
                    )}
                </div>
            </div>

            <div className="relative z-10 w-full flex flex-col items-center gap-3">
                <div className="opacity-95">
                    <DutyGuardians todaysDuties={todaysDuties} users={users} />
                </div>
            </div>
        </div>
    );
};

export default CompletedState;
