
import React from 'react';
import { Coffee, CheckCircle2 } from 'lucide-react';
import { Duty, User } from '../../../types';
import { isSameDay } from 'date-fns';
import { useDuty } from '../../../hooks/useDuty';

interface DutyRosterWidgetProps {
    users: User[];
}

const DutyRosterWidget: React.FC<DutyRosterWidgetProps> = ({ users }) => {
    const { duties } = useDuty();
    const today = new Date();
    const todaysDuties = duties.filter(d => isSameDay(new Date(d.date), today));

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-wide mb-3 flex items-center">
                <Coffee className="w-4 h-4 mr-2" /> เวรประจำวันนี้
            </h3>
            <div className="space-y-2">
                {todaysDuties.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4 bg-gray-50 rounded-xl border border-gray-100 border-dashed">วันนี้ไม่มีเวรครับ</p>
                ) : (
                    todaysDuties.map(duty => {
                        const assignee = users.find(u => u.id === duty.assigneeId);
                        return (
                            <div key={duty.id} className={`flex items-center p-3 rounded-xl border transition-all ${duty.isDone ? 'bg-green-50 border-green-200' : 'bg-white border-gray-100 hover:border-indigo-200'}`}>
                                <div className="mr-3">
                                    {assignee?.avatarUrl ? <img src={assignee.avatarUrl} className="w-8 h-8 rounded-full object-cover" referrerPolicy="no-referrer" /> : <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">{assignee?.name?.charAt(0) || '?'}</div>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-bold truncate ${duty.isDone ? 'text-green-700 line-through' : 'text-gray-800'}`}>{duty.title}</p>
                                    <p className="text-xs text-gray-500">รับผิดชอบโดย {assignee?.name || 'Unknown'}</p>
                                </div>
                                {duty.isDone && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default DutyRosterWidget;
