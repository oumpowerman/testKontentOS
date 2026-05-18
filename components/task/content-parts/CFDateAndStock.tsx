
import React, { useState } from 'react';
import { CalendarDays, Archive, Clock } from 'lucide-react';
import TimePickerModal from '../../ui/TimePickerModal';

interface CFDateAndStockProps {
    startDate: string;
    setStartDate: (val: string) => void;
    endDate: string;
    setEndDate: (val: string) => void;
    isStock: boolean;
    setIsStock: (val: boolean) => void;
    scheduledTime?: string;
    setScheduledTime?: (val: string) => void;
}

const CFDateAndStock: React.FC<CFDateAndStockProps> = ({ 
    startDate, setStartDate, endDate, setEndDate, isStock, setIsStock,
    scheduledTime, setScheduledTime
}) => {
    const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);

    return (
        <div className={`p-5 rounded-[1.5rem] border-2 transition-all duration-300 relative overflow-hidden ${isStock ? 'bg-gray-50 border-gray-200' : 'bg-white border-indigo-100 shadow-sm'}`}>
            <div className="flex justify-between items-center mb-3 relative z-10">
                <label className="block text-s font-bold text-gray-500 uppercase tracking-wide flex items-center">
                    <CalendarDays className="w-4 h-4 mr-1.5" />
                    {isStock ? 'เก็บเข้าคลัง' : 'กำหนดวันลง'}
                </label>
                
                <label className="flex items-center cursor-pointer group">
                    <div className="relative">
                        <input type="checkbox" className="sr-only" checked={isStock} onChange={(e) => setIsStock(e.target.checked)} />
                        <div className={`block w-12 h-7 rounded-full transition-colors shadow-inner ${isStock ? 'bg-gray-300' : 'bg-indigo-600'}`}></div>
                        <div className={`absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform shadow-sm ${isStock ? 'translate-x-5' : 'translate-x-0'}`}></div>
                    </div>
                    <span className={`ml-3 text-xs font-bold transition-colors ${isStock ? 'text-gray-500' : 'text-indigo-600'}`}>
                        {isStock ? 'คลัง' : 'กำหนดวัน'}
                    </span>
                </label>
            </div>
            
            <div className="relative z-10">
                {!isStock ? (
                    <div className="flex gap-2">
                        <input 
                            type="date" 
                            value={endDate} 
                            onChange={(e) => { 
                                const val = e.target.value;
                                setEndDate(val); 
                                setStartDate(val); 
                            }} 
                            className="flex-1 px-4 py-3 bg-indigo-50/30 border-2 border-indigo-100 rounded-xl outline-none font-bold text-indigo-700 focus:ring-2 focus:ring-indigo-200 transition-all cursor-pointer hover:bg-white" 
                        />
                        
                        <button
                            type="button"
                            onClick={() => setIsTimePickerOpen(true)}
                            className="w-32 px-4 py-3 bg-indigo-50/30 border-2 border-indigo-100 rounded-xl outline-none font-bold text-indigo-700 focus:ring-2 focus:ring-indigo-200 transition-all cursor-pointer hover:bg-white flex items-center justify-center space-x-2"
                        >
                            <Clock className="w-4 h-4" />
                            <span>{scheduledTime || '--:--'}</span>
                        </button>
                    </div>
                ) : (
                    <div className="px-4 py-3 bg-white/50 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-400 text-center font-bold flex items-center justify-center">
                        <Archive className="w-4 h-4 mr-2" /> ยังไม่ระบุวัน
                    </div>
                )}
            </div>

            <TimePickerModal 
                isOpen={isTimePickerOpen}
                onClose={() => setIsTimePickerOpen(false)}
                initialTime={scheduledTime}
                onSelect={(time) => setScheduledTime?.(time)}
            />
        </div>
    );
};

export default CFDateAndStock;
