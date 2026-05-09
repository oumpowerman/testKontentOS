
import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar as CalendarIcon, Users, ArrowRight, History, Bell, Sparkles, Check, ChevronRight, AlertCircle, Search } from 'lucide-react';
import { User, MeetingLog } from '../../types';
import { format, isBefore, startOfDay, isValid } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import AttendeeSelectorModal from './AttendeeSelectorModal';
import CustomDatePicker from '../common/CustomDatePicker';

// --- Sub-component for Past Meetings Search ---
interface PastMeetingsDrillDownProps {
    isOpen: boolean;
    onClose: () => void;
    meetings: MeetingLog[];
    onSelect: (meetingId: string) => void;
    selectedId?: string;
}

const PastMeetingsDrillDown: React.FC<PastMeetingsDrillDownProps> = ({ isOpen, onClose, meetings, onSelect, selectedId }) => {
    const [search, setSearch] = useState('');
    
    const filtered = useMemo(() => {
        return meetings.filter(m => 
            m.title.toLowerCase().includes(search.toLowerCase()) ||
            m.category?.toLowerCase().includes(search.toLowerCase())
        ).sort((a, b) => b.date.getTime() - a.date.getTime());
    }, [meetings, search]);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[11000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl border-4 border-white ring-1 ring-gray-100 overflow-hidden flex flex-col max-h-[80vh]"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">ค้นหาการประชุมเก่า</h3>
                        <p className="text-sm text-gray-500">เลือกการประชุมที่ต้องการติดตามผล</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-6 h-6 text-gray-400" />
                    </button>
                </div>
                
                <div className="px-6 py-4 bg-gray-50/50 shrink-0">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                            type="text"
                            placeholder="ค้นหาชื่อการประชุม หรือหมวดหมู่..."
                            className="w-full pl-11 pr-4 py-3 bg-white border-2 border-gray-100 rounded-2xl outline-none focus:border-indigo-200 transition-all font-bold text-gray-700"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {filtered.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">ไม่พบข้อมูลการประชุม</div>
                    ) : (
                        filtered.map(m => (
                            <button
                                key={m.id}
                                onClick={() => { onSelect(m.id); onClose(); }}
                                className={`w-full p-4 rounded-[1.5rem] border-2 transition-all text-left flex justify-between items-center ${selectedId === m.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-transparent hover:border-indigo-100 hover:bg-indigo-50/30'}`}
                            >
                                <div>
                                    <div className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${selectedId === m.id ? 'text-indigo-200' : 'text-indigo-400'}`}>
                                        {format(m.date, 'd MMMM yyyy')}
                                    </div>
                                    <div className={`font-bold text-sm ${selectedId === m.id ? 'text-white' : 'text-gray-800'}`}>{m.title}</div>
                                    <div className={`text-[10px] mt-1 shrink-0 ${selectedId === m.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'} px-2 py-0.5 rounded-full inline-block`}>
                                        {m.category || 'General'}
                                    </div>
                                </div>
                                {selectedId === m.id && <Check className="w-5 h-5" />}
                            </button>
                        ))
                    )}
                </div>
            </motion.div>
        </div>,
        document.body
    );
};

interface MeetingStartupModalProps {
    isOpen: boolean;
    onClose: () => void;
    users: User[];
    meetings: MeetingLog[];
    onConfirm: (data: {
        title: string;
        date: Date;
        attendees: string[];
        referenceMeetingId?: string;
        notify: boolean;
    }) => void;
}

