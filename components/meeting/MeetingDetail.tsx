import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
// Fix: Added MasterOption to imports
import { MeetingLog, MeetingCategory, User, MeetingAgendaItem, TaskAsset, MasterOption, MeetingNoteSheet } from '../../types';
import { format } from 'date-fns';
import { useToast } from '../../context/ToastContext';

// Import Refactored Sub-components
import MeetingHeader from './MeetingHeader';
import MeetingNavigation from './MeetingNavigation';
import MeetingNotesTab from './MeetingNotesTab';
import MeetingDecisionsTab from './MeetingDecisionsTab';

import MeetingAgenda from './MeetingAgenda';
import AddLinkModal from './AddLinkModal';
import { Paperclip, Plus, Link as LinkIcon, File, Sparkles, ListChecks, HardDrive } from 'lucide-react';
import { motion } from 'framer-motion';

interface MeetingDetailProps {
    meeting: MeetingLog;
    users: User[];
    
    // State Controls (Passed from Parent MeetingView)
    title: string;
    setTitle: (val: string) => void;
    date: Date;
    setDate: (val: Date) => void;
    category: MeetingCategory;
    setCategory: (val: MeetingCategory) => void;
    projectTags: string[];
    setProjectTags: (val: string[]) => void;
    attendees: string[];
    onUpdateAttendees: (ids: string[]) => void;
    attendance: Record<string, any>;
    onUpdateRSVP: (uid: string, status: any) => void;
    startTime: string;
    setStartTime: (val: string) => void;
    endTime: string;
    setEndTime: (val: string) => void;
    currentUser: User;
    
    content: string;
    setContent: (val: string) => void;
    
    sheets: MeetingNoteSheet[];
    setSheets: (val: MeetingNoteSheet[]) => void;

    decisions: string;
    setDecisions: (val: string) => void;

    activeTab: 'AGENDA' | 'NOTES' | 'FILES' | 'ACTIONS' | 'DECISIONS';
    setActiveTab: (val: 'AGENDA' | 'NOTES' | 'FILES' | 'ACTIONS' | 'DECISIONS') => void;
    
    isSaving: boolean;
    onBlurUpdate: (field: keyof MeetingLog, value: any) => void;
    
    // Fix: Added masterOptions prop definition
    masterOptions: MasterOption[];
    meetings: MeetingLog[]; // New prop
    onSwitchMeeting?: (id: string, isTemporary?: boolean) => void;

    // Transition Logic Props
    onReturnToActive?: () => void;
    activeMeetingTitle?: string;

    children?: React.ReactNode; 
}

