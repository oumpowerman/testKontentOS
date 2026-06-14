import React from 'react';
import { motion } from 'framer-motion';
import { Film, FileEdit, LayoutGrid, FileText, CheckCircle2, Info, ArrowRight, Loader2, Trash2, MapPin, Clock, AlertTriangle, Calendar } from 'lucide-react';
import { MergedQueueItem } from './types';
import { Channel, Task, ScriptSummary, MasterOption } from '../../../../types';

interface QueueItemCardProps {
    item: MergedQueueItem;
    sequenceNumber: number;
    channel?: Channel;
    masterOptions: MasterOption[];
    isFinished: boolean;
    isProcessing: boolean;
    onEditContent: (task: Task) => void;
    onEditScript?: (scriptId: string) => void;
    onToggleFinished: (item: MergedQueueItem) => void;
    onMarkAsDone: (item: MergedQueueItem) => void;
    onRemove: (item: MergedQueueItem) => void;
    onOpenPlanning: (item: MergedQueueItem) => void;
}

const QueueItemCard: React.FC<QueueItemCardProps> = ({
    item,
    sequenceNumber,
    channel,
    masterOptions,
    isFinished,
    isProcessing,
    onEditContent,
    onEditScript,
    onToggleFinished,
    onMarkAsDone,
    onRemove,
    onOpenPlanning
}) => {
    const getStatusInfo = (statusKey: string) => {
        const option = masterOptions.find(opt => opt.key === statusKey);
        return {
            label: option?.label || statusKey,
            color: option?.color || 'bg-gray-100 text-gray-600'
        };
    };

    const statusInfo = getStatusInfo(item.status);
    const isContent = item.type === 'CONTENT';

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative"
        >
            {/* Sequence Number Badge - Popping Out (Now outside overflow-hidden) */}
            <div className={`
                absolute -top-3 -left-3 z-30 px-3.5 py-1.5 rounded-2xl 
                text-[11px] font-black text-white shadow-xl border-4 border-white
                transition-transform group-hover:scale-110 group-hover:-rotate-3
                ${isContent ? 'bg-amber-500 shadow-amber-200' : 'bg-blue-500 shadow-blue-200'}
            `}>
                {String(sequenceNumber).padStart(2, '0')}
            </div>

            <div
                onClick={() => {
                    if (item.type === 'CONTENT') onEditContent(item.item as Task);
                    else if (onEditScript) onEditScript(item.id);
                }}
                className={`
                    group bg-white rounded-[2.5rem] border-2 transition-all flex flex-col cursor-pointer overflow-hidden
                    ${isContent 
                        ? 'border-amber-100 hover:border-amber-300 shadow-amber-50' 
                        : 'border-blue-100 hover:border-blue-300 shadow-blue-50'}
                    ${isFinished ? 'opacity-60 grayscale-[0.5]' : 'shadow-sm hover:shadow-md hover:-translate-y-1'}
                `}
            >
                {/* Type Indicator Bar */}
                <div className={`h-1.5 w-full ${isContent ? 'bg-amber-400' : 'bg-blue-400'}`} />

            <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                        {isContent ? (
                            <div className="px-2 py-1 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-bold border border-amber-100 flex items-center gap-1">
                                <Film className="w-3 h-3" />
                                CONTENT STOCK (CLIP)
                            </div>
                        ) : (
                            <div className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold border border-blue-100 flex items-center gap-1">
                                <FileEdit className="w-3 h-3" />
                                SCRIPT HUB
                            </div>
                        )}
                        {item.scriptId && (
                            <div className="px-2 py-1 bg-green-50 text-green-600 rounded-lg text-[10px] font-bold border border-green-100 flex items-center gap-1" title="มีสคริปต์ผูกอยู่">
                                <CheckCircle2 className="w-3 h-3" />
                                LINKED
                            </div>
                        )}
                    </div>
                    {channel && (
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-full border border-gray-100">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: channel.color.split(' ')[0].replace('bg-', '') }} />
                            <span className="text-[10px] font-bold text-gray-600">{channel.name}</span>
                        </div>
                    )}
                </div>

                <div className="flex justify-between items-start mb-1">
                    <h4 className={`text-md font-bold text-gray-800 line-clamp-2 transition-colors ${isContent ? 'group-hover:text-amber-600' : 'group-hover:text-blue-600'} ${isFinished ? 'line-through decoration-indigo-500 decoration-2' : ''}`}>
                        {item.title}
                    </h4>
                    {item.scriptId && onEditScript && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onEditScript(item.scriptId!);
                            }}
                            className="p-1.5 bg-teal-50 text-teal-600 rounded-lg hover:bg-teal-100 transition-all border border-teal-100/50 shrink-0 ml-2"
                            title="ไปหน้าแก้บทสคริปต์"
                        >
                            <FileText className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Shoot Plan Summary */}
                {item.shootLocation || item.shootTimeStart ? (
                    <div className={`mb-4 p-4 rounded-2xl space-y-3 transition-all ${isContent ? 'bg-amber-50/50 border border-amber-100' : 'bg-blue-50/50 border border-blue-100'}`}>
                        {item.shootLocation && (
                            <div className="flex items-center gap-2.5">
                                <div className={`p-1.5 rounded-lg ${isContent ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                                    <MapPin className="w-3.5 h-3.5" />
                                </div>
                                <span className="text-xs font-black text-slate-700 leading-tight line-clamp-1">{item.shootLocation}</span>
                            </div>
                        )}
                        {item.shootTimeStart && (
                            <div className="flex items-center gap-2.5">
                                <div className={`p-1.5 rounded-lg ${isContent ? 'bg-indigo-100 text-indigo-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                    <Clock className="w-3.5 h-3.5" />
                                </div>
                                <span className="text-[13px] font-black text-indigo-700">
                                    {item.shootTimeStart} {item.shootTimeEnd ? `— ${item.shootTimeEnd}` : ''}
                                </span>
                            </div>
                        )}
                        {item.shootNotes && (
                            <div className="flex items-start gap-2.5 bg-white/60 p-2.5 rounded-xl border border-white">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                                <span className="text-[10px] font-bold text-slate-600 leading-relaxed italic">{item.shootNotes}</span>
                            </div>
                        )}
                    </div>
                ) : (
                    <div 
                        onClick={(e) => {
                            e.stopPropagation();
                            onOpenPlanning(item);
                        }}
                        className="mb-4 p-4 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 hover:bg-slate-100 hover:border-indigo-300 transition-all group/plan"
                    >
                        <Calendar className="w-6 h-6 text-slate-300 group-hover/plan:text-indigo-400 group-hover/plan:scale-110 transition-all" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover/plan:text-indigo-600 transition-colors">ยังไม่ได้ระบุตารางถ่ายทำ</span>
                    </div>
                )}
                
                <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${statusInfo.color}`}>
                        {statusInfo.label}
                    </span>
                    {item.type === 'SCRIPT' && (item.item as ScriptSummary).estimatedDuration > 0 && (
                        <span className="flex items-center gap-1">
                            <Info className="w-3 h-3" />
                            ~{(item.item as ScriptSummary).estimatedDuration} นาที
                        </span>
                    )}
                    {item.type === 'CONTENT' && (item.item as Task).estimatedHours && (item.item as Task).estimatedHours! > 0 && (
                        <span className="flex items-center gap-1">
                            <Info className="w-3 h-3" />
                            ~{(item.item as Task).estimatedHours} ชม.
                        </span>
                    )}
                </div>
            </div>

            <div className="px-5 py-4 bg-gray-50/50 border-t border-gray-100 rounded-b-[2.5rem] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemove(item);
                        }}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="นำออกจากคิวถ่ายทำ"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    {!isFinished && (
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                onOpenPlanning(item);
                            }}
                            className="p-2.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl transition-all border border-indigo-100 shadow-sm"
                            title="จัดตารางถ่ายทำ"
                        >
                            <Calendar className="w-4 h-4" />
                        </button>
                    )}
                </div>

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        isFinished ? onToggleFinished(item) : onMarkAsDone(item);
                    }}
                    disabled={isProcessing}
                    className={`
                        flex items-center gap-2 px-4 py-2 rounded-xl
                        font-bold text-xs transition-all
                        ${isProcessing 
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                            : isFinished
                                ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                : 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 active:scale-95'}
                    `}
                >
                    {isProcessing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : isFinished ? (
                        <>
                            <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                            ยกเลิก
                        </>
                    ) : (
                        <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            ถ่ายเสร็จแล้ว
                        </>
                    )}
                </button>
            </div>
            </div>
        </motion.div>
    );
};

export default QueueItemCard;
