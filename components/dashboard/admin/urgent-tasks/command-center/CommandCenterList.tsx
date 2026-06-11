import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, X } from 'lucide-react';
import { Task, Channel, User, MasterOption } from '../../../../../types';
import { UrgentTaskItem } from '../UrgentTaskItem';

interface CommandCenterListProps {
    filteredTasks: Task[];
    channels: Channel[];
    users: User[];
    masterOptions: MasterOption[];
    onEditTask: (task: Task) => void;
    timeFilter: 'ALL' | 'OVERDUE' | 'TODAY' | 'SOON' | 'NORMAL';
    onClearTimeFilter: () => void;
    activeChannelId: string | null;
    onClearChannelFilter: () => void;
    activeAssigneeId: string | null;
    onClearAssigneeFilter: () => void;
    searchQuery: string;
    mobileTab: 'LIST' | 'ANALYTICS';
}

export const CommandCenterList: React.FC<CommandCenterListProps> = ({
    filteredTasks,
    channels,
    users,
    masterOptions,
    onEditTask,
    timeFilter,
    onClearTimeFilter,
    activeChannelId,
    onClearChannelFilter,
    activeAssigneeId,
    onClearAssigneeFilter,
    searchQuery,
    mobileTab,
}) => {
    return (
        <div className={`lg:col-span-8 flex flex-col overflow-hidden bg-white ${mobileTab === 'LIST' ? 'flex' : 'hidden lg:flex'} h-full`}>
            
            {/* Filter tags & active queries strip */}
            <div className="px-4 py-2.5 md:px-6 md:py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/20 shrink-0">
                <div className="text-[10px] sm:text-[11px] font-bold text-slate-400">
                    กำลังแสดง <strong className="text-slate-700 font-extrabold">{filteredTasks.length}</strong> รายการที่ตรงกับเงื่อนไข
                </div>
                
                {(timeFilter !== 'ALL' || activeChannelId || activeAssigneeId || searchQuery) && (
                    <div className="flex flex-wrap gap-1 md:gap-1.5 justify-end">
                        {activeChannelId && (
                            <span className="text-[9px] sm:text-[10px] bg-purple-50 text-purple-700 font-bold border border-purple-100 px-1.5 sm:px-2 py-0.2 rounded-full flex items-center gap-1 shadow-sm">
                                แบรนด์: {channels.find(c => c.id === activeChannelId)?.name}
                                <X 
                                    onClick={(e) => { e.stopPropagation(); onClearChannelFilter(); }} 
                                    className="w-3 h-3 cursor-pointer hover:text-purple-950" 
                                />
                            </span>
                        )}
                        {activeAssigneeId && (
                            <span className="text-[9px] sm:text-[10px] bg-blue-50 text-blue-700 font-bold border border-blue-100 px-1.5 sm:px-2 py-0.2 rounded-full flex items-center gap-1 shadow-sm">
                                งานของ: {users.find(u => u.id === activeAssigneeId)?.name}
                                <X 
                                    onClick={(e) => { e.stopPropagation(); onClearAssigneeFilter(); }} 
                                    className="w-3 h-3 cursor-pointer hover:text-blue-950" 
                                />
                            </span>
                        )}
                        {timeFilter !== 'ALL' && (
                            <span className="text-[9px] sm:text-[10px] bg-indigo-50 text-indigo-700 font-bold border border-indigo-100 px-1.5 sm:px-2 py-0.2 rounded-full flex items-center gap-1 shadow-sm">
                                ช่วงส่ง: {timeFilter}
                                <X 
                                    onClick={(e) => { e.stopPropagation(); onClearTimeFilter(); }} 
                                    className="w-3 h-3 cursor-pointer hover:text-indigo-950" 
                                />
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Scrollable Container with Lazy items */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3.5 md:space-y-4 scrollbar-thin">
                {filteredTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <motion.div
                            animate={{ scale: [1, 1.05, 1], rotate: [0, 10, -10, 0] }}
                            transition={{ repeat: Infinity, duration: 4 }}
                            className="p-4 bg-emerald-50 text-emerald-500 rounded-full border border-emerald-100 mb-4"
                        >
                            <CheckCircle2 className="w-12 h-12" />
                        </motion.div>
                        <p className="font-bold text-slate-700 text-base md:text-lg">ไม่มีรายการงานค้างตามเงื่อนไขนี้</p>
                        <p className="text-[11px] sm:text-xs text-slate-400 font-bold mt-1 max-w-[250px] mx-auto leading-relaxed">
                            ระบบรักษาสถานะปกติเยี่ยมยอดในขณะนี้ คุณสามารถปรับตัวเลือกเปลี่ยนกลุ่มตัวกรองเพื่อตรวจสอบส่วนอื่นได้เลยครับ
                        </p>
                    </div>
                ) : (
                    filteredTasks.map((task, idx) => (
                        <UrgentTaskItem 
                            key={task.id}
                            task={task}
                            idx={idx}
                            channels={channels}
                            users={users}
                            masterOptions={masterOptions}
                            onEditTask={onEditTask}
                        />
                    ))
                )}
            </div>
        </div>
    );
};
