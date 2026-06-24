import React from 'react';
import { LeaveType } from '../../../types/attendance';
import MyRequestHistory from './MyRequestHistory'; 
import LeaveRequestModal from '../leave-request/LeaveRequestModal'; 
import { useAttendanceHistoryEngine } from './useAttendanceHistoryEngine';
import AttendanceFilters from './subcomponents/AttendanceFilters';
import AttendanceTable from './subcomponents/AttendanceTable';
import AttendanceProofModal from './subcomponents/AttendanceProofModal';

interface AttendanceHistoryProps {
    userId: string;
}

const AttendanceHistory: React.FC<AttendanceHistoryProps> = ({ userId }) => {
    const {
        page,
        setPage,
        filters,
        isFetching,
        historyLogs,
        totalCount,
        totalPages,
        targetUser,
        myRequests,
        handleFilterChange,
        resetFilters,
        viewProofUrl,
        setViewProofUrl,
        resubmitLog,
        setResubmitLog,
        isResubmitOpen,
        setIsResubmitOpen,
        handleResubmit,
        handleResubmitSubmit,
        fetchData,
        isLate,
        getProofUrl,
        getLocationDisplay,
        getWorkHours,
        getStatusConfig,
        holidays,
        exceptions,
        PAGE_SIZE
    } = useAttendanceHistoryEngine(userId);

    return (
        <div className="space-y-8">
            {/* --- SECTION 1: REQUESTS (คำขอต่างๆ) --- */}
            <div className="animate-in fade-in slide-in-from-top-4">
                 <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3 ml-1">
                     รายการคำขอ (Requests)
                 </h3>
                 <MyRequestHistory requests={myRequests} />
            </div>

            {/* --- SECTION 2: ATTENDANCE LOGS (ประวัติเวลา) --- */}
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest ml-1">
                    บันทึกเวลา (Time Logs)
                </h3>

                {/* --- Filter Bar --- */}
                <AttendanceFilters 
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onReset={resetFilters}
                    onRefresh={fetchData}
                    isFetching={isFetching}
                />

                {/* --- Data Table --- */}
                <AttendanceTable 
                    isFetching={isFetching}
                    historyLogs={historyLogs}
                    targetUser={targetUser}
                    isLate={isLate}
                    getProofUrl={getProofUrl}
                    getLocationDisplay={getLocationDisplay}
                    getWorkHours={getWorkHours}
                    getStatusConfig={getStatusConfig}
                    holidays={holidays}
                    exceptions={exceptions}
                    onResubmit={handleResubmit}
                    onViewProof={setViewProofUrl}
                    totalCount={totalCount}
                    page={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                    pageSize={PAGE_SIZE}
                />

                {/* Proof Modal */}
                <AttendanceProofModal 
                    viewProofUrl={viewProofUrl}
                    onClose={() => setViewProofUrl(null)}
                />
                
                {/* Resubmit Modal */}
                <LeaveRequestModal 
                    isOpen={isResubmitOpen}
                    onClose={() => { setIsResubmitOpen(false); setResubmitLog(null); }}
                    onSubmit={handleResubmitSubmit}
                    initialDate={resubmitLog ? new Date(resubmitLog.date) : undefined}
                    initialReason={resubmitLog?.note ? resubmitLog.note.replace(/\[.*?\]/g, '').trim() : ''}
                    fixedType={(() => {
                        if (!resubmitLog) return undefined;
                        // Determine the correct correction type based on missing times
                        if (!resubmitLog.checkInTime && !resubmitLog.checkOutTime) return 'FORGOT_BOTH';
                        if (!resubmitLog.checkInTime) return 'FORGOT_CHECKIN';
                        if (!resubmitLog.checkOutTime) return 'FORGOT_CHECKOUT';
                        return 'LATE_ENTRY'; // Fallback for other action required cases
                    })() as LeaveType}
                />
            </div>
        </div>
    );
};

export default AttendanceHistory;
