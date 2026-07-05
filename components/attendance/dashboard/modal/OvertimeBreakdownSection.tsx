import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import th from 'date-fns/locale/th';
import { Zap, Clock, MessageSquare, AlertCircle, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { LeaveRequest } from '../../../../types/attendance';
import { useMasterData } from '../../../../hooks/useMasterData';
import { useUserSession } from '../../../../context/UserSessionContext';

interface OvertimeBreakdownSectionProps {
    leaveRequests: LeaveRequest[];
    userId: string;
    workingDaysInMonth: Date[]; // For date boundary matching
}

const getIntervalDuration = (start: string, end: string): number => {
    if (!start || !end) return 0;
    try {
        const [startH, startM] = start.split(':').map(Number);
        const [endH, endM] = end.split(':').map(Number);
        let startMin = startH * 60 + startM;
        let endMin = endH * 60 + endM;
        if (endMin < startMin) endMin += 24 * 60; // Crosses midnight
        return parseFloat(((endMin - startMin) / 60).toFixed(2));
    } catch (e) {
        return 0;
    }
};

const getScannedDuration = (dateStr: string, startTime: string, checkOutTime: Date | null): number => {
    if (!checkOutTime || !startTime) return 0;
    try {
        const [startH, startM] = startTime.split(':').map(Number);
        const reqStart = new Date(`${dateStr}T${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`);
        if (checkOutTime <= reqStart) return 0;
        const diffMs = checkOutTime.getTime() - reqStart.getTime();
        return parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
    } catch (e) {
        return 0;
    }
};

export const OvertimeBreakdownSection: React.FC<OvertimeBreakdownSectionProps> = ({
    leaveRequests,
    userId,
    workingDaysInMonth
}) => {
    const { annualHolidays, calendarExceptions } = useMasterData();
    const { otRequests, attendanceLogs } = useUserSession();

    // Determine boundary dates for current selection
    const selectedMonthDates = useMemo(() => {
        if (workingDaysInMonth.length === 0) return { start: new Date(), end: new Date() };
        const sorted = [...workingDaysInMonth].sort((a, b) => a.getTime() - b.getTime());
        return {
            start: sorted[0],
            end: sorted[sorted.length - 1]
        };
    }, [workingDaysInMonth]);

    // Process leaveRequests and otRequests into approved overtime records with automatic multiplier calculation
    const processedOtRequests = useMemo(() => {
        // 1. Process legacy leave-based OT requests
        const approvedOvertimeLeaves = leaveRequests.filter(req => {
            if (req.userId !== userId) return false;
            if (req.status !== 'APPROVED') return false;
            if (req.type !== 'OVERTIME') return false;
            
            // Check if within selected month range
            const reqDate = new Date(req.startDate);
            const matchMonth = reqDate.getMonth() === selectedMonthDates.start.getMonth() &&
                               reqDate.getFullYear() === selectedMonthDates.start.getFullYear();
            return matchMonth;
        });

        const mappedLeaves = approvedOvertimeLeaves.map(req => {
            const reasonStr = req.reason || '';
            const match = reasonStr.match(/\[OT:([\d\.]+)hr\]/);
            const durationHours = match ? parseFloat(match[1]) : 0;
            const cleanReason = reasonStr.replace(/\[OT:[\d\.]+hr\]\s*/, '').trim();
            const dateObj = new Date(req.startDate);
            const dateStr = format(dateObj, 'yyyy-MM-dd');

            // 1. Check if it's an annual holiday or calendar holiday exception (3.0x)
            const isAnnualHoliday = (annualHolidays || []).some(h => 
                h.isActive && h.day === dateObj.getDate() && h.month === (dateObj.getMonth() + 1)
            );
            const holidayException = (calendarExceptions || []).find(e => e.date === dateStr && e.type === 'HOLIDAY');
            const isSpecialHoliday = isAnnualHoliday || !!holidayException;

            // 2. Check if it's Saturday or Sunday (2.0x)
            const dayOfWeek = dateObj.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

            let multiplierType: 'NORMAL_DAY' | 'HOLIDAY' | 'HOLIDAY_OVERTIME' = 'NORMAL_DAY';
            if (isSpecialHoliday) {
                multiplierType = 'HOLIDAY_OVERTIME'; // 3.0x
            } else if (isWeekend) {
                multiplierType = 'HOLIDAY'; // 2.0x
            } else {
                multiplierType = 'NORMAL_DAY'; // 1.5x
            }

            return {
                id: req.id,
                date: req.startDate,
                durationHours,
                reason: cleanReason,
                type: multiplierType,
                startTime: format(dateObj, 'HH:mm'),
                endTime: req.endDate ? format(new Date(req.endDate), 'HH:mm') : '',
                source: 'LEAVE'
            };
        });

        // 2. Process modern dedicated ot_requests
        const approvedOtReqs = (otRequests || []).filter(req => {
            if (req.userId !== userId) return false;
            if (req.status !== 'APPROVED') return false;
            
            // Check if within selected month range
            const reqDate = new Date(req.date);
            const matchMonth = reqDate.getMonth() === selectedMonthDates.start.getMonth() &&
                               reqDate.getFullYear() === selectedMonthDates.start.getFullYear();
            return matchMonth;
        });

        const mappedOts = approvedOtReqs.map(req => {
            const dateObj = new Date(req.date);
            return {
                id: req.id,
                date: dateObj,
                durationHours: req.durationHours,
                reason: req.reason,
                type: req.type as 'NORMAL_DAY' | 'HOLIDAY' | 'HOLIDAY_OVERTIME',
                startTime: req.startTime,
                endTime: req.endTime,
                source: 'OT_REQUEST'
            };
        });

        // 3. Combine both and sort by date descending
        return [...mappedLeaves, ...mappedOts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [leaveRequests, otRequests, userId, selectedMonthDates, annualHolidays, calendarExceptions]);

    // Calculate aggregated statistics
    const otSummary = useMemo(() => {
        const summary = {
            normal: 0,   // 1.5x (NORMAL_DAY)
            holiday: 0,  // 2.0x (HOLIDAY)
            special: 0,  // 3.0x (HOLIDAY_OVERTIME)
            total: 0
        };

        processedOtRequests.forEach(req => {
            const hours = Number(req.durationHours || 0);
            if (req.type === 'NORMAL_DAY') {
                summary.normal += hours;
            } else if (req.type === 'HOLIDAY') {
                summary.holiday += hours;
            } else if (req.type === 'HOLIDAY_OVERTIME') {
                summary.special += hours;
            }
        });

        summary.total = summary.normal + summary.holiday + summary.special;
        return summary;
    }, [processedOtRequests]);

    // Segmented bar percentages
    const segments = useMemo(() => {
        const total = otSummary.total;
        if (total === 0) return { normal: 0, holiday: 0, special: 0 };
        return {
            normal: (otSummary.normal / total) * 100,
            holiday: (otSummary.holiday / total) * 100,
            special: (otSummary.special / total) * 100
        };
    }, [otSummary]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
        >
            {/* Header Badge */}
            <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 rounded-2xl text-purple-500">
                    <Zap className="w-5 h-5 animate-bounce" />
                </div>
                <div>
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] text-left">
                        Overtime Breakdown
                    </h4>
                    <p className="text-[10px] text-slate-400 font-bold text-left">
                        สะสมตามอัตราคูณรายเดือน (คำนวณผ่านกฎ Safe Minimum Rule อัตโนมัติ)
                    </p>
                </div>
            </div>

            {/* Aggregated Visual Card */}
            <div className="bg-gradient-to-br from-purple-50/50 via-white to-indigo-50/30 rounded-[2.5rem] border border-purple-100 p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-purple-50 pb-5 mb-5">
                    <div className="text-left">
                        <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest bg-purple-50 px-2.5 py-1 rounded-full">
                            Total Approved hours
                        </span>
                        <h2 className="text-4xl font-black text-slate-800 tracking-tight mt-1.5">
                            {otSummary.total.toFixed(1)} <span className="text-base font-normal text-slate-400">ชั่วโมง</span>
                        </h2>
                    </div>
                    
                    {/* Visual Segmented Progress Bar */}
                    <div className="flex-1 max-w-xs space-y-1.5">
                        <div className="flex justify-between text-[10px] font-bold text-slate-400">
                            <span>ชั่วโมงสะสมรวม</span>
                            <span className="text-purple-600 font-black">{otSummary.total.toFixed(1)} ชม.</span>
                        </div>
                        <div className="h-3.5 w-full bg-slate-100/80 rounded-full overflow-hidden flex p-0.5 border border-slate-200/50">
                            {otSummary.total > 0 ? (
                                <>
                                    {otSummary.normal > 0 && (
                                        <motion.div 
                                            initial={{ width: 0 }} 
                                            animate={{ width: `${segments.normal}%` }} 
                                            className="bg-purple-500 rounded-l-full h-full transition-all" 
                                            title={`Normal OT: ${otSummary.normal} hrs`}
                                        />
                                    )}
                                    {otSummary.holiday > 0 && (
                                        <motion.div 
                                            initial={{ width: 0 }} 
                                            animate={{ width: `${segments.holiday}%` }} 
                                            className="bg-amber-400 h-full transition-all" 
                                            title={`Holiday OT: ${otSummary.holiday} hrs`}
                                        />
                                    )}
                                    {otSummary.special > 0 && (
                                        <motion.div 
                                            initial={{ width: 0 }} 
                                            animate={{ width: `${segments.special}%` }} 
                                            className="bg-sky-400 rounded-r-full h-full transition-all" 
                                            title={`Special OT: ${otSummary.special} hrs`}
                                        />
                                    )}
                                </>
                            ) : (
                                <div className="w-full h-full bg-slate-200/50 rounded-full" />
                            )}
                        </div>
                    </div>
                </div>

                {/* Grid stats cards - Clean & focused on Hours */}
                <div className="grid grid-cols-3 gap-3">
                    {/* Normal Day Card */}
                    <div className="bg-white rounded-[2rem] border border-purple-100 p-4 flex flex-col items-center justify-center text-center shadow-sm hover:scale-105 transition-all">
                        <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-500 mb-2">
                            <Zap className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">วันปกติ (1.5x)</span>
                        <span className="text-xl font-black text-purple-600 mt-1">{otSummary.normal.toFixed(1)} <span className="text-xs font-bold text-slate-400">ชม.</span></span>
                    </div>

                    {/* Holiday Card */}
                    <div className="bg-white rounded-[2rem] border border-amber-100 p-4 flex flex-col items-center justify-center text-center shadow-sm hover:scale-105 transition-all">
                        <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 mb-2">
                            <Zap className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">วันหยุด (2.0x)</span>
                        <span className="text-xl font-black text-amber-600 mt-1">{otSummary.holiday.toFixed(1)} <span className="text-xs font-bold text-slate-400">ชม.</span></span>
                    </div>

                    {/* Special Holiday Card */}
                    <div className="bg-white rounded-[2rem] border border-sky-100 p-4 flex flex-col items-center justify-center text-center shadow-sm hover:scale-105 transition-all">
                        <div className="w-10 h-10 rounded-2xl bg-sky-50 flex items-center justify-center text-sky-500 mb-2">
                            <Zap className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">วันหยุดพิเศษ (3.0x)</span>
                        <span className="text-xl font-black text-sky-600 mt-1">{otSummary.special.toFixed(1)} <span className="text-xs font-bold text-slate-400">ชม.</span></span>
                    </div>
                </div>
            </div>

            {/* List Header */}
            <div className="text-left">
                <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-2">
                    Chronological Logs ({processedOtRequests.length} รายการ)
                </h5>
            </div>

            {/* Detail Logs List */}
            <div className="space-y-3">
                {processedOtRequests.length > 0 ? (
                    processedOtRequests.map(req => {
                        const dateObj = new Date(req.date);
                        const dateStr = format(dateObj, 'yyyy-MM-dd');
                        
                        // Badge details matching the type
                        const typeConfig = {
                            'NORMAL_DAY': {
                                badgeBg: 'bg-purple-100 text-purple-600',
                                label: 'วันทำงานปกติ 1.5x',
                                dot: 'bg-purple-500'
                            },
                            'HOLIDAY': {
                                badgeBg: 'bg-amber-100 text-amber-600',
                                label: 'วันหยุดปกติ 2.0x',
                                dot: 'bg-amber-500'
                            },
                            'HOLIDAY_OVERTIME': {
                                badgeBg: 'bg-sky-100 text-sky-600',
                                label: 'วันหยุดล่วงเวลา 3.0x',
                                dot: 'bg-sky-500'
                            }
                        }[req.type] || {
                            badgeBg: 'bg-slate-100 text-slate-600',
                            label: 'ล่วงเวลา',
                            dot: 'bg-slate-500'
                        };

                        // Cross check checkouts
                        const log = (attendanceLogs || []).find(
                            l => l.userId === userId && l.date === dateStr
                        );

                        const reqStartStr = req.startTime || '18:30';
                        const reqEndStr = req.endTime || '20:30';
                        const reqHours = getIntervalDuration(reqStartStr, reqEndStr);

                        let actualScannedHours = 0;
                        let scanStatus: 'NOT_FOUND' | 'EARLY' | 'OK' = 'NOT_FOUND';
                        let checkoutDisplay = 'ไม่พบบันทึกการสแกนออก';

                        if (log && log.checkOutTime) {
                            const checkOutDate = new Date(log.checkOutTime);
                            checkoutDisplay = `สแกนเช็คเอาท์ออกเวลา ${format(checkOutDate, 'HH:mm')} น.`;
                            actualScannedHours = getScannedDuration(dateStr, reqStartStr, checkOutDate);
                            
                            if (checkOutDate < new Date(`${dateStr}T${reqEndStr}`)) {
                                scanStatus = 'EARLY';
                            } else {
                                scanStatus = 'OK';
                            }
                        }

                        return (
                            <div 
                                key={req.id} 
                                className="flex flex-col p-5 bg-white rounded-[2rem] border border-slate-100 group hover:shadow-lg hover:shadow-purple-50/50 transition-all gap-4"
                            >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-start md:items-center gap-4 text-left">
                                        {/* Date Display */}
                                        <div className="w-14 h-14 bg-purple-50/50 rounded-2xl flex flex-col items-center justify-center border border-purple-100 shrink-0">
                                            <span className="text-[10px] font-black text-purple-400 uppercase">
                                                {format(dateObj, 'EEE')}
                                            </span>
                                            <span className="text-lg font-black text-purple-600">
                                                {format(dateObj, 'd')}
                                            </span>
                                        </div>
                                        
                                        {/* Content details */}
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="text-xs font-black text-slate-700">
                                                    {format(dateObj, 'MMMM yyyy', { locale: th })}
                                                </p>
                                                <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${typeConfig.badgeBg}`}>
                                                    {typeConfig.label}
                                                </span>
                                            </div>
                                            
                                            <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold flex-wrap">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3.5 h-3.5 text-slate-400" /> 
                                                    ขอช่วงเวลา: {reqStartStr} - {reqEndStr} ({reqHours.toFixed(2)} ชม.)
                                                </span>
                                                {req.reason && (
                                                    <span className="flex items-center gap-1 max-w-[220px] md:max-w-xs truncate text-slate-500 italic font-medium">
                                                        <MessageSquare className="w-3 h-3 text-slate-300" />
                                                        "{req.reason}"
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Hours bubble */}
                                    <div className="text-right flex items-center justify-between md:justify-end gap-3 border-t md:border-0 pt-2 md:pt-0 border-slate-50 shrink-0">
                                        <div className="md:hidden text-[10px] text-slate-400 font-bold">จำนวนชั่วโมงที่ได้รับอนุมัติจริง</div>
                                        <div className="flex flex-col items-end">
                                            <div className="px-4 py-2 bg-purple-50 text-purple-700 rounded-2xl border border-purple-100 font-black text-xs shadow-sm flex items-center gap-1.5">
                                                <ShieldCheck className="w-4 h-4 text-purple-500" />
                                                จ่ายจริง: {Number(req.durationHours || 0).toFixed(2)} ชม.
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Safe Minimum Rule Validation Panel */}
                                <div className={`mt-1 p-3.5 rounded-2xl border text-xs font-medium flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                    scanStatus === 'OK' 
                                        ? 'bg-emerald-50/50 border-emerald-100/80 text-emerald-800' 
                                        : scanStatus === 'EARLY'
                                            ? 'bg-amber-50/50 border-amber-100/80 text-amber-800'
                                            : 'bg-rose-50/50 border-rose-100/80 text-rose-800'
                                }`}>
                                    <div className="flex items-center gap-2 text-left">
                                        {scanStatus === 'OK' && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                                        {scanStatus === 'EARLY' && <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />}
                                        {scanStatus === 'NOT_FOUND' && <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />}
                                        
                                        <div>
                                            <p className="font-bold">{checkoutDisplay}</p>
                                            <p className="text-[10px] opacity-80 mt-0.5">
                                                {scanStatus === 'OK' && '✅ เช็คเอาท์ตามจริง ครบกำหนดตามช่วงเวลาที่ขออนุมัติ'}
                                                {scanStatus === 'EARLY' && `⚠️ กลับก่อนเวลาที่ขอ! เวลาทำ OT สแกนจริงได้เพียง ${actualScannedHours.toFixed(2)} ชม.`}
                                                {scanStatus === 'NOT_FOUND' && '❌ ไม่พบข้อมูลการตอกบัตรเช็คเอาท์ในระบบของวันนี้'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Real-time comparison indicators */}
                                    <div className="flex items-center gap-2 text-[10px] font-bold shrink-0 self-start sm:self-center bg-white/60 px-3 py-1.5 rounded-xl border border-black/5">
                                        <span className="opacity-60">ขอ: {reqHours.toFixed(1)} ชม.</span>
                                        <span className="opacity-40">|</span>
                                        <span className="opacity-60">สแกนจริง: {scanStatus === 'NOT_FOUND' ? '0' : actualScannedHours.toFixed(1)} ชม.</span>
                                        <span className="opacity-40">|</span>
                                        <span className="font-extrabold text-indigo-600">จ่าย: {Number(req.durationHours || 0).toFixed(1)} ชม.</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-purple-300 border-2 border-dashed border-purple-50 rounded-[2.5rem] bg-purple-50/10">
                        <AlertCircle className="w-8 h-8 text-purple-300 mb-2" />
                        <p className="text-xs font-black uppercase tracking-wider text-slate-500">No Approved OT found</p>
                        <p className="text-[10px] text-slate-400 mt-1">ไม่มีข้อมูลประวัติทำงานล่วงเวลาที่ได้รับการอนุมัติในเดือนนี้</p>
                    </div>
                )}
            </div>
        </motion.div>
    );
};
