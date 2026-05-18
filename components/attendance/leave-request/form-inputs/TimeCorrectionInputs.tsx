
import React, { useState } from 'react';
import { format } from 'date-fns';
import CustomDatePicker from '../../../common/CustomDatePicker';
import TimePickerModal from '../../../ui/TimePickerModal';
import { Clock } from 'lucide-react';

interface Props {
    date: string;
    setDate: (val: string) => void;
    time: string;
    setTime: (val: string) => void;
    endTime?: string;
    setEndTime?: (val: string) => void;
    isFixedDate?: boolean;
    showEndTime?: boolean;
}

const TimeCorrectionInputs: React.FC<Props> = ({ date, setDate, time, setTime, endTime, setEndTime, isFixedDate, showEndTime }) => {
    const selectedDate = date ? new Date(date) : null;
    const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
    const [isEndTimePickerOpen, setIsEndTimePickerOpen] = useState(false);

    return (
        <div className="space-y-6">
            <div>
                <label className="block text-[13px] font-kanit font-bold text-slate-400 uppercase mb-3 ml-2 tracking-[0.2em]">วันที่ต้องการแก้ไข (Date)</label>
                <div className="relative group">
                    <CustomDatePicker 
                        selected={selectedDate}
                        onChange={(date) => setDate(date ? date.toISOString().split('T')[0] : '')}
                        disabled={isFixedDate}
                        placeholderText="วัน/เดือน/ปี"
                    />
                </div>
            </div>

            <div className={`grid ${showEndTime ? 'grid-cols-2' : 'grid-cols-1'} gap-5`}>
                <div className="space-y-2">
                    <label className="block text-[13px] font-kanit font-bold text-slate-400 uppercase mb-1 ml-2 tracking-[0.2em] flex items-center gap-2">
                        <Clock className="w-4 h-4 text-indigo-400" />
                        {showEndTime ? 'เวลาเข้างาน' : 'เวลาที่ถูกต้อง'}
                    </label>
                    <button
                        type="button"
                        onClick={() => setIsTimePickerOpen(true)}
                        className="w-full p-6 bg-indigo-50/50 border-2 border-indigo-100/30 rounded-[2rem] text-left transition-all hover:bg-white hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-100/50 flex items-center justify-between group"
                    >
                        <span className={`text-xl font-bold ${time ? 'text-indigo-600' : 'text-indigo-300'}`}>
                            {time || '--:--'}
                        </span>
                        <div className="p-2 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                            <Clock className="w-5 h-5 text-indigo-400" />
                        </div>
                    </button>
                    
                    <TimePickerModal 
                        isOpen={isTimePickerOpen}
                        onClose={() => setIsTimePickerOpen(false)}
                        initialTime={time}
                        onSelect={(val) => setTime(val)}
                    />
                </div>

                {showEndTime && setEndTime && (
                    <div className="space-y-2">
                        <label className="block text-[13px] font-kanit font-bold text-slate-400 uppercase mb-1 ml-2 tracking-[0.2em] flex items-center gap-2">
                            <Clock className="w-4 h-4 text-rose-400" />
                            เวลาออกงาน
                        </label>
                        <button
                            type="button"
                            onClick={() => setIsEndTimePickerOpen(true)}
                            className="w-full p-6 bg-rose-50/50 border-2 border-rose-100/30 rounded-[2rem] text-left transition-all hover:bg-white hover:border-rose-400 hover:shadow-xl hover:shadow-rose-100/50 flex items-center justify-between group"
                        >
                            <span className={`text-xl font-bold ${endTime ? 'text-rose-600' : 'text-rose-300'}`}>
                                {endTime || '--:--'}
                            </span>
                            <div className="p-2 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                                <Clock className="w-5 h-5 text-rose-400" />
                            </div>
                        </button>

                        <TimePickerModal 
                            isOpen={isEndTimePickerOpen}
                            onClose={() => setIsEndTimePickerOpen(false)}
                            initialTime={endTime}
                            onSelect={(val) => setEndTime(val)}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default TimeCorrectionInputs;
