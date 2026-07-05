import React from 'react';
import { format } from 'date-fns';
import th from 'date-fns/locale/th';
import { Clock, ArrowRight } from 'lucide-react';

export type RecordVariant = 'on-time' | 'late' | 'absent' | 'leave';

interface AttendanceRecordCardProps {
    date: Date;
    variant: RecordVariant;
    timeLabel?: string;
    badgeText?: string;
    note?: string;
}

export const AttendanceRecordCard: React.FC<AttendanceRecordCardProps> = ({
    date,
    variant,
    timeLabel,
    badgeText,
    note
}) => {
    // Style configuration based on variant
    const config = {
        'on-time': {
            bg: 'bg-emerald-50',
            border: 'border-emerald-100',
            textPrimary: 'text-emerald-600',
            textSecondary: 'text-emerald-400',
            hoverShadow: 'hover:shadow-emerald-100/50',
            badgeBg: 'bg-emerald-100',
            badgeText: 'text-emerald-600',
            iconColor: 'text-emerald-400'
        },
        'late': {
            bg: 'bg-amber-50',
            border: 'border-amber-100',
            textPrimary: 'text-amber-600',
            textSecondary: 'text-amber-400',
            hoverShadow: 'hover:shadow-amber-100/50',
            badgeBg: 'bg-amber-100',
            badgeText: 'text-amber-600',
            iconColor: 'text-amber-400'
        },
        'absent': {
            bg: 'bg-rose-50',
            border: 'border-rose-100',
            textPrimary: 'text-rose-600',
            textSecondary: 'text-rose-400',
            hoverShadow: 'hover:shadow-rose-100/50',
            badgeBg: 'bg-rose-600',
            badgeText: 'text-white',
            iconColor: 'text-rose-400'
        },
        'leave': {
            bg: 'bg-sky-50',
            border: 'border-sky-100',
            textPrimary: 'text-sky-600',
            textSecondary: 'text-sky-400',
            hoverShadow: 'hover:shadow-sky-100/50',
            badgeBg: 'bg-sky-100',
            badgeText: 'text-sky-600',
            iconColor: 'text-sky-400'
        }
    }[variant];

    return (
        <div className={`flex items-center justify-between p-4 bg-white rounded-[2rem] border ${config.border} group hover:shadow-lg ${config.hoverShadow} transition-all`}>
            <div className="flex items-center gap-4">
                <div className={`w-14 h-14 ${config.bg} rounded-2xl flex flex-col items-center justify-center border ${config.border}`}>
                    <span className={`text-[10px] font-black ${config.textSecondary} uppercase`}>
                        {format(date, 'EEE')}
                    </span>
                    <span className={`text-lg font-black ${config.textPrimary}`}>
                        {format(date, 'd')}
                    </span>
                </div>
                <div className="text-left">
                    <p className="text-xs font-black text-slate-700">
                        {format(date, 'MMMM yyyy', { locale: th })}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className={`px-2 py-0.5 ${config.badgeBg} ${config.badgeText} rounded-lg text-[9px] font-black uppercase`}>
                            {badgeText || variant.toUpperCase()}
                        </span>
                        {variant === 'absent' ? (
                            <p className="text-[10px] font-bold text-rose-400">
                                {timeLabel || 'No record found'}
                            </p>
                        ) : variant === 'leave' ? (
                            <p className="text-[10px] font-bold text-slate-400 italic truncate max-w-[150px]">
                                "{note || 'No reason'}"
                            </p>
                        ) : (
                            <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {timeLabel || '--:--'}
                            </p>
                        )}
                    </div>
                </div>
            </div>
            <div className="text-right">
                <div className={`w-8 h-8 rounded-full ${config.bg} flex items-center justify-center ${config.iconColor} opacity-0 group-hover:opacity-100 transition-opacity`}>
                    <ArrowRight className="w-4 h-4" />
                </div>
            </div>
        </div>
    );
};
