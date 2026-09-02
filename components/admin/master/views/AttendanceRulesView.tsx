    import React, { useState, useEffect } from 'react';
import { MasterOption } from '../../../../types';
import { Clock, MapPin, Camera, Heart } from 'lucide-react';
import { useGameConfig } from '../../../../context/GameConfigContext';
import { useGlobalDialog } from '../../../../context/GlobalDialogContext';
import { motion, AnimatePresence } from 'framer-motion';

// Modular Rules Components
import WorkTimeCard, { WorkTimeConfig } from './rules/WorkTimeCard';
import LocationGeofencingCard from './rules/LocationGeofencingCard';
import SelfieVerificationCard from './rules/SelfieVerificationCard';
import TypesManagementCard from './rules/TypesManagementCard';

interface AttendanceRulesViewProps {
    masterOptions: MasterOption[];
    onUpdate: (option: MasterOption) => Promise<boolean>;
    onAdd: (option: Omit<MasterOption, 'id'>) => Promise<boolean>;
    onCreate: (type: string) => void;
    onEdit: (option: MasterOption) => void;
    onDelete: (id: string) => void;
    saveMasterOptionsBulk?: (options: MasterOption[]) => Promise<boolean>;
}

type TabType = 'time' | 'location' | 'selfie' | 'types';

