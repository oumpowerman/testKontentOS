
import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, subMonths, addMonths } from 'date-fns';
import { Calendar, Clock, Tag, Users, Maximize2, Minimize2, Copy, Check, ChevronDown, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { MeetingCategory, User, MasterOption } from '../../types';
import AttendeeSelectorModal from './AttendeeSelectorModal';
import MeetingTagInput from './MeetingTagInput';

interface MeetingHeaderProps {
    title: string;
    setTitle: (val: string) => void;
    onBlurTitle: () => void;
    date: Date;
    setDate: (val: Date) => void;
    onBlurDate: (d: Date) => void;
    category: MeetingCategory;
    setCategory: (val: MeetingCategory) => void;
    onBlurCategory: (c: MeetingCategory) => void;
    projectTags: string[];
    setProjectTags: (val: string[]) => void;
    onBlurTags: (t: string[]) => void;
    attendees: string[];
    onUpdateAttendees: (ids: string[]) => void;
    attendance: Record<string, any>;
    onUpdateRSVP: (uid: string, status: any) => void;
    startTime: string;
    setStartTime: (val: string) => void;
    onBlurStartTime: (t: string) => void;
    endTime: string;
    setEndTime: (val: string) => void;
    onBlurEndTime: (t: string) => void;
    users: User[];
    currentUser: User;
    masterOptions: MasterOption[];
    isExpanded: boolean;
    onToggleExpand: () => void;
    isCopied: boolean;
    onCopySummary: () => void;
}

const MeetingHeader: React.FC<MeetingHeaderProps> = React.memo(({
    title, setTitle, onBlurTitle,
    date, setDate, onBlurDate,
    startTime, setStartTime, onBlurStartTime,
    endTime, setEndTime, onBlurEndTime,
    category, setCategory, onBlurCategory,
    projectTags, setProjectTags, onBlurTags,
    attendees, onUpdateAttendees,
    attendance, onUpdateRSVP,
    users, currentUser, masterOptions,
    isExpanded, onToggleExpand,
    isCopied, onCopySummary
}) => {
    const [isAttendeesModalOpen, setIsAttendeesModalOpen] = useState(false);
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);

    const dateBtnRef = useRef<HTMLDivElement>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [viewDate, setViewDate] = useState(date);

    const startTimeRef = useRef<HTMLInputElement>(null);
    const endTimeRef = useRef<HTMLInputElement>(null);
    const [showStartTimePicker, setShowStartTimePicker] = useState(false);
    const [showEndTimePicker, setShowEndTimePicker] = useState(false);

    const TimePickerPortal: React.FC<{
        isOpen: boolean;
        onClose: () => void;
        anchorRef: React.RefObject<HTMLElement>;
        value: string;
        onSelect: (val: string) => void;
    }> = ({ isOpen, onClose, anchorRef, value, onSelect }) => {
        if (!isOpen || !anchorRef.current) return null;
        const rect = anchorRef.current.getBoundingClientRect();
        
        const times = [];
        for (let h = 0; h < 24; h++) {
            for (let m = 0; m < 60; m += 15) {
                times.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
            }
        }

        return createPortal(
            <>
                <div className="fixed inset-0 z-[10010]" onClick={onClose} />
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ 
                        position: 'fixed',
                        top: rect.bottom + 8,
                        left: rect.left - 40,
                        zIndex: 10011
                    }}
                    className="bg-white rounded-2xl shadow-2xl border border-indigo-50 p-2 w-[120px] max-h-[240px] overflow-y-auto scrollbar-hide"
                    onClick={e => e.stopPropagation()}
                >
                    {times.map(t => (
                        <button
                            key={t}
                            onClick={() => {
                                onSelect(t);
                                onClose();
                            }}
                            className={`w-full text-center py-2 rounded-xl text-xs font-bold transition-all mb-1 ${value === t ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-indigo-50'}`}
                        >
                            {t}
                        </button>
                    ))}
                </motion.div>
            </>,
            document.body
        );
    };

    const CalendarPortal: React.FC = () => {
        if (!showDatePicker || !dateBtnRef.current) return null;
        
        const rect = dateBtnRef.current.getBoundingClientRect();
        const days = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
        const start = startOfMonth(viewDate);
        const end = endOfMonth(viewDate);
        const startDate = startOfWeek(start);
        const endDate = endOfWeek(end);
        
        const calendarDays = [];
        let curr = startDate;
        while (curr <= endDate) {
            calendarDays.push(new Date(curr));
            curr = addDays(curr, 1);
        }

        return createPortal(
            <>
                <div className="fixed inset-0 z-[10010]" onClick={() => setShowDatePicker(false)} />
                <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    style={{ 
                        position: 'fixed',
                        top: rect.bottom + 8,
                        left: rect.left,
                        zIndex: 10011
                    }}
                    className="bg-white rounded-3xl shadow-2xl border border-indigo-50 p-4 w-[280px]"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between mb-4">
                        <button onClick={() => setViewDate(subMonths(viewDate, 1))} className="p-1.5 hover:bg-slate-50 rounded-full transition-colors text-slate-400">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-sm font-black text-slate-700">{format(viewDate, 'MMMM yyyy')}</span>
                        <button onClick={() => setViewDate(addMonths(viewDate, 1))} className="p-1.5 hover:bg-slate-50 rounded-full transition-colors text-slate-400">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {days.map(d => <div key={d} className="text-[10px] font-black text-slate-300 text-center uppercase">{d}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map((d, i) => {
                            const isCurrentMonth = d.getMonth() === viewDate.getMonth();
                            const isSelected = format(d, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
                            return (
                                <button
                                    key={i}
                                    onClick={() => {
                                        setDate(d);
                                        onBlurDate(d);
                                        setShowDatePicker(false);
                                    }}
                                    className={`
                                        h-8 w-8 rounded-xl text-[11px] font-bold transition-all
                                        ${isSelected ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 
                                          isCurrentMonth ? 'text-slate-600 hover:bg-indigo-50' : 'text-slate-200 pointer-events-none'}
                                    `}
                                >
                                    {format(d, 'd')}
                                </button>
                            );
                        })}
                    </div>
                </motion.div>
            </>,
            document.body
        );
    };

    const selectedCategory = masterOptions.find(o => o.key === category);

    // RSVP Logic
    const myStatus = attendance[currentUser.id] || 'INVITED';
    const isInvited = attendees.includes(currentUser.id);

    return (
        <div className="p-6 bg-white/40 backdrop-blur-md border-b border-white/60 relative z-30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4 mb-4 md:mb-6">
                <div className="flex-1 flex items-center gap-3">
                    <input 
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onBlur={onBlurTitle}
                        className="w-full text-xl md:text-2xl font-black text-slate-800 bg-transparent border-none focus:ring-0 p-0 placeholder:text-slate-300"
                        placeholder="หัวข้อการประชุม..."
                    />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    {/* My RSVP Status */}
                    {isInvited && (
                        <div className="flex items-center gap-1 bg-white/80 p-1 rounded-xl border border-white/60 shadow-sm mr-2">
                             {myStatus === 'INVITED' ? (
                                 <>
                                    <button 
                                        onClick={() => onUpdateRSVP(currentUser.id, 'CONFIRMED')}
                                        className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black hover:bg-emerald-600 hover:text-white transition-all"
                                    >
                                        เข้าร่วมแน่นอน
                                    </button>
                                    <button 
                                        onClick={() => onUpdateRSVP(currentUser.id, 'DECLINED')}
                                        className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-black hover:bg-rose-600 hover:text-white transition-all"
                                    >
                                        ไม่สะดวก
                                    </button>
                                 </>
                             ) : (
                                 <div className={`px-4 py-1.5 rounded-lg text-[10px] font-black flex items-center gap-2 ${
                                     myStatus === 'CONFIRMED' ? 'bg-emerald-500 text-white' :
                                     myStatus === 'PRESENT' ? 'bg-indigo-600 text-white' :
                                     myStatus === 'DECLINED' ? 'bg-slate-200 text-slate-500' : 'bg-amber-100 text-amber-600'
                                 }`}>
                                     {myStatus === 'CONFIRMED' && <><Check className="w-3 h-3" /> ยืนยันแล้ว</>}
                                     {myStatus === 'PRESENT' && <><Check className="w-3 h-3" /> มาแล้วจ้า!</>}
                                     {myStatus === 'DECLINED' && <X className="w-3 h-3" />}
                                     
                                     {myStatus !== 'PRESENT' && myStatus !== 'DECLINED' && (
                                         <button onClick={() => onUpdateRSVP(currentUser.id, 'INVITED')} className="ml-2 opacity-50 hover:opacity-100">
                                             <X className="w-3 h-3" />
                                         </button>
                                     )}
                                     
                                     {myStatus === 'CONFIRMED' && (
                                          <button 
                                            onClick={() => onUpdateRSVP(currentUser.id, 'PRESENT')}
                                            className="ml-2 px-2 py-0.5 bg-white/20 hover:bg-white/40 rounded border border-white/20"
                                          >
                                              Check-in
                                          </button>
                                     )}
                                 </div>
                             )}
                        </div>
                    )}

                    <button 
                        onClick={onCopySummary}
                        className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 md:px-4 py-2 rounded-xl font-bold text-[10px] md:text-xs transition-all shadow-sm border ${isCopied ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-white text-slate-600 border-white/80 hover:bg-slate-50'}`}
                    >
                        {isCopied ? <Check className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <Copy className="w-3.5 h-3.5 md:w-4 md:h-4" />}
                        <span>{isCopied ? 'คัดลอกแล้ว!' : 'คัดลอกสรุป'}</span>
                    </button>
                    <button 
                        onClick={onToggleExpand}
                        className="p-2 bg-white text-slate-400 hover:text-indigo-600 rounded-xl border border-white/80 shadow-sm transition-all"
                    >
                        {isExpanded ? <Minimize2 className="w-4 h-4 md:w-5 md:h-5" /> : <Maximize2 className="w-4 h-4 md:w-5 md:h-5" />}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {/* Custom Date Picker */}
                <div 
                    ref={dateBtnRef}
                    onClick={() => {
                        setViewDate(date);
                        setShowDatePicker(!showDatePicker);
                    }}
                    className="flex items-center gap-3 bg-white/60 p-3 rounded-2xl border border-white/80 shadow-sm relative group hover:bg-white transition-all cursor-pointer"
                >
                    <Calendar className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold text-slate-600">{format(date, 'd MMM yyyy')}</span>
                    <CalendarPortal />
                </div>

                {/* Time Picker */}
                <div className="flex items-center gap-2 bg-white/60 p-2 rounded-2xl border border-white/80 shadow-sm relative">
                    <Clock className="w-4 h-4 text-emerald-400 ml-2" />
                    <div className="flex items-center gap-1">
                        <input 
                            ref={startTimeRef}
                            type="text"
                            value={startTime}
                            onFocus={() => setShowStartTimePicker(true)}
                            onChange={(e) => {
                                // Simple validation for HH:mm format
                                let val = e.target.value.replace(/[^0-9:]/g, '');
                                if (val.length === 2 && !val.includes(':')) val += ':';
                                if (val.length <= 5) setStartTime(val);
                            }}
                            onBlur={() => onBlurStartTime(startTime)}
                            className="text-[10px] font-black text-slate-600 bg-transparent border-none p-0 w-10 focus:ring-0 text-center"
                            placeholder="00:00"
                        />
                        <TimePickerPortal 
                            isOpen={showStartTimePicker} 
                            onClose={() => setShowStartTimePicker(false)} 
                            anchorRef={startTimeRef} 
                            value={startTime} 
                            onSelect={(val) => {
                                setStartTime(val);
                                onBlurStartTime(val);
                            }} 
                        />
                        <span className="text-slate-300">-</span>
                        <input 
                            ref={endTimeRef}
                            type="text"
                            value={endTime}
                            onFocus={() => setShowEndTimePicker(true)}
                            onChange={(e) => {
                                let val = e.target.value.replace(/[^0-9:]/g, '');
                                if (val.length === 2 && !val.includes(':')) val += ':';
                                if (val.length <= 5) setEndTime(val);
                            }}
                            onBlur={() => onBlurEndTime(endTime)}
                            className="text-[10px] font-black text-slate-600 bg-transparent border-none p-0 w-10 focus:ring-0 text-center"
                            placeholder="00:00"
                        />
                        <TimePickerPortal 
                            isOpen={showEndTimePicker} 
                            onClose={() => setShowEndTimePicker(false)} 
                            anchorRef={endTimeRef} 
                            value={endTime} 
                            onSelect={(val) => {
                                setEndTime(val);
                                onBlurEndTime(val);
                            }} 
                        />
                    </div>
                </div>

                {/* Custom Category Dropdown */}
                <div className="flex items-center gap-3 bg-white/60 p-3 rounded-2xl border border-white/80 shadow-sm relative">
                    <Tag className="w-4 h-4 text-purple-400" />
                    <button 
                        onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                        className="flex items-center justify-between w-full text-xs font-bold text-slate-600"
                    >
                        {selectedCategory?.label || 'เลือกหมวดหมู่'}
                        <ChevronDown className="w-4 h-4" />
                    </button>
                    {isCategoryDropdownOpen && (
                        <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-2xl shadow-xl border border-gray-100 z-50 p-2">
                            {masterOptions.filter(o => o.type === 'MEETING_CATEGORY').map(opt => (
                                <button
                                    key={opt.key}
                                    onClick={() => {
                                        setCategory(opt.key as MeetingCategory);
                                        onBlurCategory(opt.key as MeetingCategory);
                                        setIsCategoryDropdownOpen(false);
                                    }}
                                    className="w-full text-left px-4 py-2 text-xs font-bold text-slate-600 hover:bg-indigo-50 rounded-xl"
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Project Tag Input */}
                <div className="flex items-center gap-3 bg-white/60 p-1 rounded-2xl border border-white/80 shadow-sm">
                    <span className="ml-3 text-amber-400 font-black text-[10px]">#</span>
                    <MeetingTagInput 
                        tags={projectTags}
                        onTagsChange={(tags) => {
                            setProjectTags(tags);
                            onBlurTags(tags);
                        }}
                        placeholder="Tag..."
                    />
                </div>

                {/* Attendees Button */}
                <button 
                    onClick={() => setIsAttendeesModalOpen(true)}
                    className="flex items-center gap-3 bg-white/60 p-3 rounded-2xl border border-white/80 shadow-sm relative group hover:bg-white transition-all overflow-hidden"
                >
                    <Users className="w-4 h-4 text-indigo-400" />
                    <div className="flex -space-x-1.5 overflow-hidden flex-1">
                        {users.filter(u => attendees.includes(u.id)).slice(0, 3).map(u => {
                            const status = attendance[u.id] || 'INVITED';
                            const statusColor = status === 'CONFIRMED' ? 'border-emerald-400' : status === 'PRESENT' ? 'border-indigo-500' : status === 'DECLINED' ? 'border-rose-400 grayscale' : 'border-white';
                            return (
                                <img key={u.id} src={u.avatarUrl} className={`w-6 h-6 rounded-full border-2 shadow-sm ${statusColor}`} title={`${u.name} (${status})`} />
                            );
                        })}
                        {attendees.length > 3 && (
                            <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-slate-400">
                                +{attendees.length - 3}
                            </div>
                        )}
                        {attendees.length === 0 && <span className="text-xs font-bold text-slate-300">Invite...</span>}
                    </div>
                    {/* Tiny stats */}
                    <div className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded">
                        {Object.values(attendance).filter(s => s === 'CONFIRMED' || s === 'PRESENT').length}/{attendees.length}
                    </div>
                </button>
            </div>

            <AttendeeSelectorModal 
                isOpen={isAttendeesModalOpen}
                onClose={() => setIsAttendeesModalOpen(false)}
                users={users}
                selectedIds={attendees}
                onConfirm={onUpdateAttendees}
            />
        </div>
    );
});

export default MeetingHeader;
