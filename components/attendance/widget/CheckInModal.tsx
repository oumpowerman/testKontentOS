import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, CheckCircle2, Loader2, Settings } from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { WorkLocation, LocationDef } from '../../../types/attendance';
import { BRAND_CONFIG } from '../../../config/brand';
import CameraView from './CameraView';

// Sub-steps components
import LocationStep from '../steps/LocationStep';
import WorkTypeStep from '../steps/WorkTypeStep';
import PreviewStep from '../steps/PreviewStep';
import LateInterventionOverlay from '../steps/LateInterventionOverlay';
import LatePenaltyBreakdownOverlay from '../steps/LatePenaltyBreakdownOverlay';

// Refactored Hooks & Parts
import { useCheckInState, CheckInLocationMatch } from './hooks/useCheckInState';
import CheckInHeader from './parts/CheckInHeader';
import GpsVerificationShield from './parts/GpsVerificationShield';
import LocationMatchSelector from './parts/LocationMatchSelector';

interface CheckInModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (
        type: WorkLocation,
        file: File | null,
        location: { lat: number, lng: number },
        locationName?: string,
        isProvisionalOnsite?: boolean,
        provisionalReason?: string,
        isGpsAppeal?: boolean,
        gpsAppealReason?: string
    ) => void;
    availableLocations?: LocationDef[];
    startTime?: string;
    lateBuffer?: number;
    onSwitchToLeave?: (type?: any, workType?: 'WFH' | 'ONSITE') => void;
    approvedWFH?: boolean; 
    approvedOnsite?: boolean;
    pendingWFHRequest?: any;
    pendingOnsiteRequest?: any;
    hasLateRequest?: boolean; 
    approvedLateTime?: string;
    pendingLateTime?: string;
    isDriveConnected?: boolean; 
    userId?: string; 
    todayRequests?: any[];
}

