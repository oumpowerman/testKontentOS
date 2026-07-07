import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FileText, XCircle } from 'lucide-react';
import { LeaveRequest } from '../../../types/attendance';
import { useGlobalDialog } from '../../../context/GlobalDialogContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useMasterData } from '../../../hooks/useMasterData';
import { RequestDetailModal } from './RequestDetailModal';
import MultiDatePickerModal from '../../ui/MultiDatePickerModal';

// Modularized Components
import { ApprovalFilterBar } from './approval/ApprovalFilterBar';
import { ApprovalCategorySelector } from './approval/ApprovalCategorySelector';
import { ApprovalRequestCard } from './approval/ApprovalRequestCard';
import { ApprovalPagination } from './approval/ApprovalPagination';

interface LeaveApprovalListProps {
    requests: LeaveRequest[];
    isLoading: boolean;
    isLoadingHistorical?: boolean;
    fetchRequestsForRange?: (start?: Date, end?: Date) => Promise<LeaveRequest[]>;
    onApprove: (
        req: LeaveRequest, 
        customOtHours?: number, 
        customStartTime?: string, 
        customEndTime?: string
    ) => Promise<void>;
    onReject: (id: string, reason: string) => Promise<void>;
}

type HistoryFilter = 'ALL' | 'APPROVED' | 'REJECTED';
type RequestCategory = 'ALL' | 'LEAVE' | 'LATE_FORGOT' | 'OT';