const AttendanceRulesView: React.FC<AttendanceRulesViewProps> = ({ 
    masterOptions, onUpdate, onAdd, onCreate, onEdit, onDelete, saveMasterOptionsBulk
}) => {
    // Game Config Context (For Syncing Scores)
    const { config, updateConfigValue } = useGameConfig();
    const { showAlert, showConfirm } = useGlobalDialog();

    // Active Tab state
    const [activeTab, setActiveTab] = useState<TabType>('time');

    // Attendance Rules Local State
    const [tempTimeConfig, setTempTimeConfig] = useState<WorkTimeConfig>({ 
        start: '10:00', 
        end: '19:00', 
        buffer: '15', 
        minHours: '9', 
        otThreshold: '2', 
        checkoutPenaltyTime: '06:00',
        dailySummaryDelayHours: '1',
        lineSummaryDestination: '',
        enableAttendanceRace: 'true',
        lateAlertMode: 'AFTER_LIMIT',
        lateAlertOffset: '5',
        multipleShiftsEnabled: 'false',
        multipleShiftsList: '08:00, 08:30, 09:00',
        lineApprovalMode: 'INTERACTIVE',
        lineHeaderTitle: 'Juijui Alert Center',
        lateAlertTargetRoles: 'BOTH',
        checkoutPenaltyTargetRoles: 'BOTH',
        checkoutAlertEnabled: 'true',
        checkoutAlertMode: 'AFTER_LIMIT',
        checkoutAlertOffset: '5',
        checkoutAlertTargetRoles: 'BOTH',
        adminAbsentPenaltyEnabled: 'false',
        absentPenaltyEnabled: 'false',
        absentPenaltyTime: '19:00',
        absentPenaltyTargetRoles: 'BOTH',
        forgotCheckInLimitHours: '12',
        lineSubmissionAlertMode: 'ADMIN_PRIVATE',
        monthlySummaryTime: '08:00',
        monthlySummaryDay: '1',
        monthlySummaryMode: 'PREV_MONTH',
        monthlySummaryFebDay: '28',
        monthlyOTSummaryTime: '08:00',
        monthlyOTSummaryDay: '1',
        monthlyOTSummaryMode: 'PREV_MONTH',
        lateEntryStrictEndTime: 'false',
        enableFourStageLate: 'true',
        lateStage1Max: '5',
        lateStage2Max: '30',
        lateStage3Max: '60',
        lateStage4BaseHp: '300',
        lateHpPerMinute: '1',
    });
    const [isStartTimeOpen, setIsStartTimeOpen] = useState(false);
    const [isEndTimeOpen, setIsEndTimeOpen] = useState(false);
    const [isCheckoutPenaltyTimeOpen, setIsCheckoutPenaltyTimeOpen] = useState(false);
    const [otJpRate, setOtJpRate] = useState<string>('10');
    
    // Selfie Verification Config State
    const [selfieMode, setSelfieMode] = useState<string>('ALWAYS_ON');
    const [selfieDays, setSelfieDays] = useState<string>('3');
    const [isSavingSelfie, setIsSavingSelfie] = useState(false);

    // Sync Temp Config with Loaded Data
    useEffect(() => {
        // Time & Duration
        const startOpt = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'START_TIME');
        const endOpt = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'END_TIME');
        const bufferOpt = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'LATE_BUFFER');
        const minHoursOpt = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'MIN_HOURS');
        const otThresholdOpt = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'OT_THRESHOLD_HOURS');
        const checkoutPenaltyTimeOpt = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'CHECKOUT_PENALTY_TIME');
        const dailySummaryDelayHoursOpt = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'DAILY_SUMMARY_DELAY_HOURS');
        const dailySummaryTimeOpt = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'DAILY_SUMMARY_TIME');
        const lineSummaryDestinationOpt = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'LINE_SUMMARY_DESTINATION');
        const enableRaceOpt = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'ENABLE_ATTENDANCE_RACE');
        const lateAlertModeOpt = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'LATE_ALERT_MODE');
        const lateAlertOffsetOpt = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'LATE_ALERT_OFFSET');
        const shiftsEnabledOpt = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'MULTIPLE_SHIFTS_ENABLED');
        const shiftsListOpt = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'MULTIPLE_SHIFTS_LIST');
        const lineApprovalModeOpt = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'LINE_APPROVAL_MODE');
        const lineHeaderTitleOpt = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'LINE_HEADER_TITLE');
        const lateAlertTargetRolesOpt = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'LATE_ALERT_TARGET_ROLES');
        const checkoutPenaltyTargetRolesOpt = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'CHECKOUT_PENALTY_TARGET_ROLES');
        const checkoutAlertEnabledOpt = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'CHECKOUT_ALERT_ENABLED');
        const checkoutAlertModeOpt = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'CHECKOUT_ALERT_MODE');
        const checkoutAlertOffsetOpt = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'CHECKOUT_ALERT_OFFSET');
        const checkoutAlertTargetRolesOpt = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'CHECKOUT_ALERT_TARGET_ROLES');
        const adminAbsentPenaltyEnabledOpt = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'ADMIN_ABSENT_PENALTY_ENABLED');
        const absentPenaltyEnabledOpt = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'ABSENT_PENALTY_ENABLED');
        const absentPenaltyTimeOpt = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'ABSENT_PENALTY_TIME');
        const absentPenaltyTargetRolesOpt = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'ABSENT_PENALTY_TARGET_ROLES');
        const forgotCheckInLimitHoursOpt = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'FORGOT_CHECKIN_LIMIT_HOURS');
        const lineSubmissionAlertModeOpt = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'LINE_SUBMISSION_ALERT_MODE');
        const monthlySummaryTimeOpt = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'MONTHLY_SUMMARY_TIME');
        const monthlySummaryDayOpt = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'MONTHLY_SUMMARY_DAY');
        const monthlySummaryModeOpt = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'MONTHLY_SUMMARY_MODE');
        const monthlySummaryFebDayOpt = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'MONTHLY_SUMMARY_FEB_DAY');
        const monthlyOTSummaryTimeOpt = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'MONTHLY_OT_SUMMARY_TIME');
        const monthlyOTSummaryDayOpt = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'MONTHLY_OT_SUMMARY_DAY');
        const monthlyOTSummaryModeOpt = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'MONTHLY_OT_SUMMARY_MODE');
        const lateEntryStrictEndTimeOpt = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'LATE_ENTRY_STRICT_END_TIME');
        const enableFourStageLateOpt = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'ENABLE_FOUR_STAGE_LATE');
        const lateStage1MaxOpt = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'LATE_STAGE1_MAX');
        const lateStage2MaxOpt = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'LATE_STAGE2_MAX');
        const lateStage3MaxOpt = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'LATE_STAGE3_MAX');
        const lateStage4BaseHpOpt = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'LATE_STAGE4_BASE_HP');
        const lateHpPerMinuteOpt = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'LATE_HP_PER_MINUTE');
        
        if (startOpt || endOpt || bufferOpt || minHoursOpt || otThresholdOpt || checkoutPenaltyTimeOpt || dailySummaryDelayHoursOpt || dailySummaryTimeOpt || lineSummaryDestinationOpt || enableRaceOpt || lateAlertModeOpt || lateAlertOffsetOpt || shiftsEnabledOpt || shiftsListOpt || lineApprovalModeOpt || lineHeaderTitleOpt || lateAlertTargetRolesOpt || checkoutPenaltyTargetRolesOpt || checkoutAlertEnabledOpt || checkoutAlertModeOpt || checkoutAlertOffsetOpt || checkoutAlertTargetRolesOpt || adminAbsentPenaltyEnabledOpt || absentPenaltyEnabledOpt || absentPenaltyTimeOpt || absentPenaltyTargetRolesOpt || forgotCheckInLimitHoursOpt || lineSubmissionAlertModeOpt || monthlySummaryTimeOpt || monthlySummaryDayOpt || monthlySummaryModeOpt || monthlySummaryFebDayOpt || monthlyOTSummaryTimeOpt || monthlyOTSummaryDayOpt || monthlyOTSummaryModeOpt || lateEntryStrictEndTimeOpt || enableFourStageLateOpt || lateStage1MaxOpt || lateStage2MaxOpt || lateStage3MaxOpt || lateStage4BaseHpOpt || lateHpPerMinuteOpt) {
            setTempTimeConfig({
                start: startOpt?.label || '10:00',
                end: endOpt?.label || '19:00',
                buffer: bufferOpt?.label || '15',
                minHours: minHoursOpt?.label || '9',
                otThreshold: otThresholdOpt?.label || '2',
                checkoutPenaltyTime: checkoutPenaltyTimeOpt?.label || '06:00',
                dailySummaryDelayHours: dailySummaryDelayHoursOpt?.label || '1',
                dailySummaryTime: dailySummaryTimeOpt?.label || '18:00',
                lineSummaryDestination: lineSummaryDestinationOpt?.label || '',
                enableAttendanceRace: enableRaceOpt?.label || 'true',
                lateAlertMode: lateAlertModeOpt?.label || 'AFTER_LIMIT',
                lateAlertOffset: lateAlertOffsetOpt?.label || '5',
                multipleShiftsEnabled: shiftsEnabledOpt?.label || 'false',
                multipleShiftsList: shiftsListOpt?.label || '08:00, 08:30, 09:00',
                lineApprovalMode: lineApprovalModeOpt?.label || 'INTERACTIVE',
                lineHeaderTitle: lineHeaderTitleOpt?.label || 'Juijui Alert Center',
                lateAlertTargetRoles: lateAlertTargetRolesOpt?.label || 'BOTH',
                checkoutPenaltyTargetRoles: checkoutPenaltyTargetRolesOpt?.label || 'BOTH',
                checkoutAlertEnabled: checkoutAlertEnabledOpt?.label || 'true',
                checkoutAlertMode: checkoutAlertModeOpt?.label || 'AFTER_LIMIT',
                checkoutAlertOffset: checkoutAlertOffsetOpt?.label || '5',
                checkoutAlertTargetRoles: checkoutAlertTargetRolesOpt?.label || 'BOTH',
                adminAbsentPenaltyEnabled: adminAbsentPenaltyEnabledOpt?.label || 'false',
                absentPenaltyEnabled: absentPenaltyEnabledOpt?.label || 'false',
                absentPenaltyTime: absentPenaltyTimeOpt?.label || '19:00',
                absentPenaltyTargetRoles: absentPenaltyTargetRolesOpt?.label || 'BOTH',
                forgotCheckInLimitHours: forgotCheckInLimitHoursOpt?.label || '12',
                lineSubmissionAlertMode: lineSubmissionAlertModeOpt?.label || 'ADMIN_PRIVATE',
                monthlySummaryTime: monthlySummaryTimeOpt?.label || '08:00',
                monthlySummaryDay: monthlySummaryDayOpt?.label || '1',
                monthlySummaryMode: monthlySummaryModeOpt?.label || 'PREV_MONTH',
                monthlySummaryFebDay: monthlySummaryFebDayOpt?.label || '28',
                monthlyOTSummaryTime: monthlyOTSummaryTimeOpt?.label || '08:00',
                monthlyOTSummaryDay: monthlyOTSummaryDayOpt?.label || '1',
                monthlyOTSummaryMode: monthlyOTSummaryModeOpt?.label || 'PREV_MONTH',
                lateEntryStrictEndTime: lateEntryStrictEndTimeOpt?.label || 'false',
                enableFourStageLate: enableFourStageLateOpt?.label || 'true',
                lateStage1Max: lateStage1MaxOpt?.label || '5',
                lateStage2Max: lateStage2MaxOpt?.label || '30',
                lateStage3Max: lateStage3MaxOpt?.label || '60',
                lateStage4BaseHp: lateStage4BaseHpOpt?.label || '300',
                lateHpPerMinute: lateHpPerMinuteOpt?.label || '1',
            });
        }

        const selfieModeOpt = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'SELFIE_VERIFICATION_MODE');
        const selfieDaysOpt = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'SELFIE_VERIFICATION_DAYS');
        if (selfieModeOpt) {
            setSelfieMode(selfieModeOpt.label || 'ALWAYS_ON');
        }
        if (selfieDaysOpt) {
            setSelfieDays(selfieDaysOpt.label || '3');
        }

        if (config?.GLOBAL_MULTIPLIERS?.OT_JP_RATE_PER_HOUR !== undefined) {
            setOtJpRate(config.GLOBAL_MULTIPLIERS.OT_JP_RATE_PER_HOUR.toString());
        }
    }, [masterOptions, config]);

    const handleSaveTimeConfig = async () => {
        const optionsToSave: any[] = [];
        const prepareUpdateOrInsert = (key: string, val: string) => {
            const existing = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === key);
            if (existing) {
                // อัปเดตเฉพาะกรณีที่ค่ามีการเปลี่ยนแปลงจริง (Dirty Checking)
                if (existing.label !== val) {
                    optionsToSave.push({ ...existing, label: val });
                }
            } else {
                 optionsToSave.push({
                    type: 'WORK_CONFIG',
                    key: key,
                    label: val,
                    color: '',
                    isActive: true,
                    sortOrder: 0
                });
            }
        };

        prepareUpdateOrInsert('START_TIME', tempTimeConfig.start);
        prepareUpdateOrInsert('END_TIME', tempTimeConfig.end);
        prepareUpdateOrInsert('LATE_BUFFER', tempTimeConfig.buffer);
        prepareUpdateOrInsert('MIN_HOURS', tempTimeConfig.minHours);
        prepareUpdateOrInsert('OT_THRESHOLD_HOURS', tempTimeConfig.otThreshold);
        prepareUpdateOrInsert('CHECKOUT_PENALTY_TIME', tempTimeConfig.checkoutPenaltyTime);
        prepareUpdateOrInsert('DAILY_SUMMARY_DELAY_HOURS', tempTimeConfig.dailySummaryDelayHours);
        prepareUpdateOrInsert('DAILY_SUMMARY_TIME', tempTimeConfig.dailySummaryTime || '18:00');
        prepareUpdateOrInsert('LINE_SUMMARY_DESTINATION', tempTimeConfig.lineSummaryDestination);
        prepareUpdateOrInsert('ENABLE_ATTENDANCE_RACE', tempTimeConfig.enableAttendanceRace);
        prepareUpdateOrInsert('LATE_ALERT_MODE', tempTimeConfig.lateAlertMode || 'AFTER_LIMIT');
        prepareUpdateOrInsert('LATE_ALERT_OFFSET', tempTimeConfig.lateAlertOffset || '5');
        prepareUpdateOrInsert('MULTIPLE_SHIFTS_ENABLED', tempTimeConfig.multipleShiftsEnabled || 'false');
        prepareUpdateOrInsert('MULTIPLE_SHIFTS_LIST', tempTimeConfig.multipleShiftsList || '08:00, 08:30, 09:00');
        prepareUpdateOrInsert('LINE_APPROVAL_MODE', tempTimeConfig.lineApprovalMode || 'INTERACTIVE');
        prepareUpdateOrInsert('LINE_HEADER_TITLE', tempTimeConfig.lineHeaderTitle || 'Juijui Alert Center');
        prepareUpdateOrInsert('LATE_ALERT_TARGET_ROLES', tempTimeConfig.lateAlertTargetRoles || 'BOTH');
        prepareUpdateOrInsert('CHECKOUT_PENALTY_TARGET_ROLES', tempTimeConfig.checkoutPenaltyTargetRoles || 'BOTH');
        prepareUpdateOrInsert('CHECKOUT_ALERT_ENABLED', tempTimeConfig.checkoutAlertEnabled || 'true');
        prepareUpdateOrInsert('CHECKOUT_ALERT_MODE', tempTimeConfig.checkoutAlertMode || 'AFTER_LIMIT');
        prepareUpdateOrInsert('CHECKOUT_ALERT_OFFSET', tempTimeConfig.checkoutAlertOffset || '5');
        prepareUpdateOrInsert('CHECKOUT_ALERT_TARGET_ROLES', tempTimeConfig.checkoutAlertTargetRoles || 'BOTH');
        prepareUpdateOrInsert('ADMIN_ABSENT_PENALTY_ENABLED', tempTimeConfig.adminAbsentPenaltyEnabled || 'false');
        prepareUpdateOrInsert('ABSENT_PENALTY_ENABLED', tempTimeConfig.absentPenaltyEnabled || 'false');
        prepareUpdateOrInsert('ABSENT_PENALTY_TIME', tempTimeConfig.absentPenaltyTime || '19:00');
        prepareUpdateOrInsert('ABSENT_PENALTY_TARGET_ROLES', tempTimeConfig.absentPenaltyTargetRoles || 'BOTH');
        prepareUpdateOrInsert('FORGOT_CHECKIN_LIMIT_HOURS', tempTimeConfig.forgotCheckInLimitHours || '12');
        prepareUpdateOrInsert('LINE_SUBMISSION_ALERT_MODE', tempTimeConfig.lineSubmissionAlertMode || 'ADMIN_PRIVATE');
        prepareUpdateOrInsert('MONTHLY_SUMMARY_TIME', tempTimeConfig.monthlySummaryTime || '08:00');
        prepareUpdateOrInsert('MONTHLY_SUMMARY_DAY', tempTimeConfig.monthlySummaryDay || '1');
        prepareUpdateOrInsert('MONTHLY_SUMMARY_MODE', tempTimeConfig.monthlySummaryMode || 'PREV_MONTH');
        prepareUpdateOrInsert('MONTHLY_SUMMARY_FEB_DAY', tempTimeConfig.monthlySummaryFebDay || '28');
        prepareUpdateOrInsert('MONTHLY_OT_SUMMARY_TIME', tempTimeConfig.monthlyOTSummaryTime || '08:00');
        prepareUpdateOrInsert('MONTHLY_OT_SUMMARY_DAY', tempTimeConfig.monthlyOTSummaryDay || '1');
        prepareUpdateOrInsert('MONTHLY_OT_SUMMARY_MODE', tempTimeConfig.monthlyOTSummaryMode || 'PREV_MONTH');
        prepareUpdateOrInsert('LATE_ENTRY_STRICT_END_TIME', tempTimeConfig.lateEntryStrictEndTime || 'false');
        prepareUpdateOrInsert('ENABLE_FOUR_STAGE_LATE', tempTimeConfig.enableFourStageLate || 'true');
        prepareUpdateOrInsert('LATE_STAGE1_MAX', tempTimeConfig.lateStage1Max || '5');
        prepareUpdateOrInsert('LATE_STAGE2_MAX', tempTimeConfig.lateStage2Max || '30');
        prepareUpdateOrInsert('LATE_STAGE3_MAX', tempTimeConfig.lateStage3Max || '60');
        prepareUpdateOrInsert('LATE_STAGE4_BASE_HP', tempTimeConfig.lateStage4BaseHp || '300');
        prepareUpdateOrInsert('LATE_HP_PER_MINUTE', tempTimeConfig.lateHpPerMinute || '1');
        
        if (optionsToSave.length > 0) {
            if (saveMasterOptionsBulk) {
                await saveMasterOptionsBulk(optionsToSave);
            } else {
                for (const opt of optionsToSave) {
                    if (opt.id) {
                        await onUpdate(opt as MasterOption);
                    } else {
                        await onAdd(opt);
                    }
                }
            }
        }
        
        const parsedRate = parseInt(otJpRate, 10);
        if (!isNaN(parsedRate)) {
            const currentMultipliers = config.GLOBAL_MULTIPLIERS || {};
            if (currentMultipliers.OT_JP_RATE_PER_HOUR !== parsedRate) {
                await updateConfigValue('GLOBAL_MULTIPLIERS', {
                    ...currentMultipliers,
                    OT_JP_RATE_PER_HOUR: parsedRate
                });
            }
        }
        
        await showAlert('บันทึกเวลาทำการเรียบร้อย ✅', 'สำเร็จ');
    };

    const handleSaveSelfieConfig = async () => {
        setIsSavingSelfie(true);
        try {
            const optionsToSave: any[] = [];
            const prepareUpdateOrInsert = (key: string, val: string) => {
                const existing = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === key);
                if (existing) {
                    if (existing.label !== val) {
                        optionsToSave.push({ ...existing, label: val });
                    }
                } else {
                    optionsToSave.push({
                        type: 'WORK_CONFIG',
                        key: key,
                        label: val,
                        color: '',
                        isActive: true,
                        sortOrder: 0
                    });
                }
            };

            prepareUpdateOrInsert('SELFIE_VERIFICATION_MODE', selfieMode);
            prepareUpdateOrInsert('SELFIE_VERIFICATION_DAYS', selfieDays);

            if (optionsToSave.length > 0) {
                if (saveMasterOptionsBulk) {
                    await saveMasterOptionsBulk(optionsToSave);
                } else {
                    for (const opt of optionsToSave) {
                        if (opt.id) {
                            await onUpdate(opt as MasterOption);
                        } else {
                            await onAdd(opt);
                        }
                    }
                }
            }

            await showAlert('บันทึกการตั้งค่าการถ่ายรูปเรียบร้อย 📸', 'สำเร็จ');
        } catch (e: any) {
            await showAlert('เกิดข้อผิดพลาดในการบันทึก: ' + e.message, 'เกิดข้อผิดพลาด');
        } finally {
            setIsSavingSelfie(false);
        }
    };

    const attendanceTypes = masterOptions.filter(o => o.type === 'ATTENDANCE_TYPE');
    const leaveTypes = masterOptions.filter(o => o.type === 'LEAVE_TYPE');

    const tabs = [
        { id: 'time' as TabType, label: 'เวลาทำงาน', icon: Clock, desc: 'เวลาเข้า-ออก, OT', color: 'indigo' },
        { id: 'location' as TabType, label: 'พิกัดออฟฟิศ', icon: MapPin, desc: 'Geofencing', color: 'orange' },
        { id: 'selfie' as TabType, label: 'ระบบถ่ายรูป', icon: Camera, desc: 'Selfie Mode', color: 'purple' },
        { id: 'types' as TabType, label: 'สถานะและการลา', icon: Heart, desc: 'Types & Leave', color: 'rose' },
    ];

    return (
        <div id="attendance-rules-container" className="space-y-6">
            {/* Beautiful Bento Tab Menu */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-gray-50/80 p-1.5 rounded-2xl border border-gray-100">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    let activeStyles = '';
                    if (isActive) {
                        if (tab.color === 'indigo') activeStyles = 'bg-indigo-600 text-white shadow-md shadow-indigo-100';
                        else if (tab.color === 'orange') activeStyles = 'bg-orange-500 text-white shadow-md shadow-orange-100';
                        else if (tab.color === 'purple') activeStyles = 'bg-purple-600 text-white shadow-md shadow-purple-100';
                        else if (tab.color === 'rose') activeStyles = 'bg-rose-500 text-white shadow-md shadow-rose-100';
                    } else {
                        activeStyles = 'bg-white hover:bg-gray-100/70 text-gray-700 hover:text-gray-900 border border-gray-100';
                    }

                    return (
                        <button
                            key={tab.id}
                            id={`tab-btn-${tab.id}`}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex flex-col items-start p-3.5 rounded-xl text-left transition-all duration-300 relative overflow-hidden group active:scale-[0.98] ${activeStyles}`}
                        >
                            <div className="flex items-center gap-2 mb-1 z-10">
                                <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 duration-300 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                                <span className="font-bold text-xs sm:text-sm tracking-tight">{tab.label}</span>
                            </div>
                            <span className={`text-[10px] sm:text-xs z-10 font-medium ${isActive ? 'text-white/80' : 'text-gray-400'}`}>
                                {tab.desc}
                            </span>
                            {/* Decorative background shape */}
                            <div className="absolute right-0 bottom-0 w-12 h-12 bg-black/[0.02] rounded-tl-full pointer-events-none transition-transform group-hover:scale-125 duration-300"></div>
                        </button>
                    );
                })}
            </div>

            {/* Content Switcher with smooth animations */}
            <div className="relative">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                    >
                        {activeTab === 'time' && (
                            <WorkTimeCard
                                tempTimeConfig={tempTimeConfig}
                                setTempTimeConfig={setTempTimeConfig}
                                otJpRate={otJpRate}
                                setOtJpRate={setOtJpRate}
                                isStartTimeOpen={isStartTimeOpen}
                                setIsStartTimeOpen={setIsStartTimeOpen}
                                isEndTimeOpen={isEndTimeOpen}
                                setIsEndTimeOpen={setIsEndTimeOpen}
                                isCheckoutPenaltyTimeOpen={isCheckoutPenaltyTimeOpen}
                                setIsCheckoutPenaltyTimeOpen={setIsCheckoutPenaltyTimeOpen}
                                handleSaveTimeConfig={handleSaveTimeConfig}
                            />
                        )}

                        {activeTab === 'location' && (
                            <LocationGeofencingCard
                                masterOptions={masterOptions}
                                onAdd={onAdd}
                                onUpdate={onUpdate}
                                onDelete={onDelete}
                            />
                        )}

                        {activeTab === 'selfie' && (
                            <SelfieVerificationCard
                                selfieMode={selfieMode}
                                setSelfieMode={setSelfieMode}
                                selfieDays={selfieDays}
                                setSelfieDays={setSelfieDays}
                                isSavingSelfie={isSavingSelfie}
                                handleSaveSelfieConfig={handleSaveSelfieConfig}
                            />
                        )}

                        {activeTab === 'types' && (
                            <TypesManagementCard
                                attendanceTypes={attendanceTypes}
                                leaveTypes={leaveTypes}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                onCreate={onCreate}
                                showConfirm={showConfirm}
                            />
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default AttendanceRulesView;
