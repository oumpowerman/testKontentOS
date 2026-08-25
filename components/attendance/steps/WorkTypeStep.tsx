import React, { useState } from 'react';
import { Building2, Home, Briefcase, ChevronRight, Check, MapPin, AlertTriangle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { WorkLocation, LocationDef } from '../../../types/attendance';
import { useGlobalDialog } from '../../../context/GlobalDialogContext';
import { BRAND_CONFIG } from '../../../config/brand';

interface WorkTypeStepProps {
    matchedLocation?: LocationDef;
    onSelect: (type: WorkLocation, customName?: string, isProvisionalOnsite?: boolean, provisionalReason?: string) => void;
    approvedWFH?: boolean;
    approvedOnsite?: boolean;
    pendingWFHRequest?: any;
    pendingOnsiteRequest?: any;
    allLocations?: any[]; // All configured locations in the system
    onBack?: () => void; // Support going back
    isSubmitting?: boolean;
    onSwitchToLeave?: (type?: string) => void;
    isGpsAppealActive?: boolean;
}

const WorkTypeStep: React.FC<WorkTypeStepProps> = ({ 
    matchedLocation, onSelect, approvedWFH, approvedOnsite, pendingWFHRequest, pendingOnsiteRequest, allLocations = [], onBack, isSubmitting = false, onSwitchToLeave, isGpsAppealActive = false
}) => {
    const { showAlert } = useGlobalDialog();
    const [showOnsiteSelector, setShowOnsiteSelector] = useState(false);
    const [showWfhWarning, setShowWfhWarning] = useState(false);
    const [showOnsiteWarning, setShowOnsiteWarning] = useState(false);
    const [tempOnsiteName, setTempOnsiteName] = useState('On Site');
    const [selectedOnsiteLoc, setSelectedOnsiteLoc] = useState('');
    const [customOnsiteText, setCustomOnsiteText] = useState('');
    const [provisionalReason, setProvisionalReason] = useState('');

    const isWfhEnabled = BRAND_CONFIG.showWfhOptionMode !== 2;

    const handleSelectOffice = () => {
        if (isSubmitting) return;
        if (!matchedLocation && !isGpsAppealActive) {
            const outOfOfficeMessage = isWfhEnabled
                ? 'คุณไม่ได้อยู่ในพิกัดของออฟฟิศหลักที่ลงทะเบียนไว้ในระบบครับ\n\nหากคุณกำลังออกปฏิบัติงานนอกสถานที่ (เช่น ถ่ายทำภาพยนตร์, นัดประชุม) กรุณาเลือก "ทำงานนอกสถานที่ (On Site)" หรือหากอนุมัติการทำงานระยะไกลให้เลือก "Work From Home"'
                : 'คุณไม่ได้อยู่ในพิกัดของออฟฟิศหลักที่ลงทะเบียนไว้ในระบบครับ\n\nหากคุณกำลังออกปฏิบัติงานนอกสถานที่ (เช่น ถ่ายทำภาพยนตร์, นัดประชุม) กรุณาเลือก "ทำงานนอกสถานที่ (On Site)"';
            
            showAlert(outOfOfficeMessage, 'อยู่นอกพื้นที่พิกัดออฟฟิศ');
            return;
        }
        onSelect('OFFICE');
    };

    // Filter locations to only show shoot locations (or all) for reference
    const shootLocations = allLocations.filter(loc => loc.type === 'SHOOT_LOCATION' || loc.type === 'WORK_LOCATION');

    const handleConfirmOnsite = () => {
        if (isSubmitting) return;
        let finalName = 'On Site';

        if (selectedOnsiteLoc && selectedOnsiteLoc !== 'CUSTOM') {
            const loc = shootLocations.find(l => l.id === selectedOnsiteLoc);
            if (loc) finalName = loc.name;
        } else if (selectedOnsiteLoc === 'CUSTOM' && customOnsiteText.trim()) {
            finalName = customOnsiteText.trim();
        }

        if (approvedOnsite) {
            // Already approved, proceed normally
            onSelect('SITE', finalName, false);
        } else {
            // No prior approval, show the Provisional Onsite Warning Panel
            setTempOnsiteName(finalName);
            setShowOnsiteWarning(true);
        }
    };

    if (showWfhWarning) {
        return (
            <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="flex-1 w-full flex flex-col justify-between"
            >
                <div className="flex-1 overflow-y-auto space-y-4 px-0.5 py-1.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] flex flex-col justify-center">
                    <motion.div 
                        initial={{ y: 15, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1, duration: 0.3 }}
                        className={`p-5 border-2 rounded-3xl space-y-4 text-center ${
                            pendingWFHRequest 
                                ? 'border-amber-200 bg-amber-50/70' 
                                : 'border-yellow-200 bg-yellow-50/50'
                        }`}
                    >
                        <div className="flex flex-col items-center gap-3">
                            <div className={`p-3 rounded-full shrink-0 ${
                                pendingWFHRequest ? 'bg-amber-100 text-amber-600' : 'bg-yellow-100 text-yellow-600'
                            }`}>
                                <AlertTriangle className="w-8 h-8" />
                            </div>
                            <div className="space-y-1">
                                <h4 className={`font-bold text-sm ${
                                    pendingWFHRequest ? 'text-amber-900' : 'text-yellow-800'
                                }`}>
                                    {pendingWFHRequest 
                                        ? 'พบคำขอ WFH ที่รออนุมัติอยู่แล้ว' 
                                        : 'ไม่พบใบอนุมัติ WFH สำหรับวันนี้'
                                    }
                                </h4>
                                <p className={`text-[11px] leading-relaxed font-medium ${
                                    pendingWFHRequest ? 'text-amber-800' : 'text-yellow-700'
                                }`}>
                                    {pendingWFHRequest ? (
                                        <>
                                            ℹ️ คุณมีคำขอ WFH สำหรับวันนี้ที่ยื่นไว้แล้ว <b>(รอการอนุมัติ)</b><br/>
                                            ระบบจะใช้คำขอเดิมนี้ในการลงเวลาแบบจำลอง (Provisional WFH) ให้อัตโนมัติ โดยจะไม่สร้างคำขอใหม่ซ้ำซ้อนครับ
                                        </>
                                    ) : (
                                        <>
                                            ⚠️ ไม่พบใบอนุมัติปฏิบัติงาน WFH สำหรับวันนี้ คุณสามารถดำเนินการลงเวลาแบบจำลอง (Provisional WFH) เพื่อเข้าทำงานก่อนได้ แต่จะไม่ถูกนับเป็นชั่วโมงงานสมบูรณ์จนกว่าแอดมินจะกดยืนยัน
                                        </>
                                    )}
                                </p>
                            </div>

                            {!pendingWFHRequest && onSwitchToLeave && (
                                <button
                                    type="button"
                                    onClick={() => onSwitchToLeave('WFH')}
                                    className="px-3 py-1.5 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-xl text-[10px] font-bold border border-yellow-200 transition-all flex items-center gap-1 cursor-pointer"
                                >
                                    <span>ยื่นส่งคำขออนุมัติ WFH ล่วงหน้าตอนนี้ 🏠</span>
                                </button>
                            )}
                            
                            {!pendingWFHRequest && (
                                <div className="w-full text-left mt-1 space-y-1.5">
                                    <label className="text-xs font-semibold text-yellow-800">
                                        ระบุเหตุผลในการขอ WFH (สั้นๆ):
                                    </label>
                                    <textarea
                                        value={provisionalReason}
                                        onChange={(e) => setProvisionalReason(e.target.value)}
                                        placeholder="ระบุเหตุผลสั้นๆ เช่น ปิดงานเอกสารที่บ้าน, มีนัดตรวจสุขภาพ..."
                                        className="w-full p-2.5 text-xs bg-white border border-yellow-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 font-medium text-gray-700 placeholder:text-gray-400 resize-none h-16"
                                        maxLength={200}
                                    />
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
                <div className="shrink-0 pt-3 border-t border-gray-100 bg-white flex gap-2 w-full">
                    <motion.button
                        disabled={isSubmitting}
                        whileHover={isSubmitting ? {} : { scale: 1.02 }}
                        whileTap={isSubmitting ? {} : { scale: 0.98 }}
                        onClick={() => setShowWfhWarning(false)}
                        className={`flex-1 py-2.5 bg-white border border-gray-200 text-gray-500 rounded-xl font-bold text-xs shadow-sm hover:shadow-md transition-all duration-250 ${
                            isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                    >
                        ย้อนกลับ
                    </motion.button>
                    <motion.button
                        disabled={isSubmitting}
                        whileHover={isSubmitting ? {} : { scale: 1.02 }}
                        whileTap={isSubmitting ? {} : { scale: 0.98 }}
                        onClick={() => {
                            const reasonToUse = pendingWFHRequest ? (pendingWFHRequest.reason || 'ใช้คำขอเดิมรออนุมัติ') : (provisionalReason.trim() || 'ลงเวลาแบบจำลอง (Provisional WFH)');
                            onSelect('WFH', undefined, false, reasonToUse);
                        }}
                        className={`flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs shadow-md shadow-amber-100 transition-all duration-250 flex items-center justify-center gap-1.5 ${
                            isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>กำลังดำเนินการ...</span>
                            </>
                        ) : (
                            <span>{pendingWFHRequest ? 'ตกลง, ใช้คำขอเดิมลงเวลาแบบจำลอง' : 'ตกลง, ลงเวลาแบบจำลอง'}</span>
                        )}
                    </motion.button>
                </div>
            </motion.div>
        );
    }

    if (showOnsiteWarning) {
        return (
            <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="flex-1 w-full flex flex-col justify-between"
            >
                <div className="flex-1 overflow-y-auto space-y-4 px-0.5 py-1.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] flex flex-col justify-center">
                    <motion.div 
                        initial={{ y: 15, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1, duration: 0.3 }}
                        className={`p-5 border-2 rounded-3xl space-y-4 text-center ${
                            pendingOnsiteRequest 
                                ? 'border-amber-200 bg-amber-50/70' 
                                : 'border-orange-200 bg-orange-50/50'
                        }`}
                    >
                        <div className="flex flex-col items-center gap-3">
                            <div className={`p-3 rounded-full shrink-0 ${
                                pendingOnsiteRequest ? 'bg-amber-100 text-amber-600' : 'bg-orange-100 text-orange-600'
                            }`}>
                                <AlertTriangle className="w-8 h-8 animate-bounce" />
                            </div>
                            <div className="space-y-1">
                                <h4 className={`font-bold text-sm ${
                                    pendingOnsiteRequest ? 'text-amber-900' : 'text-orange-800'
                                }`}>
                                    {pendingOnsiteRequest 
                                        ? 'พบคำขอ On-site ที่รออนุมัติอยู่แล้ว' 
                                        : 'ไม่พบใบอนุมัติปฏิบัติงานนอกสถานที่ (On-site) สำหรับวันนี้'
                                    }
                                </h4>
                                <p className={`text-[11px] leading-relaxed font-medium ${
                                    pendingOnsiteRequest ? 'text-amber-800' : 'text-orange-700'
                                }`}>
                                    {pendingOnsiteRequest ? (
                                        <>
                                            ℹ️ คุณมีคำขอปฏิบัติงานนอกสถานที่ (On-site) สำหรับวันนี้ที่ยื่นไว้แล้ว <b>(รอการอนุมัติ)</b><br/>
                                            ระบบจะใช้คำขอเดิมนี้ในการลงเวลาแบบจำลอง (Provisional On-site) ให้อัตโนมัติ โดยจะไม่สร้างคำขอใหม่ซ้ำซ้อนครับ
                                        </>
                                    ) : (
                                        <>
                                            ⚠️ ไม่พบใบอนุมัติปฏิบัติงานนอกสถานที่ (On-site) สำหรับวันนี้ คุณสามารถดำเนินการลงเวลาแบบจำลอง (Provisional On-site) เพื่อเริ่มงานก่อนได้ แต่ระบบจะส่งรายงานให้แอดมินพิจารณาตรวจสอบสิทธิ์และอนุมัติย้อนหลัง
                                        </>
                                    )}
                                </p>
                            </div>

                            {!pendingOnsiteRequest && onSwitchToLeave && (
                                <button
                                    type="button"
                                    onClick={() => onSwitchToLeave('ONSITE')}
                                    className="px-3 py-1.5 bg-orange-100 hover:bg-orange-200 text-orange-800 rounded-xl text-[10px] font-bold border border-orange-200 transition-all flex items-center gap-1 cursor-pointer"
                                >
                                    <span>ยื่นส่งคำขออนุมัติ On-site ล่วงหน้าตอนนี้ 🚗</span>
                                </button>
                            )}

                            {!pendingOnsiteRequest && (
                                <div className="w-full text-left mt-1 space-y-1.5">
                                    <label className="text-xs font-semibold text-orange-800">
                                        ระบุเหตุผลปฏิบัติงานนอกสถานที่ (สั้นๆ):
                                    </label>
                                    <textarea
                                        value={provisionalReason}
                                        onChange={(e) => setProvisionalReason(e.target.value)}
                                        placeholder="ระบุเหตุผลสั้นๆ เช่น ประชุมนอกสถานที่กับลูกค้า, ดูสถานที่ถ่ายทำ..."
                                        className="w-full p-2.5 text-xs bg-white border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 font-medium text-gray-700 placeholder:text-gray-400 resize-none h-16"
                                        maxLength={200}
                                    />
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
                <div className="shrink-0 pt-3 border-t border-gray-100 bg-white flex gap-2 w-full">
                    <motion.button
                        disabled={isSubmitting}
                        whileHover={isSubmitting ? {} : { scale: 1.02 }}
                        whileTap={isSubmitting ? {} : { scale: 0.98 }}
                        onClick={() => setShowOnsiteWarning(false)}
                        className={`flex-1 py-2.5 bg-white border border-gray-200 text-gray-500 rounded-xl font-bold text-xs shadow-sm hover:shadow-md transition-all duration-250 ${
                            isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                    >
                        ย้อนกลับ
                    </motion.button>
                    <motion.button
                        disabled={isSubmitting}
                        whileHover={isSubmitting ? {} : { scale: 1.02 }}
                        whileTap={isSubmitting ? {} : { scale: 0.98 }}
                        onClick={() => {
                            const reasonToUse = pendingOnsiteRequest ? (pendingOnsiteRequest.reason || 'ใช้คำขอเดิมรออนุมัติ') : (provisionalReason.trim() || 'ลงเวลาแบบจำลอง (Provisional On-site)');
                            onSelect('SITE', tempOnsiteName, true, reasonToUse);
                        }}
                        className={`flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs shadow-md shadow-amber-100 transition-all duration-250 flex items-center justify-center gap-1.5 ${
                            isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>กำลังดำเนินการ...</span>
                            </>
                        ) : (
                            <span>{pendingOnsiteRequest ? 'ตกลง, ใช้คำขอเดิมลงเวลาแบบจำลอง' : 'ตกลง, ลงเวลาแบบจำลอง'}</span>
                        )}
                    </motion.button>
                </div>
            </motion.div>
        );
    }

    return (
        <div className="flex-1 w-full flex flex-col justify-between overflow-hidden relative">
            <AnimatePresence mode="wait">
                {!showOnsiteSelector ? (
                    <motion.div
                        key="main-options"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="flex-1 w-full flex flex-col justify-between min-h-0"
                    >
                        <div className="flex-1 overflow-y-auto space-y-4 px-0.5 py-1.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                            <p className="text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">เลือกประเภทการเข้างาน (Work Mode)</p>
                            
                            {/* 1. Office Option */}
                            <motion.button 
                                disabled={isSubmitting}
                                whileHover={(matchedLocation && !isSubmitting) ? { scale: 1.02, y: -1 } : {}}
                                whileTap={(matchedLocation && !isSubmitting) ? { scale: 0.98 } : {}}
                                style={{ originX: 0.5, originY: 0.5 }}
                                onClick={handleSelectOffice}
                                className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all relative z-0 hover:z-10 ${
                                    isSubmitting
                                    ? 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed shadow-none'
                                    : matchedLocation
                                        ? 'border-indigo-100 bg-indigo-50/50 hover:border-indigo-300 cursor-pointer shadow-sm hover:shadow' 
                                        : 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white rounded-xl text-indigo-600 shadow-sm"><Building2 className="w-6 h-6"/></div>
                                    <div className="text-left">
                                        <h4 className="font-bold text-gray-800 text-sm sm:text-base">เข้าออฟฟิศหลัก (Office)</h4>
                                        <p className="text-xs text-gray-500">
                                            {matchedLocation ? `📍 อยู่ใกล้พิกัด: ${matchedLocation.name}` : 'อยู่นอกพื้นที่สำนักงานออฟฟิศหลัก ❌'}
                                        </p>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-300" />
                            </motion.button>

                            {/* 2. Work From Home Option */}
                            {isWfhEnabled && (
                                <motion.button 
                                    disabled={isSubmitting}
                                    whileHover={isSubmitting ? {} : { scale: 1.02, y: -1 }}
                                    whileTap={isSubmitting ? {} : { scale: 0.98 }}
                                    style={{ originX: 0.5, originY: 0.5 }}
                                    onClick={() => {
                                        if (approvedWFH) {
                                            onSelect('WFH');
                                        } else {
                                            setShowWfhWarning(true);
                                        }
                                    }}
                                    className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all group relative z-0 hover:z-10 ${
                                        isSubmitting
                                        ? 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed shadow-none'
                                        : approvedWFH 
                                            ? 'border-blue-500 bg-blue-50 shadow-md ring-1 ring-blue-200' 
                                            : 'border-blue-100 bg-blue-50/50 hover:border-blue-300 shadow-sm hover:shadow'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-xl shadow-sm ${approvedWFH ? 'bg-blue-500 text-white' : 'bg-white text-blue-600'}`}>
                                            <Home className="w-6 h-6"/>
                                        </div>
                                        <div className="text-left">
                                            <h4 className="font-bold text-gray-800 text-sm sm:text-base flex items-center gap-2">
                                                Work From Home
                                                {approvedWFH && <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full border border-green-200 font-bold leading-none whitespace-nowrap h-fit">อนุมัติแล้ว</span>}
                                                {!approvedWFH && pendingWFHRequest && <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full border border-amber-200 font-bold leading-none whitespace-nowrap h-fit">รออนุมัติ</span>}
                                            </h4>
                                            <p className="text-xs text-gray-500">
                                                {approvedWFH 
                                                    ? 'สิทธิ์ได้รับการอนุมัติในระบบแล้ว' 
                                                    : pendingWFHRequest 
                                                        ? 'ℹ️ มีคำขอยื่นไว้แล้ว (จะใช้คำขอเดิมลงเวลาจำลอง)' 
                                                        : '⚠️ ไม่ได้รับสิทธิ์ล่วงหน้า (ลงเวลาจำลอง)'}
                                            </p>
                                            {!approvedWFH && !pendingWFHRequest && onSwitchToLeave && (
                                                <span 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onSwitchToLeave('WFH');
                                                    }}
                                                    className="mt-1 block text-[10px] font-bold text-blue-600 underline hover:text-blue-800 transition-colors cursor-pointer"
                                                >
                                                    ยื่นคำขออนุมัติ WFH ล่วงหน้าคลิกที่นี่ 🏠
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {approvedWFH ? <Check className="w-6 h-6 text-blue-600 animate-bounce" /> : <ChevronRight className="w-5 h-5 text-gray-300" />}
                                </motion.button>
                            )}

                            {/* 3. On-site (Outside) option */}
                            <motion.button 
                                disabled={isSubmitting}
                                whileHover={isSubmitting ? {} : { scale: 1.02, y: -1 }}
                                whileTap={isSubmitting ? {} : { scale: 0.98 }}
                                style={{ originX: 0.5, originY: 0.5 }}
                                onClick={() => setShowOnsiteSelector(true)}
                                className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all group relative z-0 hover:z-10 ${
                                    isSubmitting
                                    ? 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed shadow-none'
                                    : approvedOnsite 
                                        ? 'border-orange-500 bg-orange-50 shadow-md ring-1 ring-orange-200' 
                                        : pendingOnsiteRequest
                                            ? 'border-amber-300 bg-amber-50/50 hover:border-amber-400 shadow-sm hover:shadow'
                                            : 'border-orange-100 bg-orange-50/50 hover:border-orange-300 shadow-sm hover:shadow'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-xl shadow-sm ${approvedOnsite ? 'bg-orange-500 text-white' : 'bg-white text-orange-600'}`}>
                                        <Briefcase className="w-6 h-6"/>
                                    </div>
                                    <div className="text-left">
                                        <h4 className="font-bold text-gray-800 text-sm sm:text-base flex items-center gap-2">
                                            ทำงานนอกสถานที่ / ออกกอง (On-site)
                                            {approvedOnsite && <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full border border-green-200 font-bold leading-none whitespace-nowrap h-fit">อนุมัติแล้ว</span>}
                                            {!approvedOnsite && pendingOnsiteRequest && <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full border border-amber-200 font-bold leading-none whitespace-nowrap h-fit">รออนุมัติ</span>}
                                        </h4>
                                        <p className="text-xs text-gray-500">
                                            {approvedOnsite 
                                                ? 'สิทธิ์ได้รับการอนุมัติในระบบแล้ว' 
                                                : pendingOnsiteRequest 
                                                    ? 'ℹ️ มีคำขอยื่นไว้แล้ว (จะใช้คำขอเดิมลงเวลาจำลอง)' 
                                                    : '⚠️ ไม่ได้รับสิทธิ์ล่วงหน้า (ลงเวลาจำลอง)'}
                                        </p>
                                        {!approvedOnsite && !pendingOnsiteRequest && onSwitchToLeave && (
                                            <span 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onSwitchToLeave('ONSITE');
                                                }}
                                                className="mt-1 block text-[10px] font-bold text-orange-600 underline hover:text-orange-800 transition-colors cursor-pointer"
                                            >
                                                ยื่นคำขออนุมัติ On-site ล่วงหน้าคลิกที่นี่ 🚗
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {approvedOnsite ? <Check className="w-6 h-6 text-orange-600 animate-bounce" /> : <ChevronRight className="w-5 h-5 text-gray-300" />}
                            </motion.button>

                            {/* Back to Geolocation Scan Button */}
                            {onBack && (
                                <motion.button
                                    disabled={isSubmitting}
                                    whileHover={isSubmitting ? {} : { scale: 1.01 }}
                                    whileTap={isSubmitting ? {} : { scale: 0.99 }}
                                    style={{ originX: 0.5, originY: 0.5 }}
                                    onClick={onBack}
                                    className={`w-full py-3 border-2 border-dashed border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                                        isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                                >
                                    ย้อนกลับไปหน้าตรวจสอบพิกัด
                                </motion.button>
                            )}
                        </div>
                    </motion.div>
                ) : (
                    /* Onsite Selector Panel */
                    <motion.div
                        key="onsite-panel"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="flex-1 w-full flex flex-col justify-between min-h-0"
                    >
                        <div className="flex-1 overflow-y-auto space-y-4 px-0.5 py-1.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                            <div className="p-5 border border-orange-100 bg-orange-50/20 rounded-3xl space-y-4 shadow-sm">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
                                        <MapPin className="w-4 h-4 text-orange-500 animate-pulse" />
                                        ระบุพิกัดปฏิบัติงานนอกสถานที่
                                    </h4>
                                    <motion.button 
                                        disabled={isSubmitting}
                                        whileHover={isSubmitting ? {} : { scale: 1.05 }}
                                        whileTap={isSubmitting ? {} : { scale: 0.95 }}
                                        onClick={() => setShowOnsiteSelector(false)} 
                                        className={`text-xs font-bold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-3 py-1 rounded-full border border-orange-200 transition-all ${
                                            isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                                        }`}
                                    >
                                        ย้อนกลับ
                                    </motion.button>
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">เลือกจุดลงเวลานอกสถานที่ในระบบ:</label>
                                        <select
                                            disabled={isSubmitting}
                                            value={selectedOnsiteLoc}
                                            onChange={e => {
                                                setSelectedOnsiteLoc(e.target.value);
                                                if (e.target.value !== 'CUSTOM') setCustomOnsiteText('');
                                            }}
                                            className={`w-full px-3 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none bg-white focus:border-orange-400 shadow-sm transition-all ${
                                                isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                                            }`}
                                        >
                                            <option value="">-- ไม่ระบุชื่อพิกัด (ใช้ตำแหน่ง GPS ปัจจุบัน) --</option>
                                            {shootLocations.map(loc => (
                                                <option key={loc.id} value={loc.id}>
                                                    {loc.name} {loc.type === 'WORK_LOCATION' ? '(ออฟฟิศสาขา)' : '(สถานที่ถ่ายทำ)'}
                                                </option>
                                            ))}
                                            <option value="CUSTOM">-- พิมพ์ระบุสถานที่เอง --</option>
                                        </select>
                                    </div>

                                    <AnimatePresence>
                                        {selectedOnsiteLoc === 'CUSTOM' && (
                                            <motion.div 
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="overflow-hidden"
                                            >
                                                <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">ระบุชื่อสถานที่ทำงานนอกสถานที่:</label>
                                                <input
                                                    disabled={isSubmitting}
                                                    type="text"
                                                    className={`w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none bg-white focus:border-orange-400 transition-all shadow-sm ${
                                                        isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                                                    }`}
                                                    placeholder="เช่น รพ.กรุงเทพ, ร้านกาแฟ Starbuck สาขา..."
                                                    value={customOnsiteText}
                                                    onChange={e => setCustomOnsiteText(e.target.value)}
                                                />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>

                        <div className="shrink-0 pt-3 border-t border-gray-100 bg-white w-full">
                            <motion.button
                                disabled={isSubmitting}
                                whileHover={isSubmitting ? {} : { scale: 1.02 }}
                                whileTap={isSubmitting ? {} : { scale: 0.98 }}
                                onClick={handleConfirmOnsite}
                                className={`w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-orange-100 transition-all flex items-center justify-center gap-1.5 ${
                                    isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>กำลังดำเนินการ...</span>
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-4 h-4" />
                                        ยืนยันลงเวลาแบบ On-site
                                    </>
                                )}
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default WorkTypeStep;
