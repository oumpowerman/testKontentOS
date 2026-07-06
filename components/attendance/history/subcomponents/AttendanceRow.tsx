import React from 'react';
import { AttendanceLog } from '../../../../types/attendance';
import { format, isSameDay } from 'date-fns';
import th from 'date-fns/locale/th';
import { 
    AlertTriangle, XCircle, Loader2, Image as ImageIcon 
} from 'lucide-react';
import { getWorkingDaysDifference } from '../../../../lib/attendanceUtils';

interface AttendanceRowProps {
    log: AttendanceLog;
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
    isHighlighted?: boolean;
    onClearHighlight?: () => void;
}

export const AttendanceRow: React.FC<AttendanceRowProps> = React.memo(({
    log,
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
    isHighlighted,
    onClearHighlight
}) => {
    const rowRef = React.useRef<HTMLTableRowElement>(null);
    const [localHighlight, setLocalHighlight] = React.useState(false);
    const [isFading, setIsFading] = React.useState(false);

    React.useEffect(() => {
        if (isHighlighted) {
            setLocalHighlight(true);
            setIsFading(false);
            const scrollTimeout = setTimeout(() => {
                rowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 150);

            // Start fading out after 3 seconds
            const fadeTimeoutId = setTimeout(() => {
                setIsFading(true);
            }, 3000);

            // Fully clear highlight after 4 seconds (1 second fade duration)
            const clearTimeoutId = setTimeout(() => {
                setLocalHighlight(false);
                setIsFading(false);
                if (onClearHighlight) {
                    onClearHighlight();
                }
            }, 4000);

            return () => {
                clearTimeout(scrollTimeout);
                clearTimeout(fadeTimeoutId);
                clearTimeout(clearTimeoutId);
            };
        }
    }, [isHighlighted, onClearHighlight]);

    const late = isLate(log);
    const proof = getProofUrl(log);
    const statusConfig = getStatusConfig(log, targetUser?.startDate ? new Date(targetUser.startDate) : undefined);
    const StatusIcon = statusConfig.icon;
    const isLeave = log.status === 'LEAVE' || log.workType === 'LEAVE';
    const isPending = log.status === 'PENDING_VERIFY';
    const isNotStarted = statusConfig.label === 'ยังไม่เริ่มงาน';
    
    // Check if it's a late correction (over 3 days)
    const isLateCorrection = log.status === 'ACTION_REQUIRED' && getWorkingDaysDifference(new Date(log.date), new Date(), holidays, exceptions, targetUser) > 3;

    // Check if user forgot to clock out
    const isForgotClockOut = 
        !!log.checkInTime && 
        !log.checkOutTime && 
        !isPending && 
        !isLeave && 
        !isNotStarted && 
        log.status !== 'ABSENT' && 
        log.status !== 'NO_SHOW' && 
        !isSameDay(new Date(log.date), new Date());

    return (
        <tr 
            ref={rowRef}
            id={`attendance-row-${log.id}`}
            style={localHighlight ? {
                '--rainbow-alpha': isFading ? '0' : '0.75'
            } as React.CSSProperties : undefined}
            className={`transition-all duration-1000 group ${
                localHighlight
                    ? 'bg-rainbow-pastel animate-gradient-x-slow hover:opacity-95'
                    : isForgotClockOut 
                    ? 'bg-orange-50 hover:bg-orange-100/80 border-l-4 border-l-orange-500' 
                    : 'hover:bg-indigo-50/30'
            }`}
        >
            <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${isSameDay(new Date(log.date), new Date()) ? 'bg-indigo-500 animate-pulse' : 'bg-gray-300'}`}></div>
                    <div>
                        <span className="block text-sm font-bold text-gray-700">{format(new Date(log.date), 'd MMM yyyy')}</span>
                        <span className="text-[10px] text-gray-400 font-medium">{format(new Date(log.date), 'EEEE', { locale: th })}</span>
                    </div>
                </div>
            </td>
            <td className="px-6 py-4">
                {log.status === 'ACTION_REQUIRED' ? (
                    <button 
                        onClick={() => onResubmit(log)}
                        className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold border transition-colors shadow-sm ${
                            isLateCorrection 
                                ? 'bg-gray-500 text-white border-gray-600 hover:bg-gray-600' 
                                : 'bg-red-600 text-white border-red-700 hover:bg-red-700 animate-pulse'
                        }`}
                    >
                        <AlertTriangle className="w-3 h-3" /> 
                        {isLateCorrection ? 'ลงเวลาย้อนหลัง' : 'แก้ไขด่วน!'}
                    </button>
                ) : (
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border uppercase tracking-wide flex items-center w-fit gap-1.5 ${statusConfig.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig.label}
                    </span>
                )}
            </td>
            <td className="px-6 py-4">
                {log.checkInTime ? (
                    <span className={`font-mono font-bold text-sm ${late ? 'text-red-500' : 'text-green-600'}`}>
                        {format(log.checkInTime, 'HH:mm')}
                        {late && <span className="ml-2 text-[9px] bg-red-100 px-1.5 py-0.5 rounded text-red-600 uppercase">LATE</span>}
                    </span>
                ) : (isLeave || isNotStarted) ? <span className="text-xs text-gray-400">-</span> : <span className="text-gray-300 text-xs">--:--</span>}
            </td>
            <td className="px-6 py-4">
                {log.checkOutTime ? (
                    <span className="font-mono font-bold text-sm text-gray-600">{format(log.checkOutTime, 'HH:mm')}</span>
                ) : isPending ? (
                    <span className="text-orange-500 italic text-xs font-bold flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> รออนุมัติ</span>
                ) : (isLeave || isNotStarted) ? (
                    <span className="text-xs text-gray-400">-</span>
                ) : (log.status === 'ABSENT' || log.status === 'NO_SHOW' || !log.checkInTime) ? (
                    <span className="text-red-400 text-xs font-bold flex items-center gap-1 bg-red-50 px-2 py-1 rounded-lg border border-red-100 opacity-70">
                        <XCircle className="w-3 h-3" /> ขาดงาน
                    </span>
                ) : isSameDay(new Date(log.date), new Date()) ? (
                    <span className="text-indigo-500 italic text-xs font-bold flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> Working...</span>
                ) : (
                    <span className="text-red-500 text-xs font-bold flex items-center gap-1 bg-red-50 px-2 py-1 rounded-lg border border-red-100">
                        <AlertTriangle className="w-3 h-3" /> ลืมลงออก
                    </span>
                )}
            </td>
            <td className="px-6 py-4">
                <div className="flex flex-col gap-1">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border uppercase tracking-wide w-fit ${
                        log.workType === 'OFFICE' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                        log.workType === 'WFH' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                        log.workType === 'LEAVE' ? 'bg-sky-50 text-sky-600 border-sky-100' :
                        'bg-orange-50 text-orange-600 border-orange-100'
                    }`}>
                        {log.workType}
                    </span>
                    {!isLeave && (
                        <span className="text-xs text-gray-500 truncate max-w-[120px]" title={getLocationDisplay(log)}>
                            {getLocationDisplay(log)}
                        </span>
                    )}
                </div>
            </td>
            <td className="px-6 py-4 text-center">
                <span className="text-xs font-mono font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {isLeave ? '8h' : getWorkHours(log)}
                </span>
            </td>
            <td className="px-6 py-4 text-center">
                {proof ? (
                    <button 
                        onClick={() => onViewProof(proof)} 
                        className="p-1.5 bg-white border border-gray-200 hover:border-indigo-300 hover:text-indigo-600 rounded-lg text-gray-400 transition-all shadow-sm"
                    >
                        <ImageIcon className="w-4 h-4" />
                    </button>
                ) : (
                    <span className="text-gray-200 text-lg">•</span>
                )}
            </td>
        </tr>
    );
});

AttendanceRow.displayName = 'AttendanceRow';
export default AttendanceRow;
