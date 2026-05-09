
import React from 'react';
import { 
    Calendar, 
    Clock, 
    Tag, 
    Edit3, 
    Trash2, 
    Layout, 
    Users,
    FileText,
    MessageSquare,
    Paperclip,
    Globe,
    Sparkles,
    Copy,
    Film,
    AlertTriangle,
    Folder,
    HardDrive,
    ExternalLink,
    Link2Off,
    ChevronRight,
    Target
} from 'lucide-react';
import { Task, User, MasterOption, Platform, Channel } from '../../types';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { PLATFORM_ICONS } from '../../config/taxonomy';
import PlatformSection from './content-parts/PlatformSection';
import Markdown from 'react-markdown';
import { useToast } from '../../context/ToastContext';
import { useGlobalDialog } from '../../context/GlobalDialogContext';
import { useStorage } from '../../context/StorageContext';
import { useMasterData } from '../../hooks/useMasterData';

interface ContentDetailProps {
    task: Task;
    users: User[];
    channels: Channel[];
    onEdit: () => void;
    onDelete?: () => void;
    onClose: () => void;
}

const ContentDetail: React.FC<ContentDetailProps> = ({ 
    task, users, channels, onEdit, onDelete, onClose 
}) => {
    const { masterOptions } = useMasterData();
    const { showToast } = useToast();
    const { showConfirm } = useGlobalDialog();
    const { storageConfigs } = useStorage();
    
    const getOptionLabel = (key: string | undefined, type: string) => {
        if (!key) return 'ไม่ระบุ';
        const option = masterOptions.find(o => o.key === key && o.type === type);
        return option?.label || key;
    };

    const getStatusInfo = (status: string) => {
        const option = masterOptions.find(o => o.key === status && o.type === 'STATUS');
        return {
            label: option?.label || status,
            color: option?.color || 'slate'
        };
    };

    const getChannelInfo = (id: string | undefined) => {
        if (!id) return null;
        return channels.find(c => c.id === id);
    };

    const getPriorityInfo = (priority: string) => {
        switch (priority) {
            case 'URGENT': return { label: 'ด่วนที่สุด', color: 'rose' };
            case 'HIGH': return { label: 'สำคัญมาก', color: 'orange' };
            case 'MEDIUM': return { label: 'ปกติ', color: 'indigo' };
            case 'LOW': return { label: 'ต่ำ', color: 'slate' };
            default: return { label: priority, color: 'slate' };
        }
    };

    const getPlatformStyle = (platform: string) => {
        switch (platform) {
            case 'YOUTUBE': return 'bg-[#FFF0F0] text-[#FF4B4B] border-[#FFE0E0]';
            case 'FACEBOOK': return 'bg-[#EBF5FF] text-[#1877F2] border-[#D1E9FF]';
            case 'TIKTOK': return 'bg-[#F8F8F8] text-[#000000] border-[#EEEEEE]';
            case 'INSTAGRAM': return 'bg-[#FFF0F5] text-[#E4405F] border-[#FFE0EB]';
            default: return 'bg-[#F9FAFB] text-[#9CA3AF] border-[#F3F4F6]';
        }
    };

    const getUserById = (id: string) => users.find(u => u.id === id);

    const statusInfo = getStatusInfo(task.status);
    const priorityInfo = getPriorityInfo(task.priority);
    const channel = getChannelInfo(task.channelId);

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: { 
            opacity: 1,
            transition: { staggerChildren: 0.05 }
        }
    };

    const sectionVariants: Variants = {
        hidden: { opacity: 0, scale: 0.98, y: 15 },
        visible: { 
            opacity: 1, 
            scale: 1,
            y: 0,
            transition: { type: 'spring', damping: 20, stiffness: 120 }
        }
    };

    const bouncyHover = {
        scale: 1.03,
        y: -4,
        transition: { type: 'spring', stiffness: 400, damping: 12 }
    } as const;

    const handleCopyTitle = () => {
        navigator.clipboard.writeText(task.title);
        showToast('คัดลอกชื่อรายการเรียบร้อยแล้ว ✨', 'success');
    };

    const handleCopyPath = (path: string) => {
        navigator.clipboard.writeText(path);
        showToast('คัดลอก Path เรียบร้อย! นำไปวางใน File Explorer ได้เลย 📁', 'success');
    };

    const handleDeleteClick = async () => {
        if (!onDelete) return;
        const confirm = await showConfirm(
            `คุณแน่ใจว่าต้องการลบโปรเจกต์ "${task.title}" หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้ และงานย่อยทั้งหมดจะถูกลบไปด้วย`,
            'ยืนยันการลบโครงการ'
        );
        if (confirm) {
            onDelete();
        }
    };

    // --- Path Resolution Logic ---
    const activeHub = task.driveLabel ? storageConfigs.find(c => c.label === task.driveLabel) : null;
    const resolvedPath = activeHub ? `${activeHub.currentLetter}${task.localPath || ''}` : task.localPath;
    const displayPath = resolvedPath || 'Not set';

    const [isHeaderExpanded, setIsHeaderExpanded] = React.useState(false);

    return (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col h-full bg-[#FCFDFE] text-slate-700"
        >
            {/* --- COMPRESSIBLE HEADER --- */}
            <motion.div 
                layout
                animate={{ 
                    height: isHeaderExpanded ? 'auto' : 46,
                }}
                transition={{
                    height: { type: 'spring', damping: 25, stiffness: 120 }
                }}
                className="sticky top-0 z-40 bg-white/80 backdrop-blur-2xl border-b border-slate-100/50 shadow-[0_2px_20px_-5px_rgba(0,0,0,0.03)] overflow-hidden relative"
            >
                {/* Rainbow Rail Anchor */}
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 z-50 opacity-80" />

                <AnimatePresence initial={false}>
                    {!isHeaderExpanded ? (
                        /* Collapsed Toggle Bar */
                        <motion.div 
                            key="collapsed"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            onClick={() => setIsHeaderExpanded(true)}
                            className="h-[44px] flex items-center justify-between px-6 cursor-pointer hover:bg-slate-50/50 transition-colors group absolute inset-0 z-10"
                        >
                            <div className="flex items-center gap-3">
                                <motion.div 
                                    className={`w-7 h-7 rounded-lg flex items-center justify-center bg-${statusInfo.color}-50 text-${statusInfo.color}-400 border border-${statusInfo.color}-100/40`}
                                >
                                    <Layout className="w-3.5 h-3.5" />
                                </motion.div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-indigo-400 transition-colors">
                                    {task.title.length > 50 ? task.title.slice(0, 50) + '...' : task.title}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex -space-x-2 mr-2">
                                    {task.assigneeIds?.slice(0, 3).map((id, index) => {
                                        const user = getUserById(id);
                                        return user ? (
                                            <img 
                                                key={id} 
                                                src={user.avatarUrl} 
                                                alt={user.name} 
                                                className="w-5 h-5 rounded-full border-2 border-white shadow-sm" 
                                                style={{ zIndex: 3 - index }}
                                            />
                                        ) : null;
                                    })}
                                </div>
                                <span className="text-[11px] font-medium text-slate-400 group-hover:text-slate-500 transition-colors">EXPAND CONTROLS</span>
                                <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-400" />
                            </div>
                        </motion.div>
                    ) : (
                        /* Expanded Content */
                        <motion.div 
                            key="expanded"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.4 }}
                            className="overflow-hidden"
                        >
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.1 }}
                                className="px-4 sm:px-10 py-3 sm:py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-10"
                            >
                                <div className="flex items-start sm:items-center gap-3 sm:gap-5 flex-1 min-w-0 w-full lg:w-auto">
                                    <motion.div 
                                        onClick={() => setIsHeaderExpanded(false)}
                                        whileHover={{ rotate: -8, scale: 1.15 }}
                                        className={`
                                            w-10 h-10 sm:w-16 sm:h-16 rounded-[0.85rem] sm:rounded-2xl flex items-center justify-center shadow-[0_8px_20px_-4px_rgba(0,0,0,0.08)]
                                            bg-${statusInfo.color}-50 text-${statusInfo.color}-400 border border-${statusInfo.color}-100/50 shrink-0 mt-1 sm:mt-0 cursor-pointer
                                        `}
                                    >
                                        <Layout className="w-5 h-5 sm:w-8 sm:h-8" />
                                    </motion.div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start sm:items-center gap-2 mb-1.5 group">
                                            <h3 className="text-lg sm:text-2xl lg:text-2xl font-bold text-slate-600 tracking-tight leading-[1.2] lg:leading-tight line-clamp-2" title={task.title}>
                                                {task.title}
                                            </h3>
                                            <button 
                                                onClick={handleCopyTitle}
                                                className="mt-1 sm:mt-0 p-1.5 rounded-lg bg-slate-50 text-slate-300 hover:bg-indigo-50 hover:text-indigo-400 transition-all active:scale-90 shrink-0 opacity-0 group-hover:opacity-100 hidden sm:block"
                                                title="Copy Title"
                                            >
                                                <Copy className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-3">
                                            <span className={`px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[8px] sm:text-[10px] font-bold uppercase tracking-widest bg-${statusInfo.color}-50 text-${statusInfo.color}-500 border border-${statusInfo.color}-100/50`}>
                                                {statusInfo.label}
                                            </span>
                                            {channel && (
                                                <motion.div 
                                                    whileHover={{ scale: 1.15, rotate: 5 }}
                                                    className="flex items-center justify-center w-6 h-6 sm:w-9 sm:h-9 bg-white border border-slate-100 rounded-full shadow-sm overflow-hidden"
                                                    title={channel.name}
                                                >
                                                    {channel.logoUrl ? (
                                                        <img src={channel.logoUrl} alt={channel.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-[10px] sm:text-[12px] font-bold text-white" style={{ backgroundColor: channel.color || '#cbd5e1' }}>
                                                            {channel.name.charAt(0)}
                                                        </div>
                                                    )}
                                                </motion.div>
                                            )}
                                            <span className={`px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[8px] sm:text-[10px] font-bold uppercase tracking-widest bg-${priorityInfo.color}-50 text-${priorityInfo.color}-400 border border-${priorityInfo.color}-100`}>
                                                {priorityInfo.label}
                                            </span>
                                            <button 
                                                onClick={() => setIsHeaderExpanded(false)}
                                                className="text-[12px] font-bold text-indigo-400 hover:text-indigo-600 transition-colors flex items-center gap-1 px-2 py-1 bg-indigo-50/50 rounded-lg"
                                            >
                                                CLOSE TOOLS
                                            </button>
                                        </div>
                                    </div>
                                </div>
        
                                <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto shrink-0 border-t sm:border-t-0 border-slate-50 pt-3 sm:pt-0">
                                    {onDelete && (
                                        <motion.button 
                                            whileHover={{ scale: 1.1, backgroundColor: '#fff1f2', color: '#f43f5e' }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={handleDeleteClick}
                                            className="w-10 h-10 sm:w-14 sm:h-14 flex items-center justify-center text-slate-300 bg-slate-50 sm:bg-transparent rounded-xl sm:rounded-2xl transition-all shrink-0"
                                            title="Delete Content"
                                        >
                                            <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                                        </motion.button>
                                    )}
                                    <motion.button 
                                        whileHover={{ scale: 1.02, backgroundColor: 'rgba(238, 242, 255, 0.8)' }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={onEdit}
                                        className="flex-1 sm:flex-none group flex items-center justify-center gap-2.5 px-5 sm:px-8 py-3.5 sm:py-4 bg-indigo-50/50 text-indigo-500 border border-indigo-100/50 rounded-[1rem] sm:rounded-[1.25rem] font-bold text-xs sm:text-sm shadow-[0_8px_20px_-6px_rgba(79,70,229,0.1)] hover:border-indigo-200 transition-all"
                                    >
                                        <Edit3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:rotate-12 transition-transform" />
                                        <span>EDIT CONTENT</span>
                                    </motion.button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-10 space-y-6 sm:space-y-10 scrollbar-hide">
                
                {/* --- HIGHLIGHT: STORAGE PATH (MOVED TO TOP) --- */}
                {(task.localPath || task.driveLabel) && (
                    <motion.section 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                        <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-2 text-slate-300">
                                <Folder className="w-4 h-4" />
                                <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em]">Quick Access: Local Storage</h4>
                            </div>
                            {activeHub && (
                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 shadow-sm animate-in fade-in zoom-in duration-500">
                                    <HardDrive className="w-3 h-3" />
                                    <span className="text-[10px] font-bold uppercase tracking-tight">Hub: {activeHub.label}</span>
                                </div>
                            )}
                        </div>
                        <motion.div 
                            whileHover={{ scale: 1.01, translateY: -2 }}
                            onClick={() => handleCopyPath(resolvedPath || '')}
                            className={`
                                relative p-6 rounded-[2rem] border group cursor-pointer overflow-hidden transition-all duration-500
                                ${activeHub 
                                    ? 'bg-gradient-to-br from-emerald-50/60 to-teal-50/40 border-emerald-100 shadow-[0_12px_30px_-5px_rgba(16,185,129,0.1)]' 
                                    : 'bg-slate-50/40 border-slate-100 shadow-sm'}
                            `}
                        >
                            <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                                <HardDrive className="w-16 h-16 rotate-12" />
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className={`w-2 h-2 rounded-full animate-pulse ${activeHub ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                        <p className={`text-[10px] font-bold uppercase tracking-[0.15em] ${activeHub ? 'text-emerald-600' : 'text-slate-400'}`}>
                                            {activeHub ? 'Resolved via Storage Hub' : 'Manual Storage Path'}
                                        </p>
                                    </div>
                                    <div className={`p-4 rounded-xl shadow-inner transition-colors border group-hover:bg-white flex items-center justify-between gap-3 ${activeHub ? 'bg-white/60 border-emerald-50/50' : 'bg-white border-slate-100'}`}>
                                        <code className="text-sm font-mono font-bold text-slate-700 break-all">
                                            {displayPath}
                                        </code>
                                        <div className={`shrink-0 transition-all text-emerald-500 scale-110 opacity-0 group-hover:opacity-100`}>
                                           <Copy className="w-4 h-4" />
                                        </div>
                                    </div>
                                    {activeHub && (
                                        <p className="text-[9px] text-emerald-500/70 mt-2 font-medium px-1">
                                            Current Mapping: {activeHub.label} → {activeHub.currentLetter}
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <div className="flex flex-col items-end hidden sm:flex">
                                        <p className={`text-[10px] font-bold uppercase ${activeHub ? 'text-emerald-500' : 'text-slate-400'}`}>Click to Copy Path</p>
                                        <p className="text-[9px] text-slate-400">Open in File Explorer</p>
                                    </div>
                                    <div className={`w-12 h-12 rounded-2xl shadow-sm flex items-center justify-center group-hover:scale-110 group-hover:text-white transition-all ${activeHub ? 'bg-white text-emerald-500 group-hover:bg-emerald-500' : 'bg-white text-slate-400 group-hover:bg-slate-500'}`}>
                                        <Copy className="w-5 h-5" />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.section>
                )}

                {/* --- SECTION 1: STRATEGY BENTO --- */}
                <motion.section variants={sectionVariants} className="space-y-4">
                    <div className="flex items-center gap-2 text-slate-300 px-1">
                        <Sparkles className="w-4 h-4" />
                        <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em]">Strategy & Identity</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Pillar Card */}
                        <motion.div 
                            whileHover={bouncyHover}
                            className="group relative overflow-hidden bg-white p-6 rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500"
                        >
                            <p className="text-[10px] font-semibold text-slate-300 uppercase tracking-widest mb-3">Content Pillar</p>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-300 flex items-center justify-center">
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <p className="text-lg font-semibold text-slate-600">{getOptionLabel(task.pillar, 'PILLAR')}</p>
                            </div>
                        </motion.div>

                        {/* Category Card */}
                        <motion.div 
                            whileHover={bouncyHover}
                            className="group relative overflow-hidden bg-white p-6 rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500"
                        >
                            <p className="text-[10px] font-semibold text-slate-300 uppercase tracking-widest mb-3">Category</p>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-300 flex items-center justify-center">
                                    <Tag className="w-5 h-5" />
                                </div>
                                <p className="text-lg font-semibold text-slate-600">{getOptionLabel(task.category, 'CATEGORY')}</p>
                            </div>
                        </motion.div>

                        {/* Format Card */}
                        <motion.div 
                            whileHover={bouncyHover}
                            className="group relative overflow-hidden bg-white p-6 rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500 sm:col-span-2"
                        >
                            <p className="text-[10px] font-semibold text-slate-300 uppercase tracking-widest mb-3">Content Format</p>
                            <div className="flex flex-wrap gap-2">
                                {task.contentFormats && task.contentFormats.length > 0 ? (
                                    task.contentFormats.map(f => (
                                        <span key={f} className="px-4 py-2 bg-amber-50 text-amber-500 rounded-xl text-sm font-semibold border border-amber-100 shadow-sm">
                                            {getOptionLabel(f, 'FORMAT')}
                                        </span>
                                    ))
                                ) : (
                                    <span key={task.contentFormat} className="px-4 py-2 bg-amber-50 text-amber-500 rounded-xl text-sm font-semibold border border-amber-100 shadow-sm">
                                        {getOptionLabel(task.contentFormat, 'FORMAT')}
                                    </span>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </motion.section>

                {/* --- SECTION 2: PRODUCTION & TIMELINE --- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Timeline */}
                    <motion.section variants={sectionVariants} className="lg:col-span-2 space-y-4">
                        <div className="flex items-center gap-2 text-slate-300 px-1">
                            <Clock className="w-4 h-4" />
                            <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em]">Production Timeline</h4>
                        </div>
                        <motion.div 
                            whileHover={{ y: -5 }}
                            className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] grid grid-cols-1 sm:grid-cols-2 gap-8 relative overflow-hidden"
                        >
                            <div className="relative z-10 space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-300 flex items-center justify-center shrink-0">
                                        <Calendar className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-semibold text-slate-300 uppercase tracking-widest mb-1">Publish Date</p>
                                        <p className="text-xl font-semibold text-slate-600">
                                            {task.endDate ? format(new Date(task.endDate), 'd MMMM yyyy', { locale: th }) : 'ไม่ระบุ'}
                                        </p>
                                        <p className="text-xs text-slate-300 mt-1 font-medium">
                                            {task.startDate ? `เริ่มผลิต: ${format(new Date(task.startDate), 'd MMM', { locale: th })}` : ''}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-300 flex items-center justify-center shrink-0">
                                        <Film className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-semibold text-slate-300 uppercase tracking-widest mb-1">Shoot Date</p>
                                        <p className="text-xl font-semibold text-slate-600">
                                            {task.shootDate ? format(new Date(task.shootDate), 'd MMMM yyyy', { locale: th }) : 'ยังไม่ระบุวันถ่าย'}
                                        </p>
                                        <p className="text-xs text-slate-300 mt-1 font-medium italic">
                                            {task.shootLocation ? `@ ${task.shootLocation}` : 'ยังไม่ระบุสถานที่'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <PlatformSection task={task} />
                        </motion.div>
                    </motion.section>

                    {/* Team */}
                    <motion.section variants={sectionVariants} className="space-y-4">
                        <div className="flex items-center gap-2 text-slate-300 px-1">
                            <Users className="w-4 h-4" />
                            <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em]">The Creative Crew</h4>
                        </div>
                        <motion.div 
                            whileHover={{ y: -5 }}
                            className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-6"
                        >
                            {[
                                { label: 'Idea Owner', ids: task.ideaOwnerIds, color: 'indigo' },
                                { label: 'Assignee', ids: task.assigneeIds, color: 'emerald' },
                                { label: 'Editor', ids: task.editorIds, color: 'rose' }
                            ].map((role) => (
                                <div key={role.label} className="space-y-3">
                                    <p className="text-[9px] font-semibold text-slate-300 uppercase tracking-[0.2em]">{role.label}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {role.ids && role.ids.length > 0 ? (
                                            role.ids.map(id => {
                                                const user = getUserById(id);
                                                return user ? (
                                                    <motion.div 
                                                        key={id} 
                                                        whileHover={{ scale: 1.1, x: 5 }}
                                                        className="group flex items-center gap-2 p-1 pr-3 bg-slate-50/50 border border-slate-100/50 rounded-full hover:bg-white hover:shadow-sm transition-all cursor-default"
                                                    >
                                                        <img src={user.avatarUrl} alt={user.name} className="w-7 h-7 rounded-full object-cover border-2 border-white" />
                                                        <span className="text-[11px] font-semibold text-slate-500">{user.name}</span>
                                                    </motion.div>
                                                ) : null;
                                            })
                                        ) : (
                                            <span className="text-[10px] text-slate-200 italic">Not Assigned</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    </motion.section>
                </div>

                {/* --- SECTION 3: BRIEF & REMARK --- */}
                <motion.section variants={sectionVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center gap-2 text-slate-300 px-1">
                            <FileText className="w-4 h-4" />
                            <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em]">Content Brief</h4>
                        </div>
                        <motion.div 
                            whileHover={{ y: -5 }}
                            className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] min-h-[300px] relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-100/30 via-purple-100/30 to-pink-100/30" />
                            <div className="prose prose-slate max-w-none prose-headings:font-semibold prose-p:text-slate-500 prose-p:leading-relaxed prose-strong:text-slate-700">
                                {task.description ? (
                                    <Markdown>{task.description}</Markdown>
                                ) : (
                                    <p className="italic text-slate-200 text-lg">No description provided for this content.</p>
                                )}
                            </div>
                        </motion.div>
                    </div>

                    <div className="space-y-8">
                        {task.remark && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-slate-300 px-1">
                                    <AlertTriangle className="w-4 h-4" />
                                    <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em]">Important Remark</h4>
                                </div>
                                <motion.div 
                                    whileHover={{ scale: 1.02 }}
                                    className="bg-amber-50/20 p-8 rounded-[2.5rem] border border-amber-100/20 shadow-sm relative overflow-hidden"
                                >
                                    <p className="text-sm text-amber-600/80 font-semibold leading-relaxed relative z-10">{task.remark}</p>
                                </motion.div>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-slate-300 px-1">
                                <Paperclip className="w-4 h-4" />
                                <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em]">Quick Assets</h4>
                            </div>
                            <motion.div 
                                whileHover={bouncyHover}
                                className="bg-slate-50/30 p-8 rounded-[2.5rem] text-slate-400 border border-slate-100/50 shadow-[0_8px_20px_rgba(0,0,0,0.02)] relative overflow-hidden group"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Paperclip className="w-12 h-12 rotate-12" />
                                </div>
                                <p className="text-[10px] font-semibold text-slate-300 uppercase tracking-widest mb-2">Attached Files</p>
                                <p className="text-4xl font-semibold text-slate-400/80 mb-1">{task.assets?.length || 0}</p>
                                <p className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider">Total Assets Linked</p>
                            </motion.div>
                        </div>
                    </div>
                </motion.section>

            </div>

            {/* --- MINIMAL FOOTER --- */}
            <div className="px-5 sm:px-10 py-3 sm:py-6 bg-white border-t border-slate-50 flex flex-col sm:flex-row gap-4 sm:gap-6 justify-between items-center shrink-0">
                <div className="flex items-center gap-4 sm:gap-8 overflow-x-auto w-full sm:w-auto scrollbar-none pb-1 sm:pb-0">
                    {task.createdAt && (
                        <div className="flex flex-col shrink-0">
                            <span className="text-[7.5px] sm:text-[9px] font-semibold text-slate-300 uppercase tracking-widest mb-0.5">Created At</span>
                            <span className="text-[9px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-tighter sm:tracking-normal">{format(new Date(task.createdAt), 'd MMM yy, HH:mm', { locale: th })}</span>
                        </div>
                    )}
                    <div className="w-px h-6 bg-slate-100 shrink-0" />
                    <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                        <div className="flex flex-col shrink-0">
                            <span className="text-[7.5px] sm:text-[9px] font-semibold text-slate-300 uppercase tracking-widest mb-0.5">Comments</span>
                            <span className="text-[9px] sm:text-[11px] font-semibold text-slate-400">0 Messages</span>
                        </div>
                    </div>
                </div>
                
                <button 
                    onClick={onClose}
                    className="hidden sm:block px-8 py-3 bg-slate-50 text-slate-400 font-semibold text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-100 transition-all active:scale-95"
                >
                    Close Window
                </button>
            </div>
        </motion.div>
    );
};

export default ContentDetail;
