
import React from 'react';
import { MasterOption } from '../../../types';
import { LEAVE_THEMES } from './constants';
import * as LucideIcons from 'lucide-react';
import { BRAND_CONFIG } from '../../../config/brand';

interface Props {
    masterOptions: MasterOption[];
    onSelect: (key: string) => void;
}

const LeaveTypeSelector: React.FC<Props> = ({ masterOptions, onSelect }) => {
    // Standard Types from DB
    const leaveOptions = masterOptions
        .filter(o => o.type === 'LEAVE_TYPE' && o.isActive)
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

    const renderIcon = (iconName: string, className: string) => {
        const IconComponent = (LucideIcons as any)[iconName] || LucideIcons.FileText;
        return <IconComponent className={className} />;
    };

    const getMetadata = (description?: string) => {
        try {
            return description ? JSON.parse(description) : {};
        } catch (e) {
            return {};
        }
    };

    const isWfhEnabled = BRAND_CONFIG.showWfhOptionMode !== 2;

    const specialOptions = leaveOptions
        .filter(o => getMetadata(o.description).category === 'SPECIAL')
        .filter(o => isWfhEnabled || o.key !== 'WFH');
    const standardOptions = leaveOptions.filter(o => getMetadata(o.description).category === 'STANDARD');
    const correctionOptions = leaveOptions.filter(o => getMetadata(o.description).category === 'CORRECTION');
    const otherOptions = leaveOptions.filter(o => !['SPECIAL', 'STANDARD', 'CORRECTION'].includes(getMetadata(o.description).category));

    return (
        <div className="flex flex-col gap-6 pb-4">
            {/* Special Types (e.g. WFH, OT) */}
            {specialOptions.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                        <LucideIcons.Star className="w-4 h-4 text-amber-500" />
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">คำขอพิเศษ (Special)</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                        {specialOptions.map(opt => {
                            const meta = getMetadata(opt.description);
                            const th = LEAVE_THEMES[opt.key] || LEAVE_THEMES['WFH'] || LEAVE_THEMES['DEFAULT'];
                            return (
                                <button 
                                    key={opt.key}
                                    onClick={() => onSelect(opt.key)} 
                                    className={`flex flex-row items-center justify-between p-3 sm:p-4 rounded-2xl border-2 transition-all group active:scale-95 ${th.bg} ${th.border} hover:shadow-md`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white flex items-center justify-center shadow-sm shrink-0">
                                            {renderIcon(meta.icon || 'Home', `w-4 h-4 sm:w-5 sm:h-5 ${th.text}`)}
                                        </div>
                                        <div className="text-left">
                                            <span className={`font-bold text-xs sm:text-sm block ${th.text}`}>{opt.label}</span>
                                            {meta.subLabel && <span className={`text-[9px] sm:text-[10px] font-medium opacity-80 ${th.text}`}>{meta.subLabel}</span>}
                                        </div>
                                    </div>
                                    <LucideIcons.ChevronRight className={`w-4 h-4 sm:w-5 sm:h-5 opacity-40 group-hover:opacity-100 transition-opacity ${th.text}`} />
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Standard Types */}
            {standardOptions.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                        <LucideIcons.Calendar className="w-4 h-4 text-indigo-500" />
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">ประเภทการลา (Leave)</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {standardOptions.map(opt => {
                            const meta = getMetadata(opt.description);
                            const th = LEAVE_THEMES[opt.key] || LEAVE_THEMES['DEFAULT'];
                            return (
                                <button 
                                    key={opt.key}
                                    onClick={() => onSelect(opt.key)}
                                    className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl border border-gray-100 bg-white hover:border-indigo-200 hover:shadow-md hover:-translate-y-0.5 transition-all group active:scale-95"
                                >
                                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-2 transition-colors ${th.bg} ${th.text}`}>
                                        {renderIcon(meta.icon || 'FileText', "w-5 h-5 sm:w-6 sm:h-6")}
                                    </div>
                                    <span className="font-bold text-gray-700 text-[11px] sm:text-xs group-hover:text-indigo-600 text-center leading-tight">{opt.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Correction Types */}
            {correctionOptions.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                        <LucideIcons.Wrench className="w-4 h-4 text-rose-500" />
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">แก้ไขเวลาเข้า-ออก (Correction)</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {(() => {
                            // Reorder options to place FORGOT_CHECKIN, FORGOT_CHECKOUT, FORGOT_BOTH, and LATE_ENTRY at the absolute end
                            const reorderedOptions = [...correctionOptions].sort((a, b) => {
                                const aIsDisabled = a.key === 'FORGOT_CHECKIN' || a.key === 'FORGOT_CHECKOUT' || a.key === 'FORGOT_BOTH' || a.key === 'LATE_ENTRY';
                                const bIsDisabled = b.key === 'FORGOT_CHECKIN' || b.key === 'FORGOT_CHECKOUT' || b.key === 'FORGOT_BOTH' || b.key === 'LATE_ENTRY';
                                if (aIsDisabled && !bIsDisabled) return 1;
                                if (!aIsDisabled && bIsDisabled) return -1;
                                return 0;
                            });

                            return reorderedOptions.map((opt, idx) => {
                                const meta = getMetadata(opt.description);
                                const th = LEAVE_THEMES[opt.key] || LEAVE_THEMES['DEFAULT'];
                                
                                const isForgotCheckIn = opt.key === 'FORGOT_CHECKIN';
                                const isForgotCheckOut = opt.key === 'FORGOT_CHECKOUT';
                                const isForgotBoth = opt.key === 'FORGOT_BOTH';
                                const isLateEntry = opt.key === 'LATE_ENTRY';
                                const isDisabled = isForgotCheckIn || isForgotCheckOut || isForgotBoth || isLateEntry;

                                if (isDisabled) {
                                    const tooltipTitle = isForgotCheckIn 
                                        ? "ลืมลงเวลาเข้างาน" 
                                        : isForgotCheckOut 
                                            ? "ลืมลงเวลาออกงาน" 
                                            : isForgotBoth
                                                ? "ลืมทั้งเข้าและออก"
                                                : "แจ้งเข้าสาย / ลงเวลาล่วงหน้า";
                                    const tooltipText = isForgotCheckIn 
                                        ? "ระบบปิดส่วนนี้เพื่อป้องกันการระบุวันผิดพลาด กรุณาทำรายการผ่าน 'ปุ่มสีส้มที่หน้าแรก' เฉพาะวันปัจจุบัน เพื่อความถูกต้องของแต้มกิลด์และผลงาน"
                                        : isForgotCheckOut 
                                            ? "กรุณาแจ้งเวลาออกย้อนหลังผ่านกล่องแจ้งเตือน 'เวลาค้างคา (Outdated Logs)' ที่จะแสดงในวันถัดไป เพื่อเก็บบันทึกสถิติอย่างถูกต้อง"
                                            : isForgotBoth
                                                ? "ไม่อนุญาตให้ยื่นคำขอรวบยอดตามนโยบาย กรุณายื่นคำขอเวลา 'เข้า' และ 'ออก' แยกกันเท่านั้น"
                                                : "ขณะนี้ระบบปิดการยื่นขอแจ้งเข้าสายผ่านช่องทางนี้ชั่วคราว กรุณาเข้างานผ่านระบบตอกบัตรเช้าปกติเพื่อความแม่นยำของพิกัดและประวัติเวลาการทำงานจริง";

                                    const isLeftColumn = idx % 2 === 0;
                                    const tooltipAlignClass = isLeftColumn
                                        ? "left-0 -translate-x-0 sm:left-1/2 sm:-translate-x-1/2"
                                        : "right-0 left-auto -translate-x-0 sm:left-1/2 sm:-translate-x-1/2 sm:right-auto";
                                    
                                    const caretAlignClass = isLeftColumn
                                        ? "left-6 -translate-x-0 sm:left-1/2 sm:-translate-x-1/2"
                                        : "right-6 left-auto -translate-x-0 sm:left-1/2 sm:-translate-x-1/2 sm:right-auto";

                                    return (
                                        <div key={opt.key} className="relative group">
                                            <button 
                                                disabled={true}
                                                className="w-full h-full flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl border border-gray-100 bg-gray-50/70 opacity-60 cursor-not-allowed"
                                            >
                                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-2 bg-gray-200/50 text-gray-400">
                                                    {renderIcon(meta.icon || 'Clock', "w-5 h-5 sm:w-6 sm:h-6")}
                                                </div>
                                                <span className="font-bold text-gray-400 text-[11px] sm:text-xs text-center leading-tight">
                                                    {opt.label}
                                                </span>
                                            </button>
                                            
                                            {/* Beautiful Premium Dark Animated Tooltip */}
                                            <div className={`pointer-events-none absolute bottom-[105%] ${tooltipAlignClass} mb-2 w-64 bg-slate-950/95 backdrop-blur-md text-white p-3.5 rounded-xl shadow-2xl border border-slate-800 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 z-50 text-left`}>
                                                <div className={`absolute top-full ${caretAlignClass} border-[6px] border-transparent border-t-slate-950/95`} />
                                                <div className="flex items-center gap-1.5 mb-1 text-amber-400 font-bold text-xs">
                                                    {renderIcon('AlertCircle', "w-3.5 h-3.5 shrink-0")}
                                                    <span>{tooltipTitle}</span>
                                                </div>
                                                <p className="text-[10px] sm:text-xs text-slate-300 leading-normal font-normal">
                                                    {tooltipText}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                }

                                const hoverBorderColor = th.text.includes('rose') ? 'hover:border-rose-200' : 
                                                       th.text.includes('orange') ? 'hover:border-orange-200' : 
                                                       th.text.includes('amber') ? 'hover:border-amber-200' : 
                                                       'hover:border-indigo-200';
                                
                                return (
                                    <button 
                                        key={opt.key}
                                        onClick={() => onSelect(opt.key)}
                                        className={`flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl border border-gray-100 bg-white hover:shadow-md hover:-translate-y-0.5 transition-all group active:scale-95 ${hoverBorderColor}`}
                                    >
                                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-2 ${th.bg} ${th.text}`}>
                                            {renderIcon(meta.icon || 'Clock', "w-5 h-5 sm:w-6 sm:h-6")}
                                        </div>
                                        <span className={`font-bold text-gray-700 text-[11px] sm:text-xs text-center leading-tight group-hover:${th.text}`}>{opt.label}</span>
                                    </button>
                                );
                            });
                        })()}
                    </div>
                </div>
            )}

            {/* Other Types */}
            {otherOptions.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                        <LucideIcons.MoreHorizontal className="w-4 h-4 text-gray-400" />
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">อื่นๆ (Other)</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {otherOptions.map(opt => {
                            const meta = getMetadata(opt.description);
                            const th = LEAVE_THEMES['DEFAULT'];
                            return (
                                <button 
                                    key={opt.key}
                                    onClick={() => onSelect(opt.key)}
                                    className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl border border-gray-100 bg-white hover:border-gray-200 hover:shadow-md hover:-translate-y-0.5 transition-all group active:scale-95"
                                >
                                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-2 ${th.bg} ${th.text}`}>
                                        {renderIcon(meta.icon || 'FileText', "w-5 h-5 sm:w-6 sm:h-6")}
                                    </div>
                                    <span className="font-bold text-gray-700 text-[11px] sm:text-xs text-center leading-tight">{opt.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LeaveTypeSelector;
