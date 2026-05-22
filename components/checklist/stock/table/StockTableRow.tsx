
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Package, ClipboardList, Tag, FileText, MoreHorizontal, CalendarPlus, Inbox, Video, BarChart3, AlertCircle, Zap } from 'lucide-react';
import { format, differenceInDays, startOfToday } from 'date-fns';
import th from 'date-fns/locale/th';
import { Task, Channel, User, MasterOption } from '../../../../types';
import { ColumnKey } from './StockTableSettings';
import { useGlobalDialog } from '../../../../context/GlobalDialogContext';
import { isStockTerminalStatus } from '../../../../config/status';

interface StockTableRowProps {
    task: Task;
    channel: Channel | null;
    statusInfo: { label: string; color: string };
    visibleColumns: ColumnKey[];
    columnOrder: ColumnKey[];
    columnWidths: Record<string, number>;
    statusProgress: number; // 0-100
    isInWorkbox?: boolean;
    renderUserAvatars: (userIds: string[] | undefined) => React.ReactNode;
    formatDateDisplay: (date: Date | undefined, type: 'PUBLISH' | 'SHOOT') => React.ReactNode;
    onEdit: (task: Task) => void;
    onSchedule: (task: Task) => void;
    onToggleQueue?: (id: string, currentStatus: boolean) => void;
    onAddToWorkbox?: (task: Task) => void;
    onEditScript?: (scriptId: string) => void;
    onOpenAnalytics?: (task: Task) => void;
    setIsDragging: (value: boolean) => void;
    getFormatLabel: (key?: string) => string;
    getPillarLabel: (key?: string) => string;
    getCategoryLabel: (key?: string) => string;
}

