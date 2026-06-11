import React from 'react';
import { motion } from 'framer-motion';
import { Radio, Users } from 'lucide-react';
import { Channel, User } from '../../../../../types';

interface ChannelAnalyticItem {
    id: string;
    count: number;
    channel?: Channel;
}

interface AssigneeAnalyticItem {
    id: string;
    count: number;
    user?: User;
}

interface CommandCenterSidebarProps {
    selectedType: 'ALL' | 'CONTENT' | 'TASK';
    channelsAnalytics: ChannelAnalyticItem[];
    assigneesAnalytics: AssigneeAnalyticItem[];
    activeChannelId: string | null;
    activeAssigneeId: string | null;
    onChannelSelect: (id: string | null) => void;
    onAssigneeSelect: (id: string | null) => void;
    setMobileTab: (tab: 'LIST' | 'ANALYTICS') => void;
}

export const CommandCenterSidebar: React.FC<CommandCenterSidebarProps> = ({
    selectedType,
    channelsAnalytics,
    assigneesAnalytics,
    activeChannelId,
    activeAssigneeId,
    onChannelSelect,
    onAssigneeSelect,
    setMobileTab,
}) => {
    return (
        <div className="flex flex-col w-full h-full">
            {/* Brands / Channels bottleneck breakdown */}
            {(selectedType === 'ALL' || selectedType === 'CONTENT') && (
                <div className="p-4 md:p-5 border-b border-slate-200/50">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            <Radio className="w-3.5 h-3.5 text-purple-500" />
                            แบรนด์ช่องทางที่ค้างคอนเทนต์ ({channelsAnalytics.length})
                        </div>
                        {activeChannelId && (
                            <button 
                                onClick={() => onChannelSelect(null)}
                                className="text-[10px] font-bold text-purple-600 hover:text-purple-800 bg-purple-50 px-2 py-0.5 rounded-full cursor-pointer"
                            >
                                แสดงทั้งหมด
                            </button>
                        )}
                    </div>

                    <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 scrollbar-none">
                        {channelsAnalytics.map(({ id, count, channel }) => {
                            if (!channel) return null;
                            const isActive = activeChannelId === id;
                            const isHighBurden = count >= 3;
                            return (
                                <motion.button
                                    key={id}
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                    onClick={() => {
                                        onChannelSelect(isActive ? null : id);
                                        onAssigneeSelect(null); // Mutually exclusive to prevent dead filter combinations
                                        if (window.innerWidth < 1024) {
                                            setMobileTab('LIST');
                                        }
                                    }}
                                    className={`
                                        flex items-center gap-2 px-3 py-2 rounded-xl border text-left cursor-pointer transition-all shrink-0 lg:shrink-1 select-none w-[160px] lg:w-full shadow-sm relative
                                        ${isActive 
                                            ? 'bg-purple-100 border-purple-300 text-purple-800 ring-2 ring-purple-500/10' 
                                            : 'bg-white border-slate-200 hover:border-purple-200 text-slate-700'
                                        }
                                    `}
                                >
                                    {isHighBurden && (
                                        <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 animate-ping z-10" />
                                    )}
                                    <div className="w-6 h-6 rounded-lg overflow-hidden flex items-center justify-center shrink-0 bg-slate-100">
                                        {channel.logoUrl ? (
                                            <img src={channel.logoUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt="" />
                                        ) : (
                                            <div 
                                                className="w-full h-full flex items-center justify-center text-[9px] font-extrabold text-white" 
                                                style={{ backgroundColor: channel.color || '#a855f7' }}
                                            >
                                                {channel.name.slice(0, 1).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0 pr-1">
                                        <p className="text-[11px] font-bold truncate">{channel.name}</p>
                                    </div>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${isActive ? 'bg-purple-200 text-purple-800' : 'bg-slate-100 text-slate-500'}`}>
                                        {count}
                                    </span>
                                </motion.button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Assignee bottleneck breakdown */}
            {(selectedType === 'ALL' || selectedType === 'TASK') && (
                <div className="p-4 md:p-5">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            <Users className="w-3.5 h-3.5 text-blue-500" />
                            งานค้างรายบุคคล ({assigneesAnalytics.length})
                        </div>
                        {activeAssigneeId && (
                            <button 
                                onClick={() => onAssigneeSelect(null)}
                                className="text-[10px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-0.5 rounded-full cursor-pointer"
                            >
                                แสดงทั้งหมด
                            </button>
                        )}
                    </div>

                    <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 scrollbar-none">
                        {assigneesAnalytics.map(({ id, count, user }) => {
                            if (!user) return null;
                            const isActive = activeAssigneeId === id;
                            const isHighBurden = count >= 3;
                            return (
                                <motion.button
                                    key={id}
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                    onClick={() => {
                                        onAssigneeSelect(isActive ? null : id);
                                        onChannelSelect(null); // Mutually exclusive to prevent dead filters
                                        if (window.innerWidth < 1024) {
                                            setMobileTab('LIST');
                                        }
                                    }}
                                    className={`
                                        flex items-center gap-2 px-3 py-2 rounded-xl border text-left cursor-pointer transition-all shrink-0 lg:shrink-1 select-none w-[170px] lg:w-full shadow-sm relative
                                        ${isActive 
                                            ? 'bg-blue-100 border-blue-300 text-blue-800 ring-2 ring-blue-500/10' 
                                            : 'bg-white border-slate-200 hover:border-blue-200 text-slate-700'
                                        }
                                    `}
                                >
                                    {isHighBurden && (
                                        <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 animate-ping z-10" />
                                    )}
                                    <img src={user.avatarUrl} className="w-6 h-6 rounded-full object-cover shrink-0 border border-white" referrerPolicy="no-referrer" alt="" />
                                    <div className="flex-1 min-w-0 pr-1">
                                        <p className="text-[11px] font-bold truncate">{user.name}</p>
                                    </div>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${isActive ? 'bg-blue-200 text-blue-800' : 'bg-slate-100 text-slate-500'}`}>
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
