import React from 'react';
import { X, ArrowLeft, Loader2, Film, Activity as ActivityIcon, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task, TaskType, Channel, MasterOption } from '../../types';
import { useToast } from '../../context/ToastContext';

interface TaskModalHeaderProps {
    viewMode: string;
    setViewMode: (mode: any) => void;
    hasHistory?: boolean;
    onClose: () => void;
    isLoadingDetails: boolean;
    themeColor: string;
    currentTheme: { icon: any, label: string };
    taskData?: Task | null;
    activeTab: TaskType;
    channels: Channel[];
    masterOptions: MasterOption[];
}

const TaskModalHeader: React.FC<TaskModalHeaderProps> = ({
    viewMode,
    setViewMode,
    hasHistory,
    onClose,
    isLoadingDetails,
    themeColor,
    currentTheme,
    taskData,
    activeTab,
    channels,
    masterOptions
}) => {
    const { showToast } = useToast();
    const [isCopied, setIsCopied] = React.useState(false);

    const getStatusInfo = (status: string | undefined) => {
        if (!status) return null;
        const option = masterOptions.find(o => o.key === status && o.type === 'STATUS');
        
        const color = option?.color || 'slate';
        let bgClass = 'bg-slate-50 border-slate-200 text-slate-600';
        let dotClass = 'bg-slate-500';
        
        switch (color) {
            case 'emerald': bgClass = 'bg-emerald-50 border-emerald-200 text-emerald-600'; dotClass = 'bg-emerald-500'; break;
            case 'blue': bgClass = 'bg-blue-50 border-blue-200 text-blue-600'; dotClass = 'bg-blue-500'; break;
            case 'amber': bgClass = 'bg-amber-50 border-amber-200 text-amber-600'; dotClass = 'bg-amber-500'; break;
            case 'red': bgClass = 'bg-red-50 border-red-200 text-red-600'; dotClass = 'bg-red-500'; break;
            case 'orange': bgClass = 'bg-orange-50 border-orange-200 text-orange-600'; dotClass = 'bg-orange-500'; break;
            case 'indigo': bgClass = 'bg-indigo-50 border-indigo-200 text-indigo-600'; dotClass = 'bg-indigo-500'; break;
            case 'purple': bgClass = 'bg-purple-50 border-purple-200 text-purple-600'; dotClass = 'bg-purple-500'; break;
            case 'pink': bgClass = 'bg-pink-50 border-pink-200 text-pink-600'; dotClass = 'bg-pink-500'; break;
            case 'rose': bgClass = 'bg-rose-50 border-rose-200 text-rose-600'; dotClass = 'bg-rose-500'; break;
        }

        return {
            label: option?.label || status,
            bgClass,
            dotClass
        };
    };

    const contentStatusInfo = activeTab === 'CONTENT' && taskData?.status ? getStatusInfo(taskData.status) : null;

    const handleCopyTitle = () => {
        if (!taskData?.title) return;
        navigator.clipboard.writeText(taskData.title);
        showToast('คัดลอกชื่อรายการเรียบร้อยแล้ว ✨', 'success');
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <div className={`
            relative px-4 sm:px-8 py-2.5 sm:py-5 border-b flex justify-between items-center shrink-0 transition-colors duration-500
            bg-${themeColor}-50/50 border-${themeColor}-100
        `}>
            {/* Top Sync Indicator */}
            <AnimatePresence>
                {isLoadingDetails && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 32 }}
                        exit={{ opacity: 0, height: 0 }}
                        className="absolute inset-x-0 -top-[0px] z-[100] bg-white border-b border-indigo-100 flex items-center justify-center overflow-hidden"
                    >
                        <div className="flex items-center gap-2 text-[10px] font-black text-indigo-500 tracking-[0.2em] uppercase">
                            <Loader2 className="w-3 h-3 animate-spin"/> Syncing Rich Content...
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            <div className="flex items-center gap-3 sm:gap-5">
                {(viewMode !== 'DETAILS' || hasHistory) && (
                    <button 
                        onClick={() => {
                            if (viewMode !== 'DETAILS') {
                                setViewMode('DETAILS');
                            } else if (hasHistory) {
                                onClose();
                            }
                        }} 
                        className={`p-1.5 sm:p-2 rounded-xl transition-all active:scale-90 border bg-white border-${themeColor}-200 text-${themeColor}-400 hover:text-${themeColor}-600 hover:bg-${themeColor}-50`}
                        title={viewMode !== 'DETAILS' ? "Back to Details" : "Back to Parent Task"}
                    >
                        <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                )}
                <div className="min-w-0">
                    <div className="flex items-center gap-2 sm:gap-3 overflow-hidden">
                        {/* Channel Logo for Content */}
                        {viewMode === 'DETAILS' && activeTab === 'CONTENT' && taskData?.channelId && (
                            <div className="flex items-center justify-center w-8 h-8 sm:w-11 sm:h-11 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden shrink-0">
                                {(() => {
                                    const channel = channels.find(c => c.id === taskData.channelId);
                                    if (channel?.logoUrl) {
                                        return <img src={channel.logoUrl} alt={channel.name} className="w-full h-full object-cover" />;
                                    }
                                    return (
                                        <div className="w-full h-full flex items-center justify-center text-[12px] font-bold text-white uppercase" style={{ backgroundColor: channel?.color || '#cbd5e1' }}>
                                            {channel?.name?.charAt(0) || 'C'}
                                        </div>
                                    );
                                })()}
                            </div>
                        )}

                        <h2 className={`text-lg sm:text-2xl font-bold tracking-tight flex items-center gap-2 text-slate-800 transition-colors truncate`}>
                            {viewMode === 'DETAILS' ? (
                                 taskData ? (taskData.title || 'แก้ไขงาน') : (activeTab === 'CONTENT' ? '🎬 สร้างคอนเทนต์ใหม่' : '⚡ สร้างภารกิจใหม่')
                            ) : (
                                <span className={`flex items-center gap-2 text-${themeColor}-600 truncate`}>
                                    {React.createElement(currentTheme.icon, { className: "w-5 h-5 sm:w-6 sm:h-6 shrink-0" })}
                                    {currentTheme.label}
                                    {isLoadingDetails && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
                                </span>
                            )}
                        </h2>

                        {viewMode === 'DETAILS' && taskData && (
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={handleCopyTitle}
                                className={`
                                    p-1.5 sm:p-2 rounded-xl transition-all border shrink-0
                                    ${isCopied 
                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-500' 
                                        : `bg-white border-${themeColor}-100 text-${themeColor}-300 hover:text-${themeColor}-500 hover:bg-${themeColor}-50 hover:border-${themeColor}-200`}
                                `}
                                title="Copy Title"
                            >
                                {isCopied ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                            </motion.button>
                        )}
                    </div>
                    
                    {/* Meta Badge */}
                    {viewMode === 'DETAILS' && (
                        <div className="flex items-center gap-3 mt-1.5 sm:mt-2">
                             <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                whileHover={{ scale: 1.05 }}
                                className={`
                                    flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-black tracking-widest uppercase border-2 shadow-sm relative overflow-hidden
                                    ${activeTab === 'CONTENT' 
                                        ? 'bg-white border-indigo-200 text-indigo-600 shadow-indigo-100/50' 
                                        : 'bg-white border-emerald-200 text-emerald-600 shadow-emerald-100/50'
                                    }
                                `}
                            >
                                <div className={`
                                    flex items-center justify-center w-4 h-4 rounded-full text-white shrink-0
                                    ${activeTab === 'CONTENT' ? 'bg-indigo-500' : 'bg-emerald-500'}
                                `}>
                                    {activeTab === 'CONTENT' ? <Film className="w-2.5 h-2.5" /> : <ActivityIcon className="w-2.5 h-2.5" />}
                                </div>
                                <span className="relative z-10">{activeTab}</span>
                                
                                {/* Ambient Glow for Content */}
                                {activeTab === 'CONTENT' && (
                                    <motion.div 
                                        animate={{ opacity: [0.3, 0.6, 0.3] }}
                                        transition={{ repeat: Infinity, duration: 3 }}
                                        className="absolute inset-0 bg-indigo-100/50 blur-sm -z-0"
                                    />
                                )}
                            </motion.div>

                                
                            {/* Status Badge for TASK type */}
                            {taskData && activeTab === 'TASK' && (
                                <motion.div
                                    initial={{ x: -10, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    className={`
                                        flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] sm:text-[10px] font-black tracking-widest uppercase border shadow-sm
                                        ${(() => {
                                            const s = (taskData.status || '').toUpperCase();
                                            if (s.includes('DONE')) return 'bg-emerald-50 border-emerald-200 text-emerald-600';
                                            if (s.includes('DOING') || s.includes('PROGRESS')) return 'bg-blue-50 border-blue-200 text-blue-600';
                                            if (s.includes('WAITING') || s.includes('HOLD')) return 'bg-amber-50 border-amber-200 text-amber-600';
                                            return 'bg-slate-50 border-slate-200 text-slate-500';
                                        })()}
                                    `}
                                >
                                    <div className={`
                                        w-1.5 h-1.5 rounded-full animate-pulse
                                        ${(() => {
                                            const s = (taskData.status || '').toUpperCase();
                                            if (s.includes('DONE')) return 'bg-emerald-500';
                                            if (s.includes('DOING') || s.includes('PROGRESS')) return 'bg-blue-500';
                                            if (s.includes('WAITING') || s.includes('HOLD')) return 'bg-amber-500';
                                            return 'bg-slate-400';
                                        })()}
                                    `} />
                                    {taskData.status || 'TODO'}
                                </motion.div>
                            )}

                            {/* Status Badge for CONTENT type */}
                            {taskData && activeTab === 'CONTENT' && contentStatusInfo && (
                                <motion.div
                                    initial={{ x: -10, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    className={`
                                        flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] sm:text-[10px] font-bold tracking-widest uppercase border shadow-sm
                                        ${contentStatusInfo.bgClass}
                                    `}
                                >
                                     <div className={`
                                        w-1.5 h-1.5 rounded-full animate-pulse
                                        ${contentStatusInfo.dotClass}
                                    `} />
                                    {contentStatusInfo.label}
                                </motion.div>
                            )}

                            {isLoadingDetails && (
                                <div className="flex items-center gap-1.5 p-1 px-2 bg-indigo-50/50 rounded-lg text-[9px] text-indigo-500 font-black tracking-widest uppercase border border-indigo-100/50">
                                    <Loader2 className="w-3 h-3 animate-spin"/> Syncing
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            
            <button 
                onClick={onClose} 
                className={`p-1.5 sm:p-2 rounded-full transition-all border border-transparent hover:rotate-90 bg-white/50 text-slate-400 hover:text-${themeColor}-500 hover:bg-white shrink-0`}
            >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
        </div>
    );
};

export default TaskModalHeader;
