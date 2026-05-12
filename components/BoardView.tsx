
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task, Channel, User, Status, MasterOption, TaskType } from '../types';
import { STATUS_LABELS, STATUS_COLORS, PLATFORM_ICONS } from '../constants';
import { Plus, MoreHorizontal, Calendar, User as UserIcon, Filter, Check, AlertCircle, ArrowRight, CornerDownRight } from 'lucide-react';
import { format } from 'date-fns';
import MentorTip from './MentorTip';

interface BoardViewProps {
    tasks: Task[];
    channels: Channel[];
    users: User[];
    masterOptions: MasterOption[];
    viewMode: 'CONTENT' | 'TASK'; // Added prop
    onEditTask: (task: Task) => void;
    onAddTask: (status: Status) => void;
    onUpdateStatus: (task: Task, newStatus: Status) => void;
    onOpenSettings: () => void;
}

const BoardView: React.FC<BoardViewProps> = ({ 
    tasks, 
    channels, 
    users, 
    masterOptions,
    viewMode,
    onEditTask, 
    onAddTask, 
    onUpdateStatus 
}) => {
    const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
    const [selectedChannelId, setSelectedChannelId] = useState<string>('ALL');

    // --- Dynamic Columns Logic ---
    // Correctly select status type based on view mode
    const statusTypeToCheck = viewMode === 'CONTENT' ? 'STATUS' : 'TASK_STATUS';

    const statusOptions = useMemo(() => {
        return masterOptions
            .filter(o => o.type === statusTypeToCheck && o.isActive)
            .sort((a, b) => a.sortOrder - b.sortOrder);
    }, [masterOptions, statusTypeToCheck]);

    // Fallback/Empty State Logic
    const hasStatuses = statusOptions.length > 0;

    const handleDragStart = (e: React.DragEvent, taskId: string) => {
        setDraggedTaskId(taskId);
        e.dataTransfer.setData('taskId', taskId);
        e.dataTransfer.effectAllowed = 'move';

        // Set JSON data for Workbox
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            const dragData = {
                title: task.title,
                type: task.type, // 'CONTENT' or 'TASK'
                content_id: task.id
            };
            e.dataTransfer.setData('application/json', JSON.stringify(dragData));
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault(); // Allow drop
    };

    const handleDrop = (e: React.DragEvent, statusKey: string) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('taskId');
        const task = tasks.find(t => t.id === taskId);
        
        // Cast string key to Status enum (assuming data integrity is managed via Master Data)
        if (task && task.status !== statusKey) {
            onUpdateStatus(task, statusKey as Status);
        }
        setDraggedTaskId(null);
    };

    // --- Helpers ---
    const getOptionLabel = (key: string, type: string) => {
        const option = masterOptions.find(o => o.key === key && o.type === type);
        return option ? option.label : key;
    };

    const getColumnBgTint = (statusColor: string) => {
        // Extract color name (e.g., "blue" from "bg-blue-100 text-blue-700")
        // Improved regex to handle cases without dashes if needed, but standard is bg-color-50
        const match = statusColor.match(/bg-(\w+)/);
        if (match && match[1]) {
            const color = match[1];
            
            // Special handling for gray to keep it neutral
            if (color === 'gray' || color === 'slate') return 'bg-slate-50/40 border-slate-200/50';
            
            // Unified styling for tinted columns
            return `bg-${color}-50/30 border-${color}-100/40`;
        }
        return 'bg-gray-50/40 border-gray-100/50';
    };

    const getCardBgTint = (statusColor: string, taskId: string) => {
        const match = statusColor.match(/bg-(\w+)/);
        if (!match || !match[1]) return 'bg-white border-gray-200';
        const color = match[1];
        
        if (color === 'gray' || color === 'slate') return 'bg-white border-gray-200';

        // Use taskId to generate a stable "random" variation (0-3)
        const seed = taskId.charCodeAt(taskId.length - 1) % 4;
        const opacities = ['/40', '/60', '/80', '']; // Different levels of 50-shade tints
        
        return `bg-${color}-50${opacities[seed]} border-${color}-100/60`;
    };

    const getChannelInfo = (channelId?: string) => {
        return channels.find(c => c.id === channelId);
    };

    const getAssigneeAvatar = (userIds?: string[]) => {
        if (!userIds || userIds.length === 0) return null;
        const user = users.find(u => u.id === userIds[0]);
        return user?.avatarUrl;
    };

    if (!hasStatuses) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-in fade-in">
                <div className="bg-red-50 p-6 rounded-3xl border-2 border-red-100 max-w-md">
                    <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-red-900 mb-2">
                        ไม่พบสถานะงาน ({viewMode === 'CONTENT' ? 'Content Status' : 'Task Status'})
                    </h3>
                    <p className="text-red-600 mb-6 text-sm">
                        ระบบไม่พบข้อมูล Master Data สำหรับ {statusTypeToCheck}<br/>
                        กรุณาไปที่เมนู <span className="font-bold">Admin {'>'} ตั้งค่าระบบ</span> เพื่อเพิ่มสถานะ
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col animate-in fade-in duration-500">
            {/* --- CHANNEL FILTER CHIPS --- */}
            <div className="flex items-center gap-2 overflow-x-auto pb-4 px-1 flex-shrink-0 scrollbar-hide">
                <div className="flex items-center text-xs font-bold text-gray-400 uppercase mr-2 shrink-0">
                    <Filter className="w-3 h-3 mr-1" /> กรองช่อง:
                </div>
                
                <button
                    onClick={() => setSelectedChannelId('ALL')}
                    className={`
                        px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap shadow-sm border shrink-0 flex items-center
                        ${selectedChannelId === 'ALL'
                            ? 'bg-gray-800 text-white border-gray-800 ring-2 ring-gray-300' 
                            : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-indigo-600'}
                    `}
                >
                    {selectedChannelId === 'ALL' && <Check className="w-3 h-3 mr-1" />}
                    รวมทุกช่อง (All)
                </button>

                {channels.map(channel => {
                    const isActive = selectedChannelId === channel.id;
                    const colorClass = (channel.color || 'bg-indigo-100').split(' ')[0] || 'bg-indigo-100'; // Fallback

                    return (
                        <button
                            key={channel.id}
                            onClick={() => setSelectedChannelId(channel.id)}
                            className={`
                                px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap shadow-sm border shrink-0 flex items-center
                                ${isActive 
                                    ? `bg-white text-gray-800 border-indigo-500 ring-2 ring-indigo-200` 
                                    : `bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:-translate-y-0.5`}
                            `}
                        >
                            <span className={`w-2 h-2 rounded-full mr-1.5 ${colorClass}`}></span>
                            {channel.name}
                            {isActive && <Check className="w-3 h-3 ml-1.5 text-indigo-600" />}
                        </button>
                    );
                })}
            </div>

            {/* --- BOARD COLUMNS (DYNAMIC) --- */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4
                scrollbar-thin 
                scrollbar-thumb-transparent
                hover:scrollbar-thumb-slate-200/50
                scrollbar-track-transparent
                [&::-webkit-scrollbar]:h-1
                [&::-webkit-scrollbar-thumb]:rounded-full
                [&::-webkit-scrollbar-thumb]:bg-transparent
                hover:[&::-webkit-scrollbar-thumb]:bg-slate-200/50
                transition-all duration-500
            ">
                <div className="flex h-full gap-4 min-w-max px-2">
                    {statusOptions.map((option) => {
                        const statusKey = option.key; 
                        const statusLabel = option.label;
                        const statusColor = option.color || 'bg-gray-100 text-gray-600';
                        const columnClasses = getColumnBgTint(statusColor);

                        // Filter Tasks
                        const columnTasks = tasks.filter(t => {
                            const matchStatus = t.status === statusKey;
                            const matchChannel = selectedChannelId === 'ALL' || t.channelId === selectedChannelId;
                            return matchStatus && matchChannel;
                        });

                        return (
                            <div 
                                key={option.id}
                                className={`w-80 flex flex-col rounded-xl border transition-colors max-h-full ${columnClasses}`}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, statusKey)}
                            >
                                {/* Column Header */}
                                <div className="p-4 flex justify-between items-center bg-white/60 backdrop-blur-sm rounded-t-xl border-b border-white/40 sticky top-0 z-10">
                                    <div className="flex items-center gap-2 max-w-[80%]">
                                        <span className={`px-3 py-1 rounded-lg text-sm font-bold border truncate shadow-sm ${statusColor}`}>
                                            {statusLabel}
                                        </span>
                                        <span className="text-xs text-gray-400 font-bold bg-white/80 px-2 py-0.5 rounded-md border border-gray-100">
                                            {columnTasks.length}
                                        </span>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => onAddTask(statusKey as Status)} className="p-1.5 hover:bg-white/80 rounded-lg text-gray-400 hover:text-gray-600 transition-all active:scale-95">
                                            <Plus className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Task List */}
                                <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-thumb-transparent hover:scrollbar-thumb-slate-200/50">
                                    <AnimatePresence>
                                        {columnTasks.length === 0 && (
                                            <motion.div 
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 0.5 }}
                                                exit={{ opacity: 0 }}
                                                className="h-24 flex flex-col items-center justify-center text-xs text-gray-400 gap-1"
                                            >
                                                <div className="w-8 h-8 rounded-full border border-dashed border-gray-300 flex items-center justify-center">
                                                    <Filter className="w-3.5 h-3.5" />
                                                </div>
                                                <span className="italic font-medium">ยังไม่มีงานในสถานะนี้</span>
                                            </motion.div>
                                        )}
                                        
                                        {columnTasks.map((task, index) => {
                                            const channel = getChannelInfo(task.channelId);
                                            const avatar = getAssigneeAvatar(task.assigneeIds.length > 0 ? task.assigneeIds : task.ideaOwnerIds);
                                            const formatLabel = task.contentFormats && task.contentFormats.length > 0 ? getOptionLabel(task.contentFormats[0], 'FORMAT') : null;
                                            const cardStyle = getCardBgTint(statusColor, task.id);
                                            
                                            return (
                                                <motion.div
                                                    key={task.id}
                                                    layout
                                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                    transition={{ duration: 0.2, delay: index * 0.03 }}
                                                    draggable
                                                    onDragStart={(e) => handleDragStart(e as any, task.id)}
                                                    onClick={() => onEditTask(task)}
                                                    className={`
                                                        p-4 rounded-xl shadow-sm border cursor-grab active:cursor-grabbing hover:shadow-[0_8px_20px_-8px_rgba(0,0,0,0.15)] hover:border-indigo-100 transition-all group relative
                                                        ${cardStyle}
                                                        ${draggedTaskId === task.id ? 'opacity-30 border-dashed border-indigo-400 scale-95' : ''}
                                                    `}
                                                >
                                                    {/* Parent Badge for Sub-tasks */}
                                                    {(task.contentId || task.showOnBoard) && (
                                                        <div className="text-[10px] bg-slate-50 text-slate-500 px-2 py-1 rounded mb-2 inline-flex items-center w-full border border-slate-100">
                                                            <CornerDownRight className="w-3 h-3 mr-1.5 text-slate-400" />
                                                            <span className="truncate font-semibold">{task.parentContentTitle || 'Sub-task'}</span>
                                                        </div>
                                                    )}

                                                {/* Cover/Tag Line */}
                                                <div className="flex items-center gap-1.5 mb-2.5 flex-wrap">
                                                    {channel && (
                                                        <span className={`text-[10px] px-2 py-0.5 rounded border font-black truncate max-w-[120px] ${channel.color}`}>
                                                            {channel.name}
                                                        </span>
                                                    )}
                                                    {formatLabel && (
                                                        <span className="text-[10px] bg-slate-50 text-slate-600 px-2 py-0.5 rounded border border-slate-100 font-black uppercase tracking-wider">
                                                            {formatLabel}
                                                        </span>
                                                    )}
                                                    {/* Show 'General Task' badge if no channel/format */}
                                                    {viewMode === 'TASK' && !channel && (
                                                        <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100 font-bold">TASK</span>
                                                    )}
                                                </div>

                                                {/* Title */}
                                                <h4 className="text-[13px] font-bold text-gray-800 leading-relaxed mb-3 group-hover:text-indigo-600 transition-colors line-clamp-2">
                                                    {task.title}
                                                </h4>

                                                {/* Footer Info */}
                                                <div className="flex justify-between items-end pt-2.5 border-t border-gray-50">
                                                    <div className="flex items-center text-[10px] font-bold text-gray-400">
                                                        <Calendar className="w-3 h-3 mr-1.5" />
                                                        {task.isUnscheduled ? 'No Date' : format(task.endDate, 'd MMM')}
                                                    </div>
                                                    
                                                    {avatar ? (
                                                        <img src={avatar} className="w-6 h-6 rounded-full object-cover border-2 border-white shadow-sm" />
                                                    ) : (
                                                        <div className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 border border-gray-100">
                                                            <UserIcon className="w-3 h-3" />
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                    </AnimatePresence>
                                    
                                    {/* Drop Zone Indicator */}
                                    <div className="h-12 border-2 border-dashed border-transparent transition-colors rounded-xl flex items-center justify-center text-sm font-bold text-transparent hover:border-indigo-200 hover:text-indigo-300">
                                        Drop here
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default BoardView;
