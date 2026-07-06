
import React from 'react';
import { format } from 'date-fns';
import th from 'date-fns/locale/th';
import { ChevronLeft, ChevronRight, Search, Calendar, Briefcase, UserX, UserCheck, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import FilterDropdown from '../../common/FilterDropdown';

interface TimesheetHeaderProps {
    viewMode: 'WEEK' | 'MONTH';
    setViewMode: (mode: 'WEEK' | 'MONTH') => void;
    dateRange: Date[];
    onNav: (offset: number) => void;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    filterDepartment: string;
    setFilterDepartment: (dept: string) => void;
    departments: string[];
    showInactive: boolean;
    setShowInactive: (show: boolean) => void;
    onExportCSV?: () => void;
}

const TimesheetHeader: React.FC<TimesheetHeaderProps> = ({
    viewMode,
    setViewMode,
    dateRange,
    onNav,
    searchTerm,
    setSearchTerm,
    filterDepartment,
    setFilterDepartment,
    departments,
    showInactive,
    setShowInactive,
    onExportCSV
}) => {
    const containerVariants = {
        hidden: { opacity: 0, y: -15 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.6,
                ease: [0.16, 1, 0.3, 1] as const,
                staggerChildren: 0.05,
                delayChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: -10 },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }
        }
    };

    const deptOptions = departments.map(d => ({
        key: d,
        label: d
    }));

    return (
        <motion.div 
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="bg-white/90 backdrop-blur-md rounded-3xl sm:rounded-[2.5rem] p-4 sm:p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-visible z-[120] group"
            id="timesheet-header-container"
        >
            {/* Soft Pastel Background Decors (Clipped to container boundaries) */}
            <div className="absolute inset-0 rounded-3xl sm:rounded-[2.5rem] overflow-hidden pointer-events-none z-0">
                <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-indigo-200/20 to-pink-200/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-tr from-sky-100/30 to-indigo-100/20 rounded-full blur-3xl -ml-20 -mb-20"></div>
            </div>
            
            <div className="flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-6 relative z-10">
                <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                    <motion.div 
                        whileHover={{ scale: 1.05, rotate: 5 }}
                        whileTap={{ scale: 0.95 }}
                        className="p-3 bg-indigo-50/80 rounded-2xl border border-indigo-100 text-indigo-500 shrink-0 shadow-inner cursor-pointer"
                    >
                        <Calendar className="w-8 h-8" />
                    </motion.div>
                    <div className="w-full text-center sm:text-left">
                        <div className="flex items-center justify-center sm:justify-start gap-2 mb-1.5">
                            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">Timesheet Central</h2>
                            <span className="px-2 py-0.5 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 text-[10px] font-extrabold uppercase tracking-widest">{viewMode}</span>
                        </div>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
                            <div className="flex items-center justify-between sm:justify-start gap-3 bg-slate-50/80 p-1 rounded-xl border border-slate-200/50 backdrop-blur-sm w-full sm:w-fit shrink-0">
                                <button 
                                    onClick={() => onNav(-1)} 
                                    className="p-1.5 hover:bg-slate-200/50 text-slate-500 hover:text-slate-800 rounded-lg transition-all active:scale-90 cursor-pointer" 
                                    aria-label="สัปดาห์ก่อนหน้า"
                                >
                                    <ChevronLeft className="w-4 h-4"/>
                                </button>
                                <div className="overflow-hidden h-5 flex items-center justify-center min-w-[130px] sm:min-w-[180px]">
                                    <AnimatePresence mode="wait">
                                        <motion.span 
                                            key={dateRange[0].toISOString()}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -8 }}
                                            transition={{ duration: 0.15, ease: "easeOut" }}
                                            className="text-[12px] sm:text-sm font-bold text-center px-1 sm:px-2 text-slate-700 whitespace-nowrap"
                                        >
                                            {format(dateRange[0], 'd MMM', { locale: th })} - {format(dateRange[dateRange.length-1], 'd MMM yyyy', { locale: th })}
                                        </motion.span>
                                    </AnimatePresence>
                                </div>
                                <button 
                                    onClick={() => onNav(1)} 
                                    className="p-1.5 hover:bg-slate-200/50 text-slate-500 hover:text-slate-800 rounded-lg transition-all active:scale-90 cursor-pointer" 
                                    aria-label="สัปดาห์ถัดไป"
                                >
                                    <ChevronRight className="w-4 h-4"/>
                                </button>
                            </div>

                            {onExportCSV && (
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={onExportCSV}
                                    className="flex items-center justify-center gap-2 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 hover:border-emerald-300 text-emerald-700 rounded-xl text-xs font-bold transition-all shadow-sm w-full sm:w-auto cursor-pointer select-none shrink-0"
                                    title="ส่งออกไฟล์รายงานในรูปแบบ CSV"
                                >
                                    <Download className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>ส่งออกรายงาน (CSV) 📥</span>
                                </motion.button>
                            )}
                        </div>
                    </div>
                </motion.div>

                <div className="flex flex-col sm:flex-row sm:flex-wrap xl:flex-nowrap items-center gap-3 w-full xl:w-auto">
                     <motion.button 
                        variants={itemVariants}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowInactive(!showInactive)}
                        className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all border w-full sm:w-[185px] shrink-0 cursor-pointer select-none outline-none ${
                            showInactive 
                            ? 'bg-rose-50/80 border-rose-100 text-rose-600 hover:bg-rose-100' 
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                        title={showInactive ? "ซ่อนสมาชิกที่ลาออก" : "แสดงสมาชิกที่ลาออก"}
                    >
                        {showInactive ? <UserCheck className="w-4 h-4 text-rose-500" /> : <UserX className="w-4 h-4 text-slate-400" />}
                        {showInactive ? 'SHOWING INACTIVE' : 'HIDE INACTIVE'}
                    </motion.button>

                    <motion.div variants={itemVariants} className="bg-slate-100/80 p-1 rounded-2xl border border-slate-200/50 flex w-full sm:w-auto relative shrink-0">
                        {(['WEEK', 'MONTH'] as const).map((mode) => {
                            const isActive = viewMode === mode;
                            return (
                                <button
                                    key={mode}
                                    onClick={() => setViewMode(mode)}
                                    className="relative flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer select-none outline-none z-10"
                                >
                                    <span className={`relative z-20 transition-colors duration-200 ${isActive ? 'text-white' : 'text-slate-500 hover:text-slate-800'}`}>
                                        {mode === 'WEEK' ? 'WEEKLY' : 'MONTHLY'}
                                    </span>
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeTimesheetMode"
                                            className="absolute inset-0 bg-indigo-500 rounded-xl shadow-sm z-10"
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </motion.div>

                    <motion.div variants={itemVariants} className="w-full sm:w-48 z-20 shrink-0">
                        <FilterDropdown
                            label="ทุกแผนก (All Teams)"
                            options={deptOptions}
                            value={filterDepartment}
                            onChange={setFilterDepartment}
                            icon={<Briefcase className="w-4 h-4" />}
                            theme="light"
                            showAllOption={true}
                            clearable={false}
                        />
                    </motion.div>

                    <motion.div variants={itemVariants} className="relative w-full sm:w-52 shrink-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="ค้นหาชื่อลูกทีม..." 
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-300 text-xs font-bold text-slate-700 placeholder-slate-400 transition-all hover:bg-slate-100/50 focus:bg-white"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
};

export default TimesheetHeader;