const CheckInModal: React.FC<CheckInModalProps> = ({ 
    isOpen,
    onClose,
    onConfirm,
    availableLocations = [],
    startTime,
    lateBuffer = 0,
    onSwitchToLeave,
    approvedWFH,
    approvedOnsite,
    pendingWFHRequest,
    pendingOnsiteRequest,
    hasLateRequest,
    approvedLateTime,
    pendingLateTime,
    isDriveConnected,
    userId,
    todayRequests = [],
}) => {
    const {
        step,
        direction,
        isFadeOnly,
        selectedType,
        setSelectedType,
        isSubmitting,
        timeLeft,
        compressing,
        showLateIntervention,
        setShowLateIntervention,
        showLatePenaltyBreakdown,
        setShowLatePenaltyBreakdown,
        needsSelfieDynamic,
        locationState,
        setLocationState,
        detectedMatches,
        selectedMatch,
        setSelectedMatch,
        isGpsSecure,
        gpsThreatReason,
        isGpsAppealActive,
        setIsGpsAppealActive,
        isUserLate,
        isExceededLastShift,
        lateMinutes,
        isShiftsEnabled,
        shiftsList,
        shiftResult,
        targets,
        isLoadingMasterData,
        currentUserProfile,
        handleSetStep,
        checkLocation,
        handleTypeSelect,
        handleInstantConfirm,
        handleCapture,
        handleAcceptLateness,
        handleSubmit,
        setSearchParams,
        challenge,
        capturedFile,
    } = useCheckInState({
        isOpen,
        onClose,
        onConfirm,
        availableLocations,
        startTime,
        lateBuffer,
        approvedWFH,
        approvedOnsite,
        pendingWFHRequest,
        pendingOnsiteRequest,
        hasLateRequest,
        approvedLateTime,
        pendingLateTime,
        userId,
        todayRequests,
    });

    const stepVariants: Variants = {
        enter: (dir: number) => ({
            x: isFadeOnly ? 0 : (dir > 0 ? '100%' : '-100%'),
            opacity: 0,
        }),
        center: {
            x: 0,
            opacity: 1,
            transition: {
                x: { type: 'spring', stiffness: 350, damping: 30 },
                opacity: { duration: 0.25, ease: 'easeOut' }
            }
        },
        exit: (dir: number) => ({
            x: isFadeOnly ? 0 : (dir > 0 ? '-100%' : '100%'),
            opacity: 0,
            transition: {
                x: { type: 'spring', stiffness: 350, damping: 30 },
                opacity: { duration: 0.15, ease: 'easeIn' }
            }
        })
    };

    const effectiveDisplayStartTime = shiftResult?.targetStartTime
        ? shiftResult.targetStartTime
        : (approvedLateTime || startTime || '10:00');

    if (isLoadingMasterData && isOpen) {
        return null; // Let master data load
    }

    if (step === 'CAMERA' && isOpen) {
        return (
            <CameraView 
                challengeText={challenge} 
                onCapture={handleCapture} 
                onClose={() => handleSetStep(selectedMatch ? 'CONFIRM_LOCATION' : 'TYPE')} 
            />
        );
    }

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 font-sans"
                >
                    <motion.div 
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 26 }}
                        className="bg-white w-full max-w-md min-h-[540px] max-h-[95vh] md:max-h-[640px] h-auto rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col relative"
                    >
                        <CheckInHeader
                            selectedType={selectedType}
                            matchedLocationName={locationState.matchedLocation?.name}
                            compressing={compressing}
                            isSubmitting={isSubmitting}
                            step={step}
                            timeLeft={timeLeft}
                            needsSelfieDynamic={needsSelfieDynamic}
                            isDriveConnected={isDriveConnected}
                            onClose={onClose}
                        />

                        <div className="p-6 flex-1 overflow-hidden relative flex flex-col min-h-0">
                            {/* Late Intervention & Penalty Breakdown Overlays */}
                            <AnimatePresence mode="wait">
                                {showLateIntervention && (
                                    <LateInterventionOverlay
                                        startTime={effectiveDisplayStartTime}
                                        isExceededLastShift={isExceededLastShift}
                                        onSwitchToLeave={() => {
                                            onClose();
                                            if (onSwitchToLeave) {
                                                onSwitchToLeave(
                                                    'LATE_ENTRY', 
                                                    approvedWFH ? undefined : (approvedOnsite ? undefined : (pendingWFHRequest ? 'WFH' : (pendingOnsiteRequest ? 'ONSITE' : undefined)))
                                                );
                                            }
                                        }}
                                        onClose={onClose}
                                        onConfirm={() => {
                                            setShowLateIntervention(false);
                                            setShowLatePenaltyBreakdown(true);
                                        }}
                                        onGoBack={() => {
                                            setShowLateIntervention(false);
                                            handleSetStep('TYPE');
                                        }}
                                    />
                                )}
                                {showLatePenaltyBreakdown && (
                                    <LatePenaltyBreakdownOverlay
                                        startTime={effectiveDisplayStartTime}
                                        lateMinutes={lateMinutes}
                                        onConfirm={handleAcceptLateness}
                                        onGoBack={() => {
                                            setShowLatePenaltyBreakdown(false);
                                            handleSetStep('TYPE');
                                        }}
                                    />
                                )}
                            </AnimatePresence>

                            <AnimatePresence initial={false} custom={direction} mode="wait">
                                <motion.div
                                    key={shiftResult?.isBlocked && BRAND_CONFIG.allowLateAppealMode !== 2 ? 'blocked' : step}
                                    custom={direction}
                                    variants={stepVariants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    className="w-full flex-1 flex flex-col justify-between min-h-0"
                                >
                                    {shiftResult?.isBlocked && BRAND_CONFIG.allowLateAppealMode !== 2 ? (
                                        <div className="flex-1 flex flex-col justify-between h-full">
                                            <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                                                <div className="bg-rose-50 p-4 rounded-full mb-4 border border-rose-100 animate-bounce">
                                                    <AlertTriangle className="w-12 h-12 text-rose-500" />
                                                </div>
                                                <h3 className="text-lg font-bold text-gray-900 mb-2">
                                                    เลยช่วงเวลาเข้างานแล้ว
                                                </h3>
                                                <p className="text-sm font-semibold text-rose-600 mb-3">
                                                    (Overdue / Required Appeal)
                                                </p>
                                                <p className="text-xs text-gray-500 leading-relaxed px-2 max-w-sm">
                                                    คุณลงเวลาเกินกำหนด ({shiftResult.targetStartTime} น.) ร่วมกับช่วงเวลาผ่อนปรนเรียบร้อยแล้วค่ะ ระบบไม่อนุญาตให้ลงเวลาปกติ กรุณาส่งใบคำร้องพิเศษเพื่อขออนุมัติย้อนหลังจากผู้ดูแลระบบอย่างเป็นทางการแทน
                                                </p>
                                                
                                                <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-100 text-left w-full text-xs space-y-1.5">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-400">เวลาที่พบ:</span>
                                                        <span className="font-bold text-gray-700">{shiftResult.targetStartTime} น.</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-400">เวลาขณะนี้:</span>
                                                        <span className="font-bold text-rose-600">{new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-400">มาสายเกินกะ:</span>
                                                        <span className="font-bold text-rose-600">{shiftResult.lateMinutes} นาที</span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="shrink-0 pt-3 border-t border-gray-100 space-y-2 bg-white w-full">
                                                <button 
                                                    onClick={() => {
                                                        onClose();
                                                        if (onSwitchToLeave) {
                                                            onSwitchToLeave(
                                                                'LATE_ENTRY',
                                                                approvedWFH ? undefined : (approvedOnsite ? undefined : (pendingWFHRequest ? 'WFH' : (pendingOnsiteRequest ? 'ONSITE' : undefined)))
                                                            );
                                                        }
                                                    }}
                                                    className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-lg shadow-rose-100 transition-all active:scale-95 flex items-center justify-center gap-2 text-sm cursor-pointer"
                                                >
                                                    📝 ยื่นคำร้องขอเข้ากะย้อนหลัง (Appeal)
                                                </button>
                                                <button 
                                                    onClick={onClose}
                                                    className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-xl font-semibold transition-all border border-gray-150 text-xs cursor-pointer"
                                                >
                                                    ปิดหน้าต่าง
                                                </button>
                                            </div>
                                        </div>
                                    ) : !isGpsSecure && !isGpsAppealActive ? (
                                        <div className="flex-1 flex flex-col justify-center items-center w-full p-4">
                                            <GpsVerificationShield
                                                isGpsSecure={isGpsSecure}
                                                isUserLate={isUserLate}
                                                startTime={effectiveDisplayStartTime}
                                                gpsThreatReason={gpsThreatReason}
                                                onAppealClick={() => {
                                                    setIsGpsAppealActive(true);
                                                    handleSetStep('TYPE');
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        <>
                                            {/* Step: LOCATION (Scanning GPS) */}
                                            {step === 'LOCATION' && (
                                                <div className="flex-1 flex flex-col justify-center w-full">
                                                    <LocationStep 
                                                        status={locationState.status} 
                                                        distance={locationState.distance || 0} 
                                                        lat={locationState.lat} 
                                                        lng={locationState.lng} 
                                                        matchedLocation={locationState.matchedLocation}
                                                        onRetry={checkLocation}
                                                        approvedWFH={approvedWFH} 
                                                    />
                                                </div>
                                            )}

                                            {/* Step: CONFIRM_LOCATION (Instant verification match & overlap picker) */}
                                            {step === 'CONFIRM_LOCATION' && selectedMatch && (
                                                <div className="flex-1 flex flex-col justify-between w-full min-h-0">
                                                    <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin w-full">
                                                        <GpsVerificationShield
                                                            isGpsSecure={isGpsSecure}
                                                            isUserLate={isUserLate}
                                                            startTime={effectiveDisplayStartTime}
                                                            gpsThreatReason={gpsThreatReason}
                                                            onAppealClick={() => {
                                                                setIsGpsAppealActive(true);
                                                                handleSetStep('TYPE');
                                                            }}
                                                        />

                                                        {shiftResult && (
                                                            <motion.div 
                                                                initial={{ opacity: 0, y: 10 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 flex items-start gap-2.5 shadow-sm"
                                                            >
                                                                <div className="p-1.5 bg-emerald-500 text-white rounded-lg mt-0.5 shrink-0">
                                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                                </div>
                                                                <div className="space-y-0.5">
                                                                    <p className="text-xs font-bold text-teal-800">
                                                                        ลงเวลารอบนี้เพื่อเข้ากะ: {shiftResult.targetStartTime} น.
                                                                    </p>
                                                                    <p className="text-[10px] text-teal-600/85 font-medium leading-normal">
                                                                        ระบบวิเคราะห์เวลาเข้างานแบบ Real-time และล็อกกะงานให้อัตโนมัติค่ะ
                                                                    </p>
                                                                </div>
                                                            </motion.div>
                                                        )}

                                                        <LocationMatchSelector
                                                            selectedMatch={selectedMatch}
                                                            detectedMatches={detectedMatches}
                                                            onSelectMatch={(match: CheckInLocationMatch) => {
                                                                setSelectedMatch(match);
                                                                setSelectedType(match.type === 'WORK_LOCATION' ? 'OFFICE' : 'SITE');
                                                                setLocationState(prev => ({
                                                                    ...prev,
                                                                    matchedLocation: match,
                                                                    distance: match.distance
                                                                }));
                                                            }}
                                                        />
                                                    </div>

                                                    <div className="shrink-0 pt-3 border-t border-gray-100 bg-white space-y-2 w-full">
                                                        <button 
                                                            onClick={handleInstantConfirm}
                                                            disabled={!isGpsSecure || isUserLate || isSubmitting}
                                                            className={`w-full py-3 text-white rounded-2xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 text-sm ${
                                                                isGpsSecure && !isUserLate && !isSubmitting
                                                                    ? 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 cursor-pointer' 
                                                                    : 'bg-gray-300 text-gray-400 cursor-not-allowed shadow-none'
                                                            }`}
                                                        >
                                                            {isUserLate ? (
                                                                <>
                                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                                    <span>กำลังนำคุณไปหน้ากรอกใบสาย...</span>
                                                                </>
                                                            ) : isSubmitting ? (
                                                                <>
                                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                                    <span>กำลังดำเนินการ...</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <CheckCircle2 className="w-4 h-4" /> ใช่, ฉันต้องการเข้างานที่นี่
                                                                </>
                                                            )}
                                                        </button>
                                                        <button 
                                                            onClick={() => handleSetStep('TYPE')}
                                                            disabled={!isGpsSecure || isUserLate || isSubmitting}
                                                            className={`w-full py-2 border rounded-2xl font-bold transition-all text-xs ${
                                                                isGpsSecure && !isUserLate && !isSubmitting
                                                                    ? 'bg-white hover:bg-gray-50 border-gray-200 text-gray-500 cursor-pointer' 
                                                                    : 'bg-gray-50 border-gray-150 text-gray-400 cursor-not-allowed'
                                                            }`}
                                                        >
                                                            ไม่ใช่ตำแหน่งนี้ / ต้องการเลือกประเภทงานเอง
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Step: TYPE (Fallback Mode Selector) */}
                                            {step === 'TYPE' && (
                                                <WorkTypeStep 
                                                    matchedLocation={locationState.matchedLocation} 
                                                    onSelect={handleTypeSelect} 
                                                    approvedWFH={approvedWFH} 
                                                    approvedOnsite={approvedOnsite}
                                                    pendingWFHRequest={pendingWFHRequest}
                                                    pendingOnsiteRequest={pendingOnsiteRequest}
                                                    allLocations={targets}
                                                    onBack={() => handleSetStep(selectedMatch ? 'CONFIRM_LOCATION' : 'LOCATION')}
                                                    isSubmitting={isSubmitting}
                                                    onSwitchToLeave={onSwitchToLeave}
                                                    isGpsAppealActive={isGpsAppealActive}
                                                />
                                            )}

                                            {/* Step: PREVIEW (Check-in review) */}
                                            {step === 'PREVIEW' && (
                                                <PreviewStep 
                                                    capturedFile={capturedFile}
                                                    challenge={challenge}
                                                    locationState={locationState}
                                                    selectedType={selectedType}
                                                    isSubmitting={isSubmitting || compressing}
                                                    timeLeft={timeLeft}
                                                    onRetake={() => handleSetStep('CAMERA')}
                                                    onSubmit={() => handleSubmit(false)}
                                                />
                                            )}

                                            {/* Step: NO_CONFIG (Error Fallback) */}
                                            {step === 'NO_CONFIG' && (
                                                <div className="flex-1 flex flex-col justify-between text-center">
                                                    <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center py-4">
                                                        <div className="bg-amber-50 p-3 rounded-full mb-3 border border-amber-100">
                                                            <AlertTriangle className="w-10 h-10 text-amber-500 animate-pulse" />
                                                        </div>
                                                        <h4 className="text-base font-bold text-gray-800 mb-1.5">
                                                            ไม่พบข้อมูลพิกัดสถานที่ทำงาน
                                                        </h4>
                                                        <p className="text-xs text-gray-500 leading-relaxed px-4">
                                                            ขณะนี้ระบบยังไม่มีการตั้งค่าพิกัดสำนักงานหลักหรือสถานที่ปฏิบัติงาน กรุณาติดต่อฝ่ายบุคคล (HR) หรือผู้ดูแลระบบให้ดำเนินการปักหมุดพิกัดในเมนูตั้งค่าก่อนครับ
                                                        </p>
                                                    </div>
                                                    <div className="shrink-0 pt-3 border-t border-gray-100 bg-white w-full">
                                                        {currentUserProfile?.role === 'ADMIN' ? (
                                                            <div className="space-y-2">
                                                                <button 
                                                                    onClick={() => {
                                                                        onClose();
                                                                        setSearchParams(prev => {
                                                                            const next = new URLSearchParams(prev);
                                                                            next.set('view', 'MASTER_DATA');
                                                                            next.set('tab', 'ATTENDANCE_RULES');
                                                                            return next;
                                                                        });
                                                                    }}
                                                                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2 text-sm"
                                                                >
                                                                    <span>ไปหน้าตั้งค่าพิกัดทันที</span>
                                                                </button>
                                                                <button 
                                                                    onClick={onClose}
                                                                    className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl font-semibold transition-all border border-gray-150 text-xs"
                                                                >
                                                                    ปิดหน้าต่าง
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button 
                                                                onClick={onClose}
                                                                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95 text-sm"
                                                            >
                                                                ตกลง / ปิดหน้าต่าง
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default CheckInModal;
