import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Edit2, Trash2, AlertCircle } from 'lucide-react';
import { MasterOption } from '../../../types';
import { MONTHS, getHolidayTypeInfo, Holiday } from './holidayTypes';

interface HolidayGridViewProps {
    holidays: Holiday[];
    onEdit: (h: Holiday) => void;
    onDelete: (id: string) => void;
    editingId: string | null;
    eventTypeOptions: MasterOption[];
    activeMonthNum?: number;
}

const HolidayGridView: React.FC<HolidayGridViewProps> = ({ 
    holidays, onEdit, onDelete, editingId, eventTypeOptions, activeMonthNum 
}) => {
    
    // Group sorted holidays by month
    const groupedHolidays = useMemo(() => {
        const groups: Record<number, Holiday[]> = {};
        holidays.forEach(h => {
            if (!groups[h.month]) groups[h.month] = [];
            groups[h.month].push(h);
        });
        return groups;
    }, [holidays]);

    const activeMonths = useMemo(() => {
        return MONTHS.filter(m => !!groupedHolidays[m.num]);
    }, [groupedHolidays]);

    if (activeMonths.length === 0) {
        return (
            <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-3 bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm">
                <AlertCircle className="w-10 h-10 text-slate-300" />
                <p className="text-sm font-bold text-slate-500">ไม่พบรายการวันหยุด</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-4">
            {activeMonths.map(m => {
                const list = groupedHolidays[m.num] || [];
                const isActiveMonth = activeMonthNum === m.num;
                const isCurrentMonth = m.num === (new Date().getMonth() + 1);
                const shouldGlow = isActiveMonth && list.length > 0;

                return (
                    <motion.div 
                        key={m.num}
                        id={`holiday-month-grid-${m.num}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={shouldGlow ? {
                            opacity: 1,
                            y: 0,
                            boxShadow: [
                                "0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)",
                                "0 0 25px 8px rgba(245, 158, 11, 0.35), 0 4px 6px -1px rgb(0 0 0 / 0.05)",
                                "0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)"
                            ],
                            borderColor: [
                                "rgba(226, 232, 240, 0.8)",
                                "rgba(245, 158, 11, 0.9)",
                                "rgba(226, 232, 240, 0.8)"
                            ]
                        } : {
                            opacity: 1,
                            y: 0
                        }}
                        transition={shouldGlow ? {
                            boxShadow: {
                                repeat: Infinity,
                                duration: 2.5,
                                ease: "easeInOut"
                            },
                            borderColor: {
                                repeat: Infinity,
                                duration: 2.5,
                                ease: "easeInOut"
                            },
                            opacity: { duration: 0.3 },
                            y: { duration: 0.3 }
                        } : {
                            duration: 0.3
                        }}
                        className={`relative border rounded-[1.8rem] p-4 flex flex-col h-full transition-all duration-300 ${
                            shouldGlow 
                                ? 'bg-amber-100/40 border-amber-400 ring-2 ring-amber-500/10 shadow-[0_0_22px_rgba(245,158,11,0.22)]' 
                                : 'bg-white border-slate-200/70 shadow-sm hover:shadow-md hover:border-slate-300'
                        }`}
                    >
                        {shouldGlow && (
                            <motion.div
                                className="absolute inset-0 rounded-[1.8rem] -z-10 pointer-events-none overflow-hidden"
                                style={{
                                    background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 35%, #fbbf24 50%, #fde68a 65%, #fef3c7 100%)",
                                    backgroundSize: "200% 200%",
                                }}
                                animate={{
                                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
                                }}
                                transition={{
                                    repeat: Infinity,
                                    duration: 5,
                                    ease: "easeInOut"
                                }}
                            />
                        )}
                        <div className="relative z-10 flex flex-col h-full w-full">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                            <span className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                                <span className={`inline-block w-2.5 h-2.5 rounded-full ${shouldGlow ? 'bg-amber-500 animate-pulse' : 'bg-indigo-400'}`} />
                                {m.name}
                                {shouldGlow && (
                                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md leading-none tracking-tight ml-1 ${
                                        isCurrentMonth 
                                            ? 'text-indigo-600 bg-indigo-50 border border-indigo-100/50' 
                                            : 'text-amber-600 bg-amber-50 border border-amber-100/50'
                                    }`}>
                                        {isCurrentMonth ? 'เดือนปัจจุบัน' : 'เดือนที่เลือก'}
                                    </span>
                                )}
                            </span>
                            <span className="text-xs font-bold text-slate-400 bg-slate-100/80 px-2.5 py-0.5 rounded-full">
                                {list.length} วันหยุด
                            </span>
                        </div>

                        <div className="space-y-2.5 flex-1">
                            {list.map(holiday => {
                                const typeInfo = getHolidayTypeInfo(holiday.typeKey || holiday.type_key || '', eventTypeOptions);
                                const isEditingThis = editingId === holiday.id;

                                return (
                                    <div 
                                        key={holiday.id} 
                                        className={`p-2.5 rounded-2xl border flex items-center justify-between group transition-all duration-200 relative ${
                                            isEditingThis 
                                                ? 'border-emerald-500 ring-2 ring-emerald-500/10 bg-emerald-50/10' 
                                                : shouldGlow
                                                    ? 'border-amber-200/50 hover:border-amber-300/80 bg-white/40 hover:bg-white/60 shadow-[0_2px_8px_rgba(245,158,11,0.04)]'
                                                    : 'border-slate-100 hover:border-indigo-100 bg-slate-50/40 hover:bg-indigo-50/10'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            <div className={`w-8 h-8 rounded-xl flex flex-col items-center justify-center font-black text-slate-700 shadow-sm text-sm shrink-0 border ${
                                                shouldGlow
                                                    ? 'bg-white/70 border-amber-200/40'
                                                    : 'bg-white border-slate-200'
                                            }`}>
                                                {holiday.day}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <span className="block text-xs font-bold text-slate-800 truncate" title={holiday.name}>
                                                    {holiday.name}
                                                </span>
                                                <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-md mt-0.5 ${typeInfo.color}`}>
                                                    {typeInfo.label}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-1 md:opacity-0 group-hover:opacity-100 transition-opacity duration-200 pl-2 shrink-0">
                                            <button 
                                                onClick={() => onEdit(holiday)}
                                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                title="แก้ไข"
                                            >
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </button>
                                            <button 
                                                onClick={() => onDelete(holiday.id)} 
                                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                                title="ลบ"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
};

export default HolidayGridView;
