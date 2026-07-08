import React from 'react';
import { format } from 'date-fns';
import th from 'date-fns/locale/th';
import { ChevronLeft, ChevronRight, Search, Calendar, Briefcase, UserX, UserCheck, Download, Minimize2, SlidersHorizontal } from 'lucide-react';
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
    isToolsExpanded: boolean;
    setIsToolsExpanded: (expanded: boolean) => void;
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
    onExportCSV,
    isToolsExpanded,
    setIsToolsExpanded
}) => {
    const [isFullyExpanded, setIsFullyExpanded] = React.useState(false);

    React.useEffect(() => {
        if (!isToolsExpanded) {
            setIsFullyExpanded(false);
        }
    }, [isToolsExpanded]);

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
            
            <div className="flex flex-col gap-2.5 relative z-10 w-full">
                {/* Row 1: Always Visible Header, Switcher, and Main Filter/Search */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 w-full">
                    {/* Left Side: Icon + Title + Switcher */}
                    <motion.div variants={itemVariants} className="flex flex-row items-center gap-4 shrink-0">
                        <motion.div 
                            whileHover={{ scale: 1.05, rotate: 5 }}
                            whileTap={{ scale: 0.95 }}
                            className="p-3 bg-indigo-50/80 rounded-2xl border border-indigo-100 text-indigo-500 shrink-0 shadow-inner cursor-pointer hidden sm:block"
                        >
                            <Calendar className="w-6 h-6" />
                        </motion.div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">Timesheet Central</h2>
                            
                            {/* Premium Slider Capsule next to title */}
                            <div className="relative bg-slate-100/80 p-0.5 rounded-xl border border-slate-200/50 flex items-center shrink-0 w-[130px] h-8 select-none shadow-sm">
                                {(['WEEK', 'MONTH'] as const).map((mode) => {
                                    const isActive = viewMode === mode;
                                    return (
                                        <button
                                            key={mode}
                                            onClick={() => setViewMode(mode)}
                                            className="relative flex-1 h-full flex items-center justify-center rounded-lg text-[10px] sm:text-xs font-black transition-all cursor-pointer select-none outline-none z-10"
                                        >
                                            <span className={`relative z-20 transition-colors duration-200 uppercase tracking-wider ${isActive ? 'text-indigo-600 font-extrabold' : 'text-slate-400 hover:text-slate-700 font-bold'}`}>
                                                {mode}
                                            </span>
                                            {isActive && (
                                                <motion.div
                                                    layoutId="activeHeaderViewMode"
                                                    className="absolute inset-0 bg-white rounded-lg shadow-sm border border-slate-200/40 z-10"
                                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                                />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>

                    {/* Right Side: Department Filter, Search Input, and Toggle Drawer Button */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                        {/* Filter Department */}
                        <div className="w-full sm:w-56 shrink-0">
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
                        </div>

                        {/* Search Input */}
                        <div className="relative w-full sm:w-56 shrink-0">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="ค้นหาชื่อลูกทีม..." 
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-300 text-xs font-bold text-slate-700 placeholder-slate-400 transition-all hover:bg-slate-100/50 focus:bg-white h-10"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Toggle Tools/Filters Button (Square Icon-only) */}
                        <motion.button
                            variants={itemVariants}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsToolsExpanded(!isToolsExpanded)}
                            className={`flex items-center justify-center w-10 h-10 rounded-2xl border transition-all duration-200 shadow-sm shrink-0 cursor-pointer select-none outline-none ${
                                isToolsExpanded 
                                    ? 'bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100/80 shadow-indigo-100/50' 
                                    : 'bg-slate-50 border-slate-200/80 text-slate-500 hover:text-indigo-600 hover:bg-slate-100'
                            }`}
                            title={isToolsExpanded ? "ซ่อนเครื่องมือเพิ่มเติม" : "แสดงเครื่องมือเพิ่มเติม"}
                        >
                            <AnimatePresence mode="wait" initial={false}>
                                <motion.div
                                    key={isToolsExpanded ? 'expanded' : 'collapsed'}
                                    initial={{ opacity: 0, scale: 0.8, rotate: isToolsExpanded ? -45 : 45 }}
                                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                    exit={{ opacity: 0, scale: 0.8, rotate: isToolsExpanded ? 45 : -45 }}
                                    transition={{ duration: 0.15 }}
                                    className="flex items-center justify-center"
                                >
                                    {isToolsExpanded ? (
                                        <Minimize2 className="w-4 h-4" />
                                    ) : (
                                        <SlidersHorizontal className="w-4 h-4" />
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </motion.button>
                    </div>
                </div>

                {/* Row 2: Collapsible Control Drawer (Date Selection + Export/Hide Inactive) */}
                <AnimatePresence initial={false}>
                    {isToolsExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0, marginTop: 0 }}
                            animate={{ height: "auto", opacity: 1, marginTop: 4 }}
                            exit={{ height: 0, opacity: 0, marginTop: 0 }}
                            transition={{ duration: 0.25, ease: "easeInOut" }}
                            onAnimationComplete={() => {
                                if (isToolsExpanded) {
                                    setIsFullyExpanded(true);
                                }
                            }}
                            className={`${isFullyExpanded ? 'overflow-visible' : 'overflow-hidden'} w-full relative z-20 border-t border-slate-100/50 pt-2`}
                        >
                            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 w-full">
                                {/* Left Side: Date Selection Controls */}
                                <div className="flex items-center justify-between sm:justify-start gap-3 bg-slate-50/80 p-1 rounded-xl border border-slate-200/50 backdrop-blur-sm w-full md:w-fit shrink-0">
                                    <button 
                                        onClick={() => onNav(-1)} 
                                        className="p-1.5 hover:bg-slate-200/50 text-slate-500 hover:text-slate-800 rounded-lg transition-all active:scale-90 cursor-pointer" 
                                        aria-label="ก่อนหน้า"
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
                                        aria-label="ถัดไป"
                                    >
                                        <ChevronRight className="w-4 h-4"/>
                                    </button>
                                </div>

                                {/* Right Side: Actions (Export CSV, Hide Inactive) */}
                                <div className="flex flex-row items-center gap-3 justify-end w-full sm:w-auto">
                                    {onExportCSV && (
                                        <motion.button 
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={onExportCSV}
                                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 h-10 px-4 bg-emerald-50/80 hover:bg-emerald-100 border border-emerald-100 hover:border-emerald-200 text-emerald-700 rounded-2xl text-xs font-bold transition-all shadow-sm cursor-pointer select-none shrink-0"
                                            title="ส่งออกไฟล์รายงานในรูปแบบ CSV"
                                        >
                                            <Download className="w-4 h-4 text-emerald-600" />
                                            <span className="hidden sm:inline">ส่งออกรายงาน (CSV) 📥</span>
                                            <span className="sm:hidden">EXPORT CSV</span>
                                        </motion.button>
                                    )}

                                    <motion.button 
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setShowInactive(!showInactive)}
                                        className={`flex-1 sm:flex-none flex items-center justify-center gap-2 h-10 px-4 rounded-2xl text-xs font-bold transition-all border shrink-0 cursor-pointer select-none outline-none ${
                                            showInactive 
                                            ? 'bg-rose-50/80 border-rose-100 text-rose-600 hover:bg-rose-100' 
                                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                        }`}
                                        title={showInactive ? "ซ่อนสมาชิกที่ลาออก" : "แสดงสมาชิกที่ลาออก"}
                                    >
                                        {showInactive ? <UserCheck className="w-4 h-4 text-rose-500" /> : <UserX className="w-4 h-4 text-slate-400" />}
                                        <span>{showInactive ? 'SHOWING INACTIVE' : 'HIDE INACTIVE'}</span>
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

export default TimesheetHeader;
