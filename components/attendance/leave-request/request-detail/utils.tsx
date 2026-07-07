import React from 'react';
import { format } from 'date-fns';
import { 
    Clock, Moon, Briefcase
} from 'lucide-react';

export interface ParsedReason {
    cleanReason: string;
    isLateSubmission: boolean;
    isLocationMismatch: boolean;
    forgotCheckoutPenalty: boolean;
    time: string | null;
    otHours: string | null;
}

export const parseReason = (reason: string): ParsedReason => {
    let text = reason || '';
    
    const isLateSubmission = text.includes('[LATE_SUBMISSION]');
    text = text.replace(/\[LATE_SUBMISSION\]/g, '');
    
    const isLocationMismatch = text.includes('(Location Mismatch)');
    text = text.replace(/\(Location Mismatch\)/g, '');
    
    const forgotCheckoutPenalty = text.includes('Penalized for forgotten checkout') || text.includes('forgotten checkout') || text.includes('ลืมเช็คเอาท์');
    text = text.replace(/\[SYSTEM\]\s*Penalized for forgotten checkout/g, '');
    text = text.replace(/Penalized for forgotten checkout/g, '');
    text = text.replace(/\|/g, '');
    
    const timeMatch = text.match(/\[TIME:(\d{2}:\d{2})\]/);
    let time: string | null = null;
    if (timeMatch) {
        time = timeMatch[1];
        text = text.replace(/\[TIME:\d{2}:\d{2}\]/g, '');
    }

    // Extract [OT:HH:MM-HH:MM]
    const otRangeMatch = text.match(/\[OT:(\d{2}:\d{2}-\d{2}:\d{2})\]/);
    if (otRangeMatch) {
        time = otRangeMatch[1];
    }

    // Extract OT hours: from either (Xhr) or [OT:Xhr]
    const otHoursMatch1 = text.match(/\(([\d\.]+)hr\)/);
    const otHoursMatch2 = text.match(/\[OT:([\d\.]+)hr\]/);
    let otHours: string | null = null;
    if (otHoursMatch1) {
        otHours = otHoursMatch1[1];
    } else if (otHoursMatch2) {
        otHours = otHoursMatch2[1];
    }

    // Cleanup all OT markup tags completely
    text = text.replace(/\[OT:\d{2}:\d{2}-\d{2}:\d{2}\]/g, '');
    text = text.replace(/\([\d\.]+hr\)/g, '');
    text = text.replace(/\[OT_MINUTES:\d+\]/g, '');
    text = text.replace(/\[OT:[\d\.]+hr\]/g, '');

    text = text.trim();
    return {
        cleanReason: text,
        isLateSubmission,
        isLocationMismatch,
        forgotCheckoutPenalty,
        time,
        otHours
    };
};

export const getTypeName = (type: string) => {
    const labels: Record<string, string> = {
        SICK: 'ลาป่วย',
        VACATION: 'ลาพักร้อน',
        PERSONAL: 'ลากิจ',
        EMERGENCY: 'ลาฉุกเฉิน',
        LATE_ENTRY: 'ขอเข้าสาย',
        OVERTIME: 'แจ้งทำงานล่วงเวลา (OT)',
        FORGOT_CHECKIN: 'ลืมเช็คอิน (ลืมลงเวลาเข้างาน)',
        FORGOT_CHECKOUT: 'ลืมเช็คเอาท์ (ลืมลงเวลาออกงาน)',
        FORGOT_BOTH: 'ลืมบันทึกเวลาทั้งเข้าและออก',
        WFH: 'ขอทำงานที่บ้าน (WFH)',
        UNPAID: 'ลากิจไม่รับค่าจ้าง (Unpaid Leave)'
    };
    return labels[type] || type;
};

export const getTypeColorClass = (type: string) => {
    const colors: Record<string, { bg: string; text: string; border: string; accent: string }> = {
        SICK: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-100', accent: 'bg-rose-500' },
        VACATION: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', accent: 'bg-emerald-500' },
        PERSONAL: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-100', accent: 'bg-slate-500' },
        EMERGENCY: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-100', accent: 'bg-rose-500' },
        LATE_ENTRY: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-100', accent: 'bg-violet-500' },
        OVERTIME: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-100', accent: 'bg-indigo-500' },
        FORGOT_CHECKIN: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', accent: 'bg-amber-500' },
        FORGOT_CHECKOUT: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', accent: 'bg-amber-500' },
        FORGOT_BOTH: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', accent: 'bg-amber-500' },
        WFH: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-100', accent: 'bg-sky-500' }
    };
    return colors[type] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-100', accent: 'bg-gray-500' };
};

export const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
        PENDING: { bg: 'bg-amber-100 text-amber-800 border border-amber-200', text: 'text-amber-500', label: 'รอตรวจสอบ' },
        APPROVED: { bg: 'bg-green-100 text-green-800 border border-green-200', text: 'text-green-500', label: 'อนุมัติแล้ว' },
        REJECTED: { bg: 'bg-red-100 text-red-800 border border-red-200', text: 'text-red-500', label: 'ปฏิเสธแล้ว' }
    };
    const current = badges[status] || { bg: 'bg-gray-100 text-gray-800 border border-gray-200', text: 'text-gray-500', label: status };
    return (
        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm ${current.bg}`}>
            {current.label}
        </span>
    );
};
