
import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, Calendar, ChevronLeft, ChevronRight, CheckCircle2, ArrowUpRight, MonitorPlay, CheckSquare } from 'lucide-react';
import { Task, Channel } from '../../../../types';
import { format, isWithinInterval, startOfDay, endOfDay, subDays } from 'date-fns';
import { STATUS_COLORS } from '../../../../constants';

interface DoneHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    tasks: Task[]; // All completed tasks
    onOpenTask: (task: Task) => void;
}

const ITEMS_PER_PAGE = 10;

const DoneHistoryModal: React.FC<DoneHistoryModalProps> = ({ isOpen, onClose, tasks, onOpenTask }) => {
    const defaultSearch = '';
    const today = new Date();
    // Default to current month
    const firstDay = format(new Date(today.getFullYear(), today.getMonth(), 1), 'yyyy-MM-dd');
    const lastDay = format(new Date(today.getFullYear(), today.getMonth() + 1, 0), 'yyyy-MM-dd');

    const [searchQuery, setSearchQuery] = useState(defaultSearch);
    const [startDate, setStartDate] = useState(firstDay);
    const [endDate, setEndDate] = useState(lastDay);
    const [currentPage, setCurrentPage] = useState(1);

    // Quick Filter Actions
    const setPast7Days = () => {
        setStartDate(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
        setEndDate(format(new Date(), 'yyyy-MM-dd'));
        setCurrentPage(1);
    };

    const setThisMonth = () => {
        setStartDate(firstDay);
        setEndDate(lastDay);
        setCurrentPage(1);
    };

    const setLastMonth = () => {
        const d = new Date();
        d.setMonth(d.getMonth() - 1);
        const f = format(new Date(d.getFullYear(), d.getMonth(), 1), 'yyyy-MM-dd');
        const l = format(new Date(d.getFullYear(), d.getMonth() + 1, 0), 'yyyy-MM-dd');
        setStartDate(f);
        setEndDate(l);
        setCurrentPage(1);
    };

    const clearAllFilters = () => {
        setSearchQuery('');
        setStartDate('');
        setEndDate('');
        setCurrentPage(1);
    };

    // Filter Logic
    const { filteredTasks, summary } = useMemo(() => {
        const filtered = tasks.filter(task => {
            // 1. Search
            const matchSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
            
            // 2. Date Range (Based on End Date / Completed Date)
            let matchDate = true;
            if (startDate || endDate) {
                const taskDate = new Date(task.endDate);
                const s = startDate ? startOfDay(new Date(startDate)) : null;
                const e = endDate ? endOfDay(new Date(endDate)) : null;

                if (s && e) {
                    matchDate = isWithinInterval(taskDate, { start: s, end: e });
                } else if (s) {
                    matchDate = taskDate >= s;
                } else if (e) {
                    matchDate = taskDate <= e;
                }
            }

            return matchSearch && matchDate;
        }).sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime()); // Newest first

        const totalTasks = filtered.filter(t => t.type !== 'CONTENT').length;
        const totalContent = filtered.filter(t => t.type === 'CONTENT').length;

        return { 
            filteredTasks: filtered, 
            summary: {
                total: filtered.length,
                tasks: totalTasks,
                content: totalContent
            }
        };
    }, [tasks, searchQuery, startDate, endDate]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredTasks.length / ITEMS_PER_PAGE);
    const paginatedTasks = filteredTasks.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-4xl h-[85vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border-4 border-emerald-50 animate-in zoom-in-95">
                
                {/* Header */}
                <div className="px-8 py-6 bg-emerald-600 text-white shrink-0 flex justify-between items-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 transform rotate-12">
                        <CheckCircle2 className="w-40 h-40" />
                    </div>
                    <div className="relative z-10">
                        <h2 className="text-2xl font-bold flex items-center gap-3">
                            <CheckCircle2 className="w-8 h-8 text-emerald-200" />
                            ทำเนียบงานเสร็จ (Done History)
                        </h2>
                        <p className="text-emerald-100 text-sm mt-1 font-medium">รวมผลงานความสำเร็จทั้งหมดของคุณไว้ที่นี่</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors relative z-10">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Filters */}
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex flex-col gap-4 shrink-0">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input 
                                type="text" 
                                placeholder="ค้นหาชื่องาน..." 
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 outline-none"
                                value={searchQuery}
                                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                            />
                        </div>
                        
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <div className="flex items-center bg-white border border-gray-200 rounded-xl px-3 py-2 gap-2 shadow-sm">
                                <Calendar className="w-4 h-4 text-emerald-500" />
                                <input 
                                    type="date" 
                                    className="text-xs font-bold text-gray-600 outline-none bg-transparent"
                                    value={startDate}
                                    onChange={e => { setStartDate(e.target.value); setCurrentPage(1); }}
                                />
                                <span className="text-gray-300">-</span>
                                <input 
                                    type="date" 
                                    className="text-xs font-bold text-gray-600 outline-none bg-transparent"
                                    value={endDate}
                                    onChange={e => { setEndDate(e.target.value); setCurrentPage(1); }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mr-2">Quick Filters:</span>
                        <button 
                            onClick={setPast7Days}
                            className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-[10px] font-bold text-gray-600 hover:border-emerald-300 hover:text-emerald-600 transition-all shadow-sm"
                        >
                            7 วันล่าสุด
                        </button>
                        <button 
                            onClick={setThisMonth}
                            className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-[10px] font-bold text-gray-600 hover:border-emerald-300 hover:text-emerald-600 transition-all shadow-sm"
                        >
                            เดือนนี้
                        </button>
                        <button 
                            onClick={setLastMonth}
                            className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-[10px] font-bold text-gray-600 hover:border-emerald-300 hover:text-emerald-600 transition-all shadow-sm"
                        >
                            เดือนที่แล้ว
                        </button>
                        <button 
                            onClick={clearAllFilters}
                            className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-[12px] font-medium hover:bg-rose-600 hover:text-white transition-all ml-auto"
                        >
                            ล้างทั้งหมด
                        </button>
                    </div>
                </div>
                
                {/* Summary Overview */}
                <div className="px-6 py-4 bg-white grid grid-cols-3 gap-3 shrink-0 border-b border-gray-50">
                    <div className="bg-emerald-50/50 p-4 rounded-3xl border border-emerald-100 flex flex-col items-center justify-center text-center">
                        <span className="text-[10px] font-bold text-emerald-600/70 uppercase tracking-widest mb-1">Total Accomplished</span>
                        <div className="flex items-end gap-1">
                            <span className="text-2xl font-bold text-emerald-700">{summary.total}</span>
                            <span className="text-[10px] font-bold text-emerald-600/60 mb-1">งาน</span>
                        </div>
                    </div>
                    <div className="bg-blue-50/50 p-4 rounded-3xl border border-blue-100 flex flex-col items-center justify-center text-center">
                        <span className="text-[10px] font-bold text-blue-600/70 uppercase tracking-widest mb-1">General Tasks</span>
                        <div className="flex items-end gap-1">
                            <span className="text-2xl font-bold text-blue-700">{summary.tasks}</span>
                            <span className="text-[10px] font-bold text-blue-600/60 mb-1">ชิ้น</span>
                        </div>
                    </div>
                    <div className="bg-purple-50/50 p-4 rounded-3xl border border-purple-100 flex flex-col items-center justify-center text-center">
                        <span className="text-[10px] font-bold text-purple-600/70 uppercase tracking-widest mb-1">Content Works</span>
                        <div className="flex items-end gap-1">
                            <span className="text-2xl font-bold text-purple-700">{summary.content}</span>
                            <span className="text-[10px] font-bold text-purple-600/60 mb-1">คลิป</span>
                        </div>
                    </div>
                </div>

                {/* Content List */}
                <div className="flex-1 overflow-y-auto p-6 bg-white space-y-3">
                    {paginatedTasks.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                            <CheckCircle2 className="w-16 h-16 mb-4 text-emerald-200" />
                            <p className="text-lg font-bold">ไม่พบประวัติงาน</p>
                            <p className="text-xs">ลองปรับตัวกรอง หรือคุณอาจจะยังไม่มีงานที่เสร็จในช่วงนี้</p>
                        </div>
                    ) : (
                        paginatedTasks.map(task => {
                            const isContent = task.type === 'CONTENT';
                            return (
                                <div 
                                    key={task.id}
                                    onClick={() => onOpenTask(task)}
                                    className="group flex items-center justify-between p-4 rounded-2xl border border-gray-100 hover:border-emerald-200 hover:shadow-md transition-all cursor-pointer bg-white"
                                >
                                    <div className="flex items-start gap-4 overflow-hidden">
                                        {/* Icon Box based on Type */}
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
                                            isContent 
                                                ? 'bg-purple-50 text-purple-600 border-purple-100' 
                                                : 'bg-blue-50 text-blue-600 border-blue-100'
                                        }`}>
                                            {isContent ? <MonitorPlay className="w-6 h-6" /> : <CheckSquare className="w-6 h-6" />}
                                        </div>
                                        
                                        <div className="min-w-0">
                                            <h4 className="font-bold text-gray-800 truncate group-hover:text-emerald-700 transition-colors">{task.title}</h4>
                                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                                <span className="bg-gray-100 px-2 py-0.5 rounded flex items-center">
                                                    <Calendar className="w-3 h-3 mr-1" />
                                                    {format(new Date(task.endDate), 'd MMM yyyy')}
                                                </span>
                                                {task.contentFormats && task.contentFormats.length > 0 && (
                                                    <span className="bg-purple-50 text-purple-600 px-2 py-0.5 rounded border border-purple-100 font-bold">
                                                        {task.contentFormats[0]}
                                                    </span>
                                                )}
                                                {!isContent && (
                                                    <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100 font-bold">
                                                        TASK
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-gray-300 group-hover:text-emerald-500 transition-colors p-2 rounded-full group-hover:bg-emerald-50">
                                        <ArrowUpRight className="w-5 h-5" />
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer Pagination */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center shrink-0">
                    <span className="text-xs text-gray-500 font-bold">
                        แสดง {paginatedTasks.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredTasks.length)} จาก {filteredTasks.length} รายการ
                    </span>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="px-4 py-2 bg-white rounded-lg text-xs font-bold text-gray-700 border border-gray-200 shadow-sm flex items-center">
                            หน้า {currentPage} / {totalPages || 1}
                        </span>
                        <button 
                            onClick={() => setCurrentPage(p => Math.min(totalPages || 1, p + 1))}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default DoneHistoryModal;
