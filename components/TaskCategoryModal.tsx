
import React from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, ArrowRight, User, AlertCircle } from 'lucide-react';
import { Task, Channel, MasterOption } from '../types';
import { STATUS_COLORS, STATUS_LABELS, PLATFORM_ICONS } from '../constants';
import { format, differenceInDays } from 'date-fns';

interface TaskCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  tasks: Task[];
  channels: Channel[];
  masterOptions?: MasterOption[]; // Add masterOptions
  onEditTask: (task: Task) => void;
  colorTheme: string; // e.g., 'blue', 'green', 'red', 'orange'
}

const TaskCategoryModal: React.FC<TaskCategoryModalProps> = ({ 
  isOpen, onClose, title, tasks, channels, masterOptions = [], onEditTask, colorTheme 
}) => {
  if (!isOpen) return null;

  // Map color theme to actual styling
  const themeStyles: Record<string, { bg: string, text: string, border: string, iconBg: string }> = {
    slate: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', iconBg: 'bg-slate-100' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', iconBg: 'bg-blue-100' },
    green: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', iconBg: 'bg-emerald-100' },
    red: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', iconBg: 'bg-red-100' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', iconBg: 'bg-orange-100' },
  };

  const theme = themeStyles[colorTheme] || themeStyles['blue'];

  const getChannelInfo = (channelId: string) => {
    const channel = channels.find(c => c.id === channelId);
    if (!channel) return null;
    const platform = channel.platforms?.[0] || 'OTHER';
    const Icon = PLATFORM_ICONS[platform];
    const colorClass = (channel.color || 'bg-gray-100').split(' ')[1] || 'text-gray-500';
    return { name: channel.name, Icon, colorClass, fullColor: channel.color };
  };

  const getDueText = (date: Date) => {
      const diff = differenceInDays(date, new Date());
      if (diff < 0) return { text: `${Math.abs(diff)} วันที่แล้ว`, color: 'text-red-500' };
      if (diff === 0) return { text: 'วันนี้', color: 'text-orange-600' };
      if (diff === 1) return { text: 'พรุ่งนี้', color: 'text-indigo-600' };
      return { text: `อีก ${diff} วัน`, color: 'text-gray-500' };
  };

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border-4 border-white animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className={`px-6 py-5 border-b flex justify-between items-center ${theme.bg} ${theme.border}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${theme.iconBg} ${theme.text}`}>
                 <AlertCircle className="w-6 h-6" />
            </div>
            <div>
                <h2 className={`text-xl font-bold ${theme.text} tracking-tight`}>
                    {title}
                </h2>
                <p className="text-xs font-bold opacity-70">
                    รายการทั้งหมด {tasks.length} งาน
                </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 bg-white/50 hover:bg-white rounded-full transition-colors text-gray-500 hover:text-red-500 shadow-sm"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="p-4 overflow-y-auto bg-gray-50/50 flex-1 space-y-3">
            {tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                    <p className="font-bold">ไม่มีงานในรายการนี้ครับ</p>
                </div>
            ) : (
                tasks.map(task => {
                    const channelInfo = getChannelInfo(task.channelId || '');
                    const dueInfo = getDueText(task.endDate);
                    
                    return (
                        <div 
                            key={task.id}
                            onClick={() => {
                                onEditTask(task);
                            }}
                            className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-300 cursor-pointer transition-all group relative overflow-hidden"
                        >
                            {/* Hover Bar */}
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                            <div className="flex justify-between items-start gap-4">
                                <div className="flex-1 min-w-0">
                                    {/* Top Metadata */}
                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                        {channelInfo && (
                                            <span className={`flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${channelInfo.fullColor}`}>
                                                <channelInfo.Icon className="w-3 h-3" /> {channelInfo.name}
                                            </span>
                                        )}
                                        {(() => {
                                            const s = (task.status || '').toString().toUpperCase();
                                            let masterStatus = masterOptions.find(opt => 
                                                (opt.type === 'STATUS' || opt.type === 'TASK_STATUS') && 
                                                opt.key.toUpperCase() === s
                                            );

                                            if (!masterStatus) {
                                                masterStatus = masterOptions.find(opt => opt.key.toUpperCase() === s);
                                            }

                                            const label = masterStatus?.label || STATUS_LABELS[s as any] || task.status;
                                            
                                            return (
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${STATUS_COLORS[s as any] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                                    {label}
                                                </span>
                                            );
                                        })()}
                                        {task.contentFormat && (() => {
                                            const f = task.contentFormat.toString().toUpperCase();
                                            const masterFormat = masterOptions.find(opt => 
                                                opt.type === 'FORMAT' && opt.key.toUpperCase() === f
                                            );
                                            return (
                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold border border-indigo-100 bg-indigo-50 text-indigo-600">
                                                    {masterFormat?.label || task.contentFormat}
                                                </span>
                                            );
                                        })()}
                                    </div>
                                    
                                    <h3 className="font-bold text-gray-800 text-base leading-snug group-hover:text-indigo-700 transition-colors mb-2">
                                        {task.title}
                                    </h3>
                                    
                                    {/* Bottom Metadata */}
                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                        <div className={`flex items-center font-bold ${dueInfo.color}`}>
                                            <Calendar className="w-3.5 h-3.5 mr-1.5" />
                                            {format(task.endDate, 'd MMM')} ({dueInfo.text})
                                        </div>
                                        {/* Assignees (Visual only) */}
                                        {(task.assigneeIds.length > 0 || (task.ideaOwnerIds?.length ?? 0) > 0) && (
                                            <div className="flex items-center gap-1">
                                                <User className="w-3.5 h-3.5" />
                                                <span>{(task.assigneeIds.length || 0) + (task.ideaOwnerIds?.length ?? 0)} คน</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="p-2 bg-gray-50 rounded-full text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors self-center">
                                    <ArrowRight className="w-5 h-5" />
                                </div>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default TaskCategoryModal;
