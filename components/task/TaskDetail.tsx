
import React from 'react';
import { 
    Calendar, 
    Clock, 
    AlertCircle, 
    Edit3, 
    Trash2, 
    Flag,
    Users,
    FileText,
    MessageSquare,
    Paperclip,
    Info,
    ChevronRight,
    Zap,
    Target,
    AlertTriangle,
    Sparkles,
    Link as LinkIcon,
    Copy
} from 'lucide-react';
import { Task, User, MasterOption } from '../../types';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { motion, Variants, AnimatePresence } from 'framer-motion';
import Markdown from 'react-markdown';
import { useToast } from '../../context/ToastContext';
import { useGlobalDialog } from '../../context/GlobalDialogContext';

interface TaskDetailProps {
    task: Task;
    users: User[];
    masterOptions: MasterOption[];
    onEdit: () => void;
    onDelete?: () => void;
    onClose: () => void;
    onOpenTask?: (task: Task, currentViewMode?: string) => void;
}

const TaskDetail: React.FC<TaskDetailProps> = ({ 
    task, users, masterOptions, onEdit, onDelete, onClose, onOpenTask 
}) => {
    const { showToast } = useToast();
    const { showConfirm, showAlert } = useGlobalDialog();
    
    const getStatusInfo = (status: string) => {
        const option = masterOptions.find(o => o.key === status && o.type === 'TASK_STATUS');
        return {
            label: option?.label || status,
            color: option?.color || 'slate'
        };
    };

    const getPriorityInfo = (priority: string) => {
        switch (priority) {
            case 'URGENT': return { label: 'ด่วนที่สุด', color: 'rose', icon: AlertCircle };
            case 'HIGH': return { label: 'สำคัญมาก', color: 'orange', icon: Flag };
            case 'MEDIUM': return { label: 'ปกติ', color: 'indigo', icon: Flag };
            case 'LOW': return { label: 'ต่ำ', color: 'slate', icon: Flag };
            default: return { label: priority, color: 'slate', icon: Flag };
        }
    };

    const getUserById = (id: string) => users.find(u => u.id === id);

    const getDifficultyLevel = (difficulty?: string) => {
        switch (difficulty) {
            case 'EASY': return 1;
            case 'MEDIUM': return 3;
            case 'HARD': return 5;
            default: return 0;
        }
    };

    const statusInfo = getStatusInfo(task.status);
    const priorityInfo = getPriorityInfo(task.priority);
    const difficultyLevel = getDifficultyLevel(task.difficulty);

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
        showToast('คัดลอกชื่อรายการเรียบร้อยแล้ว ✅', 'success');
    };

    const handleDeleteClick = async () => {
        if (!onDelete) return;
        const confirm = await showConfirm(
            `คุณแน่ใจว่าต้องการลบรายการ "${task.title}" หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้`,
            'ยืนยันการลบรายการ'
        );
        if (confirm) {
            onDelete();
        }
    };

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
                                    <Zap className="w-3.5 h-3.5" />
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
                                <span className="text-[10px] font-black text-slate-300 group-hover:text-slate-500 transition-colors uppercase tracking-tight">Tap to reveal info</span>
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
                                className="px-4 sm:px-8 py-2.5 sm:py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4"
                            >
                                <div className="flex items-center gap-3 sm:gap-5 flex-1 min-w-0">
                                    <motion.div 
                                        onClick={() => setIsHeaderExpanded(false)}
                                        whileHover={{ rotate: -8, scale: 1.15 }}
                                        className={`
                                            w-9 h-9 sm:w-14 sm:h-14 rounded-lg sm:rounded-[1.25rem] flex items-center justify-center shadow-[0_8px_20px_-4px_rgba(0,0,0,0.08)]
                                            bg-${statusInfo.color}-50 text-${statusInfo.color}-400 border border-${statusInfo.color}-100 shrink-0 cursor-pointer
                                        `}
                                    >
                                        <Zap className="w-5 h-5 sm:w-7 sm:h-7" />
                                    </motion.div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 sm:gap-3 mb-0.5 sm:mb-1.5 overflow-hidden group">
                                            <h3 className="text-base sm:text-2xl font-semibold text-slate-700 tracking-tight leading-none truncate">{task.title}</h3>
                                            <button 
                                                onClick={handleCopyTitle}
                                                className="p-1 rounded-lg sm:rounded-xl bg-slate-50 text-slate-300 hover:bg-slate-100 hover:text-slate-400 transition-all active:scale-90 shrink-0 opacity-0 group-hover:opacity-100"
                                                title="Copy Title"
                                            >
                                                <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                            <span className={`px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[7px] sm:text-[10px] font-semibold uppercase tracking-widest bg-${statusInfo.color}-50 text-${statusInfo.color}-500 border border-${statusInfo.color}-100/50`}>
                                                {statusInfo.label}
                                            </span>
                                            <span className="px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[7px] sm:text-[10px] font-semibold uppercase tracking-widest bg-emerald-50 text-emerald-500 border border-emerald-100/50">
                                                TASK
                                            </span>
                                            <button 
                                                onClick={() => setIsHeaderExpanded(false)}
                                                className="text-[12px] font-medium text-indigo-400 hover:text-indigo-600 transition-colors uppercase tracking-tight px-2 py-0.5 bg-indigo-50/50 rounded-md"
                                            >
                                                Hide header
                                            </button>
                                        </div>
                                    </div>
                                </div>
        
                                <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto shrink-0 border-t sm:border-t-0 border-slate-50 pt-2 sm:pt-0">
                                    {onDelete && (
                                        <motion.button 
                                            whileHover={{ scale: 1.1, color: '#f43f5e' }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={handleDeleteClick}
                                            className="p-1.5 sm:p-3 text-slate-300 hover:bg-rose-50 rounded-xl sm:rounded-2xl transition-all shrink-0"
                                        >
                                            <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                                        </motion.button>
                                    )}
                                    <motion.button 
                                        whileHover={bouncyHover}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={onEdit}
                                        className="flex-1 sm:flex-none group flex items-center justify-center gap-2 px-3 sm:px-6 py-2 sm:py-3 bg-indigo-50 text-indigo-500 border border-indigo-100 rounded-xl sm:rounded-[1.25rem] font-semibold text-[10px] sm:text-sm shadow-[0_4px_12px_-2px_rgba(79,70,229,0.1)] hover:bg-indigo-100 transition-all"
                                    >
                                        <Edit3 className="w-3 h-3 sm:w-4 sm:h-4 group-hover:rotate-12 transition-transform" />
                                        EDIT TASK
                                    </motion.button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-10 space-y-6 sm:space-y-10 scrollbar-none">
                
                {/* --- SECTION 1: KEY METRICS --- */}
                <motion.section variants={sectionVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <motion.div 
                        whileHover={bouncyHover}
                        className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center gap-4 transition-all duration-500"
                    >
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-${priorityInfo.color}-50 text-${priorityInfo.color}-400 flex items-center justify-center shrink-0`}>
                            <priorityInfo.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <div>
                            <p className="text-[9px] sm:text-[10px] font-semibold text-slate-300 uppercase tracking-widest mb-0.5">Priority</p>
                            <p className={`text-base sm:text-lg font-semibold text-${priorityInfo.color}-500`}>{priorityInfo.label}</p>
                        </div>
                    </motion.div>

                    <motion.div 
                        whileHover={bouncyHover}
                        className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center gap-4 transition-all duration-500"
                    >
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-sky-50 text-sky-300 flex items-center justify-center shrink-0">
                            <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <div>
                            <p className="text-[9px] sm:text-[10px] font-semibold text-slate-300 uppercase tracking-widest mb-0.5">Deadline</p>
                            <p className="text-base sm:text-lg font-semibold text-slate-600 truncate">
                                {task.endDate ? format(new Date(task.endDate), 'd MMM yyyy', { locale: th }) : 'ไม่ระบุ'}
                            </p>
                        </div>
                    </motion.div>

                    <motion.div 
                        whileHover={bouncyHover}
                        className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center gap-4 transition-all duration-500"
                    >
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 text-emerald-300 flex items-center justify-center shrink-0">
                            <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <div>
                            <p className="text-[9px] sm:text-[10px] font-semibold text-slate-300 uppercase tracking-widest mb-0.5">Duration</p>
                            <p className="text-base sm:text-lg font-semibold text-slate-600 truncate">
                                {task.startDate && task.endDate ? (
                                    `${format(new Date(task.startDate), 'd MMM')} - ${format(new Date(task.endDate), 'd MMM')}`
                                ) : 'ไม่ระบุ'}
                            </p>
                        </div>
                    </motion.div>
                </motion.section>

                {/* --- SECTION 2: TASK BENTO --- */}
                <motion.section variants={sectionVariants} className="space-y-4">
                    <div className="flex items-center gap-2 text-slate-300 px-1">
                        <Zap className="w-4 h-4" />
                        <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em]">Task Specifications</h4>
                    </div>
                    
                    <motion.div 
                        whileHover={{ y: -5 }}
                        className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-8"
                    >
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
                            <div className="space-y-1">
                                <p className="text-[9px] sm:text-[10px] font-semibold text-slate-300 uppercase tracking-widest">Type</p>
                                <p className="text-sm sm:text-lg font-semibold text-slate-600 truncate">{task.assigneeType || 'รายบุคคล'}</p>
                            </div>

                            <div className="space-y-1">
                                <p className="text-[9px] sm:text-[10px] font-semibold text-slate-300 uppercase tracking-widest">Position</p>
                                <p className="text-sm sm:text-lg font-semibold text-slate-600 truncate">{task.targetPosition || 'ไม่ระบุ'}</p>
                            </div>

                            <div className="space-y-1">
                                <p className="text-[9px] sm:text-[10px] font-semibold text-slate-300 uppercase tracking-widest">Difficulty</p>
                                <div className="flex items-center gap-1 mt-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Sparkles 
                                            key={star} 
                                            className={`w-3 h-3 sm:w-4 sm:h-4 ${star <= difficultyLevel ? 'text-amber-300 fill-amber-300' : 'text-slate-100'}`} 
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <p className="text-[9px] sm:text-[10px] font-semibold text-slate-300 uppercase tracking-widest">Hours</p>
                                <p className="text-sm sm:text-lg font-semibold text-slate-600">{task.estimatedHours || 0} ชม.</p>
                            </div>
                        </div>

                        {task.contentId && (
                            <div className="pt-10 border-t border-slate-50">
                                <div className="flex items-center gap-2 text-slate-300 mb-4 ml-1 uppercase tracking-[0.2em] text-[11px] font-bold">
                                    <Target className="w-4 h-4" />
                                    <span>Master Project Connection</span>
                                </div>
                                <motion.div 
                                    whileHover={{ y: -5 }}
                                    onClick={() => onOpenTask && onOpenTask({ id: task.contentId, type: 'CONTENT', title: 'Loading...' } as Task)}
                                    className="relative group cursor-pointer overflow-hidden rounded-[2rem] border border-indigo-100 bg-white"
                                >
                                    {/* Ambient Glow */}
                                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-500/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                    
                                    <div className="px-8 py-6 flex flex-col sm:flex-row items-center gap-6 relative z-10">
                                        <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shrink-0">
                                            <Target className="w-7 h-7" />
                                        </div>
                                        
                                        <div className="flex-1 text-center sm:text-left">
                                            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                                                <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">Project Master</span>
                                                <Sparkles className="w-3 h-3 text-amber-400" />
                                            </div>
                                            <h4 className="text-lg font-bold text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors">
                                                เข้าดูรายละเอียดโครงการหลักและไฟล์งานต้นฉบับ
                                            </h4>
                                            <p className="text-xs text-slate-400 font-medium mt-1">ดูสคริปต์, ไฟล์แนบ และข้อมูลสำคัญของ Master Project นี้</p>
                                        </div>

                                        <div className="flex items-center gap-3 shrink-0">
                                            <div className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-all">
                                                <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bottom Indicator Line */}
                                    <div className="absolute bottom-0 left-0 h-1 bg-indigo-500/0 group-hover:bg-indigo-500/100 transition-all duration-500 w-0 group-hover:w-full" />
                                </motion.div>
                            </div>
                        )}
                    </motion.div>
                </motion.section>

                {/* --- SECTION 3: DESCRIPTION & TEAM --- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <motion.section variants={sectionVariants} className="lg:col-span-2 space-y-4">
                        <div className="flex items-center gap-2 text-slate-300 px-1">
                            <FileText className="w-4 h-4" />
                            <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em]">Task Description</h4>
                        </div>
                        <motion.div 
                            whileHover={{ y: -5 }}
                            className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] min-h-[250px] relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-100/30 via-purple-100/30 to-pink-100/30" />
                            <div className="prose prose-slate max-w-none prose-headings:font-semibold prose-p:text-slate-500 prose-p:leading-relaxed prose-strong:text-slate-700">
                                {task.description ? (
                                    <Markdown>{task.description}</Markdown>
                                ) : (
                                    <p className="italic text-slate-200 text-lg">No description provided for this task.</p>
                                )}
                            </div>
                        </motion.div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <motion.div 
                                whileHover={task.caution ? { scale: 1.02, y: -2 } : {}}
                                onClick={() => task.caution && showAlert(task.caution, 'รายละเอียดข้อควรระวัง')}
                                className={`group p-6 rounded-[2rem] border flex gap-4 transition-all duration-300 ${
                                    task.caution 
                                        ? 'bg-rose-50/20 border-rose-200/30 cursor-pointer shadow-sm' 
                                        : 'bg-slate-50/30 border-slate-100/30 opacity-60'
                                }`}
                            >
                                <AlertTriangle className={`w-6 h-6 shrink-0 ${task.caution ? 'text-rose-400' : 'text-slate-200'}`} />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className={`text-[10px] font-semibold uppercase tracking-widest ${task.caution ? 'text-rose-500' : 'text-slate-400'}`}>
                                            Caution
                                        </p>
                                        {task.caution && <span className="w-1 h-1 rounded-full bg-rose-300 animate-pulse" />}
                                    </div>
                                    <p className={`text-sm leading-relaxed line-clamp-2 ${task.caution ? 'text-rose-600/70 font-medium' : 'text-slate-300 italic'}`}>
                                        {task.caution || 'ไม่มีข้อควรระวังพิเศษ'}
                                    </p>
                                    {task.caution && (
                                        <p className="mt-2 text-[9px] text-rose-400 font-bold uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">
                                            คลิกเพื่ออ่านเพิ่มเติม
                                        </p>
                                    )}
                                </div>
                            </motion.div>

                            <motion.div 
                                whileHover={task.importance ? { scale: 1.02, y: -2 } : {}}
                                onClick={() => task.importance && showAlert(task.importance, 'รายละเอียดสิ่งสำคัญ')}
                                className={`group p-6 rounded-[2rem] border flex gap-4 transition-all duration-300 ${
                                    task.importance 
                                        ? 'bg-indigo-50/20 border-indigo-200/30 cursor-pointer shadow-sm' 
                                        : 'bg-slate-50/30 border-slate-100/30 opacity-60'
                                }`}
                            >
                                <Target className={`w-6 h-6 shrink-0 ${task.importance ? 'text-indigo-400' : 'text-slate-200'}`} />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className={`text-[10px] font-semibold uppercase tracking-widest ${task.importance ? 'text-indigo-500' : 'text-slate-400'}`}>
                                            Key Focus
                                        </p>
                                        {task.importance && <span className="w-1 h-1 rounded-full bg-indigo-300 animate-pulse" />}
                                    </div>
                                    <p className={`text-sm leading-relaxed line-clamp-2 ${task.importance ? 'text-indigo-600/70 font-medium' : 'text-slate-300 italic'}`}>
                                        {task.importance || 'ไม่มีจุดเน้นพิเศษ'}
                                    </p>
                                    {task.importance && (
                                        <p className="mt-2 text-[9px] text-indigo-400 font-bold uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">
                                            คลิกเพื่ออ่านเพิ่มเติม
                                        </p>
                                    )}
                                </div>
                            </motion.div>
                        </div>

                        {task.remark && (
                            <motion.div 
                                whileHover={{ scale: 1.01 }}
                                className="bg-amber-50/20 p-6 rounded-[2rem] border border-amber-100/20 flex gap-4"
                            >
                                <Info className="w-6 h-6 text-amber-300 shrink-0" />
                                <div>
                                    <p className="text-[10px] font-semibold text-amber-500 uppercase tracking-widest mb-1">Remark</p>
                                    <p className="text-sm text-amber-700/70 leading-relaxed font-medium">{task.remark}</p>
                                </div>
                            </motion.div>
                        )}
                    </motion.section>

                    <motion.section variants={sectionVariants} className="space-y-4">
                        <div className="flex items-center gap-2 text-slate-300 px-1">
                            <Users className="w-4 h-4" />
                            <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em]">Assigned Crew</h4>
                        </div>
                        <motion.div 
                            whileHover={{ y: -5 }}
                            className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-6"
                        >
                            <div className="space-y-4">
                                <p className="text-[9px] font-semibold text-slate-300 uppercase tracking-[0.2em]">Main Assignees</p>
                                <div className="flex flex-wrap gap-2.5">
                                    {task.assigneeIds && task.assigneeIds.length > 0 ? (
                                        task.assigneeIds.map(id => {
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
                                        <p className="text-xs text-slate-200 italic">No assignees linked</p>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </motion.section>
                </div>
            </div>

                {/* --- MINIMAL FOOTER --- */}
                <div className="px-4 sm:px-10 py-3 sm:py-6 bg-white border-t border-slate-50 flex flex-col sm:flex-row gap-4 sm:gap-6 justify-between items-center shrink-0">
                    <div className="flex items-center gap-4 sm:gap-8 overflow-x-auto w-full sm:w-auto scrollbar-none pb-1 sm:pb-0">
                        {task.createdAt && (
                            <div className="flex flex-col shrink-0">
                                <span className="text-[7.5px] sm:text-[9px] font-semibold text-slate-300 uppercase tracking-widest mb-0.5">Created At</span>
                                <span className="text-[9px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-tighter sm:tracking-normal">{format(new Date(task.createdAt), 'd MMM yy, HH:mm', { locale: th })}</span>
                            </div>
                        )}
                        <div className="w-px h-6 bg-slate-100 shrink-0" />
                        <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                            <div className="flex items-center gap-1.5 sm:gap-2 text-slate-300">
                                <MessageSquare className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                                <span className="text-[8px] sm:text-[10px] font-semibold uppercase tracking-wider">0 Comments</span>
                            </div>
                            <div className="flex items-center gap-1.5 sm:gap-2 text-slate-300">
                                <Paperclip className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                                <span className="text-[8px] sm:text-[10px] font-semibold uppercase tracking-wider">{task.assets?.length || 0} Assets</span>
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

export default TaskDetail;
