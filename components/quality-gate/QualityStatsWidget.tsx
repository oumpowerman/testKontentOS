
import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ReviewSession, User, Task } from '../../types';
import { CheckCircle2, AlertTriangle, Clock, Activity, X, Calendar, LayoutList, User as UserIcon, MessageSquare } from 'lucide-react';
import { isToday, format } from 'date-fns';
import { th } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

interface QualityStatsWidgetProps {
    reviews: ReviewSession[];
    users: User[];
}

// --- Helper: Find Submitter ---
const getSubmitter = (task: Task | undefined, users: User[]) => {
    if (!task) return null;
    // Priority: Editor -> Assignee -> Idea Owner
    const id = task.editorIds?.[0] || task.assigneeIds?.[0] || task.ideaOwnerIds?.[0];
    return users.find(u => u.id === id);
}

// --- Enhanced Internal Modal ---
const StatDetailModal = ({ 
    isOpen, onClose, title, items, colorClass, icon: Icon, users 
}: { 
    isOpen: boolean; onClose: () => void; title: string; items: ReviewSession[]; colorClass: string; icon: any; users: User[] 
}) => {
    // Extract base color name for gradients (e.g. 'text-yellow-600' -> 'yellow')
    const colorKey = colorClass.split('-')[1] || 'indigo';
    
    // Dynamic Gradient Background for Header
    const headerBg = `bg-gradient-to-r from-${colorKey}-500 to-${colorKey}-600`;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 overflow-hidden">
                    {/* Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md cursor-pointer"
                    />

                    {/* Modal Container: Fixed sizing for Enterprise feel */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 30 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300, mass: 0.8 }}
                        className="relative bg-slate-50 w-full max-w-[calc(100%-1rem)] md:max-w-2xl h-[70vh] md:h-[600px] rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col border-4 border-white ring-1 ring-black/5"
                    >
                        {/* Premium Header */}
                        <div className={`px-6 py-6 h-28 shrink-0 flex justify-between items-center text-white relative overflow-hidden ${headerBg} shadow-lg`}>
                            {/* Decor Pattern */}
                            <motion.div 
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 0.15, x: 0 }}
                                className="absolute top-0 right-0 p-8 transform rotate-12 -mr-4 -mt-4 pointer-events-none"
                            >
                                <Icon className="w-32 h-32" />
                            </motion.div>
                            
                            <div className="relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl shadow-inner border border-white/20">
                                        <Icon className="w-7 h-7 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold tracking-tight leading-none drop-shadow-sm">{title}</h3>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="px-2 py-0.5 bg-white/20 rounded-md text-[10px] font-bold uppercase tracking-wider">
                                                {items.length} รายการในระบบ
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <motion.button 
                                whileHover={{ scale: 1.1, rotate: 90 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={onClose} 
                                className="relative z-10 p-2 bg-white/10 hover:bg-white/30 rounded-full text-white transition-colors backdrop-blur-md border border-white/20"
                            >
                                <X className="w-6 h-6" />
                            </motion.button>
                        </div>

                        {/* List Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 scroll-smooth custom-scrollbar">
                            {items.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                    <motion.div 
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="w-24 h-24 bg-white rounded-[2rem] shadow-sm border border-gray-100 flex items-center justify-center mb-4"
                                    >
                                        <LayoutList className="w-10 h-10 opacity-20" />
                                    </motion.div>
                                    <p className="text-base font-bold text-gray-500">ยังไม่มีข้อมูลในส่วนนี้</p>
                                    <p className="text-xs text-gray-400 mt-1">ยินดีด้วย! ระบบของคุณเรียบร้อยดี</p>
                                </div>
                            ) : (
                                items.map((r, idx) => {
                                    const submitter = getSubmitter(r.task, users);
                                    
                                    return (
                                        <motion.div 
                                            key={r.id} 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-indigo-100 hover:-translate-y-1 transition-all group relative overflow-hidden"
                                        >
                                            <div className={`absolute top-0 left-0 w-1 h-full bg-${colorKey}-500/30`} />
                                            
                                            {/* Top Row: Title & Round */}
                                            <div className="flex justify-between items-start gap-4 mb-3">
                                                <h4 className="font-medium text-gray-800 text-md md:text-base line-clamp-2 leading-relaxed group-hover:text-indigo-600 transition-colors">
                                                    {r.task?.title || 'Unknown Task'}
                                                </h4>
                                                <div className="shrink-0 flex flex-col items-end">
                                                    <span className="text-[10px] font-bold bg-gray-50 text-gray-500 px-2.5 py-1 rounded-lg border border-gray-200 uppercase tracking-widest">
                                                        R.{r.round}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Submitter & Date Info */}
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 pt-4 border-t border-gray-50">
                                                
                                                {/* Submitter Profile */}
                                                <div className="flex items-center gap-3">
                                                    <div className="relative">
                                                        {submitter?.avatarUrl ? (
                                                            <img src={submitter.avatarUrl} className="w-8 h-8 rounded-full object-cover ring-2 ring-white shadow-md" alt={submitter.name} />
                                                        ) : (
                                                            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-[10px] font-bold text-indigo-400 ring-2 ring-white shadow-sm">
                                                                <UserIcon className="w-4 h-4" />
                                                            </div>
                                                        )}
                                                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-${colorKey}-500 rounded-full border-2 border-white`} />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider leading-none">ผู้รับผิดชอบ</span>
                                                        <span className="text-xs font-bold text-gray-700 mt-1">{submitter?.name || 'Unknown User'}</span>
                                                    </div>
                                                </div>

                                                {/* Date Badge */}
                                                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100 self-start sm:self-center">
                                                    <Calendar className="w-3 h-3 text-gray-400" />
                                                    {format(new Date(r.scheduledAt), 'd MMMM yyyy, HH:mm', { locale: th })}
                                                </div>
                                            </div>

                                            {/* Feedback (Conditional) */}
                                            {r.feedback && (
                                                <div className="mt-4 bg-red-50/50 p-4 rounded-2xl border border-red-100/50 flex items-start gap-3">
                                                    <div className="p-1.5 bg-red-100 rounded-lg">
                                                        <MessageSquare className="w-3.5 h-3.5 text-red-500 shrink-0" />
                                                    </div>
                                                    <p className="text-xs text-red-700 font-medium leading-relaxed italic">
                                                        "{r.feedback}"
                                                    </p>
                                                </div>
                                            )}
                                        </motion.div>
                                    );
                                })
                            )}
                        </div>
                        
                        {/* Footer Bottom Guard */}
                        <div className="h-4 bg-white shrink-0 border-t border-gray-50" />
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};

const QualityStatsWidget: React.FC<QualityStatsWidgetProps> = ({ reviews, users }) => {
    // Filter Logic
    const pendingList = useMemo(() => reviews.filter(r => r.status === 'PENDING'), [reviews]);
    const passedTodayList = useMemo(() => reviews.filter(r => r.status === 'PASSED' && isToday(new Date(r.scheduledAt))), [reviews]);
    const reviseList = useMemo(() => reviews.filter(r => r.status === 'REVISE'), [reviews]);
    const overdueList = useMemo(() => reviews.filter(r => r.status === 'PENDING' && new Date(r.scheduledAt) < new Date() && !isToday(new Date(r.scheduledAt))), [reviews]);
    const expiredList = useMemo(() => reviews.filter(r => r.status === 'EXPIRED'), [reviews]);

    // Modal State
    const [activeModal, setActiveModal] = useState<{
        title: string;
        items: ReviewSession[];
        colorClass: string;
        icon: any;
    } | null>(null);

    return (
        <>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                
                {/* 1. Pending Card */}
                <div 
                    onClick={() => setActiveModal({ title: 'รายการรอตรวจ (Pending)', items: pendingList, colorClass: 'text-yellow-600', icon: Clock })}
                    className="bg-white p-4 rounded-2xl border border-yellow-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all cursor-pointer group active:scale-95 hover:border-yellow-200"
                >
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-bold text-yellow-600 uppercase tracking-wide">รอตรวจ (Pending)</span>
                        <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg group-hover:bg-yellow-100 transition-colors">
                            <Clock className="w-4 h-4" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-gray-800 mt-2 group-hover:text-yellow-600 transition-colors">{pendingList.length}</p>
                </div>

                {/* 2. Passed Today Card */}
                <div 
                    onClick={() => setActiveModal({ title: 'ผ่านวันนี้ (Passed Today)', items: passedTodayList, colorClass: 'text-green-600', icon: CheckCircle2 })}
                    className="bg-white p-4 rounded-2xl border border-green-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all cursor-pointer group active:scale-95 hover:border-green-200"
                >
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-bold text-green-600 uppercase tracking-wide">ผ่านวันนี้ (Passed)</span>
                        <div className="p-2 bg-green-50 text-green-600 rounded-lg group-hover:bg-green-100 transition-colors">
                            <CheckCircle2 className="w-4 h-4" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-gray-800 mt-2 group-hover:text-green-600 transition-colors">{passedTodayList.length}</p>
                </div>

                {/* 3. Revise Card */}
                <div 
                    onClick={() => setActiveModal({ title: 'รายการสั่งแก้ (Revise)', items: reviseList, colorClass: 'text-red-600', icon: Activity })}
                    className="bg-white p-4 rounded-2xl border border-red-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all cursor-pointer group active:scale-95 hover:border-red-200"
                >
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-bold text-red-600 uppercase tracking-wide">สั่งแก้ (Revise)</span>
                        <div className="p-2 bg-red-50 text-red-600 rounded-lg group-hover:bg-red-100 transition-colors">
                            <Activity className="w-4 h-4" />
                        </div>
                    </div>
                    <p className="text-3xl font-medium text-gray-800 mt-2 group-hover:text-red-600 transition-colors">{reviseList.length}</p>
                </div>

                {/* 4. Overdue Card */}
                <div 
                    onClick={() => setActiveModal({ title: 'รายการเลยกำหนด (Overdue)', items: overdueList, colorClass: 'text-orange-600', icon: AlertTriangle })}
                    className="bg-white p-4 rounded-2xl border border-orange-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all cursor-pointer group active:scale-95 hover:border-orange-200"
                >
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-bold text-orange-600 uppercase tracking-wide">เลยกำหนด (Overdue)</span>
                        <div className="p-2 bg-orange-50 text-orange-600 rounded-lg group-hover:bg-orange-100 transition-colors">
                            <AlertTriangle className="w-4 h-4" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-gray-800 mt-2 group-hover:text-orange-600 transition-colors">{overdueList.length}</p>
                </div>

                {/* 5. Expired Card */}
                <div 
                    onClick={() => setActiveModal({ title: 'รายการหมดอายุ (Expired)', items: expiredList, colorClass: 'text-slate-600', icon: AlertTriangle })}
                    className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all cursor-pointer group active:scale-95 hover:border-slate-200"
                >
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">หมดอายุ (Expired)</span>
                        <div className="p-2 bg-slate-50 text-slate-600 rounded-lg group-hover:bg-slate-100 transition-colors">
                            <AlertTriangle className="w-4 h-4" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-gray-800 mt-2 group-hover:text-slate-600 transition-colors">{expiredList.length}</p>
                </div>
            </div>

            {/* Drill Down Modal */}
            <StatDetailModal 
                isOpen={!!activeModal}
                onClose={() => setActiveModal(null)}
                title={activeModal?.title || ''}
                items={activeModal?.items || []}
                colorClass={activeModal?.colorClass || ''}
                icon={activeModal?.icon || Clock}
                users={users}
            />
        </>
    );
};

export default QualityStatsWidget;
