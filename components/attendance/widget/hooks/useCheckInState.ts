import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { WorkLocation, LocationDef, ShiftSlotResult } from '../../../../types/attendance';
import { BRAND_CONFIG } from '../../../../config/brand';
import { getRandomPose, OFFICE_COORDS } from '../../../../lib/locationUtils';
import { compressImage } from '../../../../lib/imageUtils';
import { useGlobalDialog } from '../../../../context/GlobalDialogContext';
import { useMasterData } from '../../../../hooks/useMasterData';
import { useUserSession } from '../../../../context/UserSessionContext';
import { checkNeedsSelfieVerification } from '../../../../lib/selfieUtils';
import { useCheckInLocation } from '../../../../hooks/attendance/useCheckInLocation';
import { getMatchedShiftSlot, getICTTime } from '../../../../lib/attendanceUtils';
import { 
    getHalfDayOffset, 
    getEarliestTransitionPointMinutes, 
    calculatePMShiftDetails, 
    timeToMinutes 
} from '../../../../utils/shiftCalculator';

export type CheckInStep = 'LOCATION' | 'CONFIRM_LOCATION' | 'TYPE' | 'CAMERA' | 'PREVIEW' | 'NO_CONFIG';

export interface CheckInLocationMatch extends LocationDef {
    distance: number;
    type?: string;
}

const STEP_FLOW_ORDER: CheckInStep[] = ['LOCATION', 'CONFIRM_LOCATION', 'TYPE', 'CAMERA', 'PREVIEW', 'NO_CONFIG'];

interface UseCheckInStateProps {
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
    approvedWFH?: boolean;
    approvedOnsite?: boolean;
    pendingWFHRequest?: any;
    pendingOnsiteRequest?: any;
    hasLateRequest?: boolean;
    approvedLateTime?: string;
    pendingLateTime?: string;
    userId?: string;
    todayRequests?: any[];
}

