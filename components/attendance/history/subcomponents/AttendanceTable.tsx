import React from 'react';
import { AttendanceLog } from '../../../../types/attendance';
import { Loader2, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import AttendanceRow from './AttendanceRow';

interface AttendanceTableProps {
    isFetching: boolean;
    historyLogs: AttendanceLog[];
    targetUser: any;
    isLate: (log: AttendanceLog) => boolean;
    getProofUrl: (log: AttendanceLog) => string | null;
    getLocationDisplay: (log: AttendanceLog) => string;
    getWorkHours: (log: AttendanceLog) => string;
    getStatusConfig: (log: AttendanceLog, userStartDate?: Date) => any;
    holidays: any[];
    exceptions: any[];
    onResubmit: (log: AttendanceLog) => void;
    onViewProof: (proofUrl: string) => void;
    totalCount: number;
    page: number;
    totalPages: number;
    onPageChange: (page: number | ((p: number) => number)) => void;
    pageSize: number;
}

export const AttendanceTable: React.FC<AttendanceTableProps> = ({
    isFetching,
    historyLogs,
    targetUser,
    isLate,
    getProofUrl,
    getLocationDisplay,
    getWorkHours,
    getStatusConfig,
    holidays,
    exceptions,
    onResubmit,
    onViewProof,
    totalCount,
    page,
    totalPages,
    onPageChange,
    pageSize
}) => {
    return (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden min-h-[400px] flex flex-col">
            <div className="overflow-x-auto flex-1">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50/80 border-b border-gray-100 text-[10px] text-gray-400 font-black uppercase tracking-wider">
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Time In</th>
                            <th className="px-6 py-4">Time Out</th>
                            <th className="px-6 py-4">Location</th>
                            <th className="px-6 py-4 text-center">Duration</th>
                            <th className="px-6 py-4 text-center">Proof</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {isFetching && historyLogs.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="py-20 text-center text-gray-400">
                                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-400" />
                                    กำลังโหลดข้อมูล...
                                </td>
                            </tr>
                        ) : historyLogs.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="text-center py-20 text-gray-400">
                                    <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    ไม่พบประวัติการลงเวลาในช่วงนี้
                                </td>
                            </tr>
                        ) : (
                            historyLogs.map(log => (
                                <AttendanceRow 
                                    key={log.id}
                                    log={log}
                                    targetUser={targetUser}
                                    isLate={isLate}
                                    getProofUrl={getProofUrl}
                                    getLocationDisplay={getLocationDisplay}
                                    getWorkHours={getWorkHours}
                                    getStatusConfig={getStatusConfig}
                                    holidays={holidays}
                                    exceptions={exceptions}
                                    onResubmit={onResubmit}
                                    onViewProof={onViewProof}
                                />
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer Pagination */}
            {totalCount > 0 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                    <span className="text-xs text-gray-500 font-medium">
                        Showing {((page - 1) * pageSize) + 1} - {Math.min(page * pageSize, totalCount)} of {totalCount}
                    </span>
                    
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => onPageChange(p => Math.max(1, p - 1))}
                            disabled={page === 1 || isFetching}
                            className="p-2 bg-white border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-xs font-bold text-gray-700 px-2">
                            Page {page} / {totalPages}
                        </span>
                        <button 
                            onClick={() => onPageChange(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages || isFetching}
                            className="p-2 bg-white border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AttendanceTable;
