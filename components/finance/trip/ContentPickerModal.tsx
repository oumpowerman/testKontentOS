
import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, Filter, CheckCircle2, Circle, Calendar, Layout, Layers, Film } from 'lucide-react';
import { Task, MasterOption } from '../../../types';
import { format, subDays, isAfter } from 'date-fns';

interface ContentPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    availableTasks: Task[];
    masterOptions: MasterOption[];
    onConfirm: (selectedIds: string[]) => void;
}

const ContentPickerModal: React.FC<ContentPickerModalProps> = ({ 
    isOpen, onClose, availableTasks, masterOptions, onConfirm 
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [filterFormat, setFilterFormat] = useState<string>('ALL');
    const [filterTime, setFilterTime] = useState<string>('ALL');

    // Filter Options
    const formatOptions = masterOptions.filter(o => o.type === 'FORMAT' && o.isActive);

    // --- Filter Logic ---
    const filteredTasks = useMemo(() => {
        return availableTasks.filter(t => {
            // 1. Search
            if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            
            // 2. Format
            if (filterFormat !== 'ALL') {
                const formats = t.contentFormats || [];
                if (!formats.includes(filterFormat)) return false;
            }

            // 3. Time
            if (filterTime === 'RECENT') {
                // Last 30 days created
                const date = t.createdAt ? new Date(t.createdAt) : new Date();
                if (!isAfter(date, subDays(new Date(), 30))) return false;
            }

            return true;
        }).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    }, [availableTasks, searchQuery, filterFormat, filterTime]);

    // --- Handlers ---
    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const handleConfirm = () => {
        onConfirm(Array.from(selectedIds));
        onClose();
    };

    const handleSelectAll = () => {
        if (selectedIds.size === filteredTasks.length) {
            setSelectedIds(new Set());
        } else {
            const newSet = new Set<string>();
            filteredTasks.forEach(t => newSet.add(t.id));
            setSelectedIds(newSet);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-5xl h-[85vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border-[6px] border-white ring-1 ring-slate-200">
                
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
                    <div>
                        <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                            <span className="bg-indigo-100 text-indigo-600 p-2 rounded-xl">
                                <Film className="w-6 h-6" />
                            </span>
                            เลือกคอนเทนต์เข้ากอง (Content Picker)
                        </h3>
                        <p className="text-slate-500 text-sm mt-1 ml-1">เลือกรายการที่ต้องการถ่ายทำใน Session นี้</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    
                    {/* Sidebar Filters */}
                    <div className="w-64 bg-slate-50 border-r border-slate-100 p-5 flex flex-col gap-6 shrink-0 overflow-y-auto">
                        
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="ค้นหาชื่อ..." 
                                className="w-full pl-9 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-200 outline-none"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                autoFocus
                            />
                        </div>

                        {/* Format Filter */}
                        <div>
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center">
                                <Layout className="w-3 h-3 mr-1.5" /> Filter by Format
                            </h4>
                            <div className="space-y-1">
                                <button 
                                    onClick={() => setFilterFormat('ALL')}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all ${filterFormat === 'ALL' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-white'}`}
                                >
                                    ทั้งหมด (All Formats)
                                </button>
                                {formatOptions.map(opt => (
                                    <button 
                                        key={opt.key}
                                        onClick={() => setFilterFormat(opt.key)}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all ${filterFormat === opt.key ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-white'}`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Time Filter */}
                        <div>
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center">
                                <Calendar className="w-3 h-3 mr-1.5" /> Time Range
                            </h4>
                            <div className="space-y-1">
                                <button 
                                    onClick={() => setFilterTime('ALL')}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all ${filterTime === 'ALL' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-white'}`}
                                >
                                    ทั้งหมด (All Time)
                                </button>
                                <button 
                                    onClick={() => setFilterTime('RECENT')}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all ${filterTime === 'RECENT' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-white'}`}
                                >
                                    ล่าสุด 30 วัน
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Main Grid */}
                    <div className="flex-1 overflow-y-auto p-6 bg-[#f8fafc]">
                        <div className="flex justify-between items-center mb-4">
                            <p className="text-sm font-bold text-slate-500">
                                พบ {filteredTasks.length} รายการ
                            </p>
                            <button 
                                onClick={handleSelectAll}
                                className="text-xs font-bold text-indigo-600 hover:underline"
                            >
                                {selectedIds.size === filteredTasks.length && filteredTasks.length > 0 ? 'Deselect All' : 'Select All'}
                            </button>
                        </div>

                        {filteredTasks.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl">
                                <Layers className="w-12 h-12 mb-2 opacity-20" />
                                <p>ไม่พบรายการที่ค้นหา</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredTasks.map(task => {
                                    const isSelected = selectedIds.has(task.id);
                                    return (
                                        <div 
                                            key={task.id}
                                            onClick={() => toggleSelection(task.id)}
                                            className={`
                                                relative p-4 rounded-2xl border-2 transition-all cursor-pointer group flex flex-col justify-between min-h-[140px]
                                                ${isSelected 
                                                    ? 'bg-indigo-50 border-indigo-500 shadow-md ring-1 ring-indigo-200' 
                                                    : 'bg-white border-slate-100 hover:border-indigo-300 hover:shadow-lg hover:-translate-y-1'
                                                }
                                            `}
                                        >
                                            {/* Selection Circle */}
                                            <div className={`absolute top-3 right-3 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-slate-200 bg-white group-hover:border-indigo-300'}`}>
                                                {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                                            </div>

                                            <div>
                                                {task.contentFormats && task.contentFormats.length > 0 && (
                                                    <span className="inline-block text-[9px] font-black uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md mb-2">
                                                        {task.contentFormats[0]}
                                                    </span>
                                                )}
                                                <h4 className={`font-bold text-sm line-clamp-3 leading-relaxed ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>
                                                    {task.title}
                                                </h4>
                                            </div>

                                            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100/50">
                                                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${task.status === 'IDEA' ? 'bg-yellow-50 text-yellow-600' : 'bg-slate-50 text-slate-500'}`}>
                                                    {task.status}
                                                </span>
                                                {task.isUnscheduled && (
                                                    <span className="text-[10px] font-bold text-slate-400 flex items-center ml-auto">
                                                        Unscheduled
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Bar */}
                <div className="p-4 bg-white border-t border-slate-100 flex justify-between items-center shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-10">
                    <div className="text-sm font-medium text-slate-500 ml-4">
                        เลือกแล้ว <span className="font-black text-indigo-600 text-lg">{selectedIds.size}</span> รายการ
                    </div>
                    <div className="flex gap-3">
                         <button onClick={onClose} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors">
                            ยกเลิก
                        </button>
                        <button 
                            onClick={handleConfirm}
                            disabled={selectedIds.size === 0}
                            className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-bold shadow-lg hover:shadow-indigo-200 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            ยืนยัน ({selectedIds.size})
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ContentPickerModal;
