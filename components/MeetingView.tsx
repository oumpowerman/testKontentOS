
import React, { useState, useEffect } from 'react';
import { User, MeetingLog, Task, MeetingCategory, MasterOption, MeetingNoteSheet } from '../types';
import { useMeetings } from '../hooks/useMeetings';
import { useTasks } from '../hooks/useTasks';
import { FileText, Plus, Info, Sparkles, StickyNote, X, Save, Coffee, ChevronRight, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { format, addDays, isBefore, startOfDay } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useGlobalDialog } from '../context/GlobalDialogContext';

// Import New Components
import MeetingListSidebar from './meeting/MeetingListSidebar';
import MeetingMainHeader from './meeting/MeetingMainHeader';
import MeetingDetail from './meeting/MeetingDetail';
import MeetingActionModule from './meeting/MeetingActionModule';
import InfoModal from './ui/InfoModal';
import MeetingGuide from './meeting/MeetingGuide';
import MeetingStartupModal from './meeting/MeetingStartupModal';

interface MeetingViewProps {
    users: User[];
    currentUser: User;
    tasks: Task[]; 
    masterOptions?: MasterOption[]; // Optional for now to support lazy load
}

type MeetingTab = 'AGENDA' | 'NOTES' | 'FILES' | 'ACTIONS' | 'DECISIONS';