const StockTableRow = React.memo(React.forwardRef<HTMLTableRowElement, StockTableRowProps>(({
    task,
    channel,
    statusInfo,
    visibleColumns,
    columnOrder,
    columnWidths,
    statusProgress,
    isInWorkbox = false,
    renderUserAvatars,
    formatDateDisplay,
    onEdit,
    onSchedule,
    onToggleQueue,
    onAddToWorkbox,
    onEditScript,
    onOpenAnalytics,
    setIsDragging,
    getFormatLabel,
    getPillarLabel,
    getCategoryLabel
}, ref) => {
    const { showConfirm } = useGlobalDialog();
    const channelStyle = channel ? channel.color : 'bg-gray-100 text-gray-500 border-gray-200';

    const isInsightOverdue = useMemo(() => {
        const isTerminal = isStockTerminalStatus(task.status);
            
        // Must be explicitly scheduled (not in stock), terminal status, incomplete analytics (not COMPLETE), and > 7 days old
        if (task.type !== 'CONTENT' || task.isUnscheduled || !isTerminal || !task.endDate || task.analyticsStatus === 'COMPLETE') return false;
            
        const endDateObj = task.endDate instanceof Date ? task.endDate : new Date(task.endDate);
        const daysSincePublish = differenceInDays(startOfToday(), endDateObj);
        return daysSincePublish >= 7;
    }, [task.type, task.status, task.endDate, task.isUnscheduled, task.analyticsStatus]);

    const handleDragStart = (e: React.DragEvent) => {
        setIsDragging(true);
        const dragData = {
            title: task.title,
            content_id: task.id,
            type: 'CONTENT',
            description: task.description || task.remark || ''
        };
        e.dataTransfer.setData('application/json', JSON.stringify(dragData));
        e.dataTransfer.effectAllowed = 'copy';
    };

    return (
        <motion.tr 
            ref={ref}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            onClick={() => onEdit(task)} 
            draggable
            onDragStartCapture={handleDragStart}
            onDragEndCapture={() => setIsDragging(false)}
            className={`transition-colors group cursor-pointer relative cursor-grab active:cursor-grabbing border-b border-gray-50 ${
                task.isInShootQueue 
                    ? 'bg-[#f5f7ff] hover:bg-[#ebf0ff]' 
                    : 'hover:bg-indigo-50'
            }`}
        >
            {/* 1. Title (Fixed) */}
            <td 
                className={`px-6 py-5 sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] align-top border-r border-gray-100 transition-colors overflow-hidden ${
                    task.isInShootQueue ? 'bg-[#f5f7ff] group-hover:bg-[#ebf0ff]' : 'bg-white group-hover:bg-indigo-50'
                }`}
                style={{ width: columnWidths['title'] || 350 }}
            >
                <div className="relative">
                    <div className="flex items-start gap-2 mb-2">
                        {task.isInShootQueue && (
                            <motion.div 
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="flex-shrink-0"
                            >
                                <span className="flex items-center gap-1 px-1.5 py-0.5 bg-indigo-50 text-indigo-500 border border-indigo-100 text-[8px] font-black rounded-md shadow-sm animate-pulse uppercase tracking-wider">
                                    <Video className="w-2 h-2 fill-current" />
                                    IN QUEUE
                                </span>
                            </motion.div>
                        )}
                        <div className={`font-medium font-kanit text-[18px] group-hover:text-indigo-700 line-clamp-2 text-sm leading-snug ${task.isInShootQueue ? 'text-indigo-600' : 'text-gray-800'}`} title={task.title}>
                            {task.title}
                        </div>
                        {task.hasAnalytics && (
                             <motion.div 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                whileHover={{ scale: 1.2, rotate: 15 }}
                                className="shrink-0 flex items-center justify-center w-5 h-5 bg-purple-100 rounded-full border border-purple-200"
                                title="Performance Data Entry Complete ✨"
                            >
                                <Zap className="w-2.5 h-2.5 text-purple-600 fill-purple-600" />
                            </motion.div>
                        )}
                        {isInsightOverdue && (
                            <motion.div 
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="flex-shrink-0"
                            >
                                <span className="flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-500 border border-rose-100 text-[8px] font-black rounded-md shadow-sm animate-bounce italic uppercase tracking-wider">
                                    <AlertCircle className="w-2.5 h-2.5" />
                                    MISSING INSIGHT
                                </span>
                            </motion.div>
                        )}
                    </div>
                    {/* Subtle fade for long text */}
                    <div className={`absolute bottom-2 right-0 w-12 h-4 bg-gradient-to-r from-transparent pointer-events-none ${
                        task.isInShootQueue ? 'to-indigo-50 group-hover:to-indigo-100' : 'to-white group-hover:to-indigo-50'
                    }`} />
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                    {channel ? (
                        <div 
                            className="flex items-center justify-center p-0.5 rounded-full bg-white border border-slate-100 shadow-sm hover:border-indigo-200 transition-colors"
                            title={channel.name}
                        >
                            {channel.logoUrl ? (
                                <img src={channel.logoUrl} alt={channel.name} className="w-6 h-6 rounded-full object-cover shadow-sm" referrerPolicy="no-referrer" />
                            ) : (
                                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm" style={{ backgroundColor: channel.color || '#6366f1' }}>
                                    {channel.name.charAt(0)}
                                </div>
                            )}
                        </div>
                    ) : (
                        <span className="text-[9px] px-2 py-0.5 rounded-full border border-slate-100 text-slate-400 uppercase tracking-tight">-</span>
                    )}
                    {task.contentFormats && task.contentFormats.length > 0 ? (
                        <div className="flex items-center gap-1">
                            <span className="text-[9px] text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100 font-bold flex items-center">
                                {getFormatLabel(task.contentFormats[0])}
                            </span>
                            {task.contentFormats.length > 1 && (
                                <div className="relative group/tooltip">
                                    <motion.span 
                                        whileHover={{ scale: 1.2, rotate: [0, -10, 10, -10, 0] }}
                                        transition={{ 
                                            scale: { type: "spring", stiffness: 400, damping: 10 },
                                            rotate: { duration: 0.4, ease: "easeInOut" }
                                        }}
                                        className="text-[9px] text-purple-500 bg-purple-100/50 px-2 py-0.5 rounded-full border border-purple-200 font-bold cursor-help flex items-center justify-center"
                                    >
                                        +{task.contentFormats.length - 1}
                                    </motion.span>
                                    
                                    {/* Custom Animated Tooltip */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-all duration-300 translate-y-2 group-hover/tooltip:translate-y-0 z-50">
                                        <div className="bg-white/90 backdrop-blur-xl text-purple-900 text-[10px] font-bold px-3 py-2 rounded-2xl shadow-2xl shadow-purple-200/50 border border-purple-100 flex flex-col gap-1.5 min-w-max">
                                            <div className="text-[8px] text-purple-500 uppercase tracking-widest mb-0.5 opacity-70">Format อื่นๆ</div>
                                            {task.contentFormats.slice(1).map(f => (
                                                <div key={f} className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.4)]" />
                                                    {getFormatLabel(f)}
                                                </div>
                                            ))}
                                            {/* Arrow */}
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-[6px] border-transparent border-t-white/90" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        null
                    )}
                    {task.pillar && <span className="text-[9px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 font-bold flex items-center">{getPillarLabel(task.pillar)}</span>}
                    {task.category && <span className="text-[9px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100 font-bold flex items-center"><Tag className="w-2.5 h-2.5 mr-1 opacity-50" />{getCategoryLabel(task.category)}</span>}
                    {task.tags && task.tags.length > 0 && (
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            {task.tags.slice(0, 2).map((tag) => (
                                <span 
                                    key={tag} 
                                    className="text-[9px] text-indigo-600 bg-indigo-50/60 hover:bg-indigo-100/70 px-2 py-0.5 rounded-full border border-indigo-100/60 font-black transition-colors"
                                >
                                    #{tag}
                                </span>
                            ))}
                            {task.tags.length > 2 && (
                                <div className="relative group/tag-tooltip">
                                    <motion.span 
                                        whileHover={{ scale: 1.15 }}
                                        className="text-[9px] text-indigo-500 bg-indigo-100/40 px-1.5 py-0.5 rounded-full border border-indigo-200 font-extrabold cursor-help flex items-center justify-center transition-all"
                                    >
                                        +{task.tags.length - 2}
                                    </motion.span>
                                    
                                    {/* Custom Animated Tooltip */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover/tag-tooltip:opacity-100 pointer-events-none transition-all duration-300 translate-y-2 group-hover/tag-tooltip:translate-y-0 z-50">
                                        <div className="bg-white/95 backdrop-blur-xl text-indigo-900 text-[10px] font-bold px-3 py-2 rounded-2xl shadow-xl border border-indigo-100 flex flex-col gap-1.5 min-w-max">
                                            <div className="text-[8px] text-indigo-400 uppercase tracking-widest mb-0.5 opacity-80">แท็กทั้งหมด</div>
                                            {task.tags.slice(2).map(t => (
                                                <div key={t} className="flex items-center gap-1.5 text-indigo-700 font-extrabold">
                                                    <span className="text-indigo-400">#</span>
                                                    {t}
                                                </div>
                                            ))}
                                            {/* Arrow */}
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-[6px] border-transparent border-t-white" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </td>

            {/* Dynamic Columns */}
            {columnOrder.map((key) => {
                if (!visibleColumns.includes(key)) return null;
                const width = columnWidths[key] || 150;

                switch (key) {
                    case 'shortNote':
                        return (
                            <td key={key} className="px-4 py-5 align-top hidden md:table-cell" style={{ width }}>
                                <div className="flex items-start gap-2">
                                    <FileText className="w-3.5 h-3.5 text-slate-300 mt-0.5 flex-shrink-0" />
                                    <p className="text-[11px] text-slate-500 line-clamp-3 leading-relaxed italic">
                                        {task.description || task.remark || 'ไม่มีรายละเอียดเพิ่มเติม...'}
                                    </p>
                                </div>
                            </td>
                        );
                    case 'status':
                        const bgClass = statusInfo.color.split(' ').find(c => c.startsWith('bg-')) || 'bg-gray-200';
                        const textClass = statusInfo.color.split(' ').find(c => c.startsWith('text-')) || 'text-gray-700';
                        
                        return (
                            <td key={key} className="px-4 py-5 text-center align-middle hidden md:table-cell" style={{ width }}>
                                <div className="relative w-full h-7 bg-gray-100 rounded-full overflow-hidden border border-gray-200 shadow-inner group/status">
                                    {/* Progress Fill */}
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${statusProgress}%` }}
                                        transition={{ duration: 0.8, ease: "easeOut" }}
                                        className={`absolute inset-y-0 left-0 ${bgClass} `}
                                    />
                                    


                                    {/* Status Label */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className={`text-[9px] font-bold uppercase tracking-[0.15em] drop-shadow-sm ${textClass}`}>
                                            {statusInfo.label}
                                        </span>
                                    </div>

                                    {/* Percentage Tooltip on Hover */}
                                    <div className="absolute inset-0 opacity-0 group-hover/status:opacity-100 transition-opacity bg-white/40 backdrop-blur-[1px] flex items-center justify-center">
                                        <span className="text-[10px] font-bold text-indigo-600">{statusProgress}%</span>
                                    </div>
                                </div>
                            </td>
                        );
                    case 'publishDate':
                        return (
                            <td key={key} className="px-4 py-5 text-center align-middle whitespace-nowrap hidden md:table-cell" style={{ width }}>
                                {task.isUnscheduled ? (
                                    <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-1 rounded-lg font-bold uppercase tracking-tighter">Unscheduled</span>
                                ) : (
                                    <div className="flex flex-col items-center">
                                        {formatDateDisplay(task.endDate, 'PUBLISH')}
                                    </div>
                                )}
                            </td>
                        );
                    case 'shootDate':
                        return (
                            <td key={key} className="px-4 py-5 text-center align-middle whitespace-nowrap hidden md:table-cell" style={{ width }}>
                                {task.shootDate ? (
                                    <div className="flex flex-col items-center">
                                        <div className="flex items-center gap-1 text-[10px] text-indigo-500 font-bold bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100">
                                            <Video className="w-3 h-3" />
                                            {format(new Date(task.shootDate), 'd MMM yy', { locale: th })}
                                        </div>
                                    </div>
                                ) : (
                                    <span className="text-gray-300 text-xs">-</span>
                                )}
                            </td>
                        );
                    case 'ideaOwner':
                        return <td key={key} className="px-2 py-5 text-center align-middle hidden md:table-cell" style={{ width }}>{renderUserAvatars(task.ideaOwnerIds)}</td>;
                    case 'editor':
                        return <td key={key} className="px-2 py-5 text-center align-middle hidden md:table-cell" style={{ width }}>{renderUserAvatars(task.editorIds)}</td>;
                    case 'helper':
                        return <td key={key} className="px-2 py-5 text-center align-middle hidden md:table-cell" style={{ width }}>{renderUserAvatars(task.assigneeIds)}</td>;
                    default:
                        return null;
                }
            })}

            {/* 7. Actions (Fixed) */}
            <td className={`px-4 py-5 text-right sticky right-0 z-10 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)] align-middle border-l border-gray-100 transition-colors hidden lg:table-cell ${
                task.isInShootQueue ? 'bg-[#f5f7ff] group-hover:bg-[#ebf0ff]' : 'bg-white group-hover:bg-indigo-50'
            }`}>
                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onToggleQueue && (
                        <button 
                            onClick={async (e) => { 
                                e.stopPropagation(); 
                                if (!task.isInShootQueue) {
                                    const confirmed = await showConfirm(
                                        `คุณต้องการเพิ่ม "${task.title}" เข้าสู่คิวถ่ายใช่หรือไม่?`,
                                        "ยืนยันการเพิ่มเข้าคิวถ่าย"
                                    );
                                    if (!confirmed) return;
                                }
                                onToggleQueue(task.id, task.isInShootQueue || false); 
                            }} 
                            className={`p-2 rounded-xl transition-all shadow-sm ${
                                task.isInShootQueue 
                                    ? 'text-indigo-600 bg-indigo-50 border border-indigo-100' 
                                    : 'text-gray-400 hover:text-indigo-600 hover:bg-white'
                            }`}
                            title={task.isInShootQueue ? "เอาออกจากคิวถ่าย" : "เพิ่มเข้าคิวถ่าย"}
                        >
                            <Video className={`w-4 h-4 ${task.isInShootQueue ? 'fill-current' : ''}`} />
                        </button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); onEdit(task); }} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all shadow-sm">
                        <MoreHorizontal className="w-4 h-4" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onSchedule(task); }} className="p-2 text-gray-400 hover:text-green-600 hover:bg-white rounded-xl transition-all shadow-sm" title="ลงตาราง">
                        <CalendarPlus className="w-4 h-4" />
                    </button>
                    {onOpenAnalytics && (
                        <button 
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                onOpenAnalytics(task); 
                            }} 
                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all shadow-sm"
                            title="สถิติคอนเทนต์"
                        >
                            <BarChart3 className="w-4 h-4" />
                        </button>
                    )}
                    {onAddToWorkbox && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onAddToWorkbox(task); }} 
                            className={`p-2 rounded-xl transition-all shadow-sm ${
                                isInWorkbox 
                                    ? 'text-amber-600 bg-amber-50 border border-amber-100' 
                                    : 'text-gray-400 hover:text-amber-600 hover:bg-white'
                            }`}
                            title={isInWorkbox ? "อยู่ใน WorkBox แล้ว" : "เก็บเข้า WorkBox"}
                        >
                            <Inbox className={`w-4 h-4 ${isInWorkbox ? 'fill-current' : ''}`} />
                        </button>
                    )}
                </div>
            </td>
        </motion.tr>
    );
}));

export default StockTableRow;
