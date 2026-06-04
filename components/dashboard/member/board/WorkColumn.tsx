
import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Task, User, MasterOption } from '../../../../types';
import { Backpack, Play, Coffee, CheckCircle2, Zap } from 'lucide-react';
import WorkCard from './WorkCard';

type ColumnType = 'TODO' | 'DOING' | 'WAITING' | 'DONE';

interface WorkColumnProps {
    type: ColumnType;
    tasks: Task[];
    users: User[];
    masterOptions: MasterOption[]; // Add Prop
    isDroppable: boolean;
    onDropTask: (taskId: string, targetType: ColumnType) => void;
    onOpenTask: (task: Task) => void;
    onDeleteTask?: (taskId: string) => void;
    onViewAll?: () => void;
    isUltimate?: boolean;
}

const WorkColumn: React.FC<WorkColumnProps> = ({ 
    type, tasks, users, masterOptions, isDroppable, onDropTask, onOpenTask, onDeleteTask, onViewAll, isUltimate = false
}) => {
    
    // Header Config
    const headerConfig = {
        'TODO': { 
            icon: <Backpack className="w-4 h-4" />, 
            title: "รอทำ (To Do)", 
            bg: "bg-slate-500/10", 
            text: "text-slate-600", 
            border: "border-slate-200/50",
            accent: "bg-slate-500"
        },
        'DOING': { 
            icon: <Play className="w-4 h-4" />, 
            title: "ลุยงาน (Doing)", 
            bg: "bg-indigo-500/10", 
            text: "text-indigo-600", 
            border: "border-indigo-200/50",
            accent: "bg-indigo-500"
        },
        'WAITING': { 
            icon: <Coffee className="w-4 h-4" />, 
            title: "รอตรวจ (Waiting)", 
            bg: "bg-amber-500/10", 
            text: "text-amber-600", 
            border: "border-amber-200/50",
            accent: "bg-amber-500"
        },
        'DONE': { 
            icon: <CheckCircle2 className="w-4 h-4" />, 
            title: "เสร็จแล้ว (Done)", 
            bg: "bg-emerald-500/10", 
            text: "text-emerald-600", 
            border: "border-emerald-200/50",
            accent: "bg-emerald-500"
        }
    }[type];

    const handleDragOver = (e: React.DragEvent) => {
        if (isDroppable) {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        if (!isDroppable) return;
        e.preventDefault();
        const taskId = e.dataTransfer.getData("text/plain");
        if (taskId) {
            onDropTask(taskId, type);
        }
    };

    const renderEmptyState = () => {
        const style = "text-center py-12 text-[14px] font-kanit font-medium border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center gap-3 h-full min-h-[180px] transition-all duration-300";
        
        const content = (() => {
            if (type === 'TODO') return (
                <>
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100">
                        <Backpack className="w-5 h-5 opacity-40" />
                    </div>
                    <span className="uppercase tracking-widest">ไม่มีงานค้าง</span>
                </>
            );
            if (type === 'DOING') return (
                <>
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-indigo-100">
                        <Zap className="w-5 h-5 opacity-40 animate-pulse" />
                    </div>
                    <span className="uppercase tracking-widest">ลากงานมาวางเพื่อเริ่ม!</span>
                </>
            );
            if (type === 'WAITING') return (
                <>
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-amber-100">
                        <Coffee className="w-5 h-5 opacity-40" />
                    </div>
                    <span className="uppercase tracking-widest">ไม่มีงานรอตรวจ</span>
                </>
            );
            return (
                <>
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-emerald-100">
                        <CheckCircle2 className="w-5 h-5 opacity-40" />
                    </div>
                    <span className="uppercase tracking-widest">ยังไม่มีงานที่เสร็จ</span>
                </>
            );
        })();

        const borderClass = 
            type === 'TODO' ? 'border-slate-200 text-slate-400 bg-slate-50/30' :
            type === 'DOING' ? 'border-indigo-200 text-indigo-400 bg-indigo-50/30' :
            type === 'WAITING' ? 'border-amber-200 text-amber-400 bg-amber-50/30' :
            'border-emerald-200 text-emerald-400 bg-emerald-50/30';

        return (
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`${style} ${borderClass}`}
            >
                {content}
            </motion.div>
        );
    };

    // Container Style with horizontal scroll dimensions
    let containerStyle = isUltimate
        ? "rounded-[2.5rem] p-4 flex flex-col h-full transition-all duration-300 border border-slate-800 bg-[#0f111f]/30 shadow-lg hover:shadow-indigo-950/20 w-[280px] md:w-[320px] xl:w-auto flex-shrink-0"
        : "rounded-[2.5rem] p-4 flex flex-col h-full transition-all duration-500 border border-white/40 shadow-sm hover:shadow-md w-[280px] md:w-[320px] xl:w-auto flex-shrink-0";

    if (isUltimate) {
        if (type === 'DOING') containerStyle += " bg-indigo-950/20 border-indigo-500/25 shadow-indigo-950/40";
        else if (type === 'WAITING') containerStyle += " bg-amber-950/10 border-amber-500/20";
        else if (type === 'DONE') containerStyle += " bg-emerald-950/10 border-emerald-500/20";
        else containerStyle += " bg-slate-950/30 border-slate-800";
    } else {
        if (type === 'DOING') containerStyle += " bg-white/60 backdrop-blur-md border-indigo-100/50 shadow-indigo-100/20";
        else if (type === 'WAITING') containerStyle += " bg-white/40 backdrop-blur-sm border-amber-100/50";
        else if (type === 'DONE') containerStyle += " bg-white/40 backdrop-blur-sm border-emerald-100/50";
        else containerStyle += " bg-white/40 backdrop-blur-sm border-slate-200/50";
    }

    const DISPLAY_LIMIT = 3;
    const hasMoreItems = tasks.length > DISPLAY_LIMIT;
    const badgeColor = hasMoreItems 
        ? 'bg-rose-500 text-white border-rose-400' 
        : 'bg-white text-slate-600 border-slate-100';

    return (
        <div 
            className={containerStyle}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            {/* Header */}
            <div className={`flex items-center justify-between mb-5 p-3.5 rounded-2xl border ${
                isUltimate 
                    ? 'border-indigo-500/15 bg-[#121424]/75 shadow-lg shadow-indigo-950/10' 
                    : `${headerConfig.border} ${headerConfig.bg}`
            } backdrop-blur-md shadow-sm`}>
                <div className={`flex items-center gap-2.5 text-[14px] font-kanit font-bold uppercase tracking-[0.15em] ${
                    isUltimate ? 'text-indigo-200' : headerConfig.text
                }`}>
                    <div className={`p-1.5 rounded-lg text-white ${headerConfig.accent} shadow-sm`}>
                        {headerConfig.icon}
                    </div>
                    {headerConfig.title}
                </div>
                <span className={`text-[14px] font-black px-2.5 py-1 rounded-xl shadow-sm border transition-all duration-300 ${
                    isUltimate 
                        ? (hasMoreItems ? 'bg-rose-950 text-rose-300 border-rose-800' : 'bg-slate-950 text-indigo-300 border-slate-800') 
                        : badgeColor
                }`}>
                    {tasks.length}
                </span>
            </div>

            {/* Content */}
            <div className={`flex-1 overflow-y-auto p-1.5 pt-3 pb-6 flex flex-col gap-3 relative ${isDroppable ? 'min-h-[200px]' : ''}`}>
                <AnimatePresence mode="popLayout" initial={false}>
                    {tasks.length > 0 ? (
                        tasks.slice(0, DISPLAY_LIMIT).map(task => (
                            <WorkCard 
                                key={task.id}
                                task={task}
                                users={users}
                                masterOptions={masterOptions}
                                columnType={type}
                                isDraggable={type === 'TODO' || type === 'DOING'}
                                onDragStart={(e, id) => {
                                    e.dataTransfer.setData("text/plain", id);
                                    e.dataTransfer.effectAllowed = "move";
                                }}
                                onClick={onOpenTask}
                                onDelete={onDeleteTask}
                                isUltimate={isUltimate}
                            />
                        ))
                    ) : (
                        renderEmptyState()
                    )}
                </AnimatePresence>

                {(tasks.length > DISPLAY_LIMIT || type === 'DONE') && onViewAll && (
                    <button 
                        onClick={onViewAll} 
                        className={`w-full py-3.5 text-[12px] font-black mt-2 border-t transition-all rounded-2xl uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] ${
                            type === 'WAITING' ? 'text-amber-600 hover:bg-amber-500 hover:text-white border-amber-100 bg-amber-50/50' :
                            type === 'DONE' ? 'text-emerald-600 hover:bg-emerald-500 hover:text-white border-emerald-100 bg-emerald-50/50' :
                            'text-slate-500 hover:bg-slate-500 hover:text-white border-slate-100 bg-slate-50/50'
                        }`}
                    >
                        {type === 'DONE' ? '📜 View History' : `+ View All (${tasks.length})`}
                    </button>
                )}
            </div>
        </div>
    );
};

export default WorkColumn;
