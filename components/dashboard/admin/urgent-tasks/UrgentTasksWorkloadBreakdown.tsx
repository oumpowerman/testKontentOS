import React from 'react';
import { motion } from 'framer-motion';
import { Channel, User } from '../../../../types';

interface UrgentTasksWorkloadBreakdownProps {
    selectedType: 'ALL' | 'CONTENT' | 'TASK';
    channelsWithPending: { channel: Channel | undefined; count: number; id: string }[];
    assigneesWithPending: { user: User | undefined; count: number; id: string }[];
    selectedChannelId: string | null;
    setSelectedChannelId: (id: string | null) => void;
    selectedAssigneeId: string | null;
    setSelectedAssigneeId: (id: string | null) => void;
}

export const UrgentTasksWorkloadBreakdown: React.FC<UrgentTasksWorkloadBreakdownProps> = ({
    selectedType,
    channelsWithPending,
    assigneesWithPending,
    selectedChannelId,
    setSelectedChannelId,
    selectedAssigneeId,
    setSelectedAssigneeId,
}) => {
    const hasChannels = (selectedType === 'ALL' || selectedType === 'CONTENT') && channelsWithPending.length > 0;
    const hasAssignees = (selectedType === 'ALL' || selectedType === 'TASK') && assigneesWithPending.length > 0;

    if (!hasChannels && !hasAssignees) return null;

    return (
        <div className="bg-slate-50/50 border-b border-slate-100 px-6 py-2.5 flex flex-col gap-2 relative z-10" id="urgent-tasks-workload-breakdown">
            {/* Channel Workload Breakdown */}
            {hasChannels && (
                <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                            ค้างตามช่องทาง ({channelsWithPending.length})
                        </span>
                        {selectedChannelId && (
                            <button 
                                onClick={() => setSelectedChannelId(null)} 
                                className="text-[10px] font-bold text-indigo-500 hover:text-indigo-700 flex items-center gap-0.5 cursor-pointer bg-indigo-50 px-1.5 py-0.2 rounded-full border border-indigo-100"
                            >
                                แสดงทั้งหมด
                            </button>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none -mx-2 px-2">
                        {channelsWithPending.map(({ channel, count, id }) => {
                            if (!channel) return null;
                            const isSelected = selectedChannelId === id;
                            return (
                                <motion.button
                                    key={id}
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => setSelectedChannelId(isSelected ? null : id)}
                                    className={`
                                        flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all text-xs font-black cursor-pointer shrink-0 select-none shadow-sm
                                        ${isSelected 
                                            ? 'bg-purple-100 border-purple-300 text-purple-800 ring-2 ring-purple-500/10' 
                                            : 'bg-white border-slate-200/80 hover:border-purple-200 text-slate-600'
                                        }
                                    `}
                                >
                                    <div className="w-4 h-4 rounded-full overflow-hidden flex items-center justify-center shrink-0 bg-slate-100">
                                        {channel.logoUrl ? (
                                            <img src={channel.logoUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt="" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-[7px] font-black text-white" style={{ backgroundColor: channel.color || '#8b5cf6' }}>
                                                {channel.name.slice(0, 1).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <span className="max-w-[70px] truncate text-[11px] font-black">{channel.name}</span>
                                    <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-extrabold ${isSelected ? 'bg-purple-200 text-purple-800' : 'bg-slate-100 text-slate-500'}`}>
                                        {count}
                                    </span>
                                </motion.button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Divider if both are shown */}
            {selectedType === 'ALL' && channelsWithPending.length > 0 && assigneesWithPending.length > 0 && (
                <div className="border-t border-slate-200/40 my-0.5"></div>
            )}

            {/* User Workload Breakdown */}
            {hasAssignees && (
                <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                            งานค้างรายบุคคล ({assigneesWithPending.length})
                        </span>
                        {selectedAssigneeId && (
                            <button 
                                onClick={() => setSelectedAssigneeId(null)} 
                                className="text-[10px] font-bold text-indigo-500 hover:text-indigo-700 flex items-center gap-0.5 cursor-pointer bg-indigo-50 px-1.5 py-0.2 rounded-full border border-indigo-100"
                            >
                                แสดงทั้งหมด
                            </button>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none -mx-2 px-2">
                        {assigneesWithPending.map(({ user, count, id }) => {
                            if (!user) return null;
                            const isSelected = selectedAssigneeId === id;
                            return (
                                <motion.button
                                    key={id}
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => setSelectedAssigneeId(isSelected ? null : id)}
                                    className={`
                                        flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all text-xs font-black cursor-pointer shrink-0 select-none shadow-sm
                                        ${isSelected 
                                            ? 'bg-blue-100 border-blue-300 text-blue-800 ring-2 ring-blue-500/10' 
                                            : 'bg-white border-slate-200/80 hover:border-blue-200 text-slate-600'
                                        }
                                    `}
                                >
                                    <img src={user.avatarUrl} className="w-4 h-4 rounded-full object-cover shrink-0 border border-white" referrerPolicy="no-referrer" alt="" />
                                    <span className="max-w-[75px] truncate text-[11px] font-bold">{user.name}</span>
                                    <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-extrabold ${isSelected ? 'bg-blue-200 text-blue-800' : 'bg-slate-100 text-slate-500'}`}>
                                        {count}
                                    </span>
                                </motion.button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};
