
import React, { useState, useRef } from 'react';
import { MeetingAgendaItem, TaskAsset, MeetingNoteSheet, MeetingLog } from '../../types';
import { 
    Paperclip, Plus, Link as LinkIcon, File, Sparkles, HardDrive, 
    UploadCloud, Loader2, RefreshCw, History as HistoryIcon,
    Maximize2, Minimize2, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MeetingAgenda from './MeetingAgenda';
import MeetingNotes from './MeetingNotes';
import RichTextEditor from '../ui/RichTextEditor';
import AddLinkModal from './AddLinkModal';
import { useGoogleDrive } from '../../hooks/useGoogleDrive';
import { format } from 'date-fns';

interface MeetingNotesTabProps {
    agenda: MeetingAgendaItem[];
    onAddAgenda: (topic: string) => void;
    onToggleAgenda: (id: string) => void;
    onDeleteAgenda: (id: string) => void;

    assets: TaskAsset[];
    onAddAsset: (name: string, url: string) => void; 

    content: string;
    setContent: (val: string) => void;
    onBlurContent: () => void;
    sheets: MeetingNoteSheet[];
    setSheets: (val: MeetingNoteSheet[]) => void;
    hideExtraPanels?: boolean;
    referenceMeeting?: MeetingLog;
    onSwitchMeeting?: (id: string, isTemporary?: boolean) => void;
}

const MeetingNotesTab: React.FC<MeetingNotesTabProps> = ({
    agenda, onAddAgenda, onToggleAgenda, onDeleteAgenda,
    assets, onAddAsset,
    content, setContent, onBlurContent,
    sheets, setSheets,
    hideExtraPanels = false,
    referenceMeeting,
    onSwitchMeeting
}) => {
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [isFocusMode, setIsFocusMode] = useState(false);
    const [isAgendaExpanded, setIsAgendaExpanded] = useState(false);
    const [isAssetsExpanded, setIsAssetsExpanded] = useState(false);
    const [showComparison, setShowComparison] = useState(false);
    const [isPreviousFocused, setIsPreviousFocused] = useState(false);

    const driveUploadInputRef = useRef<HTMLInputElement>(null);
    const { openDrivePicker, uploadFileToDrive, isReady: isDriveReady, isUploading, isAuthenticated: isDriveAuthenticated, login, retry } = useGoogleDrive();

    const handleDriveSelect = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isDriveAuthenticated) {
            login();
            return;
        }
        openDrivePicker((file: any) => {
            onAddAsset(file.name, file.url);
        });
    };

    const handleDriveUploadClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isDriveAuthenticated) {
            login();
            return;
        }
        driveUploadInputRef.current?.click();
    };

    const handleDriveUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const currentMonthFolder = format(new Date(), 'yyyy-MM');

        try {
            const currentYear = format(new Date(), 'yyyy');
            const currentMonth = format(new Date(), 'MM');
            const result = await uploadFileToDrive(
                file,
                ['Juijui_Assets', 'Meeting_Attachments', currentYear, currentMonth]
            );
            onAddAsset(result.name, result.url);
        } catch (err) {
            console.error('Drive upload failed:', err);
        } finally {
            if (driveUploadInputRef.current) {
                driveUploadInputRef.current.value = '';
            }
        }
    };

    return (
        <div className="flex-1 p-3 md:p-5 flex flex-col gap-4 relative">
            
            {/* Reference Meeting Toggle */}
            {referenceMeeting && (
                <div className="flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-3 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500 text-white rounded-xl shadow-sm">
                            <HistoryIcon className="w-4 h-4" />
                        </div>
                        <div>
                            <div className="text-[12px] font-kanit font-bold text-amber-600 uppercase tracking-widest">ติดตามผลจากประชุมเมื่อ: {format(referenceMeeting.date, 'd MMM yyyy')}</div>
                            <div className="font-kanit font-medium text-gray-700 text-sm">หัวข้อ: {referenceMeeting.title}</div>
                        </div>
                    </div>
                    <button 
                        onClick={() => setShowComparison(!showComparison)}
                        className={`px-4 py-1.5 rounded-xl text-xs font-kanit font-medium transition-all flex items-center gap-2 ${showComparison ? 'bg-amber-500 text-white shadow-lg' : 'bg-white text-amber-600 hover:bg-amber-100'}`}
                    >
                        <RefreshCw className={`w-3 h-3 ${showComparison && 'animate-spin-slow'}`} />
                        {showComparison ? 'ซ่อนการเปรียบเทียบ' : 'ดูบันทึกครั้งก่อน'}
                    </button>
                </div>
            )}

            {/* TOP ROW: Assets & Agenda (Hidden in Focus Mode or if hidden by prop) */}
            {!isFocusMode && !hideExtraPanels && (
                <div className="flex flex-col lg:flex-row gap-4 shrink-0 animate-in fade-in slide-in-from-top-4 duration-500">
                    
                    {/* LEFT: Attachments Panel */}
                    <motion.div 
                        layout
                        className="flex-1 bg-white rounded-[1.5rem] md:rounded-[2rem] border-b-4 border-r-2 border-slate-200 shadow-lg p-3 md:p-4 flex flex-col relative overflow-hidden group"
                    >
                         {/* Header */}
                         <div 
                            className="flex items-center justify-between mb-2 md:mb-3 relative z-10 cursor-pointer lg:cursor-default"
                            onClick={() => window.innerWidth < 1024 && setIsAssetsExpanded(!isAssetsExpanded)}
                         >
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-500">
                                    <Paperclip className="w-3.5 h-3.5" />
                                </div>
                                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                                    ไฟล์แนบ
                                </h4>
                                <div className="flex items-center gap-1">
                                    <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[8px] font-bold tracking-tighter ${isDriveAuthenticated ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-amber-50 border-amber-100 text-amber-600'}`}>
                                        <HardDrive className={`w-2 h-2 ${isDriveAuthenticated && isUploading ? 'animate-spin' : ''}`} />
                                        {isDriveAuthenticated ? 'ONLINE' : 'OFFLINE'}
                                    </div>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); retry(); }}
                                        className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                                        title="รีเฟรชการเชื่อมต่อ"
                                    >
                                        <RefreshCw className={`w-2 h-2 ${!isDriveReady && 'animate-spin'}`} />
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="bg-slate-100 text-slate-500 text-[9px] font-bold px-2 py-0.5 rounded-full border border-slate-200 shadow-inner">
                                    {assets.length}
                                </span>
                                <div className="lg:hidden text-slate-400">
                                    <Plus className={`w-4 h-4 transition-transform duration-300 ${isAssetsExpanded ? 'rotate-45' : ''}`} />
                                </div>
                            </div>
                        </div>

                        {/* List / Empty State */}
                        <AnimatePresence>
                            {(isAssetsExpanded || typeof window !== 'undefined' && window.innerWidth >= 1024) && (
                                <motion.div 
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="flex-1 overflow-y-auto pr-1 flex flex-wrap content-start gap-2 relative z-10 max-h-[180px] lg:max-h-none pb-2">
                                        {assets.length === 0 ? (
                                            <div className="flex flex-col sm:flex-row gap-2 w-full">
                                                <motion.button 
                                                    whileHover={{ scale: 0.99, backgroundColor: '#f8fafc' }}
                                                    whileTap={{ scale: 0.97 }}
                                                    onClick={(e) => { e.stopPropagation(); setIsLinkModalOpen(true); }}
                                                    className="flex-1 h-20 md:h-24 flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-100 rounded-2xl transition-all group/empty relative overflow-hidden"
                                                >
                                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover/empty:opacity-100 transition-opacity" />
                                                    <LinkIcon className="w-5 h-5 md:w-6 md:h-6 mb-1 opacity-20 group-hover/empty:opacity-40 group-hover/empty:scale-110 transition-all" />
                                                    <span className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest group-hover/empty:text-indigo-400">แปะลิงก์</span>
                                                </motion.button>

                                                <motion.button 
                                                    whileHover={{ scale: 0.99, backgroundColor: '#f0f9ff' }}
                                                    whileTap={{ scale: 0.97 }}
                                                    disabled={!isDriveReady}
                                                    onClick={handleDriveSelect}
                                                    className={`flex-1 h-20 md:h-24 flex flex-col items-center justify-center border-2 border-dashed rounded-2xl transition-all group/drive relative overflow-hidden ${isDriveAuthenticated ? 'text-blue-500 border-blue-200 bg-blue-50/30' : 'text-slate-300 border-slate-100'}`}
                                                >
                                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 opacity-0 group-hover/drive:opacity-100 transition-opacity" />
                                                    <HardDrive className={`w-5 h-5 md:w-6 md:h-6 mb-1 opacity-20 group-hover/drive:opacity-40 group-hover/drive:scale-110 transition-all ${isDriveAuthenticated ? 'text-blue-500 opacity-40' : ''}`} />
                                                    <span className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest group-hover/drive:text-blue-400">
                                                        {isDriveAuthenticated ? 'เลือกจาก Drive' : 'เชื่อมต่อ Drive'}
                                                    </span>
                                                </motion.button>

                                                <motion.button 
                                                    whileHover={{ scale: 0.99, backgroundColor: '#f0fdf4' }}
                                                    whileTap={{ scale: 0.97 }}
                                                    disabled={!isDriveReady || isUploading}
                                                    onClick={handleDriveUploadClick}
                                                    className={`flex-1 h-20 md:h-24 flex flex-col items-center justify-center border-2 border-dashed rounded-2xl transition-all group/upload relative overflow-hidden ${isDriveAuthenticated ? 'text-emerald-500 border-emerald-200 bg-emerald-50/30' : 'text-slate-300 border-slate-100'}`}
                                                >
                                                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 opacity-0 group-hover/upload:opacity-100 transition-opacity" />
                                                    {isUploading ? <Loader2 className="w-5 h-5 md:w-6 md:h-6 mb-1 animate-spin text-emerald-400" /> : <UploadCloud className={`w-5 h-5 md:w-6 md:h-6 mb-1 opacity-20 group-hover/upload:opacity-40 group-hover/upload:scale-110 transition-all ${isDriveAuthenticated ? 'text-emerald-500 opacity-40' : ''}`} />}
                                                    <span className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest group-hover/upload:text-emerald-400">
                                                        {isUploading ? 'กำลังอัป...' : isDriveAuthenticated ? 'อัปโหลดขึ้น Drive' : 'เชื่อมต่อเพื่ออัปโหลด'}
                                                    </span>
                                                </motion.button>
                                            </div>
                                        ) : (
                                            <>
                                                {assets.map(asset => {
                                                    const isDrive = asset.url.includes('drive.google.com');
                                                    return (
                                                        <motion.a 
                                                            whileHover={{ y: -2, scale: 1.02 }}
                                                            whileTap={{ scale: 0.98 }}
                                                            key={asset.id} 
                                                            href={asset.url} 
                                                            target="_blank" 
                                                            rel="noreferrer" 
                                                            className={`group flex items-center gap-2 px-3 py-2 border rounded-xl text-xs transition-all shadow-sm h-9 max-w-full ${isDrive ? 'bg-blue-50/50 border-blue-100 text-blue-600 hover:bg-white hover:border-blue-300' : 'bg-slate-50/50 border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-300 hover:bg-white'}`}
                                                        >
                                                            <div className={`p-1 bg-white rounded-lg border shrink-0 shadow-sm ${isDrive ? 'border-blue-100 group-hover:border-blue-200' : 'border-slate-100 group-hover:border-indigo-100'}`}>
                                                                {isDrive ? <HardDrive className="w-3 h-3 text-blue-500" /> : <LinkIcon className="w-3 h-3 opacity-50 group-hover:opacity-100 group-hover:text-indigo-500" />}
                                                            </div>
                                                            <span className="font-bold truncate max-w-[100px] md:max-w-[120px]">{asset.name || asset.url}</span>
                                                        </motion.a>
                                                    );
                                                })}
                                                
                                                <div className="flex gap-1.5">
                                                    <motion.button 
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={(e) => { e.stopPropagation(); setIsLinkModalOpen(true); }}
                                                        className="flex items-center justify-center w-9 h-9 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all border-b-4 border-indigo-800"
                                                        title="เพิ่มลิงก์"
                                                    >
                                                        <LinkIcon className="w-4 h-4" />
                                                    </motion.button>

                                                    <motion.button 
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        disabled={!isDriveReady}
                                                        onClick={handleDriveSelect}
                                                        className={`flex items-center justify-center w-9 h-9 rounded-xl shadow-lg transition-all border-b-4 ${isDriveReady ? 'bg-blue-600 text-white shadow-blue-200 hover:bg-blue-700 border-blue-800' : 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed'}`}
                                                        title="เลือกจาก Drive"
                                                    >
                                                        <HardDrive className="w-4 h-4" />
                                                    </motion.button>

                                                    <motion.button 
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    disabled={!isDriveReady || isUploading}
                                                    onClick={handleDriveUploadClick}
                                                    className={`flex items-center justify-center w-9 h-9 rounded-xl shadow-lg transition-all border-b-4 ${isDriveReady ? 'bg-emerald-600 text-white shadow-emerald-200 hover:bg-emerald-700 border-emerald-800' : 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed'}`}
                                                    title="อัปโหลดขึ้น Drive"
                                                >
                                                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                                                </motion.button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Decor */}
                        <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-indigo-50 rounded-full opacity-30 pointer-events-none group-hover:scale-125 transition-transform duration-700"></div>
                    </motion.div>

                    {/* RIGHT: Agenda Widget */}
                    <motion.div 
                        layout
                        className="w-full lg:w-[380px] shrink-0"
                    >
                        <div 
                            className="lg:hidden flex items-center justify-between p-4 bg-white rounded-2xl border-b-4 border-r-2 border-slate-200 shadow-md mb-2 cursor-pointer"
                            onClick={() => setIsAgendaExpanded(!isAgendaExpanded)}
                        >
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-amber-500" />
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">วาระการประชุม</span>
                            </div>
                            <Plus className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isAgendaExpanded ? 'rotate-45' : ''}`} />
                        </div>
                        
                        <div className={`${isAgendaExpanded ? 'block' : 'hidden lg:block'} animate-in fade-in zoom-in-95 duration-300`}>
                            <MeetingAgenda 
                                agenda={agenda}
                                onToggle={onToggleAgenda}
                                onDelete={onDeleteAgenda}
                                onAdd={onAddAgenda}
                            />
                        </div>
                    </motion.div>
                </div>
            )}

            {/* BOTTOM ROW: Notes */}
            <motion.div 
                layout
                className={`w-full flex flex-col transition-all duration-500 ease-in-out ${isFocusMode ? 'z-[100] flex-1' : 'min-h-[400px] md:min-h-[500px]'} ${isPreviousFocused ? 'flex-col' : 'flex-col lg:flex-row gap-4'}`}
            >
                <div className={`flex flex-col lg:flex-row gap-4 flex-1 ${isPreviousFocused ? 'flex-col' : ''}`}>
                    {/* Previous Meeting Notes (Comparison View) */}
                    <AnimatePresence mode="wait">
                        {showComparison && referenceMeeting && (
                            <motion.div 
                                initial={{ width: 0, opacity: 0 }}
                                animate={{ width: '100%', opacity: 1 }}
                                exit={{ width: 0, opacity: 0 }}
                                className={`
                                    bg-amber-50/20 rounded-[1.5rem] md:rounded-[2.5rem] border-2 border-dashed border-amber-100 overflow-hidden flex flex-col relative transition-all duration-500
                                    ${isPreviousFocused ? 'fixed inset-4 md:inset-12 z-[200] shadow-2xl bg-white border-solid' : 'flex-1'}
                                `}
                            >
                                <div className="p-4 border-b border-amber-100 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-10">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                                            <HistoryIcon className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="text-[12px] font-kanit font-bold text-amber-600 uppercase tracking-[0.2em] leading-none mb-1">บันทึกครั้งก่อน</div>
                                            <div className="text-sm font-kanit font-medium text-gray-700">{referenceMeeting.title}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => setIsPreviousFocused(!isPreviousFocused)}
                                            className={`px-3 py-1.5 rounded-xl text-[12px] font-kanit font-medium transition-all flex items-center gap-1.5 ${isPreviousFocused ? 'bg-amber-600 text-white shadow-lg' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'}`}
                                        >
                                            {isPreviousFocused ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                                            {isPreviousFocused ? 'ย่อหน้าต่าง' : 'ดูเต็มจอ'}
                                        </button>

                                        {onSwitchMeeting && (
                                            <button 
                                                onClick={() => onSwitchMeeting(referenceMeeting.id, true)}
                                                className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-[12px] font-kanit font-medium hover:bg-indigo-700 transition-all flex items-center gap-1.5 shadow-lg shadow-indigo-100"
                                            >
                                                <RefreshCw className="w-3.5 h-3.5" />
                                                สลับไปดูสรุปเต็ม
                                            </button>
                                        )}
                                        
                                        {isPreviousFocused && (
                                            <button 
                                                onClick={() => {
                                                    setIsPreviousFocused(false);
                                                    setShowComparison(false);
                                                }}
                                                className="p-1.5 bg-gray-100 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className={`flex-1 overflow-y-auto ${isPreviousFocused ? 'p-6 md:p-12' : 'p-4 md:p-6'}`}>
                                    <div className="max-w-4xl mx-auto">
                                        <RichTextEditor 
                                            content={referenceMeeting.content || ''}
                                            onChange={() => {}} // Read-only doesn't need onChange
                                            readOnly={true}
                                            className="prose-amber"
                                        />
                                        
                                        {referenceMeeting.decisions && (
                                            <div className="mt-12 pt-8 border-t border-amber-100 animate-in fade-in duration-700">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <div className="w-1 h-4 bg-amber-400 rounded-full"></div>
                                                    <div className="text-[10px] font-bold text-amber-600 uppercase tracking-[0.2em]">มติจากครั้งก่อน</div>
                                                </div>
                                                <div className="p-6 bg-gradient-to-br from-white to-amber-50/30 rounded-3xl italic border border-amber-100 text-gray-600 shadow-sm leading-relaxed text-sm">
                                                    "{referenceMeeting.decisions}"
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                {!isPreviousFocused && (
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 opacity-[0.03]">
                                        <HistoryIcon className="w-64 h-64 text-amber-500" />
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className={`
                        bg-white rounded-[1.5rem] md:rounded-[2.5rem] border-b-4 border-r-2 border-slate-200 shadow-xl overflow-hidden flex flex-col relative group transition-all duration-500
                        ${isFocusMode ? 'flex-1' : ''}
                        ${showComparison && !isPreviousFocused ? 'flex-[1.5]' : 'flex-1'}
                        ${isPreviousFocused ? 'hidden lg:flex lg:opacity-20 pointer-events-none grayscale' : 'flex'}
                    `}>
                        <MeetingNotes 
                            initialContent={content}
                            onUpdate={setContent}
                            onBlur={onBlurContent}
                            sheets={sheets}
                            onUpdateSheets={setSheets}
                            isFocused={isFocusMode}
                            onToggleFocus={() => setIsFocusMode(!isFocusMode)}
                        />
                        
                        {/* Focus Mode Decor */}
                        {!isFocusMode && (
                            <div className="absolute top-4 right-16 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 rounded-full border border-amber-100 text-[9px] font-bold text-amber-600 uppercase tracking-widest shadow-sm">
                                    <Sparkles className="w-3 h-3" /> Focus Mode Available
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* ATTACH MODAL */}
            <AddLinkModal 
                isOpen={isLinkModalOpen}
                onClose={() => setIsLinkModalOpen(false)}
                onSave={onAddAsset}
            />

            {/* HIDDEN DRIVE INPUT */}
            <input 
                type="file" 
                ref={driveUploadInputRef} 
                className="hidden" 
                onChange={handleDriveUpload} 
            />
        </div>
    );
};

export default MeetingNotesTab;
