
import React, { useState, useMemo } from 'react';
import { LeaveRequest } from '../../../types/attendance';
import { format, differenceInDays } from 'date-fns';
import th from 'date-fns/locale/th';
import { 
    Clock, CheckCircle2, XCircle, Calendar, 
    FileText, AlertTriangle, ChevronDown, ChevronUp, AlertCircle
} from 'lucide-react';

interface MyRequestHistoryProps {
    requests: LeaveRequest[];
}

type FilterStatus = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';

const MyRequestHistory: React.FC<MyRequestHistoryProps> = ({ requests }) => {
    const [filter, setFilter] = useState<FilterStatus>('ALL');
    const [isExpanded, setIsExpanded] = useState(false);

    // Stats for Badges
    const stats = useMemo(() => ({
        pending: requests.filter(r => r.status === 'PENDING').length,
        rejected: requests.filter(r => r.status === 'REJECTED').length,
        approved: requests.filter(r => r.status === 'APPROVED').length
    }), [requests]);

    const filteredRequests = useMemo(() => {
        return requests.filter(r => {
            if (filter === 'ALL') return true;
            return r.status === filter;
        });
    }, [requests, filter]);

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

    if (requests.length === 0) return null;

    return (
        <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm overflow-hidden mb-6 transition-all duration-300">
            {/* Header / Toggle */}
            <div 
                onClick={() => setIsExpanded(!isExpanded)}
                className={`w-full flex items-center justify-between px-5 py-4 cursor-pointer transition-colors ${isExpanded ? 'bg-indigo-50/50' : 'bg-white hover:bg-gray-50'}`}
            >
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${isExpanded ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}>
                        <FileText className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 text-sm">ประวัติคำขอ (My Requests)</h3>
                        <p className="text-[10px] text-gray-400">ติดตามสถานะการลาและการขออนุญาต</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {!isExpanded && (
                        <div className="flex gap-1">
                             {stats.pending > 0 && <span className="text-[10px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-bold">{stats.pending} รอ</span>}
                             {stats.rejected > 0 && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">{stats.rejected} ปฏิเสธ</span>}
                        </div>
                    )}
                    <div className="text-gray-400">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                </div>
            </div>

            {/* Content Body */}
            {isExpanded && (
                <div className="p-4 border-t border-indigo-100 bg-[#f8fafc]">
                    
                    {/* Filter Tabs */}
                    <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
                        {[
                            { id: 'ALL', label: 'ทั้งหมด' },
                            { id: 'PENDING', label: 'รออนุมัติ', count: stats.pending, activeClass: 'bg-orange-500 text-white shadow-orange-200' },
                            { id: 'APPROVED', label: 'สำเร็จ', count: stats.approved, activeClass: 'bg-green-500 text-white shadow-green-200' },
                            { id: 'REJECTED', label: 'ไม่ผ่าน', count: stats.rejected, activeClass: 'bg-red-500 text-white shadow-red-200' }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setFilter(tab.id as FilterStatus)}
                                className={`
                                    px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shadow-sm border
                                    ${filter === tab.id 
                                        ? `${tab.activeClass || 'bg-indigo-600 text-white shadow-indigo-200'} border-transparent` 
                                        : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                                    }
                                `}
                            >
                                {tab.label} {(tab.count !== undefined) ? `(${tab.count})` : ''}
                            </button>
                        ))}
                    </div>

                    {/* Request List */}
                    <div className="space-y-3">
                        {filteredRequests.length === 0 ? (
                            <div className="text-center py-8 text-gray-400 text-xs">
                                ไม่พบรายการในหมวดนี้
                            </div>
                        ) : (
                            filteredRequests.map((req) => {
                                const status = getStatusConfig(req.status);
                                const StatusIcon = status.icon;
                                const daysCount = differenceInDays(new Date(req.endDate), new Date(req.startDate)) + 1;

                                return (
                                    <div 
                                        key={req.id} 
                                        className={`
                                            bg-white p-4 rounded-xl border-l-4 shadow-sm transition-all hover:shadow-md
                                            ${status.border} ${req.status === 'REJECTED' ? 'border-l-red-500' : req.status === 'APPROVED' ? 'border-l-green-500' : 'border-l-orange-400'}
                                        `}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className={`text-xs font-black px-2 py-0.5 rounded-md border ${status.bg} ${status.color} ${status.border} flex items-center gap-1`}>
                                                    <StatusIcon className="w-3 h-3" /> {status.label}
                                                </span>
                                                <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md">
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
                                                            <span className="text-[10px] font-medium text-indigo-500 bg-indigo-50 px-1.5 rounded ml-1">
                                                                ({daysCount} วัน)
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1 italic truncate">
                                                    "{req.reason}"
                                                </p>

                                                {/* Rejection Reason (Highlight) */}
                                                {req.status === 'REJECTED' && req.rejectionReason && (
                                                    <div className="mt-3 bg-red-50 p-2.5 rounded-lg border border-red-100 animate-pulse flex items-start gap-2">
                                                        <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                                                        <div>
                                                            <p className="text-[10px] font-bold text-red-700 uppercase mb-0.5">
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
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyRequestHistory;