const LeaveApprovalList: React.FC<LeaveApprovalListProps> = ({ 
    requests, 
    isLoading, 
    isLoadingHistorical = false, 
    fetchRequestsForRange, 
    onApprove, 
    onReject 
}) => {
    const { showAlert, showConfirm } = useGlobalDialog();
    const { annualHolidays, calendarExceptions } = useMasterData();
    const [filterStatus, setFilterStatus] = useState<'PENDING' | 'HISTORY'>('PENDING');
    const [historySubFilter, setHistorySubFilter] = useState<HistoryFilter>('ALL');
    
    // State for Rejection Modal
    const [rejectingId, setRejectingId] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // State for Request Detail Modal
    const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);

    const [activeCategory, setActiveCategory] = useState<RequestCategory>('ALL');

    // Date/Month Filtering State
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
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Historical Cache & Window Check (60 days)
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
    const currentCacheKey = `${selectedYear}-${selectedMonth}`;
    const isCurrentMonthCached = !!historicalCache[currentCacheKey];

    useEffect(() => {
        if (!isMonthFilterEnabled || isCustomRangeEnabled || !fetchRequestsForRange) return;
        if (!isOutsideSixtyDays(selectedMonth, selectedYear)) return;
        if (isCurrentMonthCached) return; // already cached

        const loadHistorical = async () => {
            setIsLocalLoading(true);
            try {
                const startOfSelectedMonth = new Date(selectedYear, selectedMonth, 1);
                const endOfSelectedMonth = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59);
                const data = await fetchRequestsForRange(startOfSelectedMonth, endOfSelectedMonth);
                setHistoricalCache(prev => ({
                    ...prev,
                    [currentCacheKey]: data
                }));
            } catch (err) {
                console.error("Failed to fetch historical requests", err);
            } finally {
                setIsLocalLoading(false);
            }
        };

        loadHistorical();
    }, [selectedMonth, selectedYear, isMonthFilterEnabled, isCustomRangeEnabled, fetchRequestsForRange, isCurrentMonthCached, sixtyDaysAgo]);

    // On-Demand Fetching Effect for Show All (Full History)
    useEffect(() => {
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

    const handleCustomRangeConfirm = async (startDate: Date, endDate: Date) => {
        setIsDatePickerOpen(false);
        setCustomRange({ start: startDate, end: endDate });
        setIsCustomRangeEnabled(true);
        setIsMonthFilterEnabled(false);
        setCurrentPage(1);
        setActiveCategory('ALL');

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

        return uniq.sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return dateB - dateA;
        });
    }, [requests, historicalCache, selectedMonth, selectedYear, isMonthFilterEnabled, isCustomRangeEnabled, customRangeRequests, allRequestsLoaded, sixtyDaysAgo]);

    const isCategoryDimmed = (cat: 'LEAVE' | 'LATE_FORGOT' | 'OT') => {
        return activeCategory !== 'ALL' && activeCategory !== cat;
    };

    const handleCategoryClick = (cat: 'LEAVE' | 'LATE_FORGOT' | 'OT') => {
        setActiveCategory(prev => prev === cat ? 'ALL' : cat);
        setCurrentPage(1);
    };

    const tabRequests = useMemo(() => {
        let base = combinedRequests.filter(r => 
            filterStatus === 'PENDING' ? r.status === 'PENDING' : r.status !== 'PENDING'
        );

        if (filterStatus === 'HISTORY') {
            base = base.filter(req => {
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

            if (historySubFilter === 'APPROVED') base = base.filter(r => r.status === 'APPROVED');
            if (historySubFilter === 'REJECTED') base = base.filter(r => r.status === 'REJECTED');
        }

        return base;
    }, [combinedRequests, filterStatus, historySubFilter, isCustomRangeEnabled, customRange, isMonthFilterEnabled, selectedMonth, selectedYear]);

    const counts = useMemo(() => {
        const leaves = ['SICK', 'VACATION', 'PERSONAL', 'EMERGENCY', 'WFH'];
        const lateForgot = ['LATE_ENTRY', 'FORGOT_CHECKIN', 'FORGOT_CHECKOUT', 'FORGOT_BOTH'];
        const ot = ['OVERTIME'];

        return {
            LEAVE: tabRequests.filter(r => leaves.includes(r.type)).length,
            LATE_FORGOT: tabRequests.filter(r => lateForgot.includes(r.type)).length,
            OT: tabRequests.filter(r => ot.includes(r.type)).length
        };
    }, [tabRequests]);

    const filteredRequests = useMemo(() => {
        let base = [...tabRequests];

        if (activeCategory === 'LEAVE') {
            const leaves = ['SICK', 'VACATION', 'PERSONAL', 'EMERGENCY', 'WFH'];
            base = base.filter(r => leaves.includes(r.type));
        } else if (activeCategory === 'LATE_FORGOT') {
            const lateForgot = ['LATE_ENTRY', 'FORGOT_CHECKIN', 'FORGOT_CHECKOUT', 'FORGOT_BOTH'];
            base = base.filter(r => lateForgot.includes(r.type));
        } else if (activeCategory === 'OT') {
            const ot = ['OVERTIME'];
            base = base.filter(r => ot.includes(r.type));
        }

        base.sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return dateB - dateA;
        });

        return base;
    }, [tabRequests, activeCategory]);

    const paginatedRequests = useMemo(() => {
        if (filterStatus === 'PENDING') {
            return filteredRequests;
        }
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredRequests.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredRequests, filterStatus, currentPage, itemsPerPage]);

    const totalPages = useMemo(() => {
        return Math.max(1, Math.ceil(filteredRequests.length / itemsPerPage));
    }, [filteredRequests, itemsPerPage]);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [totalPages, currentPage]);

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

    const showLoading = isLoading || isLoadingHistorical || isLocalLoading;

    const handleRejectClick = (id: string) => {
        setRejectingId(id);
        setRejectionReason('');
    };

    const handleConfirmReject = async () => {
        if (!rejectingId) return;
        if (!rejectionReason.trim()) {
            showAlert('กรุณาระบุเหตุผลในการปฏิเสธ', 'ข้อมูลไม่ครบ');
            return;
        }
        setIsSubmitting(true);
        await onReject(rejectingId, rejectionReason);
        setIsSubmitting(false);
        setRejectingId(null);
    };

    return (
        <div className="space-y-4">
            {/* Modular filter bar */}
            <ApprovalFilterBar 
                filterStatus={filterStatus}
                setFilterStatus={setFilterStatus}
                historySubFilter={historySubFilter}
                setHistorySubFilter={setHistorySubFilter}
                pendingCount={requests.filter(r => r.status === 'PENDING').length}
                isMonthFilterEnabled={isMonthFilterEnabled}
                setIsMonthFilterEnabled={setIsMonthFilterEnabled}
                isCustomRangeEnabled={isCustomRangeEnabled}
                setIsCustomRangeEnabled={setIsCustomRangeEnabled}
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                handlePrevMonth={handlePrevMonth}
                handleNextMonth={handleNextMonth}
                customRange={customRange}
                setIsDatePickerOpen={setIsDatePickerOpen}
                setCurrentPage={setCurrentPage}
                setActiveCategory={setActiveCategory}
            />

            {/* Modular Bento category totals */}
            <ApprovalCategorySelector 
                counts={counts}
                activeCategory={activeCategory}
                onCategoryClick={handleCategoryClick}
                isCategoryDimmed={isCategoryDimmed}
            />

            {/* List */}
            <div className="grid gap-4">
                {showLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
                        <p className="text-sm font-bold">กำลังดึงข้อมูลคำขอ...</p>
                    </div>
                ) : paginatedRequests.length === 0 ? (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-gray-100 text-gray-400"
                    >
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileText className="w-10 h-10 opacity-20" />
                        </div>
                        <p className="font-bold">ไม่มีรายการคำขอในหน้านี้</p>
                        <p className="text-xs mt-1">รายการใหม่ๆ จะปรากฏที่นี่เมื่อพนักงานส่งคำขอ</p>
                    </motion.div>
                ) : (
                    <motion.div layout className="space-y-4">
                        <AnimatePresence mode="popLayout">
                            {paginatedRequests.map((req) => (
                                <ApprovalRequestCard 
                                    key={req.id}
                                    request={req}
                                    onApprove={onApprove}
                                    onRejectClick={handleRejectClick}
                                    onViewDetail={setSelectedRequest}
                                    annualHolidays={annualHolidays}
                                    calendarExceptions={calendarExceptions}
                                />
                            ))}
                        </AnimatePresence>

                        {/* Modular Pagination */}
                        {filterStatus === 'HISTORY' && (
                            <ApprovalPagination 
                                currentPage={currentPage}
                                setCurrentPage={setCurrentPage}
                                totalPages={totalPages}
                                totalItems={filteredRequests.length}
                                itemsPerPage={itemsPerPage}
                            />
                        )}
                    </motion.div>
                )}
            </div>

            {/* Rejection Reason Modal */}
            {rejectingId && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 border-2 border-red-100 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full -mr-16 -mt-16 opacity-50"></div>
                        
                        <div className="relative">
                            <div className="w-16 h-16 bg-red-100 rounded-3xl flex items-center justify-center mb-6">
                                <XCircle className="w-8 h-8 text-red-500" />
                            </div>
                            
                            <h3 className="text-xl font-black text-gray-800 mb-2">ระบุเหตุผลการปฏิเสธ</h3>
                            <p className="text-sm text-gray-500 mb-6 font-medium">เพื่อให้พนักงานทราบเหตุผลและปรับปรุงแก้ไขในครั้งถัดไป</p>
                            
                            <textarea 
                                className="w-full p-4 border-2 border-gray-100 rounded-3xl text-sm focus:ring-4 focus:ring-red-50 focus:border-red-200 outline-none resize-none mb-6 transition-all"
                                rows={4}
                                placeholder="เช่น เอกสารไม่ครบ, วันลาหมด, หรือเหตุผลอื่นๆ..."
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                autoFocus
                                id="rejection-modal-reason-textarea"
                            />
                            
                            <div className="flex gap-3">
                                <button 
                                    type="button"
                                    onClick={() => setRejectingId(null)}
                                    disabled={isSubmitting}
                                    className="flex-1 py-3.5 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-2xl text-xs font-medium transition-colors outline-none cursor-pointer border border-gray-100"
                                    id="rejection-modal-cancel-btn"
                                >
                                    ยกเลิก
                                </button>
                                <button 
                                    type="button"
                                    onClick={handleConfirmReject}
                                    disabled={isSubmitting}
                                    className="flex-1 py-3.5 bg-red-500 hover:bg-red-600 text-white rounded-2xl text-xs font-bold shadow-lg shadow-red-100 transition-all active:scale-95 disabled:opacity-50 outline-none cursor-pointer"
                                    id="rejection-modal-submit-btn"
                                >
                                    {isSubmitting ? 'กำลังบันทึก...' : 'ยืนยันปฏิเสธ'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>,
                document.body
            )}

            {/* Request Detail Modal */}
            <AnimatePresence>
                {selectedRequest && (
                    <RequestDetailModal 
                        request={selectedRequest}
                        isOpen={true}
                        onClose={() => setSelectedRequest(null)}
                        onApprove={onApprove}
                        onReject={onReject}
                    />
                )}
            </AnimatePresence>

            {/* Multi Date Picker Modal */}
            <MultiDatePickerModal 
                isOpen={isDatePickerOpen}
                onClose={() => setIsDatePickerOpen(false)}
                onConfirm={handleCustomRangeConfirm}
            />
        </div>
    );
};

export default LeaveApprovalList;
