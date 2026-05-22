
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, ChevronRight, Trash2, Edit3, FileText, Activity, Check, Lock } from 'lucide-react';
import { Task, User, Channel } from '../../../types';
import { useToast } from '../../../context/ToastContext';
import { useGlobalDialog } from '../../../context/GlobalDialogContext';

interface ContentDetailHeaderProps {
    task: Task;
    users: User[];
    channels: Channel[];
    isExpanded: boolean;
    onToggleExpand: (val: boolean) => void;
    onEdit: () => void;
    onDelete?: () => void;
    activeTab: 'CONTENT' | 'EDIT';
    setActiveTab: (tab: 'CONTENT' | 'EDIT') => void;
    viewSubTab?: 'INFO' | 'INSIGHT';
    setViewSubTab?: (tab: 'INFO' | 'INSIGHT') => void;
    isInsightOverdue?: boolean;
    insightStatus?: 'NONE' | 'PARTIAL' | 'COMPLETE';
}

const ContentDetailHeader: React.FC<ContentDetailHeaderProps> = ({
    task, users, channels, isExpanded, onToggleExpand, onEdit, onDelete, activeTab, setActiveTab,
    viewSubTab = 'INFO', setViewSubTab, isInsightOverdue = false, insightStatus = 'NONE'
}) => {
    const { showToast } = useToast();
    const { showConfirm } = useGlobalDialog();

    const getUserById = (id: string) => users.find(u => u.id === id);
    
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

    return (
        <motion.div 
            layout
            animate={{ height: isExpanded ? 'auto' : 46 }}
            transition={{ height: { type: 'spring', damping: 25, stiffness: 120 } }}
            className="sticky top-0 z-40 bg-white/80 backdrop-blur-2xl border-b border-slate-100/50 shadow-[0_2px_20px_-5px_rgba(0,0,0,0.03)] overflow-hidden relative"
        >
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 z-50 opacity-80" />

            <AnimatePresence initial={false}>
                {!isExpanded ? (
                    <motion.div 
                        key="collapsed"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => onToggleExpand(true)}
                        className="h-[44px] flex items-center justify-between px-6 cursor-pointer hover:bg-slate-50/50 transition-colors group absolute inset-0 z-10"
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center bg-indigo-50 text-indigo-400 border border-indigo-100/40`}>
                                <ChevronDown className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-indigo-400 transition-colors">
                                PROJECT CONTROLS
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
                    <motion.div 
                        key="expanded"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="px-4 sm:px-10 py-3 sm:py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-10"
                    >
                        <div className="flex items-start sm:items-center gap-3 sm:gap-5 flex-1 min-w-0 w-full lg:w-auto">
                            <motion.div 
                                onClick={() => onToggleExpand(false)}
                                whileHover={{ rotate: -8, scale: 1.15 }}
                                className={`w-10 h-10 sm:w-16 sm:h-16 rounded-[0.85rem] sm:rounded-2xl flex items-center justify-center shadow-[0_8px_20px_-4px_rgba(0,0,0,0.08)] bg-rose-50 text-rose-400 border border-rose-100/50 shrink-0 mt-1 sm:mt-0 cursor-pointer group`}
                            >
                                <ChevronUp className="w-5 h-5 sm:w-8 sm:h-8 group-hover:scale-110 transition-transform" />
                            </motion.div>
                            <div className="flex-1 min-w-0 text-left">
                                <div className="inline-flex items-center p-1 bg-slate-100/80 backdrop-blur-md rounded-2xl border border-slate-200/50 shadow-inner overflow-hidden select-none">
                                    {[
                                        { id: 'INFO', label: 'ข้อมูลทั่วไป', labelMobile: 'ข้อมูล', icon: FileText, color: 'text-indigo-600', activeBg: 'bg-white shadow-[0_4px_12px_rgba(99,102,241,0.08)] ring-1 ring-indigo-100/50' },
                                        { id: 'INSIGHT', label: 'สถิติ (INSIGHT)', labelMobile: 'สถิติ', icon: Activity, color: 'text-amber-600', activeBg: 'bg-white shadow-[0_4px_12px_rgba(245,158,11,0.08)] ring-1 ring-amber-100/50' },
                                        { id: 'EDIT', label: 'แก้ไขโครงการ', labelMobile: 'แก้ไข', icon: Edit3, color: 'text-rose-600', activeBg: 'bg-slate-900 border-slate-950 text-white shadow-md' }
                                    ].map((tab) => {
                                        const currentMode = activeTab === 'EDIT' ? 'EDIT' : (viewSubTab === 'INSIGHT' ? 'INSIGHT' : 'INFO');
                                        const isActive = currentMode === tab.id;
                                        const isInsight = tab.id === 'INSIGHT';
                                        const isEdit = tab.id === 'EDIT';
                                        
                                        const handleTabClick = async () => {
                                            if (currentMode === 'EDIT' && tab.id !== 'EDIT') {
                                                const confirm = await showConfirm(
                                                    'ข้อมูลที่คุณกำลังแก้ไขหรือกรอกไว้อาจจะยังไม่ได้บันทึกและระบบจะรีเซ็ตค่ากลับไปเป็นของเดิม คุณแน่ใจหรือไม่ว่าต้องการสลับหน้า?',
                                                    'ยืนยันการเปลี่ยนหน้าสลับสตรีน'
                                                );
                                                if (!confirm) {
                                                    return;
                                                }
                                            }
                                            if (tab.id === 'INFO') {
                                                setActiveTab('CONTENT');
                                                setViewSubTab?.('INFO');
                                            } else if (tab.id === 'INSIGHT') {
                                                setActiveTab('CONTENT');
                                                setViewSubTab?.('INSIGHT');
                                            } else if (tab.id === 'EDIT') {
                                                setActiveTab('EDIT');
                                            }
                                        };

                                        return (
                                            <button
                                                key={tab.id}
                                                onClick={handleTabClick}
                                                className={`
                                                    relative flex items-center gap-1.5 xs:gap-2 px-3 sm:px-6 py-2 sm:py-2.5 rounded-xl text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.05em] sm:tracking-[0.1em] transition-all duration-300 z-10
                                                    ${isActive ? (isEdit ? 'text-white' : tab.color) : 'text-slate-400 hover:text-slate-600'}
                                                `}
                                                title={tab.label}
                                            >
                                                {isActive && (
                                                    <motion.div
                                                        layoutId="smartModeIndicator"
                                                        className={`absolute inset-0 rounded-xl -z-10 ${tab.activeBg}`}
                                                        transition={{ type: "spring", bounce: 0.18, duration: 0.5 }}
                                                    />
                                                )}
                                                
                                                <tab.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isActive && !isEdit ? 'animate-pulse' : ''}`} />
                                                
                                                <span className="hidden xs:inline">{tab.label}</span>
                                                <span className="inline xs:hidden">{tab.labelMobile}</span>

                                                {/* Badge indicators for INSIGHT */}
                                                {isInsight && isInsightOverdue && !isActive && (
                                                    <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 border border-white"></span>
                                                    </span>
                                                )}
                                                
                                                {isInsight && insightStatus === 'COMPLETE' && (
                                                    <div className={`ml-1 flex items-center justify-center w-4 h-4 rounded-full ${isActive ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-600'} transition-colors`} title="กรอกสถิติครบทุกแพลตฟอร์มแล้ว 🎉">
                                                        <Check strokeWidth={4} className="w-2.5 h-2.5" />
                                                    </div>
                                                )}
                                                {isInsight && insightStatus === 'PARTIAL' && (
                                                    <div className={`ml-1.5 px-2 py-0.5 rounded-[0.5rem] text-[9px]/[1] font-bold tracking-normal flex items-center justify-center whitespace-nowrap ${isActive ? 'bg-amber-500 text-white shadow-sm' : 'bg-amber-50 text-amber-600 border border-amber-100'} transition-all`} title="บันทึกสถิติบางส่วนแล้ว แต่ยังมีบางแพลตฟอร์มที่ยังไม่บันทึกครับ">
                                                        บางส่วน
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto shrink-0 border-t sm:border-t-0 border-slate-50 pt-3 sm:pt-0">
                            {onDelete && (
                                <motion.button 
                                    whileHover={{ scale: 1.1, backgroundColor: '#fff1f2', color: '#f43f5e' }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={handleDeleteClick}
                                    className="w-10 h-10 sm:w-14 sm:h-14 flex items-center justify-center text-slate-300 bg-slate-50 sm:bg-transparent rounded-xl sm:rounded-2xl transition-all"
                                >
                                    <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                                </motion.button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default ContentDetailHeader;
