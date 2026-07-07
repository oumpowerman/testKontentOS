
import React, { useState, useMemo } from 'react';
import { LeaveRequest } from '../../../types/attendance';
import { format, differenceInDays } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import th from 'date-fns/locale/th';
import { 
    Clock, CheckCircle2, XCircle, Calendar, 
    FileText, AlertTriangle, ChevronDown, AlertCircle, Settings,
    ChevronLeft, ChevronRight, Loader2, MapPin, Moon
} from 'lucide-react';
import MultiDatePickerModal from '../../ui/MultiDatePickerModal';
import { parseReason } from '../leave-request/request-detail/utils';

interface MyRequestHistoryProps {
    requests: LeaveRequest[];
    fetchRequestsForRange?: (start?: Date, end?: Date) => Promise<LeaveRequest[]>;
    isLoadingHistorical?: boolean;
}

type FilterStatus = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';

const listVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.04
        }
    }
};

const cardVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { 
        opacity: 1, 
        y: 0,
        transition: { type: "spring" as const, stiffness: 350, damping: 28 }
    },
    exit: { opacity: 0, x: -8, transition: { duration: 0.15 } }
};

const MyRequestHistory: React.FC<MyRequestHistoryProps> = ({ 
    requests, 
    fetchRequestsForRange, 
    isLoadingHistorical = false 
}) => {
    const [filter, setFilter] = useState<FilterStatus>('ALL');
    const [isExpanded, setIsExpanded] = useState(false);

    // Month & Year Filter state (default: current month & year)
    const today = useMemo(() => new Date(), []);
    const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
    const [selectedYear, setSelectedYear] = useState(today.getFullYear());
    const [isMonthFilterEnabled, setIsMonthFilterEnabled] = useState(true);

    // Custom Date Range state
    const [isCustomRangeEnabled, setIsCustomRangeEnabled] = useState(false);
    const [customRange, setCustomRange] = useState<{ start: Date; end: Date } | null>(null);
    const [customRangeRequests, setCustomRangeRequests] = useState<LeaveRequest[]>([]);
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [isLocalLoading, setIsLocalLoading] = useState(false);

    // Show All (Full History) state
    const [allRequestsLoaded, setAllRequestsLoaded] = useState<LeaveRequest[]>([]);
    const [hasLoadedAll, setHasLoadedAll] = useState(false);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);

    // Historical Cache & Window Check
    const [historicalCache, setHistoricalCache] = useState<Record<string, LeaveRequest[]>>({});
    
    const sixtyDaysAgo = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() - 60);
        return d;
    }, []);

    const isOutsideSixtyDays = (month: number, year: number) => {
        const endOfSelectedMonth = new Date(year, month + 1, 0, 23, 59, 59);
        return endOfSelectedMonth < sixtyDaysAgo;
    };

    // On-Demand Fetching Effect for Monthly Filters
    React.useEffect(() => {
        if (!isMonthFilterEnabled || isCustomRangeEnabled || !fetchRequestsForRange) return;
        if (!isOutsideSixtyDays(selectedMonth, selectedYear)) return;

        const key = `${selectedYear}-${selectedMonth}`;
        if (historicalCache[key]) return; // already cached

        const loadHistorical = async () => {
            const startOfSelectedMonth = new Date(selectedYear, selectedMonth, 1);
            const endOfSelectedMonth = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59);
            const data = await fetchRequestsForRange(startOfSelectedMonth, endOfSelectedMonth);
            setHistoricalCache(prev => ({
                ...prev,
                [key]: data
            }));
        };

        loadHistorical();
    }, [selectedMonth, selectedYear, isMonthFilterEnabled, isCustomRangeEnabled, fetchRequestsForRange, historicalCache, sixtyDaysAgo]);

    // On-Demand Fetching Effect for Show All (Full History)
    React.useEffect(() => {
        if (isMonthFilterEnabled || isCustomRangeEnabled) return;
        if (hasLoadedAll || !fetchRequestsForRange) return;

        const loadAll = async () => {
            setIsLocalLoading(true);
            try {
                const data = await fetchRequestsForRange(); // No parameters = ALL
                setAllRequestsLoaded(data);
                setHasLoadedAll(true);
            } catch (err) {
                console.error("Failed to fetch all requests", err);
            } finally {
                setIsLocalLoading(false);
            }
        };

        loadAll();
    }, [isMonthFilterEnabled, isCustomRangeEnabled, hasLoadedAll, fetchRequestsForRange]);

    // Combined Requests (Default 60-day Context + Cached On-Demand)
    const combinedRequests = useMemo(() => {
        const key = `${selectedYear}-${selectedMonth}`;
        const historicalList = (isMonthFilterEnabled && isOutsideSixtyDays(selectedMonth, selectedYear))
            ? (historicalCache[key] || [])
            : [];
        
        const customList = isCustomRangeEnabled ? customRangeRequests : [];
        const showAllList = (!isMonthFilterEnabled && !isCustomRangeEnabled) ? allRequestsLoaded : [];
        
        const all = [...requests, ...historicalList, ...customList, ...showAllList];
        const seen = new Set<string>();
        const uniq = all.filter(item => {
            if (seen.has(item.id)) return false;
            seen.add(item.id);
            return true;
        });

        return uniq.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }, [requests, historicalCache, selectedMonth, selectedYear, isMonthFilterEnabled, isCustomRangeEnabled, customRangeRequests, allRequestsLoaded, sixtyDaysAgo]);

    const handleCustomRangeConfirm = async (startDate: Date, endDate: Date) => {
        setIsDatePickerOpen(false);
        setCustomRange({ start: startDate, end: endDate });
        setIsCustomRangeEnabled(true);
        setIsMonthFilterEnabled(false);
        setCurrentPage(1);

        if (fetchRequestsForRange) {
            setIsLocalLoading(true);
            try {
                const data = await fetchRequestsForRange(startDate, endDate);
                setCustomRangeRequests(data);
            } catch (err) {
                console.error("Failed to fetch custom range requests", err);
            } finally {
                setIsLocalLoading(false);
            }
        }
    };

    const formatThaiRange = (start: Date, end: Date) => {
        const months = [
            'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
            'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
        ];
        const startDay = start.getDate();
        const startMonth = months[start.getMonth()];
        const startYear = start.getFullYear() + 543;

        const endDay = end.getDate();
        const endMonth = months[end.getMonth()];
        const endYear = end.getFullYear() + 543;

        return `${startDay} ${startMonth} ${startYear} - ${endDay} ${endMonth} ${endYear}`;
    };

    const showLoading = isLoadingHistorical || isLocalLoading;

    const handlePrevMonth = () => {
        if (selectedMonth === 0) {
            setSelectedMonth(11);
            setSelectedYear(prev => prev - 1);
        } else {
            setSelectedMonth(prev => prev - 1);
        }
        setCurrentPage(1);
    };

    const handleNextMonth = () => {
        if (selectedMonth === 11) {
            setSelectedMonth(0);
            setSelectedYear(prev => prev + 1);
        } else {
            setSelectedMonth(prev => prev + 1);
        }
        setCurrentPage(1);
    };

    const getThaiMonthYearLabel = (month: number, year: number) => {
        const months = [
            'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
            'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
        ];
        return `${months[month]} ${year + 543}`;
    };

    // Overall Stats for Collapsed Header Badges
    const overallStats = useMemo(() => ({
        pending: combinedRequests.filter(r => r.status === 'PENDING').length,
        rejected: combinedRequests.filter(r => r.status === 'REJECTED').length
    }), [combinedRequests]);

    // 1. Filter by Month/Year first OR Custom Date Range
    const monthFilteredRequests = useMemo(() => {
        return combinedRequests.filter(req => {
            if (isCustomRangeEnabled && customRange) {
                const reqDate = new Date(req.startDate);
                const start = new Date(customRange.start.getFullYear(), customRange.start.getMonth(), customRange.start.getDate());
                const end = new Date(customRange.end.getFullYear(), customRange.end.getMonth(), customRange.end.getDate(), 23, 59, 59);
                return reqDate >= start && reqDate <= end;
            }
            if (!isMonthFilterEnabled) return true;
            const start = new Date(req.startDate);
            return start.getMonth() === selectedMonth && start.getFullYear() === selectedYear;
        });
    }, [combinedRequests, selectedMonth, selectedYear, isMonthFilterEnabled, isCustomRangeEnabled, customRange]);

    // 2. Compute Tab Stats based on month/year filtered requests
    const stats = useMemo(() => ({
        pending: monthFilteredRequests.filter(r => r.status === 'PENDING').length,
        rejected: monthFilteredRequests.filter(r => r.status === 'REJECTED').length,
        approved: monthFilteredRequests.filter(r => r.status === 'APPROVED').length
    }), [monthFilteredRequests]);

    // 3. Filter by Status Tab
    const finalRequests = useMemo(() => {
        return monthFilteredRequests.filter(r => {
            if (filter === 'ALL') return true;
            return r.status === filter;
        });
    }, [monthFilteredRequests, filter]);

    // 4. Calculate pagination bounds and slice
    const totalPages = Math.max(1, Math.ceil(finalRequests.length / itemsPerPage));
    const paginatedRequests = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return finalRequests.slice(startIndex, startIndex + itemsPerPage);
    }, [finalRequests, currentPage, itemsPerPage]);

    // Keep currentPage within bounds when items change
    React.useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [totalPages, currentPage]);

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'APPROVED': return { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', icon: CheckCircle2, label: 'อนุมัติแล้ว' };
            case 'REJECTED': return { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: XCircle, label: 'ถูกปฏิเสธ' };
            default: return { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', icon: Clock, label: 'รออนุมัติ' };
        }
    };

    const getLeaveLabel = (type: string) => {
        const labels: Record<string, string> = {
            'LATE_ENTRY': '⏰ ขอเข้าสาย (Late)',
            'SICK': '🤢 ลาป่วย (Sick)',
            'VACATION': '🏖️ ลาพักร้อน (Vacation)',
            'PERSONAL': '💼 ลากิจ (Business)',
            'EMERGENCY': '🚨 ฉุกเฉิน (Emergency)',
            'WFH': '🏠 WFH (Work From Home)',
            'FORGOT_CHECKIN': '🕒 ลืม Check-in',
            'FORGOT_CHECKOUT': '🏃 ลืม Check-out (แก้เวลาออก)',
            'OVERTIME': '🌙 ขอ OT'
        };
        return labels[type] || type;
    };

    if (requests.length === 0 && combinedRequests.length === 0 && !showLoading) return null;

    return (
        <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm overflow-hidden mb-6 transition-all duration-300">
            {/* Header / Toggle */}
            <div 
                onClick={() => setIsExpanded(!isExpanded)}
                className={`w-full flex items-center justify-between px-5 py-4 cursor-pointer transition-colors select-none ${isExpanded ? 'bg-indigo-50/50' : 'bg-white hover:bg-gray-50'}`}
            >
                <div className="flex items-center gap-3">
                    <motion.div 
                        animate={{ scale: isExpanded ? 1.05 : 1 }}
                        className={`p-2 rounded-xl transition-colors ${isExpanded ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}
                    >
                        <FileText className="w-5 h-5" />
                    </motion.div>
                    <div>
                        <h3 className="font-bold text-gray-800 text-sm">ประวัติคำขอ (My Requests)</h3>
                        <p className="text-[10px] text-gray-400">ติดตามสถานะการลาและการขออนุญาต</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {!isExpanded && (
                        <div className="flex gap-1 shrink-0">
                             {overallStats.pending > 0 && <span className="text-[10px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-bold whitespace-nowrap">{overallStats.pending} รอ</span>}
                             {overallStats.rejected > 0 && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold whitespace-nowrap">{overallStats.rejected} ปฏิเสธ</span>}
                        </div>
                    )}
                    <motion.div 
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className="text-gray-400"
                    >
                        <ChevronDown className="w-5 h-5" />
                    </motion.div>
                </div>
            </div>

            {/* Content Body */}
            <AnimatePresence initial={false}>
                {isExpanded && (
                    <motion.div
                        key="request-history-body"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                    >
                        <div className="p-4 border-t border-indigo-100 bg-[#f8fafc]">
                            
                            {/* Month & Year Filter Widget */}
                            <div className="bg-white p-4 rounded-xl border border-indigo-50 shadow-sm mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-bold text-gray-500">กรองช่วงเวลา:</span>
                                    
                                    {/* Monthly Filter Button */}
                                    <button
                                        onClick={() => {
                                            setIsMonthFilterEnabled(true);
                                            setIsCustomRangeEnabled(false);
                                            setCurrentPage(1);
                                        }}
                                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border outline-none cursor-pointer ${
                                            (isMonthFilterEnabled && !isCustomRangeEnabled)
                                                ? 'bg-indigo-50 text-indigo-600 border-indigo-200 shadow-sm' 
                                                : 'bg-gray-50 text-gray-400 border-gray-200'
                                        }`}
                                    >
                                        {(isMonthFilterEnabled && !isCustomRangeEnabled) ? '✓ กรองรายเดือน' : 'กรองรายเดือน'}
                                    </button>

                                    {/* Custom Range Button */}
                                    <button
                                        onClick={() => {
                                            setIsDatePickerOpen(true);
                                        }}
                                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border outline-none cursor-pointer flex items-center gap-1.5 ${
                                            isCustomRangeEnabled 
                                                ? 'bg-indigo-50 text-indigo-600 border-indigo-200 shadow-sm' 
                                                : 'bg-gray-50 text-gray-400 border-gray-200'
                                        }`}
                                    >
                                        <span>📅 {isCustomRangeEnabled ? '✓ ช่วงวันที่กำหนดเอง' : 'เลือกช่วงวันที่กำหนดเอง'}</span>
                                    </button>

                                    {/* Show All Button */}
                                    <button
                                        onClick={() => {
                                            setIsMonthFilterEnabled(false);
                                            setIsCustomRangeEnabled(false);
                                            setCurrentPage(1);
                                        }}
                                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border outline-none cursor-pointer ${
                                            (!isMonthFilterEnabled && !isCustomRangeEnabled)
                                                ? 'bg-indigo-50 text-indigo-600 border-indigo-200 shadow-sm' 
                                                : 'bg-gray-50 text-gray-400 border-gray-200'
                                        }`}
                                    >
                                        {(!isMonthFilterEnabled && !isCustomRangeEnabled) ? '✓ แสดงทั้งหมด' : 'แสดงทั้งหมด'}
                                    </button>
                                </div>

                                {isMonthFilterEnabled && !isCustomRangeEnabled && (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handlePrevMonth}
                                            className="p-1 rounded-lg hover:bg-gray-100 border border-gray-200 text-gray-500 transition-colors cursor-pointer outline-none"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        <span className="text-xs font-black text-gray-700 min-w-[110px] text-center bg-gray-50 px-3 py-2 rounded-lg border border-gray-200/50 font-mono">
                                            {getThaiMonthYearLabel(selectedMonth, selectedYear)}
                                        </span>
                                        <button
                                            onClick={handleNextMonth}
                                            className="p-1 rounded-lg hover:bg-gray-100 border border-gray-200 text-gray-500 transition-colors cursor-pointer outline-none"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}

                                {isCustomRangeEnabled && customRange && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5" />
                                            <span>แสดงระหว่าง: <span className="font-bold">{formatThaiRange(customRange.start, customRange.end)}</span></span>
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Filter Tabs */}
                            <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
                                {[
                                    { id: 'ALL', label: 'ทั้งหมด' },
                                    { id: 'PENDING', label: 'รออนุมัติ', count: stats.pending, activeClass: 'bg-orange-500 text-white shadow-orange-200' },
                                    { id: 'APPROVED', label: 'สำเร็จ', count: stats.approved, activeClass: 'bg-green-500 text-white shadow-green-200' },
                                    { id: 'REJECTED', label: 'ไม่ผ่าน', count: stats.rejected, activeClass: 'bg-red-500 text-white shadow-red-200' }
                                ].map((tab) => (
                                    <motion.button
                                        key={tab.id}
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                        onClick={() => {
                                            setFilter(tab.id as FilterStatus);
                                            setCurrentPage(1);
                                        }}
                                        className={`
                                            px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap shadow-sm border cursor-pointer outline-none
                                            ${filter === tab.id 
                                                ? `${tab.activeClass || 'bg-indigo-600 text-white shadow-indigo-200'} border-transparent` 
                                                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                                            }
                                        `}
                                    >
                                        {tab.label} {(tab.count !== undefined) ? `(${tab.count})` : ''}
                                    </motion.button>
                                ))}
                            </div>

                            {/* Request List */}
                            <motion.div 
                                layout
                                variants={listVariants}
                                initial="hidden"
                                animate="visible"
                                className="space-y-3"
                            >
                                <AnimatePresence mode="popLayout">
                                    {showLoading ? (
                                        <motion.div 
                                            key="historical-loading-state"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="flex flex-col items-center justify-center py-12 text-indigo-500 gap-2"
                                        >
                                            <Loader2 className="w-8 h-8 animate-spin" />
                                            <span className="text-xs text-gray-500 font-bold">กำลังดึงข้อมูลประวัติย้อนหลัง...</span>
                                        </motion.div>
                                    ) : paginatedRequests.length === 0 ? (
                                        <motion.div 
                                            key="empty-state"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="text-center py-8 text-gray-400 text-xs"
                                        >
                                            ไม่พบรายการในหมวดนี้
                                        </motion.div>
                                    ) : (
                                        paginatedRequests.map((req) => {
                                            const status = getStatusConfig(req.status);
                                            const StatusIcon = status.icon;
                                            const daysCount = differenceInDays(new Date(req.endDate), new Date(req.startDate)) + 1;

                                            // Parse the reason and build a friendly user display
                                            const parsed = parseReason(req.reason);
                                            let displayReason = parsed.cleanReason;

                                            if (!displayReason) {
                                                if (parsed.forgotCheckoutPenalty) {
                                                    displayReason = "ลืมบันทึกเวลาออกงาน (ระบบบันทึกเวลาและปรับลดคะแนนอัตโนมัติ)";
                                                } else if (req.type === 'FORGOT_CHECKIN' || req.type === 'LATE_ENTRY') {
                                                    displayReason = "แจ้งขอปรับปรุงข้อมูลเวลาเข้างาน";
                                                } else if (req.type === 'FORGOT_CHECKOUT') {
                                                    displayReason = "แจ้งขอปรับปรุงข้อมูลเวลาออกงาน";
                                                } else {
                                                    displayReason = "แจ้งขอปรับปรุงข้อมูลเวลาปฏิบัติงาน";
                                                }
                                            }

                                            return (
                                                <motion.div 
                                                    key={req.id}
                                                    variants={cardVariants}
                                                    layout="position"
                                                    className={`
                                                        bg-white p-4 rounded-xl border-l-4 shadow-sm transition-all hover:shadow-md
                                                        ${status.border} ${req.status === 'REJECTED' ? 'border-l-red-500' : req.status === 'APPROVED' ? 'border-l-green-500' : 'border-l-orange-400'}
                                                    `}
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className={`text-xs font-black px-2 py-1 rounded-md border ${status.bg} ${status.color} ${status.border} flex items-center gap-1`}>
                                                                <StatusIcon className="w-3 h-3" /> {status.label}
                                                            </span>
                                                            <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded-md">
                                                                {getLeaveLabel(req.type)}
                                                            </span>
                                                        </div>
                                                        <span className="text-[10px] text-gray-400 font-mono">
                                                            {format(req.createdAt, 'd MMM HH:mm')}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-start gap-3 mt-3">
                                                        <div className="p-2 bg-gray-50 rounded-lg shrink-0 text-gray-400">
                                                            <Calendar className="w-5 h-5" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 text-sm font-bold text-gray-800 flex-wrap">
                                                                <span>{format(new Date(req.startDate), 'd MMM yyyy')}</span>
                                                                {/* Show date range only if different */}
                                                                {daysCount > 1 && req.type !== 'LATE_ENTRY' && req.type !== 'FORGOT_CHECKIN' && req.type !== 'FORGOT_CHECKOUT' && (
                                                                    <>
                                                                        <span className="text-gray-400">-</span>
                                                                        <span>{format(new Date(req.endDate), 'd MMM yyyy')}</span>
                                                                        <span className="text-[10px] font-medium text-indigo-500 bg-indigo-50 px-2 rounded ml-1">
                                                                            ({daysCount} วัน)
                                                                        </span>
                                                                    </>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-gray-600 mt-1 italic whitespace-pre-line">
                                                                "{displayReason}"
                                                            </p>

                                                            {/* Custom Detail Badges */}
                                                            {(parsed.time || parsed.isLateSubmission || parsed.isLocationMismatch || parsed.otHours) && (
                                                                <div className="flex flex-wrap gap-1.5 mt-2">
                                                                    {parsed.time && (
                                                                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-700 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded">
                                                                            <Clock className="w-3 h-3" />
                                                                            <span>เวลา: {parsed.time} น.</span>
                                                                        </span>
                                                                    )}
                                                                    {parsed.isLateSubmission && (
                                                                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded">
                                                                            <AlertTriangle className="w-3 h-3" />
                                                                            <span>ส่งคำขอช้ากว่ากำหนด</span>
                                                                        </span>
                                                                    )}
                                                                    {parsed.isLocationMismatch && (
                                                                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded">
                                                                            <MapPin className="w-3 h-3" />
                                                                            <span>พิกัดภายนอกพื้นที่ทำงาน</span>
                                                                        </span>
                                                                    )}
                                                                    {parsed.otHours && (
                                                                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded">
                                                                            <Moon className="w-3 h-3" />
                                                                            <span>OT: {parsed.otHours} ชม.</span>
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {/* Rejection Reason (Highlight) */}
                                                            {req.status === 'APPROVED' && req.rejectionReason && (
                                                                 <div className="mt-3 bg-indigo-50 p-2 rounded-lg border border-indigo-100 flex items-start gap-2">
                                                                     <Settings className="w-4 h-4 text-indigo-600 shrink-0 mt-1 animate-pulse" />
                                                                     <div>
                                                                         <p className="text-[10px] font-bold text-indigo-700 uppercase mb-1">
                                                                             บันทึกการอนุมัติ/ปรับแก้เวลาจากแอดมิน:
                                                                         </p>
                                                                         <p className="text-xs text-indigo-800 font-medium whitespace-pre-line">
                                                                             {req.rejectionReason}
                                                                         </p>
                                                                     </div>
                                                                 </div>
                                                             )}

                                                             {req.status === 'REJECTED' && req.rejectionReason && (
                                                                <div className="mt-3 bg-red-50 p-2 rounded-lg border border-red-100 flex items-start gap-2">
                                                                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-1" />
                                                                    <div>
                                                                        <p className="text-[10px] font-bold text-red-700 uppercase mb-1">
                                                                            เหตุผลที่ไม่อนุมัติ:
                                                                        </p>
                                                                        <p className="text-xs text-red-600 font-medium">
                                                                            {req.rejectionReason}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })
                                    )}
                                </AnimatePresence>
                            </motion.div>

                            {/* Pagination Controls */}
                            {finalRequests.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                                    {/* Items Per Page Selector */}
                                    <div className="flex items-center gap-2 text-gray-500 font-medium">
                                        <span>แสดงคำขอ</span>
                                        <select
                                            value={itemsPerPage}
                                            onChange={(e) => {
                                                setItemsPerPage(Number(e.target.value));
                                                setCurrentPage(1);
                                            }}
                                            className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs font-bold text-gray-700 focus:outline-none focus:border-indigo-300"
                                        >
                                            {[5, 10, 20, 50].map(val => (
                                                <option key={val} value={val}>{val}</option>
                                            ))}
                                        </select>
                                        <span>รายการ/หน้า</span>
                                    </div>

                                    {/* Current Page Indicators */}
                                    <div className="flex items-center gap-2">
                                        <button
                                            disabled={currentPage === 1}
                                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                            className={`p-1 px-3 py-2 rounded-lg border text-xs font-bold transition-all flex items-center gap-1 cursor-pointer outline-none ${
                                                currentPage === 1 
                                                    ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed' 
                                                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                            }`}
                                        >
                                            <ChevronLeft className="w-3 h-3" /> ย้อนกลับ
                                        </button>

                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => {
                                                if (
                                                    totalPages > 6 &&
                                                    pageNum !== 1 &&
                                                    pageNum !== totalPages &&
                                                    Math.abs(pageNum - currentPage) > 1
                                                ) {
                                                    if (pageNum === 2 && currentPage > 3) {
                                                        return <span key="ellipsis-start" className="text-gray-400 px-1 font-mono">...</span>;
                                                    }
                                                    if (pageNum === totalPages - 1 && currentPage < totalPages - 2) {
                                                        return <span key="ellipsis-end" className="text-gray-400 px-1 font-mono">...</span>;
                                                    }
                                                    return null;
                                                }

                                                return (
                                                    <button
                                                        key={pageNum}
                                                        onClick={() => setCurrentPage(pageNum)}
                                                        className={`w-8 h-8 rounded-lg text-xs font-black transition-all cursor-pointer outline-none ${
                                                            currentPage === pageNum
                                                                ? 'bg-indigo-600 text-white shadow-sm'
                                                                : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        <button
                                            disabled={currentPage === totalPages}
                                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                            className={`p-1 px-3 py-2 rounded-lg border text-xs font-bold transition-all flex items-center gap-1 cursor-pointer outline-none ${
                                                currentPage === totalPages 
                                                    ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed' 
                                                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                            }`}
                                        >
                                            ถัดไป <ChevronRight className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Multi Date Picker Modal for Custom Range */}
            <MultiDatePickerModal
                isOpen={isDatePickerOpen}
                onClose={() => setIsDatePickerOpen(false)}
                onConfirm={handleCustomRangeConfirm}
                initialStartDate={customRange?.start || new Date()}
                initialEndDate={customRange?.end || new Date()}
            />
        </div>
    );
};

export default MyRequestHistory;
