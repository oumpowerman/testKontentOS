
import React, { useState, useMemo } from 'react';
import { MeetingLog, MeetingCategory, MasterOption, User } from '../../types';
import { Search, Trash2, Clock, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Hash, Sparkles, Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import { format, endOfMonth, eachDayOfInterval, isToday, addMonths, isFuture, isSameDay, isSameMonth } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

interface MeetingListSidebarProps {
    meetings: MeetingLog[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    onDelete: (id: string) => void;
    searchQuery: string;
    setSearchQuery: (val: string) => void;
    currentUser?: any; 
    masterOptions: MasterOption[]; // New Prop
    users: User[];
}

type ViewTab = 'UPCOMING' | 'HISTORY';

const MeetingListSidebar: React.FC<MeetingListSidebarProps> = React.memo(({
    meetings, selectedId, onSelect, onDelete, searchQuery, setSearchQuery, currentUser, masterOptions, users
}) => {
    // --- State ---
    const [viewTab, setViewTab] = useState<ViewTab>('UPCOMING');
    const [currentNavDate, setCurrentNavDate] = useState(new Date()); // For Calendar Navigation
    const [selectedDate, setSelectedDate] = useState<Date | null>(null); // Specific day filter
    const [filterCategory, setFilterCategory] = useState<string>('ALL'); // Changed type to string to match MasterOption key
    const [showCalendar, setShowCalendar] = useState(true);

    // --- Helpers ---
    const getCategoryKey = (m: MeetingLog): string => m.category || 'GENERAL';

    // --- Calendar Logic ---
    const monthStart = new Date(currentNavDate.getFullYear(), currentNavDate.getMonth(), 1);
    const monthEnd = endOfMonth(currentNavDate);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startOffset = monthStart.getDay(); 
    
    // Find days with meetings
    const meetingDays = useMemo(() => {
        const days = new Set<string>();
        meetings.forEach(m => days.add(format(m.date, 'yyyy-MM-dd')));
        return days;
    }, [meetings]);

    // --- Filter Logic ---
    const filteredMeetings = useMemo(() => {
        let filtered = meetings.filter(m => {
            // 1. Search Query
            const matchSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase());
            // 2. Category
            const matchCat = filterCategory === 'ALL' || getCategoryKey(m) === filterCategory;
            // 3. Date Selection (If calendar day selected)
            const matchDate = selectedDate ? isSameDay(m.date, selectedDate) : true;
            
            return matchSearch && matchCat && matchDate;
        });

        // 4. Tab Split (Upcoming vs History)
        if (!selectedDate) {
            const today = new Date();
            today.setHours(0,0,0,0);
            
            if (viewTab === 'UPCOMING') {
                // Future or Today
                filtered = filtered.filter(m => {
                    const mDate = new Date(m.date);
                    mDate.setHours(0,0,0,0);
                    return mDate >= today;
                }).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()); 
            } else {
                // Past
                filtered = filtered.filter(m => {
                    const mDate = new Date(m.date);
                    mDate.setHours(0,0,0,0);
                    return mDate < today;
                }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()); 
            }
        } else {
             filtered.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }

        return filtered;
    }, [meetings, searchQuery, filterCategory, selectedDate, viewTab]);

    // --- Grouping Logic (For History) ---
    const groupedMeetings = useMemo(() => {
        if (selectedDate || viewTab === 'UPCOMING') return null; 
        
        const groups: Record<string, MeetingLog[]> = {};
        filteredMeetings.forEach(m => {
            const key = format(m.date, 'MMMM yyyy'); 
            if (!groups[key]) groups[key] = [];
            groups[key].push(m);
        });
        return groups;
    }, [filteredMeetings, selectedDate, viewTab]);


    // --- Renderers ---
    const renderMeetingItem = (meeting: MeetingLog) => {
        const catKey = getCategoryKey(meeting);
        
        // Find Dynamic Style from Master Options
        const option = masterOptions.find(o => o.type === 'MEETING_CATEGORY' && o.key === catKey);
        
        // Fallback Style
        const colorClass = option?.color || 'bg-slate-50 text-slate-600 border-slate-200';
        const label = option?.label || catKey;
        
        const isSelected = selectedId === meeting.id;

        return (
            <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                key={meeting.id} 
                onClick={() => onSelect(meeting.id)}
                className={`
                    relative p-4 mb-4 rounded-[2rem] cursor-pointer transition-all duration-300 group border
                    ${isSelected 
                        ? `bg-white/90 backdrop-blur-md border-indigo-300 shadow-[0_15px_30px_-10px_rgba(99,102,241,0.2)] z-10 ring-4 ring-indigo-500/5` 
                        : 'bg-white/60 backdrop-blur-sm border-white/80 hover:border-indigo-200 hover:shadow-lg shadow-sm'
                    }
                `}
            >
                {/* Left Accent Bar */}
                <div className={`absolute left-0 top-6 bottom-6 w-1.5 rounded-r-full opacity-70 ${colorClass.split(' ')[0].replace('bg-', 'bg-')}`}></div>

                <div className="pl-3">
                    {/* Header: Date & Category */}
                    <div className="flex justify-between items-center mb-3">
                        <div className={`text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1.5 border shadow-sm ${colorClass} backdrop-blur-md`}>
                            {label}
                        </div>
                        <div className="text-[9px] font-bold text-slate-400 bg-white/80 px-2 py-1 rounded-lg flex items-center shadow-sm border border-white/60">
                            <Clock className="w-3 h-3 mr-1 text-indigo-400" />
                            {format(meeting.date, 'd MMM')}
                        </div>
                    </div>

                    {/* Title */}
                    <h4 className={`font-bold text-sm mb-3 line-clamp-2 leading-relaxed ${isSelected ? 'text-slate-900' : 'text-slate-700'}`}>
                        {meeting.title || 'Untitled Meeting'}
                    </h4>

                    {/* Footer: Stats & Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-white/40">
                         <div className="flex items-center gap-2">
                            {/* Tags */}
                            {meeting.tags.length > 0 && (
                                <span className="text-[8px] text-indigo-500 bg-indigo-50/50 px-2 py-0.5 rounded-full font-bold flex items-center border border-indigo-100/50">
                                    <Hash className="w-2.5 h-2.5 mr-0.5" />
                                    {meeting.tags[0]}
                                </span>
                            )}
                            {/* Attendees */}
                            {meeting.attendees.length > 0 && (
                                <div className="flex -space-x-1.5">
                                    {meeting.attendees.slice(0,3).map((uid, i) => {
                                        const user = users.find(u => u.id === uid);
                                        return (
                                            <div key={i} className="w-5 h-5 rounded-full bg-slate-100 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center">
                                                {user?.avatarUrl ? (
                                                    <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-[6px] font-black text-slate-400 capitalize">
                                                        {user?.name?.charAt(0) || '?'}
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                    {meeting.attendees.length > 3 && <div className="text-[8px] text-slate-400 font-bold ml-2">+{meeting.attendees.length - 3}</div>}
                                </div>
                            )}
                         </div>

                        <button 
                            onClick={(e) => { e.stopPropagation(); onDelete(meeting.id); }}
                            className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100 shadow-sm border border-transparent hover:border-rose-100"
                            title="ลบบันทึก"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </motion.div>
        );
    };

    // Filter Options for Chips
    const categoryOptions = masterOptions
        .filter(o => o.type === 'MEETING_CATEGORY' && o.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder);

    return (
        <div className="w-full bg-slate-50/50 backdrop-blur-xl flex flex-col h-full shrink-0 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden opacity-30">
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-200/40 rounded-full blur-3xl animate-pulse" />
                <div className="absolute top-1/2 -left-20 w-48 h-48 bg-purple-200/40 rounded-full blur-3xl" />
            </div>

            {/* 1. Search & Filter Header */}
            <div className="p-3 md:p-4 bg-white/40 backdrop-blur-md border-b border-white/60 space-y-3 md:space-y-4 shadow-sm z-10">
            <div className="relative group">
                    <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400 group-focus-within:text-indigo-500 transition-all duration-300 z-10" />
                    <input 
                        type="text" 
                        placeholder="ค้นหาบันทึก..." 
                        className="w-full px-3 md:px-4 py-2 md:py-3 bg-white/60 border border-white/80 rounded-xl md:rounded-2xl text-[11px] md:text-sm focus:border-indigo-400 focus:bg-white focus:ring-4 md:focus:ring-8 focus:ring-indigo-500/5 outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300 shadow-inner text-center"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Main Tabs */}
                <div className="bg-slate-200/50 backdrop-blur-sm p-1 md:p-1.5 rounded-xl md:rounded-2xl flex font-medium text-[9px] font-kanit md:text-[12px] relative shadow-inner border border-white/40">
                    <button 
                        onClick={() => { setViewTab('UPCOMING'); setSelectedDate(null); }}
                        className={`flex-1 py-2 md:py-2.5 rounded-lg md:rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 md:gap-2 uppercase tracking-widest relative ${viewTab === 'UPCOMING' && !selectedDate ? 'bg-white text-indigo-600 shadow-md scale-[1.02]' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <span className="relative">
                            นัดหมาย
                            <span className={`absolute -right-6 md:-right-7 top-1/2 -translate-y-1/2 px-1 md:px-1.5 py-0.5 rounded-full text-[7px] md:text-[8px] min-w-[16px] md:min-w-[18px] text-center ${viewTab === 'UPCOMING' && !selectedDate ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-500'}`}>
                                {meetings.filter(m => isFuture(m.date) || isToday(m.date)).length}
                            </span>
                        </span>
                    </button>
                    <button 
                        onClick={() => { setViewTab('HISTORY'); setSelectedDate(null); }}
                        className={`flex-1 py-2 md:py-2.5 rounded-lg md:rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 md:gap-2 uppercase tracking-widest ${viewTab === 'HISTORY' && !selectedDate ? 'bg-white text-indigo-600 shadow-md scale-[1.02]' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        ประวัติเก่า
                    </button>
                </div>
            </div>
            
            {/* 2. Mini Calendar (Expandable) */}
            <AnimatePresence>
                {showCalendar && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-white/40 backdrop-blur-md border-b border-white/60 overflow-hidden z-20"
                    >
                        <div className="px-3 md:px-4 pb-3 md:pb-4 pt-2 md:pt-3">
                            <div className="flex justify-between items-center mb-3 md:mb-4">
                                <button onClick={() => setCurrentNavDate(addMonths(currentNavDate, -1))} className="p-1.5 md:p-2 hover:bg-white/80 rounded-lg md:rounded-xl text-slate-400 transition-all active:scale-90 shadow-sm border border-white/60"><ChevronLeft className="w-3.5 h-3.5 md:w-4 md:h-4"/></button>
                                <span className="text-xs md:text-sm font-bold text-slate-800 tracking-tight">{format(currentNavDate, 'MMMM yyyy')}</span>
                                <button onClick={() => setCurrentNavDate(addMonths(currentNavDate, 1))} className="p-1.5 md:p-2 hover:bg-white/80 rounded-lg md:rounded-xl text-slate-400 transition-all active:scale-90 shadow-sm border border-white/60"><ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4"/></button>
                            </div>
                            <div className="grid grid-cols-7 gap-0.5 md:gap-1 text-center mb-1 md:mb-2 max-w-[240px] md:max-w-[260px] mx-auto">
                                {['S','M','T','W','T','F','S'].map((d, i) => (
                                    <span key={i} className="text-[8px] md:text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center justify-center h-6 md:h-8">
                                        {d}
                                    </span>
                                ))}
                            </div>
                            <div className="grid grid-cols-7 gap-0.5 md:gap-1 justify-items-center max-w-[240px] md:max-w-[260px] mx-auto">
                                {Array.from({ length: startOffset }).map((_, i) => (
                                    <div key={`empty-${i}`} className="h-7 w-7 md:h-9 md:w-9" />
                                ))}
                                {daysInMonth.map(day => {
                                    const dateStr = format(day, 'yyyy-MM-dd');
                                    const hasMeeting = meetingDays.has(dateStr);
                                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                                    const isCurrent = isToday(day);

                                    return (
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            key={day.toString()}
                                            onClick={() => {
                                                setSelectedDate(isSelected ? null : day);
                                                if (!isSelected) setShowCalendar(false); // Auto-hide on select
                                            }}
                                            className={`
                                                h-7 w-7 md:h-9 md:w-9 rounded-lg md:rounded-2xl text-[10px] md:text-xs font-bold flex items-center justify-center relative transition-all duration-300
                                                ${isSelected ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-110 z-10' : 'hover:bg-white/80 text-slate-600 border border-transparent hover:border-white/80'}
                                                ${!isSameMonth(day, currentNavDate) ? 'opacity-20' : ''}
                                                ${isCurrent && !isSelected ? 'text-indigo-600 font-bold border-2 border-indigo-100 bg-indigo-50/50' : ''}
                                            `}
                                        >
                                            {format(day, 'd')}
                                            {hasMeeting && !isSelected && (
                                                <div className="absolute bottom-1 w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.6)]"></div>
                                            )}
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Calendar Toggle Bar */}
            <button 
                onClick={() => setShowCalendar(!showCalendar)}
                className="w-full py-3 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-md border-b border-white/60 font-kanit text-[12px] font-bold text-indigo-600 hover:text-indigo-700 hover:from-indigo-500/20 hover:via-purple-500/20 hover:to-pink-500/20 transition-all duration-500 uppercase tracking-[0.2em] group shadow-sm"
            >
                {showCalendar ? (
                    <>
                        <ChevronUp className="w-3 h-3 group-hover:-translate-y-0.5 transition-transform" />
                        ซ่อนปฏิทิน
                        <ChevronUp className="w-3 h-3 group-hover:-translate-y-0.5 transition-transform" />
                    </>
                ) : (
                    <>
                        <ChevronDown className="w-3 h-3 group-hover:translate-y-0.5 transition-transform" />
                        แสดงปฏิทิน
                        <ChevronDown className="w-3 h-3 group-hover:translate-y-0.5 transition-transform" />
                    </>
                )}
            </button>

            {/* 3. Category Filter Chips (Dynamic) */}
            <div className="px-3 md:px-4 py-3 md:py-4 flex gap-1.5 md:gap-2 overflow-x-auto scrollbar-hide bg-white/20 backdrop-blur-md border-b border-white/60 shadow-sm sticky top-0 z-10">
                <button 
                    onClick={() => setFilterCategory('ALL')}
                    className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-bold whitespace-nowrap border transition-all duration-300 uppercase tracking-widest ${filterCategory === 'ALL' ? 'bg-slate-800 text-white border-slate-800 shadow-lg scale-105' : 'bg-white/60 text-slate-400 border-white/80 hover:border-slate-300 hover:bg-white'}`}
                >
                    ทั้งหมด
                </button>
                {categoryOptions.map(opt => {
                    const activeClass = `${opt.color} shadow-lg scale-105 border-transparent`;
                    
                    return (
                        <button
                            key={opt.key}
                            onClick={() => setFilterCategory(opt.key)}
                            className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-bold whitespace-nowrap border transition-all duration-300 uppercase tracking-widest ${filterCategory === opt.key ? activeClass : 'bg-white/60 text-slate-400 border-white/80 hover:border-slate-300 hover:bg-white'}`}
                        >
                            {opt.label.split('(')[0]}
                        </button>
                    );
                })}
            </div>
            
            {/* 4. Scrollable List Area */}
            <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-slate-200/50">
                <AnimatePresence mode="popLayout">
                    {filteredMeetings.length === 0 ? (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="text-center py-20 flex flex-col items-center"
                        >
                            <div className="w-20 h-20 bg-white/60 backdrop-blur-md rounded-[2rem] flex items-center justify-center shadow-lg mb-6 border border-white/80">
                                <CalendarIcon className="w-10 h-10 text-slate-200" />
                            </div>
                            <h4 className="text-slate-500 font-bold text-sm">ไม่พบการประชุม</h4>
                            {viewTab === 'UPCOMING' && <p className="text-xs text-slate-400 mt-2 font-medium">กด + ด้านบนเพื่อเริ่มนัดหมาย</p>}
                        </motion.div>
                    ) : (
                        <div className="space-y-2">
                            {selectedDate && (
                                <motion.div 
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex justify-between items-center mb-5 px-2"
                                >
                                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-indigo-100 shadow-sm flex items-center gap-2">
                                        <Filter className="w-3 h-3" />
                                        {format(selectedDate, 'd MMM yyyy')}
                                    </span>
                                    <button 
                                        onClick={() => setSelectedDate(null)} 
                                        className="text-[10px] font-bold text-slate-300 hover:text-rose-500 transition-colors uppercase tracking-widest flex items-center gap-1"
                                    >
                                        <X className="w-3 h-3" /> ล้าง
                                    </button>
                                </motion.div>
                            )}
                            
                            {groupedMeetings ? (
                                // Grouped View (For History)
                                Object.keys(groupedMeetings).map(group => (
                                    <div key={group} className="mb-8">
                                        <div className="flex items-center gap-3 mb-4 px-2">
                                            <div className="w-2.5 h-2.5 rounded-full bg-indigo-200 shadow-[0_0_8px_rgba(199,210,254,0.8)]"></div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{group}</span>
                                            <div className="h-px bg-slate-200/50 flex-1"></div>
                                        </div>
                                        <div className="space-y-1">
                                            {groupedMeetings[group].map(m => renderMeetingItem(m))}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                // Flat View (For Upcoming or Single Date)
                                <div className="space-y-1">
                                    {filteredMeetings.map(m => renderMeetingItem(m))}
                                </div>
                            )}
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
});

export default MeetingListSidebar;
