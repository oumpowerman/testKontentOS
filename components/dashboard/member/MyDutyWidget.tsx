
import React, { useMemo } from 'react';
import { User, Duty, ViewMode, AnnualHoliday } from '../../../types';
import { format, isWeekend } from 'date-fns';
import { Clock } from 'lucide-react';

// Sub-components
import AbandonedState from './duty-widgets/AbandonedState';
import DeadState from './duty-widgets/DeadState';
import TribunalState from './duty-widgets/TribunalState';
import ActiveState from './duty-widgets/ActiveState';
import CompletedState from './duty-widgets/CompletedState';
import IdleState from './duty-widgets/IdleState';

interface MyDutyWidgetProps {
    duties: Duty[];
    currentUser: User;
    users: User[];
    onNavigate: (view: ViewMode) => void;
    onFixNegligence?: (duty: Duty) => void;
    calendarMetadata?: {
        annualHolidays: AnnualHoliday[];
        calendarExceptions: any[];
    };
}

const MyDutyWidget: React.FC<MyDutyWidgetProps> = ({ duties, currentUser, users, onNavigate, onFixNegligence, calendarMetadata }) => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const today = new Date();
    today.setHours(0,0,0,0);

    // Helper to check today's status
    const todayStatus = useMemo(() => {
        if (!calendarMetadata) return { isHoliday: false, name: '' };
        
        const exception = calendarMetadata.calendarExceptions.find(e => e.date === todayStr);
        if (exception) {
            return { 
                isHoliday: exception.type === 'HOLIDAY', 
                name: exception.description || (exception.type === 'HOLIDAY' ? 'วันหยุดพิเศษ' : 'วันทำงานพิเศษ') 
            };
        }

        const holiday = calendarMetadata.annualHolidays.find(h => h.day === today.getDate() && h.month === today.getMonth() + 1 && h.isActive);
        if (holiday) return { isHoliday: true, name: holiday.name };

        if (isWeekend(today)) return { isHoliday: true, name: 'วันหยุดสุดสัปดาห์' };

        return { isHoliday: false, name: '' };
    }, [calendarMetadata, todayStr, today]);

    // 1. Get ALL duties for today
    const todaysDuties = useMemo(() => 
        duties.filter(d => {
            if (!d.date) return false;
            const dutyDateStr = format(new Date(d.date), 'yyyy-MM-dd');
            return dutyDateStr === todayStr;
        }),
    [duties, todayStr]);

    // 2. Check if current user has duty TODAY
    const myDutiesToday = todaysDuties.filter(d => d.assigneeId === currentUser.id && !d.isDone);
    const myCompletedDutyToday = todaysDuties.find(d => d.assigneeId === currentUser.id && d.isDone);
    const hasMyDutyToday = myDutiesToday.length > 0;

    // 3. CRITICAL CHECK: Find Missed Duties
    const missedDuties = useMemo(() => duties.filter(d => {
        if (!d.date || d.isDone) return false;
        const dutyDate = new Date(d.date);
        dutyDate.setHours(0,0,0,0);
        return d.assigneeId === currentUser.id && dutyDate < today && d.penaltyStatus === 'NONE';
    }), [duties, currentUser, today]);

    const tribunalDuties = useMemo(() => duties.filter(d => d.assigneeId === currentUser.id && d.penaltyStatus === 'AWAITING_TRIBUNAL'), [duties, currentUser]);
    
    const abandonedDuties = useMemo(() => duties.filter(d => 
        d.assigneeId === currentUser.id && 
        d.penaltyStatus === 'ABANDONED' && 
        !d.clearedBySystem
    ), [duties, currentUser]);

    // 4. Find Next Duty (Future)
    const nextDuty = useMemo(() => {
        return duties
            .filter(d => {
                if (!d.date) return false;
                const dutyDateStr = format(new Date(d.date), 'yyyy-MM-dd');
                return d.assigneeId === currentUser.id && dutyDateStr > todayStr;
            })
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
    }, [duties, currentUser, todayStr]);

    // --- PRIORITY 0: DEATH STATE ---
    if (currentUser.hp <= 0) {
        return <DeadState onNavigate={onNavigate} />;
    }

    // --- PRIORITY 1: ABANDONED (SHAME LIST) ---
    if (abandonedDuties.length > 0) {
        return <AbandonedState abandonedDuty={abandonedDuties[0]} onFixNegligence={onFixNegligence} onNavigate={onNavigate} />;
    }

    // --- PRIORITY 2: TRIBUNAL (LAST CHANCE) ---
    if (tribunalDuties.length > 0) {
        return <TribunalState onNavigate={onNavigate} />;
    }

    // --- PRIORITY 3: RECENT MISSED (BEFORE TRIBUNAL) ---
    if (missedDuties.length > 0) {
        return (
            <div 
                onClick={() => onNavigate('DUTY')}
                className="relative overflow-hidden bg-gradient-to-br from-orange-50 to-red-100 rounded-[2.5rem] p-8 text-red-900 shadow-lg shadow-orange-100 h-full flex flex-col justify-between items-center text-center group border-4 border-white cursor-pointer transition-all hover:shadow-xl active:scale-[0.98]"
            >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-40 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
                <div className="relative z-10 flex flex-col items-center gap-5 w-full my-auto">
                    <div className="w-16 h-16 bg-white/60 backdrop-blur-md rounded-2xl flex items-center justify-center border border-orange-300 shadow-inner shrink-0 animate-pulse">
                        <Clock className="w-10 h-10 text-orange-600" />
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <span className="bg-orange-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                                MISSED DUTY
                            </span>
                        </div>
                        <h3 className="text-2xl font-black tracking-tight leading-none mb-2 text-slate-800">
                            ลืมทำเวรเมื่อวาน! 😱
                        </h3>
                        <p className="text-orange-950/80 text-xs font-semibold max-w-[240px] leading-relaxed">
                            รีบไปจัดการด่วนก่อนโดนหักคะแนน HP และระบบบันทึกความประพฤติครับ
                        </p>
                    </div>
                </div>

                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        onNavigate('DUTY');
                    }}
                    className="relative z-10 flex items-center justify-center gap-2 px-6 py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold text-sm shadow-xl shadow-red-900/20 transition-all active:scale-95 w-full text-center border-t border-red-400"
                >
                    ⚡ เคลียร์เวรย้อนหลัง
                </button>
            </div>
        );
    }

    // --- CASE 3: I HAVE DUTY TODAY (Active Mode) ---
    if (hasMyDutyToday) {
        return <ActiveState myDuty={myDutiesToday[0]} onNavigate={onNavigate} />;
    }

    // --- CASE 3.5: MISSION ACCOMPLISHED ---
    if (myCompletedDutyToday) {
        return (
            <CompletedState 
                completedDuty={myCompletedDutyToday} 
                nextDuty={nextDuty} 
                todaysDuties={todaysDuties} 
                users={users} 
                onNavigate={onNavigate} 
            />
        );
    }

    // --- CASE 4: NO DUTY (Idle Mode) ---
    return (
        <IdleState 
            todayStatus={todayStatus} 
            nextDuty={nextDuty} 
            todaysDuties={todaysDuties} 
            users={users} 
            onNavigate={onNavigate} 
        />
    );
};

export default MyDutyWidget;