export function useCheckInState({
    isOpen,
    onClose,
    onConfirm,
    availableLocations = [],
    startTime,
    lateBuffer = 0,
    approvedWFH,
    approvedOnsite,
    pendingWFHRequest,
    pendingOnsiteRequest,
    hasLateRequest,
    approvedLateTime,
    pendingLateTime,
    userId,
    todayRequests = [],
}: UseCheckInStateProps) {
    const { showAlert, showConfirm } = useGlobalDialog();
    const { masterOptions, isLoading } = useMasterData();
    const { currentUserProfile } = useUserSession();
    const [, setSearchParams] = useSearchParams();

    const [step, setStep] = useState<CheckInStep>('LOCATION');
    const [prevStep, setPrevStep] = useState<CheckInStep | null>(null);
    const [direction, setDirection] = useState(1);

    const getStepIndex = (s: CheckInStep): number => STEP_FLOW_ORDER.indexOf(s);

    const handleSetStep = (newStep: CheckInStep) => {
        setDirection(getStepIndex(newStep) >= getStepIndex(step) ? 1 : -1);
        setPrevStep(step);
        setStep(newStep);
        if (newStep === 'TYPE' || newStep === 'LOCATION') {
            setSelectedType(null);
        }
    };

    const isFadeOnly = step === 'LOCATION' || prevStep === 'LOCATION';

    const [selectedType, setSelectedType] = useState<WorkLocation | null>(null);
    const [provisionalOnsite, setProvisionalOnsite] = useState(false);
    const [provisionalReason, setProvisionalReason] = useState('');
    const [isGpsAppealActive, setIsGpsAppealActive] = useState(false);
    const [challenge, setChallenge] = useState('');
    const [capturedFile, setCapturedFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [timeLeft, setTimeLeft] = useState(60);
    const [compressing, setCompressing] = useState(false);
    const [showLateIntervention, setShowLateIntervention] = useState(false);
    const [showLatePenaltyBreakdown, setShowLatePenaltyBreakdown] = useState(false);
    const [hasAcceptedLateness, setHasAcceptedLateness] = useState(false);
    const [bypassSelfie, setBypassSelfie] = useState(false);

    const needsSelfieDynamic = useMemo(() => {
        const selfieModeOpt = masterOptions?.find(o => o.type === 'WORK_CONFIG' && o.key === 'SELFIE_VERIFICATION_MODE');
        const selfieDaysOpt = masterOptions?.find(o => o.type === 'WORK_CONFIG' && o.key === 'SELFIE_VERIFICATION_DAYS');
        const selfieMode = selfieModeOpt?.label || 'ALWAYS_ON';
        const selfieDays = selfieDaysOpt?.label || '3';
        return checkNeedsSelfieVerification(userId || '', selfieMode, selfieDays, new Date(), currentUserProfile?.workDays);
    }, [masterOptions, userId, currentUserProfile]);

    const fourStageConfig = useMemo(() => {
        const enableOpt = masterOptions?.find(o => o.type === 'WORK_CONFIG' && o.key === 'ENABLE_FOUR_STAGE_LATE');
        const stage1MaxOpt = masterOptions?.find(o => o.type === 'WORK_CONFIG' && o.key === 'LATE_STAGE1_MAX');
        const stage2MaxOpt = masterOptions?.find(o => o.type === 'WORK_CONFIG' && o.key === 'LATE_STAGE2_MAX');
        const stage3MaxOpt = masterOptions?.find(o => o.type === 'WORK_CONFIG' && o.key === 'LATE_STAGE3_MAX');
        const stage4BaseHpOpt = masterOptions?.find(o => o.type === 'WORK_CONFIG' && o.key === 'LATE_STAGE4_BASE_HP');
        const hpPerMinuteRateOpt = masterOptions?.find(o => o.type === 'WORK_CONFIG' && o.key === 'LATE_HP_PER_MINUTE');

        return {
            enableFourStageLateRules: enableOpt ? enableOpt.label === 'true' : ((BRAND_CONFIG as any).enableFourStageLateRules ?? true),
            stage1MaxMins: stage1MaxOpt ? Number(stage1MaxOpt.label) : 5,
            stage2MaxMins: stage2MaxOpt ? Number(stage2MaxOpt.label) : 30,
            stage3MaxMins: stage3MaxOpt ? Number(stage3MaxOpt.label) : 60,
            stage4BaseHp: stage4BaseHpOpt ? Number(stage4BaseHpOpt.label) : 300,
            hpPerMinuteRate: hpPerMinuteRateOpt ? Number(hpPerMinuteRateOpt.label) : 1
        };
    }, [masterOptions]);

    useEffect(() => {
        let timer: ReturnType<typeof setInterval>;
        if (isSubmitting && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (!isSubmitting) {
            setTimeLeft(60);
        }
        return () => clearInterval(timer);
    }, [isSubmitting, timeLeft]);

    const targets = useMemo(() => {
        if (availableLocations && availableLocations.length > 0) {
            return availableLocations;
        }

        const latOpt = masterOptions?.find(o => o.type === 'WORK_CONFIG' && o.key === 'OFFICE_LAT');
        const lngOpt = masterOptions?.find(o => o.type === 'WORK_CONFIG' && o.key === 'OFFICE_LNG');
        const radOpt = masterOptions?.find(o => o.type === 'WORK_CONFIG' && o.key === 'OFFICE_RADIUS');

        return [{
            id: 'def',
            name: 'Office (Default)',
            lat: latOpt && latOpt.label ? parseFloat(latOpt.label) : OFFICE_COORDS.lat,
            lng: lngOpt && lngOpt.label ? parseFloat(lngOpt.label) : OFFICE_COORDS.lng,
            radiusMeters: radOpt && radOpt.label ? parseFloat(radOpt.label) : OFFICE_COORDS.radiusMeters,
            type: 'WORK_LOCATION'
        }];
    }, [availableLocations, masterOptions]);

    const {
        locationState,
        setLocationState,
        detectedMatches,
        setDetectedMatches,
        selectedMatch,
        setSelectedMatch,
        isGpsSecure,
        gpsThreatReason,
        checkLocation: runCheckLocation,
    } = useCheckInLocation(targets);

    const shiftsEnabledOpt = masterOptions?.find(o => o.type === 'WORK_CONFIG' && o.key === 'MULTIPLE_SHIFTS_ENABLED');
    const shiftsListOpt = masterOptions?.find(o => o.type === 'WORK_CONFIG' && o.key === 'MULTIPLE_SHIFTS_LIST');
    const isShiftsEnabled = shiftsEnabledOpt?.label === 'true';
    const shiftsList = useMemo(() => {
        if (shiftsListOpt?.label) {
            return shiftsListOpt.label.split(',').map(s => s.trim());
        }
        return ['08:00', '08:30', '09:00'];
    }, [shiftsListOpt]);

    const minHours = useMemo(() => {
        const minHoursOpt = masterOptions?.find(o => o.type === 'WORK_CONFIG' && o.key === 'MIN_HOURS');
        return parseFloat(minHoursOpt?.label || '9');
    }, [masterOptions]);

    const transitionPointMins = useMemo(() => {
        return getEarliestTransitionPointMinutes(startTime || '10:00', shiftsList, isShiftsEnabled, minHours);
    }, [startTime, shiftsList, isShiftsEnabled, minHours]);

    const isBeforeTransitionPoint = useMemo(() => {
        const now = new Date();
        const currentMins = now.getHours() * 60 + now.getMinutes();
        return currentMins < transitionPointMins;
    }, [transitionPointMins]);

    const shiftResult = useMemo(() => {
        const now = new Date();

        // Check if there is an AM half-day leave and we are in the PM session (case-insensitive checking)
        const halfDayLeave = todayRequests?.find(req => {
            const type = (req.type || req.leave_type || '').toUpperCase();
            const isHalf = req.isHalfDay || req.is_half_day === true || req.is_half_day === 'true';
            const isLeaveType = ['SICK', 'VACATION', 'PERSONAL', 'EMERGENCY', 'UNPAID'].includes(type);
            const statusUpper = req.status?.toUpperCase();
            return isLeaveType && isHalf && statusUpper === 'APPROVED';
        });

        const session = halfDayLeave ? (halfDayLeave.halfDaySession || halfDayLeave.half_day_session) : null;

        // If shifts are disabled and there is no half-day leave, return null
        if (!isShiftsEnabled && !session) return null;

        const effectiveShiftsList = isShiftsEnabled ? shiftsList : [startTime || '08:30'];

        if (session === 'AM') {
            const { hour, minute, totalMinutes: currentTotalMinutes } = getICTTime(now);
            const timeStr = `${hour}:${minute}`;
            const { matchedPMStart } = calculatePMShiftDetails(timeStr, effectiveShiftsList, minHours);

            const pmStartTotalMinutes = timeToMinutes(matchedPMStart);
            const diff = currentTotalMinutes - pmStartTotalMinutes;
            const isLate = diff > lateBuffer;
            const isRawLate = diff > 0;

            return {
                targetStartTime: matchedPMStart,
                targetShift: matchedPMStart,
                isLate,
                isRawLate,
                isBlocked: isLate,
                isExceededLastShift: isLate,
                lateMinutes: diff > 0 ? diff : 0
            };
        } else if (session === 'PM') {
            if (isBeforeTransitionPoint) {
                return getMatchedShiftSlot(now, effectiveShiftsList, lateBuffer, false, masterOptions);
            } else {
                const normalSlot = getMatchedShiftSlot(now, effectiveShiftsList, lateBuffer, false, masterOptions);
                return {
                    ...normalSlot,
                    isLate: true,
                    isRawLate: true,
                    isBlocked: true,
                    isExceededLastShift: true,
                };
            }
        }

        return getMatchedShiftSlot(now, effectiveShiftsList, lateBuffer, false, masterOptions);
    }, [isShiftsEnabled, shiftsList, lateBuffer, isOpen, todayRequests, isBeforeTransitionPoint, minHours, masterOptions, startTime]);

    const lateMinutes = useMemo(() => {
        if (shiftResult) {
            return shiftResult.lateMinutes;
        }

        if (!startTime) return 0;
        
        const now = new Date();
        now.setSeconds(0, 0);
        let effectiveStartTime = startTime;
        if (approvedLateTime) {
            effectiveStartTime = approvedLateTime;
        } else if (pendingLateTime) {
            const [ph, pm] = pendingLateTime.split(':').map(Number);
            const pendingLimit = new Date();
            pendingLimit.setHours(ph, pm, 0, 0);
            if (now > pendingLimit) {
                effectiveStartTime = pendingLateTime;
            }
        }
        
        const [h, m] = effectiveStartTime.split(':').map(Number);
        const limit = new Date();
        limit.setHours(h, m, 0, 0);
        const diff = Math.floor((now.getTime() - limit.getTime()) / 60000);
        return Math.max(0, diff);
    }, [shiftResult, startTime, approvedLateTime, pendingLateTime, lateBuffer]);

    const isExceededLastShift = useMemo(() => {
        if (approvedLateTime) return false;

        // Under 4-stage late rules, we only block (isExceededLastShift) if lateness is Stage 4 (> stage3MaxMins, i.e., > 60 mins)
        if (fourStageConfig.enableFourStageLateRules) {
            const stage3MaxMins = fourStageConfig.stage3MaxMins || 60;
            return lateMinutes > stage3MaxMins;
        }

        if (shiftResult) {
            return !!shiftResult.isExceededLastShift;
        }
        if (!startTime) return false;
        const effectiveStartTime = approvedLateTime || startTime;
        const [h, m] = effectiveStartTime.split(':').map(Number);
        const limitWithBuffer = new Date();
        // Give a lateBuffer minutes window before fully blocking
        limitWithBuffer.setHours(h, m + lateBuffer, 0, 0);
        const nowNormalized = new Date();
        nowNormalized.setSeconds(0, 0);
        return nowNormalized > limitWithBuffer;
    }, [shiftResult, approvedLateTime, startTime, lateBuffer, lateMinutes, fourStageConfig]);

    const isUserLate = useMemo(() => {
        if (hasAcceptedLateness) return false;
        if (hasLateRequest && !approvedLateTime) return false;

        // Bypass if 4-stage late rules are enabled and the lateness is within Stage 1 (<= max mins)
        if (fourStageConfig.enableFourStageLateRules) {
            const maxMins = fourStageConfig.stage1MaxMins || 5;
            if (lateMinutes <= maxMins) {
                return false;
            }
        }

        if (shiftResult) {
            // 🟢 ถ้าเปิดกฎ 4 ขั้นบันไดให้นับสายย้อนหลังแบบดิบ ๆ (isRawLate)
            // 🟢 แต่ถ้าปิดกฎ 4 ขั้น (แบบดั้งเดิม) ให้เช็คจากความสายจริงหลังพ้นสิทธิ์ผ่อนผันแล้วเท่านั้น (isLate)
            return fourStageConfig.enableFourStageLateRules ? !!shiftResult.isRawLate : !!shiftResult.isLate;
        }

        if (!startTime) return false;
        
        const now = new Date();
        now.setSeconds(0, 0);
        // 🟢 ถ้าปิดกฎ 4 ขั้นบันได ให้บวกค่าผ่อนผัน (lateBuffer) คุ้มครองพนักงานไว้ก่อน
        const bufferToApply = fourStageConfig.enableFourStageLateRules ? 0 : lateBuffer;

        if (pendingLateTime) {
            const [ph, pm] = pendingLateTime.split(':').map(Number);
            const pendingLimit = new Date();
            pendingLimit.setHours(ph, pm + bufferToApply, 0, 0);
            const isPendingLatePast = now > pendingLimit;
            
            if (!isPendingLatePast) {
                return false;
            } else {
                return true;
            }
        }
        
        const effectiveStartTime = approvedLateTime || startTime;
        const [h, m] = effectiveStartTime.split(':').map(Number);
        const limit = new Date();
        limit.setHours(h, m + bufferToApply, 0, 0);
        return now > limit;
    }, [shiftResult, startTime, lateBuffer, hasLateRequest, approvedLateTime, pendingLateTime, hasAcceptedLateness, lateMinutes, fourStageConfig]);

    useEffect(() => {
        if (step === 'CONFIRM_LOCATION' && isGpsSecure && isUserLate && isOpen && !showLateIntervention && !showLatePenaltyBreakdown && !hasAcceptedLateness) {
            const timer = setTimeout(() => {
                setShowLateIntervention(true);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [step, isGpsSecure, isUserLate, isOpen, showLateIntervention, showLatePenaltyBreakdown, hasAcceptedLateness]);

    const checkLocation = () => {
        runCheckLocation(
            (matches, primaryMatch) => {
                setSelectedType(primaryMatch.type === 'WORK_LOCATION' ? 'OFFICE' : 'SITE');
                setTimeout(() => handleSetStep('CONFIRM_LOCATION'), 1200);
            },
            () => {
                setTimeout(() => handleSetStep('TYPE'), 1500);
            }
        );
    };

    useEffect(() => {
        if (isOpen) {
            if (isLoading) return;

            const hasLocations = availableLocations && availableLocations.length > 0;
            const latOpt = masterOptions?.find(o => o.type === 'WORK_CONFIG' && o.key === 'OFFICE_LAT');
            const lngOpt = masterOptions?.find(o => o.type === 'WORK_CONFIG' && o.key === 'OFFICE_LNG');
            const hasOfficeConfig = !!(latOpt?.label && lngOpt?.label);

            if (!hasLocations && !hasOfficeConfig) {
                setStep('NO_CONFIG');
                setPrevStep(null);
                return;
            }

            setStep('LOCATION');
            setPrevStep(null);
            setChallenge(getRandomPose());
            setCapturedFile(null);
            setShowLateIntervention(false);
            setShowLatePenaltyBreakdown(false);
            setHasAcceptedLateness(false);
            setBypassSelfie(false);
            setDetectedMatches([]);
            setSelectedMatch(null);
            setIsGpsAppealActive(false);

            checkLocation();
        }
    }, [isOpen, isLoading, availableLocations, masterOptions]);

    useEffect(() => {
        if (hasLateRequest && showLateIntervention) {
            setShowLateIntervention(false);
        }
    }, [hasLateRequest, showLateIntervention]);

    const handleSubmit = async (forceCheckIn = false, typeToSubmit?: WorkLocation, bypassFile?: boolean, passProvisionalOnsite?: boolean) => {
        if (isSubmitting) return;

        // Check for Half-Day Leave Interceptions
        const halfDayLeave = todayRequests?.find(req => {
            const type = req.type || req.leave_type;
            const isHalf = req.isHalfDay || req.is_half_day === true || req.is_half_day === 'true';
            const isLeaveType = ['SICK', 'VACATION', 'PERSONAL', 'EMERGENCY', 'UNPAID'].includes(type);
            return isLeaveType && isHalf && req.status === 'APPROVED';
        });

        if (halfDayLeave && !forceCheckIn) {
            const session = halfDayLeave.halfDaySession || halfDayLeave.half_day_session;
            if (session === 'AM' && isBeforeTransitionPoint) {
                const confirmed = await showConfirm(
                    "คุณมีคำขออนุมัติลาครึ่งเช้าอยู่ หากยืนยันตอกบัตรตอนนี้จะลงเวลาเข้างานช่วงบ่าย ยืนยันหรือไม่?",
                    "⚠️ ยืนยันการเข้างานช่วงบ่าย"
                );
                if (!confirmed) return;
            } else if (session === 'PM' && !isBeforeTransitionPoint) {
                const confirmed = await showConfirm(
                    "คุณมีคำขออนุมัติลาครึ่งบ่ายอยู่หนิ และระบบจะบันทึกว่าคุณขาดงานช่วงเช้า เนื่องจากลาครึ่งบ่ายแปลว่าช่วงเช้าต้องมาทำงาน แต่คุณไม่ได้กดลงเวลาเช้าเลยนิ ใช่ไหม",
                    "⚠️ ยืนยันการเข้างานช่วงบ่าย"
                );
                if (!confirmed) return;
            }
        }

        if (isExceededLastShift && !approvedLateTime && !forceCheckIn && !hasAcceptedLateness) {
            if (typeToSubmit) setSelectedType(typeToSubmit);
            setShowLateIntervention(true);
            return;
        }

        const targetType = typeToSubmit || selectedType;
        if (!targetType) return;

        const actualBypass = bypassFile !== undefined ? bypassFile : bypassSelfie;
        if (!actualBypass && !capturedFile) return;

        const effectiveCheckStartTime = approvedLateTime || pendingLateTime || (shiftResult?.targetStartTime ? shiftResult.targetStartTime : startTime);

        if (effectiveCheckStartTime && !forceCheckIn && !showLateIntervention && !showLatePenaltyBreakdown && !hasAcceptedLateness) {
            const now = new Date();
            now.setSeconds(0, 0);
            let shouldBypass = false;
            
            if (pendingLateTime) {
                const [ph, pm] = pendingLateTime.split(':').map(Number);
                const pendingLimit = new Date();
                pendingLimit.setHours(ph, pm + lateBuffer, 0, 0);
                if (now <= pendingLimit) {
                    shouldBypass = true;
                }
            } else if (hasLateRequest && !approvedLateTime) {
                shouldBypass = true;
            }
            
            if (shouldBypass) {
                // Bypass late check
            } else {
                let isLateCheck = false;
                if (shiftResult && !approvedLateTime && !pendingLateTime) {
                    isLateCheck = shiftResult.isLate || shiftResult.isBlocked;
                } else if (effectiveCheckStartTime) {
                    const [h, m] = effectiveCheckStartTime.split(':').map(Number);
                    const limit = new Date();
                    // ถ้าปิดกฎ 4 ขั้นบันได (แบบดั้งเดิม) ให้ใช้ lateBuffer (เวลาแถม) เข้ามาช่วยพนักงาน
                    const bufferToApply = fourStageConfig.enableFourStageLateRules ? 0 : lateBuffer;
                    limit.setHours(h, m + bufferToApply, 0, 0);
                    isLateCheck = now > limit;
                }

                // Bypass if 4-stage late rules are enabled and the lateness is within Stage 1 (<= max mins)
                if (isLateCheck && fourStageConfig.enableFourStageLateRules) {
                    const maxMins = fourStageConfig.stage1MaxMins || 5;
                    if (lateMinutes <= maxMins) {
                        isLateCheck = false;
                    }
                }

                if (isLateCheck) {
                    if (typeToSubmit) setSelectedType(typeToSubmit);
                    setShowLateIntervention(true);
                    return;
                }
            }
        }

        setIsSubmitting(true);
        if (!actualBypass) {
            setCompressing(true);
        }
        setShowLateIntervention(false);

        try {
            const compressedFile = (actualBypass || !capturedFile) ? null : await compressImage(capturedFile);

            let locName = locationState.matchedLocation ? locationState.matchedLocation.name : 'On Site';
            if (targetType === 'WFH') locName = 'Home (WFH)';

            const isProv = passProvisionalOnsite !== undefined ? passProvisionalOnsite : provisionalOnsite;
            await onConfirm(
                targetType, 
                compressedFile, 
                { lat: locationState.lat, lng: locationState.lng }, 
                locName, 
                isProv, 
                provisionalReason,
                isGpsAppealActive,
                isGpsAppealActive ? `อุทธรณ์พิกัด GPS ผิดปกติ: ตรวจพบ ${gpsThreatReason || 'ไม่ระบุ'}` : undefined
            );
            onClose();
        } catch (error) {
            console.error("Submission error:", error);
            showAlert("ไม่สามารถบันทึกข้อมูลการลงเวลาได้ กรุณาลองใหม่อีกครั้ง", "เกิดข้อผิดพลาด");
        } finally {
            setCompressing(false);
            setIsSubmitting(false);
        }
    };

    const handleTypeSelect = async (type: WorkLocation, customName?: string, isProvisionalOnsite?: boolean, provReason?: string) => {
        if (isSubmitting) return;
        
        if (!isGpsSecure && !isGpsAppealActive) {
            showAlert(`ระบบตรวจพบการพยายามใช้แอปสวมสิทธิ์พิกัดปลอมหรือจำลอง GPS: ${gpsThreatReason || 'กรุณาปิดเครื่องมือจำลองพิกัดก่อน'}`, 'ไม่สามารถลงเวลาได้');
            return;
        }

        if (type === 'WFH' && approvedWFH) {
             // Allowed by approval
        } else {
             const isNearAnyOffice = !!locationState.matchedLocation;
             if (type === 'OFFICE' && !isNearAnyOffice && locationState.status === 'SUCCESS' && !isGpsAppealActive) {
                showAlert(`คุณไม่ได้อยู่ในพิกัดพื้นที่ออฟฟิศหลักที่กำหนดในระบบครับ (ห่างประมาณ ${locationState.distance?.toFixed(0)} ม.)`, 'อยู่นอกพิกัด');
                return;
            }
        }

        if (type === 'OFFICE' && (approvedWFH || approvedOnsite)) {
            const approvedTypeStr = approvedWFH ? 'Work From Home' : 'นอกสถานที่ (On-site)';
            const confirm = await showConfirm(
                `วันนี้คุณได้รับการอนุมัติให้ปฏิบัติงานแบบ [${approvedTypeStr}] เรียบร้อยแล้ว หากคุณยืนยันที่จะลงเวลาทำงานในรูปแบบ [ปฏิบัติงานในออฟฟิศ (OFFICE)] ระบบจะถือว่าคุณสละสิทธิ์และยกเลิกคำขอเดิมนั้นทันที (ไม่สามารถกู้คืนสิทธิ์วันนั้นได้)\n\nคุณต้องการยืนยันการลงเวลาในออฟฟิศใช่หรือไม่?`,
                '⚠️ คำเตือนสิทธิ์การทำงานซ้ำซ้อน',
                true
            );
            if (!confirm) {
                return;
            }
        }

        setSelectedType(type);
        setProvisionalOnsite(!!isProvisionalOnsite);
        if (provReason) {
            setProvisionalReason(provReason);
        } else {
            setProvisionalReason('');
        }

        if (customName) {
            setLocationState(prev => ({
                ...prev,
                matchedLocation: {
                    id: 'custom_onsite',
                    name: customName,
                    lat: prev.lat,
                    lng: prev.lng,
                    radiusMeters: 500
                }
            }));
        }

        const needsSelfie = needsSelfieDynamic || isGpsAppealActive;

        if (!needsSelfie) {
            setBypassSelfie(true);
            handleSubmit(false, type, true, !!isProvisionalOnsite);
            return;
        } else {
            setBypassSelfie(false);
            handleSetStep('CAMERA');
        }
    };

    const handleInstantConfirm = async () => {
        if (!selectedMatch || isSubmitting) return;

        const finalType = (selectedMatch as CheckInLocationMatch).type === 'WORK_LOCATION' ? 'OFFICE' : 'SITE';

        if (finalType === 'OFFICE' && (approvedWFH || approvedOnsite)) {
            const approvedTypeStr = approvedWFH ? 'Work From Home' : 'นอกสถานที่ (On-site)';
            const confirm = await showConfirm(
                `วันนี้คุณได้รับการอนุมัติให้ปฏิบัติงานแบบ [${approvedTypeStr}] เรียบร้อยแล้ว หากคุณยืนยันที่จะลงเวลาทำงานในรูปแบบ [ปฏิบัติงานในออฟฟิศ (OFFICE)] ระบบจะถือว่าคุณสละสิทธิ์และยกเลิกคำขอเดิมนั้นทันที (ไม่สามารถกู้คืนสิทธิ์วันนั้นได้)\n\nคุณต้องการยืนยันการลงเวลาในออฟฟิศใช่หรือไม่?`,
                '⚠️ คำเตือนสิทธิ์การทำงานซ้ำซ้อน',
                true
            );
            if (!confirm) {
                return;
            }
        }

        setSelectedType(finalType);

        const needsSelfie = needsSelfieDynamic;

        if (!needsSelfie) {
            setBypassSelfie(true);
            handleSubmit(false, finalType, true);
            return;
        } else {
            setBypassSelfie(false);
            handleSetStep('CAMERA');
        }
    };

    const handleCapture = (file: File) => {
        setCapturedFile(file);
        handleSetStep('PREVIEW');
    };

    const handleAcceptLateness = () => {
        setShowLateIntervention(false);
        setShowLatePenaltyBreakdown(false);
        setHasAcceptedLateness(true);

        const finalType = selectedType || ((selectedMatch as CheckInLocationMatch)?.type === 'WORK_LOCATION' ? 'OFFICE' : 'SITE');
        if (!selectedType) {
            setSelectedType(finalType);
        }

        const needsSelfie = needsSelfieDynamic;

        if (!needsSelfie) {
            setBypassSelfie(true);
            handleSubmit(true, finalType, true);
        } else if (capturedFile) {
            // If the user has already taken a selfie photo prior to late warning (e.g. from WorkTypeStep -> Camera -> Preview),
            // submit directly using the existing capturedFile without forcing a second camera photo.
            handleSubmit(true, finalType, false);
        } else {
            setBypassSelfie(false);
            handleSetStep('CAMERA');
        }
    };

    return {
        step,
        prevStep,
        direction,
        isFadeOnly,
        selectedType,
        setSelectedType,
        provisionalOnsite,
        provisionalReason,
        isGpsAppealActive,
        setIsGpsAppealActive,
        challenge,
        capturedFile,
        isSubmitting,
        timeLeft,
        compressing,
        showLateIntervention,
        setShowLateIntervention,
        showLatePenaltyBreakdown,
        setShowLatePenaltyBreakdown,
        approvedWFH,
        approvedOnsite,
        pendingWFHRequest,
        pendingOnsiteRequest,
        hasAcceptedLateness,
        bypassSelfie,
        needsSelfieDynamic,
        locationState,
        setLocationState,
        detectedMatches: detectedMatches as CheckInLocationMatch[],
        setDetectedMatches,
        selectedMatch: selectedMatch as CheckInLocationMatch | null,
        setSelectedMatch,
        isGpsSecure,
        gpsThreatReason,
        isUserLate,
        isExceededLastShift,
        lateMinutes,
        isShiftsEnabled,
        shiftsList,
        shiftResult,
        targets,
        isLoadingMasterData: isLoading,
        currentUserProfile,
        handleSetStep,
        checkLocation,
        handleTypeSelect,
        handleInstantConfirm,
        handleCapture,
        handleAcceptLateness,
        handleSubmit,
        setSearchParams,
    };
}