const MeetingView: React.FC<MeetingViewProps> = ({ users, currentUser, tasks, masterOptions = [] }) => {
    const { 
        meetings, 
        historyMeetings,
        createMeeting, 
        updateMeeting, 
        deleteMeeting, 
        isLoading: isMeetingsLoading, 
        isHistoryLoading,
        currentMonth, 
        setCurrentMonth, 
        fetchMeetingDetail,
        hasMore: contextHasMore,
        historyHasMore,
        loadMoreMeetings,
        loadMoreHistory
    } = useMeetings();
    const { handleSaveTask } = useTasks(() => {}); 
    
    // UI State
    const { showConfirm } = useGlobalDialog();
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<MeetingTab>('NOTES');
    const [isSaving, setIsSaving] = useState(false);
    const [isInfoOpen, setIsInfoOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
    const [isStartupModalOpen, setIsStartupModalOpen] = useState(false);
    const [originalMeetingId, setOriginalMeetingId] = useState<string | null>(null);
    const [isMobile, setIsMobile] = useState(false);

    // Mobile Detection
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Selected Meeting State (Controlled)
    const [title, setTitle] = useState('');
    const [date, setDate] = useState(new Date());
    const [category, setCategory] = useState<MeetingCategory>('GENERAL');
    const [projectTags, setProjectTags] = useState<string[]>([]);
    const [content, setContent] = useState('');
    const [sheets, setSheets] = useState<MeetingNoteSheet[]>([]); // New Sheets State
    const [decisions, setDecisions] = useState(''); // New Decisions State
    const [attendees, setAttendees] = useState<string[]>([]);
    const [attendance, setAttendance] = useState<Record<string, any>>({});
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('10:00');

    // --- Custom Note Modal State ---
    const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
    const [taskToNote, setTaskToNote] = useState<Task | null>(null);
    const [noteText, setNoteText] = useState('');

    // Fetch detail when selection changes
    useEffect(() => {
        if (selectedId) {
            fetchMeetingDetail(selectedId);
        }
    }, [selectedId, fetchMeetingDetail]);

    // Filter Logic
    const filteredMeetings = meetings.filter(m => 
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.tags && m.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())))
    );

    const selectedMeeting = meetings.find(m => m.id === selectedId);

    // Sync state when selection changes
    useEffect(() => {
        if (selectedMeeting) {
            setTitle(selectedMeeting.title);
            setDate(selectedMeeting.date);
            setContent(selectedMeeting.content || '');
            setSheets(selectedMeeting.sheets || []); // Sync Sheets
            setDecisions(selectedMeeting.decisions || ''); // Sync Decisions
            // Force cast for flexibility if legacy data exists
            setCategory((selectedMeeting.category as MeetingCategory) || 'GENERAL');
            setAttendees(selectedMeeting.attendees);
            setAttendance(selectedMeeting.attendance || {});
            setStartTime(selectedMeeting.startTime || '09:00');
            setEndTime(selectedMeeting.endTime || '10:00');
            setProjectTags(selectedMeeting.tags || []); 
        }
    }, [selectedMeeting]);

    // Auto-save debounce for content, decisions, and sheets
    useEffect(() => {
        if (!selectedId || !selectedMeeting || selectedMeeting.isPartial) return;
        
        const timer = setTimeout(() => {
            // Only update if values actually changed from the last known meeting state
            if (content !== selectedMeeting.content) {
                handleUpdate('content', content);
            }
            
            // Shallow comparison for sheets array is often enough if we treat it as immutable
            // But since it's an array of objects, we check length and content of first/last or just trust the state update
            // To be safe but fast, we only update if it's different from the meeting object
            if (sheets !== selectedMeeting.sheets) {
                handleUpdate('sheets', sheets);
            }
            
            if (decisions !== (selectedMeeting.decisions || '')) {
                handleUpdate('decisions', decisions);
            }
        }, 2000);
        
        return () => clearTimeout(timer);
    }, [content, decisions, sheets, selectedId]);

    const handleCreate = () => {
        setIsStartupModalOpen(true);
    };

    const handleSwitchToMeeting = (id: string, isTemporary = true) => {
        if (isTemporary && selectedId && id !== selectedId) {
            setOriginalMeetingId(selectedId);
        } else if (!isTemporary) {
            setOriginalMeetingId(null);
        }
        setSelectedId(id);
    };

    const handleReturnToOriginal = () => {
        if (originalMeetingId) {
            setSelectedId(originalMeetingId);
            setOriginalMeetingId(null);
        }
    };

    const handleConfirmStart = async (data: {
        title: string;
        date: Date;
        startTime?: string;
        attendees: string[];
        referenceMeetingId?: string;
        notify: boolean;
    }) => {
        const isPast = isBefore(startOfDay(data.date), startOfDay(new Date()));

        const proceed = async () => {
            const id = await createMeeting(data.title, data.date, currentUser.id, {
                attendees: data.attendees,
                startTime: data.startTime,
                referenceMeetingId: data.referenceMeetingId,
                attendance: data.attendees.reduce((acc, uid) => ({ ...acc, [uid]: 'INVITED' }), {})
            });

            if (id) {
                setSelectedId(id);
                setActiveTab('NOTES');
                setProjectTags([]);
                setIsSidebarCollapsed(true);
                setIsHeaderCollapsed(true);
                setIsStartupModalOpen(false);

                // Handle Notifications
                if (data.notify && data.attendees.length > 0) {
                    const notifs = data.attendees.map(uid => ({
                        user_id: uid,
                        type: 'INFO',
                        title: 'การประชุมใหม่! 🗓️',
                        message: `${currentUser.name} เริ่มประชุม: ${data.title}`,
                        created_at: new Date().toISOString(),
                        is_read: false,
                        metadata: { meetingId: id }
                    }));
                    await supabase.from('notifications').insert(notifs);
                }
            }
        };

        if (isPast) {
            const confirmed = await showConfirm(
                `คุณกำลังสร้างบันทึกการประชุมสำหรับวันที่ ${format(data.date, 'd MMMM yyyy')} ซึ่งเป็นวันในอดีต ระบบจะทำการบันทึกข้อมูลย้อนหลังให้ ตกลงไหม?`,
                'สร้างการประชุมย้อนหลัง?'
            );
            if (confirmed) await proceed();
        } else {
            await proceed();
        }
    };

    const handleUpdate = async (field: keyof MeetingLog, value: any) => {
        if (!selectedId) return;
        setIsSaving(true);
        await updateMeeting(selectedId, { [field]: value });
        setIsSaving(false);
    };

    // --- Task Integration Handlers (Improved Context) ---
    const handleAddTask = async (taskTitle: string, assigneeId: string, type: 'TASK' | 'CONTENT', targetDate?: Date) => {
        const tags = ['Meeting-Action', ...projectTags];
        
        // Date Logic
        const effectiveDate = targetDate || new Date();
        const isFollowUp = targetDate && targetDate > addDays(new Date(), 2);
        if (isFollowUp) tags.push('FollowUp');

        // Context Injection: Add meeting info to description
        const meetingContext = `📌 Origin: Meeting "${title}" (${format(date, 'd MMM yy')})\n-------------------`;

        const newTask: Task = {
            id: crypto.randomUUID(),
            type: type,
            title: taskTitle,
            description: `${meetingContext}\n\n[รายละเอียดเพิ่มเติม...]\nหมวดหมู่: ${category}`,
            status: 'TODO',
            priority: 'MEDIUM',
            startDate: new Date(), // Created today
            endDate: effectiveDate, // Due date
            assigneeIds: assigneeId ? [assigneeId] : [],
            tags: tags,
            isUnscheduled: false,
            assigneeType: 'INDIVIDUAL',
            difficulty: 'MEDIUM',
            estimatedHours: 0,
            assets: [],
            reviews: [],
            logs: []
        };

        await handleSaveTask(newTask, null);
        
        // Append log to notes with better formatting
        const assigneeName = users.find(u => u.id === assigneeId)?.name || 'Unassigned';
        const dateLabel = targetDate ? format(targetDate, 'd MMM') : 'ASAP';
        
        // Update meeting notes content
        const newLogLine = `- [ ] ⚡ **${taskTitle}** (@${assigneeName}) — Due: ${dateLabel}`;
        const newContent = content ? `${content}\n${newLogLine}` : newLogLine;
        
        setContent(newContent);
        handleUpdate('content', newContent);
    };

    // Updated: Open Modal instead of prompt
    const handleUpdateTask = async (task: Task, updateType: 'DONE' | 'NOTE') => {
        if (updateType === 'DONE') {
            await handleSaveTask({ ...task, status: 'DONE' }, null);
        } else {
            setTaskToNote(task);
            setNoteText('');
            setIsNoteModalOpen(true);
        }
    };

    // New: Handle Saving Note from Modal
    const handleConfirmSaveNote = async () => {
        if (!taskToNote || !noteText.trim()) return;

        const newDesc = taskToNote.description + `\n\n[อัปเดต ${format(new Date(), 'd/MM')}]: ${noteText}`;
        await handleSaveTask({ ...taskToNote, description: newDesc }, null);
        
        const newMeetingNote = content + `\n> 🔄 อัปเดตงาน (${taskToNote.title}): ${noteText}`;
        setContent(newMeetingNote);
        handleUpdate('content', newMeetingNote);

        setIsNoteModalOpen(false);
        setTaskToNote(null);
        setNoteText('');
    };

    const handleToggleAttendee = (userId: string) => {
        const newAttendees = attendees.includes(userId) 
            ? attendees.filter(id => id !== userId)
            : [...attendees, userId];
        setAttendees(newAttendees);
        handleUpdate('attendees', newAttendees);
    };

    const handleUpdateAttendees = (newAttendees: string[]) => {
        // Find newly invited people to set default RSVP status
        const currentData = { ...(selectedMeeting?.attendance || {}) } as Record<string, any>;
        const updatedAttendance: Record<string, any> = {};
        
        newAttendees.forEach(id => {
            updatedAttendance[id] = currentData[id] || 'INVITED';
        });

        setAttendees(newAttendees);
        setAttendance(updatedAttendance);
        
        // Update both fields in DB
        updateMeeting(selectedId!, { 
            attendees: newAttendees,
            attendance: updatedAttendance
        });
    };

    const handleUpdateRSVP = (userId: string, status: 'CONFIRMED' | 'DECLINED' | 'PRESENT' | 'ABSENT' | 'INVITED') => {
        if (!selectedId) return;
        const updatedAttendance = { ...attendance, [userId]: status };
        setAttendance(updatedAttendance);
        handleUpdate('attendance', updatedAttendance);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] md:h-[calc(100vh-80px)] animate-in fade-in duration-500 overflow-hidden pb-2 md:pb-6 relative isolate">
            
            {/* Background Decoration (Cute Dots) */}
            <div className="absolute inset-0 -z-10 opacity-40 pointer-events-none" 
                style={{ 
                    backgroundImage: 'radial-gradient(#e0e7ff 2px, transparent 2px)', 
                    backgroundSize: '24px 24px' 
                }}>
            </div>
            
            {/* Top Bar (Header) */}
            <AnimatePresence>
                {!isHeaderCollapsed && (
                    <motion.div
                        initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                        animate={{ height: 'auto', opacity: 1, marginBottom: 24 }}
                        exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="overflow-hidden"
                    >
                        <MeetingMainHeader 
                            onInfoOpen={() => setIsInfoOpen(true)}
                            onCreateMeeting={handleCreate}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header Toggle (When Collapsed) */}
            {isHeaderCollapsed && (
                <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-center mb-2"
                >
                    <button 
                        onClick={() => setIsHeaderCollapsed(false)}
                        className="px-6 py-1 bg-white/40 backdrop-blur-md border border-white/60 rounded-b-2xl text-[10px] font-bold text-indigo-400 hover:text-indigo-600 hover:bg-white/80 transition-all shadow-sm uppercase tracking-[0.2em] flex items-center gap-2 group"
                    >
                        <Plus className="w-3 h-3 group-hover:rotate-90 transition-transform" />
                        Show Header
                    </button>
                </motion.div>
            )}

            {/* Main Workspace */}
            <div className="flex-1 flex gap-0 md:gap-0 overflow-hidden bg-white/60 backdrop-blur-xl rounded-t-[1.5rem] md:rounded-[2.5rem] shadow-sm border border-white/80 ring-1 ring-indigo-50 p-1 md:p-4 relative">
                
                {/* Sidebar Container */}
                <AnimatePresence>
                    {!isSidebarCollapsed && (
                        <motion.div 
                            initial={{ width: 0, opacity: 0, x: -20, marginRight: 0 }}
                            animate={{ 
                                width: isMobile ? 'calc(100% - 8px)' : 500, 
                                marginRight: isMobile ? 0 : 24,
                                opacity: 1, 
                                x: 0,
                                transition: {
                                    width: { duration: 0.4, ease: [0.33, 1, 0.68, 1] },
                                    marginRight: { duration: 0.4, ease: [0.33, 1, 0.68, 1] },
                                    opacity: { duration: 0.3, delay: 0.1 }
                                }
                            }}
                            exit={{ 
                                width: 0, 
                                marginRight: 0,
                                opacity: 0, 
                                x: -20,
                                transition: {
                                    width: { duration: 0.4, ease: [0.65, 0, 0.35, 1] },
                                    marginRight: { duration: 0.4, ease: [0.65, 0, 0.35, 1] },
                                    opacity: { duration: 0.2 }
                                }
                            }}
                            className={`flex flex-col bg-white/80 backdrop-blur-md rounded-[1.5rem] md:rounded-[2rem] border border-indigo-50 shadow-sm overflow-hidden h-full shrink-0 relative z-[70] w-full md:w-[500px] absolute md:relative inset-1 md:inset-auto mb-1 md:mb-0`}
                        >
                             <MeetingListSidebar 
                                meetings={meetings}
                                historyMeetings={historyMeetings}
                                selectedId={selectedId}
                                isLoading={isMeetingsLoading}
                                isHistoryLoading={isHistoryLoading}
                                hasMore={contextHasMore}
                                historyHasMore={historyHasMore}
                                onLoadMore={loadMoreMeetings}
                                onLoadMoreHistory={loadMoreHistory}
                                currentMonth={currentMonth}
                                onMonthChange={setCurrentMonth}
                                onSelect={(id) => {
                                    setSelectedId(id);
                                    setIsSidebarCollapsed(true); // Auto-hide on select
                                    setIsHeaderCollapsed(true); // Auto-hide header on select
                                }}
                                onDelete={deleteMeeting}
                                searchQuery={searchQuery}
                                setSearchQuery={setSearchQuery}
                                masterOptions={masterOptions}
                                users={users}
                            />
                            
                            {/* Collapse Button (Inside) */}
                            <button 
                                onClick={() => setIsSidebarCollapsed(true)}
                                className="absolute top-1/2 -right-3 -translate-y-1/2 w-8 h-12 bg-white border border-indigo-100 rounded-xl shadow-lg flex items-center justify-center text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all z-50 group"
                                title="ซ่อนแถบข้าง"
                            >
                                <PanelLeftClose className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Expand Button (When Collapsed) */}
                {isSidebarCollapsed && (
                    <motion.button 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => setIsSidebarCollapsed(false)}
                        className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-8 md:w-10 h-12 md:h-16 bg-white/80 backdrop-blur-md border border-indigo-100 rounded-xl md:rounded-2xl shadow-xl flex flex-col items-center justify-center text-indigo-500 hover:text-indigo-700 hover:bg-white transition-all z-[60] group border-2 md:border-4 border-white/50"
                        title="แสดงแถบข้าง"
                    >
                        <PanelLeftOpen className="w-5 h-5 md:w-6 md:h-6 group-hover:scale-125 transition-transform" />
                        <div className="text-[7px] md:text-[8px] font-black uppercase tracking-tighter mt-0.5 md:mt-1">LIST</div>
                    </motion.button>
                )}

                {/* Detail Container */}
                <motion.div 
                    layout
                    className="flex-1 min-h-0 flex flex-col overflow-hidden relative bg-white rounded-[1.5rem] md:rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/50"
                >
                    <AnimatePresence mode="wait">
                        {selectedMeeting ? (
                            <motion.div 
                                key={selectedId}
                                initial={{ x: 40, opacity: 0, rotateY: -20, scale: 0.95 }}
                                animate={{ x: 0, opacity: 1, rotateY: 0, scale: 1 }}
                                exit={{ x: -40, opacity: 0, rotateY: 20, scale: 0.95 }}
                                transition={{ 
                                    type: "spring", 
                                    stiffness: 120, 
                                    damping: 18,
                                    opacity: { duration: 0.25 }
                                }}
                                style={{ 
                                    perspective: "2000px", 
                                    transformStyle: "preserve-3d",
                                    transformOrigin: "center left"
                                }}
                                className="flex-1 min-h-0 flex flex-col min-w-0"
                            >
                                <MeetingDetail 
                                    meeting={selectedMeeting}
                                    users={users}
                                    title={title} setTitle={setTitle}
                                    date={date} setDate={setDate}
                                    category={category} setCategory={setCategory}
                                    projectTags={projectTags} setProjectTags={setProjectTags}
                                    attendees={attendees} onUpdateAttendees={handleUpdateAttendees}
                                    attendance={attendance} onUpdateRSVP={handleUpdateRSVP}
                                    startTime={startTime} setStartTime={setStartTime}
                                    endTime={endTime} setEndTime={setEndTime}
                                    currentUser={currentUser}
                                    content={content} setContent={setContent}
                                    sheets={sheets} setSheets={setSheets} // PASS SHEETS
                                    decisions={decisions} setDecisions={setDecisions} 
                                    activeTab={activeTab} setActiveTab={setActiveTab}
                                    isSaving={isSaving} onBlurUpdate={handleUpdate}
                                    masterOptions={masterOptions} // PASS MASTER OPTIONS
                                    meetings={meetings}
                                    onSwitchMeeting={handleSwitchToMeeting}
                                    onReturnToActive={originalMeetingId ? handleReturnToOriginal : undefined}
                                    activeMeetingTitle={meetings.find(m => m.id === originalMeetingId)?.title}
                                >
                                    <MeetingActionModule 
                                        users={users}
                                        tasks={tasks}
                                        projectTags={projectTags}
                                        meetingTitle={title} 
                                        meetingDate={date}
                                        onAddTask={handleAddTask}
                                        onUpdateTask={handleUpdateTask}
                                    />
                                </MeetingDetail>
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="empty"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex-1 flex flex-col items-center justify-center text-gray-300 bg-indigo-50/30 p-6 md:p-12 text-center relative overflow-hidden"
                            >
                                {/* Empty State Decor */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 md:w-96 h-64 md:h-96 bg-indigo-200/20 rounded-full blur-3xl animate-pulse"></div>
                                
                                <div className="relative z-10 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                                    <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-[2rem] md:rounded-[2.5rem] flex items-center justify-center mb-6 md:mb-8 shadow-2xl shadow-indigo-100 border-4 border-white rotate-3 hover:rotate-6 transition-transform duration-500">
                                        <Sparkles className="w-12 h-12 md:w-16 md:h-16 text-indigo-400" />
                                    </div>
                                    <h3 className="font-black text-xl md:text-3xl text-gray-700 mb-3 tracking-tight">พร้อมประชุมรึยัง?</h3>
                                    <p className="max-w-[200px] md:max-w-xs mx-auto text-[11px] md:text-sm text-gray-500 leading-relaxed font-medium bg-white/50 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/50">
                                        เลือกหัวข้อการประชุมจากทางซ้าย <br/>หรือกดปุ่ม <span className="text-indigo-600 font-bold">"เริ่มการประชุม"</span> เพื่อเริ่มเรื่องใหม่
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>

            {/* INFO MODAL */}
            <InfoModal 
                isOpen={isInfoOpen}
                onClose={() => setIsInfoOpen(false)}
                title="คู่มือ Meeting Room"
            >
                <MeetingGuide />
            </InfoModal>

            {/* STARTUP MODAL */}
            <MeetingStartupModal 
                isOpen={isStartupModalOpen}
                onClose={() => setIsStartupModalOpen(false)}
                users={users}
                meetings={meetings}
                onConfirm={handleConfirmStart}
            />

            {/* NEW: Custom Note Modal (Styled) */}
            {isNoteModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-indigo-900/40 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl p-6 relative animate-in zoom-in-95 border-4 border-white ring-1 ring-indigo-100">
                        <button 
                            onClick={() => setIsNoteModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3.5 bg-indigo-100 text-indigo-600 rounded-2xl shadow-sm rotate-3">
                                <StickyNote className="w-7 h-7" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-gray-800 tracking-tight">บันทึกเพิ่มเติม</h3>
                                <p className="text-xs text-gray-500 font-bold bg-gray-100 px-2 py-0.5 rounded-lg truncate max-w-[200px] mt-1">
                                    งาน: {taskToNote?.title}
                                </p>
                            </div>
                        </div>

                        <textarea 
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            placeholder="พิมพ์อัปเดต หรือรายละเอียดเพิ่มเติม..."
                            className="w-full h-36 p-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-indigo-200 rounded-2xl outline-none resize-none text-sm font-medium mb-6 transition-all"
                            autoFocus
                        />

                        <div className="flex gap-3">
                            <button 
                                onClick={() => setIsNoteModalOpen(false)}
                                className="flex-1 py-3 text-gray-500 font-bold bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors text-sm"
                            >
                                ยกเลิก
                            </button>
                            <button 
                                onClick={handleConfirmSaveNote}
                                disabled={!noteText.trim()}
                                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 text-sm flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Save className="w-4 h-4 mr-2" /> บันทึก
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MeetingView;