const MeetingStartupModal: React.FC<MeetingStartupModalProps> = ({ 
    isOpen, onClose, users, meetings, onConfirm 
}) => {
    const [step, setStep] = useState(1);
    const [title, setTitle] = useState('');
    const [meetingDate, setMeetingDate] = useState<Date>(new Date());
    const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);
    const [refMeetingId, setRefMeetingId] = useState<string | undefined>();
    const [shouldNotify, setShouldNotify] = useState(true);
    
    // Modal states
    const [isAttendeeModalOpen, setIsAttendeeModalOpen] = useState(false);
    const [isRefDrillDownOpen, setIsRefDrillDownOpen] = useState(false);

    // --- Helper Logic ---
    const pastMeetings = useMemo(() => {
        return [...meetings].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5);
    }, [meetings]);

    if (!isOpen) return null;

    const isPastDate = isBefore(startOfDay(meetingDate), startOfDay(new Date()));

    const handleNext = () => {
        if (step < 2) setStep(step + 1);
        else handleConfirm();
    };

    const handleConfirm = () => {
        onConfirm({
            title: title || 'การประชุมใหม่',
            date: meetingDate,
            attendees: selectedAttendees,
            referenceMeetingId: refMeetingId,
            notify: shouldNotify
        });
    };

    return createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-indigo-900/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl border-4 border-white ring-1 ring-indigo-100 overflow-hidden relative flex flex-col max-h-[90vh]"
            >
                {/* Header Decoration */}
                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 -z-10" />
                
                {/* Header */}
                <div className="p-8 pb-4 flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="px-3 py-1 bg-indigo-600 text-white rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-indigo-200">
                                Step {step} of 2
                            </div>
                            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-800 tracking-tight">
                            {step === 1 ? 'ตั้งค่าการประชุม' : 'เลือกผู้เข้าร่วมคอนเทนต์'}
                        </h2>
                        <p className="text-gray-500 font-medium text-sm">
                            {step === 1 ? 'กำหนดชื่อและวันที่สำหรับการประชุมครั้งนี้' : 'เลือกทีมงานและอ้างอิงเรื่องที่ผ่านมา'}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-2xl text-gray-400 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="px-8 mb-6">
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <motion.div 
                            initial={{ width: '0%' }}
                            animate={{ width: step === 1 ? '50%' : '100%' }}
                            className="h-full bg-gradient-to-r from-indigo-400 to-purple-500"
                        />
                    </div>
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto px-8 pb-8">
                    <AnimatePresence mode="wait">
                        {step === 1 ? (
                            <motion.div 
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6 py-2"
                            >
                                {/* Title Input */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">หัวข้อการประชุม</label>
                                    <input 
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="เช่น วางแผนคอนเทนต์สัปดาห์หน้า..."
                                        className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-indigo-200 focus:bg-white rounded-[1.5rem] outline-none font-bold text-gray-700 transition-all text-lg shadow-inner"
                                    />
                                </div>

                                {/* Date Selection */}
                                <div className="space-y-4">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">เลือกวันที่และเวลาเริ่ม</label>
                                    <div className="flex flex-col gap-4">
                                        <CustomDatePicker 
                                            selected={meetingDate}
                                            onChange={(date) => date && setMeetingDate(date)}
                                            showTimeSelect={true}
                                            portalId="root"
                                        />

                                        <AnimatePresence>
                                            {isPastDate && (
                                                <motion.div 
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="p-4 bg-amber-50 border-2 border-amber-100 rounded-3xl flex gap-3 text-amber-700"
                                                >
                                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                                    <p className="text-xs font-medium leading-relaxed">
                                                        วันที่เลือก <span className="underline decoration-2">{format(meetingDate, 'd MMM')}</span> เป็นอดีตไปแล้ว <br/>
                                                        แน่ใจนะว่าต้องการสร้างบันทึกย้อนหลัง?
                                                    </p>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8 py-2"
                            >
                                {/* Reference Past Meeting */}
                                <div className="space-y-3">
                                    <div className="flex justify-between items-end">
                                        <label className="text-sm font-medium text-gray-400 uppercase tracking-widest ml-1">ติดตามผลจากงานเก่า (Optional)</label>
                                        <div className="flex gap-3">
                                            {refMeetingId && (
                                                <button 
                                                    onClick={() => setRefMeetingId(undefined)}
                                                    className="text-[10px] font-medium text-rose-500 hover:rose-600 underline"
                                                >
                                                    ล้างค่า
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => setIsRefDrillDownOpen(true)}
                                                className="text-[12px] font-medium text-indigo-500 hover:text-indigo-600 underline"
                                            >
                                                ค้นหาทั้งหมด
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
                                        {pastMeetings.length === 0 ? (
                                            <div className="text-[10px] text-gray-400 p-4 border border-dashed border-gray-200 rounded-2xl w-full text-center">ไม่มีข้อมูลการประชุมก่อนหน้า</div>
                                        ) : (
                                            pastMeetings.map(m => (
                                                <button
                                                    key={m.id}
                                                    onClick={() => setRefMeetingId(m.id)}
                                                    className={`shrink-0 p-4 rounded-2xl border-2 transition-all flex flex-col gap-1.5 w-40 text-left relative ${refMeetingId === m.id ? 'bg-indigo-50 border-indigo-400 ring-2 ring-indigo-200 shadow-lg shadow-indigo-100' : 'bg-white border-gray-100 hover:border-indigo-100'}`}
                                                >
                                                    {refMeetingId === m.id && (
                                                        <div className="absolute top-2 right-2 p-1 bg-indigo-500 text-white rounded-full">
                                                            <Check className="w-2.5 h-2.5 stroke-[4px]" />
                                                        </div>
                                                    )}
                                                    <div className="text-[10px] font-bold text-indigo-400 uppercase">{format(m.date, 'd MMM')}</div>
                                                    <div className="font-bold text-xs text-gray-700 truncate w-full">{m.title}</div>
                                                    <div className="text-[8px] font-bold text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded-md self-start">{m.category}</div>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Attendee Selection */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center px-1">
                                        <label className="text-sm font-medium text-gray-400 uppercase tracking-widest">ใครจะมาประชุมบ้าง?</label>
                                        <span className="text-[12px] font-medium bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">{selectedAttendees.length} คน</span>
                                    </div>

                                    <div className="bg-gray-50 rounded-[2rem] p-3 flex gap-3 items-center">
                                        <div className="flex -space-x-4 overflow-hidden flex-1 px-2">
                                            {selectedAttendees.slice(0, 5).map(uid => {
                                                const u = users.find(user => user.id === uid);
                                                if (!u) return null;
                                                return (
                                                    <img 
                                                        key={u.id}
                                                        src={u.avatarUrl} 
                                                        className="w-12 h-12 rounded-2xl border-4 border-white object-cover shadow-sm bg-white" 
                                                        alt={u.name} 
                                                    />
                                                );
                                            })}
                                            {selectedAttendees.length > 5 && (
                                                <div className="w-12 h-12 rounded-2xl border-4 border-white bg-indigo-50 flex items-center justify-center text-indigo-600 text-xs font-bold shadow-sm">
                                                    +{selectedAttendees.length - 5}
                                                </div>
                                            )}
                                            {selectedAttendees.length === 0 && (
                                                <div className="text-xs font-medium text-gray-400 px-2 italic">ยังไม่ได้เลือกผู้เข้าร่วม</div>
                                            )}
                                        </div>
                                        <button 
                                            onClick={() => setIsAttendeeModalOpen(true)}
                                            className="p-3.5 rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2 px-5"
                                        >
                                            <Users className="w-5 h-5" />
                                            <span className="text-xs font-medium uppercase tracking-wider">เลือกสมาชิก</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Notification Toggle */}
                                <div className="flex items-center justify-between p-5 bg-indigo-50/50 rounded-[2rem] border border-indigo-100 shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-4 rounded-2xl ${shouldNotify ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-gray-200 text-gray-500'} transition-all`}>
                                            <Bell className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-gray-700">แจ้งเตือนผู้เข้าร่วม</div>
                                            <div className="text-[12px] font-medium text-gray-400">ส่งการแจ้งเตือนทันทีเมื่อเริ่มการประชุม</div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setShouldNotify(!shouldNotify)}
                                        className={`w-14 h-8 rounded-full p-1 relative transition-all ${shouldNotify ? 'bg-indigo-600' : 'bg-gray-300'}`}
                                    >
                                        <motion.div 
                                            animate={{ x: shouldNotify ? 24 : 0 }}
                                            className="w-6 h-6 bg-white rounded-full shadow-md"
                                        />
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer Actions */}
                <div className="p-8 pt-0 flex gap-4">
                    {step === 2 && (
                        <button 
                            onClick={() => setStep(1)}
                            className="flex-1 py-5 rounded-[1.5rem] font-bold text-sm text-gray-500 bg-gray-50 hover:bg-gray-100 transition-all tracking-widest uppercase"
                        >
                            ย้อนกลับ
                        </button>
                    )}
                    <button 
                        onClick={handleNext}
                        className="flex-[2] py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-[2rem] font-medium text-md tracking-[0.2em] uppercase shadow-2xl shadow-indigo-200 hover:shadow-indigo-400/40 hover:-translate-y-1 transition-all flex items-center justify-center group"
                    >
                        <span>{step === 1 ? 'ขั้นตอนถัดไป' : 'เริ่มการประชุม'}</span>
                        <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </motion.div>

            {/* Child Modals */}
            <AttendeeSelectorModal 
                isOpen={isAttendeeModalOpen}
                onClose={() => setIsAttendeeModalOpen(false)}
                users={users}
                selectedIds={selectedAttendees}
                onConfirm={setSelectedAttendees}
            />

            <PastMeetingsDrillDown 
                isOpen={isRefDrillDownOpen}
                onClose={() => setIsRefDrillDownOpen(false)}
                meetings={meetings}
                selectedId={refMeetingId}
                onSelect={setRefMeetingId}
            />
        </div>,
        document.body
    );
};

export default MeetingStartupModal;
