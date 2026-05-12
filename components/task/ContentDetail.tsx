
import React from 'react';
import { 
    FileText,
    Activity
} from 'lucide-react';
import { Task, User, Channel } from '../../types';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import SingleContentInsight from '../analytics/SingleContentInsight';
import ContentDetailHeader from './detail/ContentDetailHeader';
import ContentInfoView from './detail/ContentInfoView';

interface ContentDetailProps {
    task: Task;
    users: User[];
    channels: Channel[];
    onEdit: () => void;
    onDelete?: () => void;
    onClose: () => void;
    initialTab?: 'CONTENT' | 'INSIGHT';
}

const ContentDetail: React.FC<ContentDetailProps> = ({ 
    task, users, channels, onEdit, onDelete, onClose, initialTab = 'CONTENT'
}) => {
    const [isHeaderExpanded, setIsHeaderExpanded] = React.useState(false);
    const [activeTab, setActiveTab] = React.useState<'CONTENT' | 'INSIGHT'>(initialTab);

    const containerVariants = {
        hidden: { opacity: 0, y: 15 },
        visible: { 
            opacity: 1, 
            y: 0,
        },
        exit: { 
            opacity: 0,
            transition: { duration: 0.4, ease: "easeIn" as const }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ 
                duration: 0.5,
                ease: "easeOut",
                staggerChildren: 0.1 
            }}
            className="flex flex-col h-full bg-[#FCFDFE] text-slate-700"
        >
            {/* --- COMPRESSIBLE HEADER --- */}
            <motion.div variants={itemVariants}>
                <ContentDetailHeader 
                    task={task}
                    users={users}
                    channels={channels}
                    isExpanded={isHeaderExpanded}
                    onToggleExpand={setIsHeaderExpanded}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
            </motion.div>

            {/* --- TAB SELECTOR --- */}
            <motion.div 
                variants={itemVariants}
                className="px-10 pt-4 pb-0 bg-[#FCFDFE] sticky top-[46px] z-30"
            >
                <div className="flex items-center gap-1 bg-slate-100/50 p-1 rounded-2xl border border-slate-200/40 w-fit">
                    <button 
                        onClick={() => setActiveTab('CONTENT')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all duration-300 ${activeTab === 'CONTENT' ? 'bg-white text-indigo-600 shadow-md ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                        title="Content Detail"
                    >
                        <FileText className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={() => setActiveTab('INSIGHT')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all duration-300 ${activeTab === 'INSIGHT' ? 'bg-white text-indigo-600 shadow-md ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                        title="Performance Insight"
                    >
                        <Activity className="w-5 h-5" />
                    </button>
                </div>
            </motion.div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-10 space-y-6 sm:space-y-10 scrollbar-hide">
                <AnimatePresence mode="wait">
                    {activeTab === 'CONTENT' ? (
                        <div key="content-tab">
                            <ContentInfoView task={task} users={users} />
                        </div>
                    ) : (
                        <motion.div
                            key="insight-tab"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-10"
                        >
                            <SingleContentInsight task={task} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* --- MINIMAL FOOTER --- */}
            <div className="px-5 sm:px-10 py-3 sm:py-6 bg-white border-t border-slate-50 flex flex-col sm:flex-row gap-4 sm:gap-6 justify-between items-center shrink-0">
                <div className="flex items-center gap-4 sm:gap-8 overflow-x-auto w-full sm:w-auto scrollbar-none pb-1 sm:pb-0">
                    {task.createdAt && (
                        <div className="flex flex-col shrink-0">
                            <span className="text-[7.5px] sm:text-[9px] font-semibold text-slate-300 uppercase tracking-widest mb-0.5">Created At</span>
                            <span className="text-[9px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-tighter sm:tracking-normal">
                                {format(new Date(task.createdAt), 'd MMM yy, HH:mm', { locale: th })}
                            </span>
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