const MeetingDetail: React.FC<MeetingDetailProps> = ({
    meeting, users,
    title, setTitle, date, setDate, category, setCategory, projectTags, setProjectTags, 
    attendees, onUpdateAttendees, attendance, onUpdateRSVP,
    startTime, setStartTime, endTime, setEndTime, currentUser,
    content, setContent, sheets, setSheets, decisions, setDecisions, activeTab, setActiveTab,
    // Fix: Destructure masterOptions from props
    isSaving, onBlurUpdate, masterOptions, meetings, onSwitchMeeting, 
    onReturnToActive, activeMeetingTitle, children
}) => {
    const { showToast } = useToast();
    
    // Referenced Meeting
    const referenceMeeting = meetings.find(m => m.id === meeting.referenceMeetingId);
    
    // Local State specific to this UI (not persisted in parent usually, or complex objects)
    const [agenda, setAgenda] = useState<MeetingAgendaItem[]>(meeting.agenda || []);
    const [assets, setAssets] = useState<TaskAsset[]>(meeting.assets || []);
    
    // UI Toggles
    const [isCopied, setIsCopied] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);

    // --- Sync Effect ---
    useEffect(() => {
        setAgenda(meeting.agenda || []);
        setAssets(meeting.assets || []);
    }, [meeting.id]); 

    // --- Logic Handlers ---

    const handleAddAgenda = (topic: string) => {
        const newItem: MeetingAgendaItem = {
            id: crypto.randomUUID(),
            topic: topic,
            isCompleted: false
        };
        const newAgenda = [...agenda, newItem];
        setAgenda(newAgenda);
        onBlurUpdate('agenda', newAgenda);
    };

    const toggleAgenda = (id: string) => {
        const newAgenda = agenda.map(item => item.id === id ? { ...item, isCompleted: !item.isCompleted } : item);
        setAgenda(newAgenda);
        onBlurUpdate('agenda', newAgenda);
    };

    const deleteAgenda = (id: string) => {
        const newAgenda = agenda.filter(item => item.id !== id);
        setAgenda(newAgenda);
        onBlurUpdate('agenda', newAgenda);
    };
    
    // REFACTORED: Now accepts name and url directly
    const handleAddLink = (name: string, url: string) => {
        const newAsset: TaskAsset = {
            id: crypto.randomUUID(),
            name: name,
            url: url,
            type: 'LINK',
            category: 'LINK',
            createdAt: new Date()
        };
        const newAssets = [...assets, newAsset];
        setAssets(newAssets);
        onBlurUpdate('assets', newAssets);
    };

    const handleCopySummary = () => {
        const attendeeData = users.filter(u => attendees.includes(u.id)).map(u => {
            const status = attendance[u.id] || 'INVITED';
            let label = '';
            switch(status) {
                case 'CONFIRMED': label = '[확]'; break;
                case 'DECLINED': label = '[불]'; break;
                case 'PRESENT': label = '[참]'; break;
                default: label = '[?]';
            }
            return `${label} ${u.name}`;
        }).join(', ');

        const agendaText = agenda.map(a => `${a.isCompleted ? '✅' : '⬜'} ${a.topic}`).join('\n');
        
        const summary = `
📝 *สรุปการประชุม: ${title}*
📅 วันที่: ${format(date, 'd MMM yyyy')} | เวลา: ${startTime} - ${endTime}
👥 ผู้เข้าประชุม/สถานะ: ${attendeeData || '-'}

📌 *วาระการประชุม (Agenda):*
${agendaText || '- ไม่มีวาระ -'}

💬 *บันทึก (Notes):*
${content}

✨ *มติที่ประชุม (Decisions):*
${decisions || '-'}

🔗 *ลิงก์ที่เกี่ยวข้อง:*
${assets.map(a => `- ${a.name}: ${a.url}`).join('\n')}

_Generated by Juijui Planner_ 🍹
        `.trim();

        navigator.clipboard.writeText(summary);
        setIsCopied(true);
        showToast('คัดลอกสรุปแล้ว! พร้อมส่งในไลน์ครับผม', 'success');
        setTimeout(() => setIsCopied(false), 2000);
    };

    // --- Layout Classes ---
    const containerClasses = isExpanded
        ? "fixed inset-0 z-[9999] w-screen h-[100dvh] bg-[#FFF9F2] flex flex-col"
        : "flex-1 min-h-0 flex flex-col overflow-hidden bg-[#FFF9F2] relative transition-all duration-500";

    const detailView = (
        <div className={containerClasses}>
            
            {/* Decorative BG */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#4f46e5 2px, transparent 2px)', backgroundSize: '24px 24px' }}></div>

            {/* Part 1: Header */}
            <MeetingHeader 
                title={title} setTitle={setTitle} onBlurTitle={() => onBlurUpdate('title', title)}
                date={date} setDate={setDate} onBlurDate={(d) => onBlurUpdate('date', d)}
                startTime={startTime} setStartTime={setStartTime} onBlurStartTime={(t) => onBlurUpdate('startTime', t)}
                endTime={endTime} setEndTime={setEndTime} onBlurEndTime={(t) => onBlurUpdate('endTime', t)}
                category={category} setCategory={setCategory} onBlurCategory={(c) => onBlurUpdate('category', c)}
                projectTags={projectTags} setProjectTags={setProjectTags} onBlurTags={(t) => onBlurUpdate('tags', t)}
                attendees={attendees} onUpdateAttendees={onUpdateAttendees}
                attendance={attendance} onUpdateRSVP={onUpdateRSVP}
                users={users} currentUser={currentUser}
                masterOptions={masterOptions}
                isExpanded={isExpanded} onToggleExpand={() => setIsExpanded(!isExpanded)}
                isCopied={isCopied} onCopySummary={handleCopySummary}
                onReturnToActive={onReturnToActive}
                activeMeetingTitle={activeMeetingTitle}
            />

            {/* Part 2: Navigation */}
            <MeetingNavigation 
                activeTab={activeTab} 
                setActiveTab={setActiveTab} 
            />

            {/* Part 3: Body Content */}
            <div className={`flex-1 overflow-y-auto flex flex-col relative`}>
                
                {activeTab === 'AGENDA' && (
                    <div className="flex-1 p-8 flex items-center justify-center bg-amber-50/20">
                        <div className="w-full max-w-2xl h-full max-h-[600px]">
                            <MeetingAgenda 
                                agenda={agenda}
                                onToggle={toggleAgenda}
                                onDelete={deleteAgenda}
                                onAdd={handleAddAgenda}
                            />
                        </div>
                    </div>
                )}

                {activeTab === 'NOTES' && (
                    <MeetingNotesTab 
                        key={meeting.id} // FORCE REMOUNT: Using ID as key to reset state on switch
                        agenda={agenda}
                        onAddAgenda={handleAddAgenda}
                        onToggleAgenda={toggleAgenda}
                        onDeleteAgenda={deleteAgenda}
                        assets={assets}
                        onAddAsset={handleAddLink}
                        
                        // FIX: Use 'content' (active state) instead of 'meeting.content' (stale DB object) to prevent content jump during expansion/rerender
                        content={content}
                        
                        // Keep setContent to update parent state for autosave
                        setContent={setContent}
                        sheets={sheets}
                        setSheets={setSheets}
                        onBlurContent={() => onBlurUpdate('content', content)}
                        hideExtraPanels={true} // New prop to hide agenda/assets in this tab
                        referenceMeeting={referenceMeeting}
                        onSwitchMeeting={onSwitchMeeting}
                    />
                )}

                {activeTab === 'FILES' && (
                    <div className="flex-1 p-8 overflow-y-auto">
                        <div className="max-w-4xl mx-auto space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                                        <Paperclip className="w-5 h-5" />
                                    </div>
                                    ไฟล์แนบและลิงก์ที่เกี่ยวข้อง
                                </h3>
                                <button 
                                    onClick={() => setIsLinkModalOpen(true)}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-xl font-kanit font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" /> เพิ่มลิงก์
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {assets.length === 0 ? (
                                    <div className="col-span-full py-20 text-center bg-white rounded-[2rem] border-4 border-dashed border-slate-100 text-slate-300">
                                        <File className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                        <p className="font-bold uppercase tracking-widest text-sm">ยังไม่มีไฟล์แนบ</p>
                                    </div>
                                ) : (
                                    assets.map(asset => {
                                        const isDrive = asset.url.includes('drive.google.com');
                                        return (
                                            <motion.a 
                                                whileHover={{ y: -4, scale: 1.02 }}
                                                key={asset.id} 
                                                href={asset.url} 
                                                target="_blank" 
                                                rel="noreferrer" 
                                                className={`p-5 rounded-[2rem] border-b-4 border-r-2 shadow-lg transition-all group ${isDrive ? 'bg-blue-50/30 border-blue-200 hover:border-blue-400' : 'bg-white border-slate-200 hover:border-blue-300'}`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-3 rounded-2xl transition-colors ${isDrive ? 'bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white' : 'bg-blue-50 text-blue-500 group-hover:bg-blue-600 group-hover:text-white'}`}>
                                                        {isDrive ? <HardDrive className="w-6 h-6" /> : <LinkIcon className="w-6 h-6" />}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h4 className="font-bold text-slate-800 truncate">{asset.name || 'Untitled Link'}</h4>
                                                        <div className="flex items-center gap-1.5 mt-1">
                                                            {isDrive && <span className="text-[8px] font-bold bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded uppercase tracking-wider">Google Drive</span>}
                                                            <p className="text-[10px] text-slate-400 font-bold truncate">{asset.url}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.a>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                        <AddLinkModal 
                            isOpen={isLinkModalOpen}
                            onClose={() => setIsLinkModalOpen(false)}
                            onSave={handleAddLink}
                        />
                    </div>
                )}

                {activeTab === 'ACTIONS' && (
                    <div className="flex-1 overflow-hidden relative flex flex-col">
                         {children}
                    </div>
                )}

                {activeTab === 'DECISIONS' && (
                    <MeetingDecisionsTab 
                        decisions={decisions}
                        setDecisions={setDecisions}
                        onBlurDecisions={() => onBlurUpdate('decisions', decisions)}
                        content={content}
                    />
                )}
            </div>
        </div>
    );

    // Render Portal if Expanded
    if (isExpanded) {
        return createPortal(detailView, document.body);
    }

    return detailView;
};

export default MeetingDetail;