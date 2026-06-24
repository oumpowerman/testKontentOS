import React from 'react';
import { Users, User, Calendar, Layers, UserCircle, LayoutGrid, List, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addWeeks } from 'date-fns';
import { th } from 'date-fns/locale';

type GroupMode = 'DATE' | 'CHANNEL' | 'ROLE';
type ViewMode = 'GRID' | 'LIST';

interface WorkloadControlsProps {
    tabMode: 'TEAM' | 'ME';
    setTabMode: (tab: 'TEAM' | 'ME') => void;
    groupMode: GroupMode;
    setGroupMode: (mode: GroupMode) => void;
    viewMode: ViewMode;
    setViewMode: (mode: ViewMode) => void;
    currentDate: Date;
    setCurrentDate: (date: Date) => void;
    weekStart: Date;
    weekEnd: Date;
}

const WorkloadControls: React.FC<WorkloadControlsProps> = ({
    tabMode,
    setTabMode,
    groupMode,
    setGroupMode,
    viewMode,
    setViewMode,
    currentDate,
    setCurrentDate,
    weekStart,
    weekEnd
}) => {
    return (
        <div className="px-4 md:px-6 py-3 md:py-4 bg-gray-50 border-b border-gray-100 flex flex-col md:flex-row items-center justify-between shrink-0 gap-3 md:gap-4 overflow-hidden">
            
            {/* Tabs */}
            <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm shrink-0 w-full md:w-auto">
                <button 
                    onClick={() => setTabMode('TEAM')}
                    className={`px-3 md:px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all flex-1 md:flex-initial ${tabMode === 'TEAM' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    <Users className="w-4 h-4" /> ภาพรวมทีม
                </button>
                <button 
                    onClick={() => setTabMode('ME')}
                    className={`px-3 md:px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all flex-1 md:flex-initial ${tabMode === 'ME' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    <User className="w-4 h-4" /> ของฉัน (My Focus)
                </button>
            </div>

            {/* Switchable Controls with Framer Motion */}
            <AnimatePresence mode="popLayout">
                {tabMode === 'ME' ? (
                    <motion.div
                        key="me-controls"
                        initial={{ opacity: 0, x: 20, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 20, scale: 0.95 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="flex flex-row items-center gap-2 md:gap-4 w-full md:w-auto overflow-x-auto scrollbar-hide shrink-0"
                    >
                        <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider hidden md:block whitespace-nowrap">Group By:</span>
                            <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm flex-1 md:flex-none">
                                <button 
                                    onClick={() => setGroupMode('DATE')} 
                                    className={`flex-1 flex items-center justify-center gap-1.5 md:gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${groupMode === 'DATE' ? 'bg-indigo-50 text-indigo-700 shadow-inner' : 'text-gray-500 hover:bg-gray-50'}`}
                                >
                                    <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4" /> วันส่ง
                                </button>
                                <button 
                                    onClick={() => setGroupMode('CHANNEL')} 
                                    className={`flex-1 flex items-center justify-center gap-1.5 md:gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${groupMode === 'CHANNEL' ? 'bg-indigo-50 text-indigo-700 shadow-inner' : 'text-gray-500 hover:bg-gray-50'}`}
                                >
                                    <Layers className="w-3.5 h-3.5 md:w-4 md:h-4" /> ช่องรายการ
                                </button>
                                <button 
                                    onClick={() => setGroupMode('ROLE')} 
                                    className={`flex-1 flex items-center justify-center gap-1.5 md:gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${groupMode === 'ROLE' ? 'bg-indigo-50 text-indigo-700 shadow-inner' : 'text-gray-500 hover:bg-gray-50'}`}
                                >
                                    <UserCircle className="w-3.5 h-3.5 md:w-4 md:h-4" /> หน้าที่
                                </button>
                            </div>
                        </div>

                        {/* View Mode Toggle */}
                        <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm shrink-0">
                            <button 
                                onClick={() => setViewMode('GRID')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'GRID' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                title="Grid View"
                            >
                                <LayoutGrid className="w-4 h-4 md:w-5 md:h-5" />
                            </button>
                            <button 
                                onClick={() => setViewMode('LIST')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'LIST' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                title="List View"
                            >
                                <List className="w-4 h-4 md:w-5 md:h-5" />
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="team-controls"
                        initial={{ opacity: 0, x: -20, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -20, scale: 0.95 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="flex items-center justify-between bg-white p-1 rounded-xl border border-gray-200 shadow-sm w-full md:w-auto shrink-0"
                    >
                        <button 
                            onClick={() => setCurrentDate(addWeeks(currentDate, -1))} 
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-xs font-bold text-center text-gray-700 min-w-[120px] px-2 whitespace-nowrap">
                            {format(weekStart, 'd MMM', { locale: th })} - {format(weekEnd, 'd MMM', { locale: th })}
                        </span>
                        <button 
                            onClick={() => setCurrentDate(addWeeks(currentDate, 1))} 
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default WorkloadControls;
