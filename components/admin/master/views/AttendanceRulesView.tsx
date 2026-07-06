import React, { useState, useEffect } from 'react';
import { MasterOption } from '../../../../types';
import { Clock, MapPin, Camera, Heart } from 'lucide-react';
import { useGameConfig } from '../../../../context/GameConfigContext';
import { useGlobalDialog } from '../../../../context/GlobalDialogContext';
import { motion, AnimatePresence } from 'framer-motion';

// Modular Rules Components
import WorkTimeCard from './rules/WorkTimeCard';
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
    masterOptions, onUpdate, onAdd, onCreate, onEdit, onDelete 
}) => {
    // Game Config Context (For Syncing Scores)
    const { config, updateConfigValue } = useGameConfig();
    const { showAlert, showConfirm } = useGlobalDialog();

    // Active Tab state
    const [activeTab, setActiveTab] = useState<TabType>('time');

    // Attendance Rules Local State
    const [tempTimeConfig, setTempTimeConfig] = useState({ 
        start: '10:00', 
        end: '19:00', 
        buffer: '15', 
        minHours: '9', 
        otThreshold: '2', 
        checkoutPenaltyTime: '06:00',
        dailySummaryDelayHours: '1',
        lineSummaryDestination: '',
        enableAttendanceRace: 'true'
    });
    const [isStartTimeOpen, setIsStartTimeOpen] = useState(false);
    const [isEndTimeOpen, setIsEndTimeOpen] = useState(false);
    const [isCheckoutPenaltyTimeOpen, setIsCheckoutPenaltyTimeOpen] = useState(false);
    const [otJpRate, setOtJpRate] = useState<string>('10');
    
    // Selfie Verification Config State
    const [selfieMode, setSelfieMode] = useState<string>('ALWAYS_ON');
    const [selfieDays, setSelfieDays] = useState<string>('3');
    const [isSavingSelfie, setIsSavingSelfie] = useState(false);
    
    // Location Config State
    const [officeConfig, setOfficeConfig] = useState({ lat: '', lng: '', radius: '500' });
    const [isLocating, setIsLocating] = useState(false);

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
        const lineSummaryDestinationOpt = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'LINE_SUMMARY_DESTINATION');
        const enableRaceOpt = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'ENABLE_ATTENDANCE_RACE');
        
        if (startOpt || endOpt || bufferOpt || minHoursOpt || otThresholdOpt || checkoutPenaltyTimeOpt || dailySummaryDelayHoursOpt || lineSummaryDestinationOpt || enableRaceOpt) {
            setTempTimeConfig({
                start: startOpt?.label || '10:00',
                end: endOpt?.label || '19:00',
                buffer: bufferOpt?.label || '15',
                minHours: minHoursOpt?.label || '9',
                otThreshold: otThresholdOpt?.label || '2',
                checkoutPenaltyTime: checkoutPenaltyTimeOpt?.label || '06:00',
                dailySummaryDelayHours: dailySummaryDelayHoursOpt?.label || '1',
                lineSummaryDestination: lineSummaryDestinationOpt?.label || '',
                enableAttendanceRace: enableRaceOpt?.label || 'true'
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

        // Location
        const latOpt = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'OFFICE_LAT');
        const lngOpt = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'OFFICE_LNG');
        const radOpt = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'OFFICE_RADIUS');

        if (latOpt || lngOpt || radOpt) {
            setOfficeConfig({
                lat: latOpt?.label || '',
                lng: lngOpt?.label || '',
                radius: radOpt?.label || '500'
            });
        }
    }, [masterOptions, config]);

    const handleSaveTimeConfig = async () => {
        const updateOrInsert = async (key: string, val: string) => {
            const existing = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === key);
            if (existing) {
                await onUpdate({ ...existing, label: val });
            } else {
                 await onAdd({
                    type: 'WORK_CONFIG',
                    key: key,
                    label: val,
                    color: '',
                    isActive: true,
                    sortOrder: 0
                });
            }
        };

        await updateOrInsert('START_TIME', tempTimeConfig.start);
        await updateOrInsert('END_TIME', tempTimeConfig.end);
        await updateOrInsert('LATE_BUFFER', tempTimeConfig.buffer);
        await updateOrInsert('MIN_HOURS', tempTimeConfig.minHours);
        await updateOrInsert('OT_THRESHOLD_HOURS', tempTimeConfig.otThreshold);
        await updateOrInsert('CHECKOUT_PENALTY_TIME', tempTimeConfig.checkoutPenaltyTime);
        await updateOrInsert('DAILY_SUMMARY_DELAY_HOURS', tempTimeConfig.dailySummaryDelayHours);
        await updateOrInsert('LINE_SUMMARY_DESTINATION', tempTimeConfig.lineSummaryDestination);
        await updateOrInsert('ENABLE_ATTENDANCE_RACE', tempTimeConfig.enableAttendanceRace);
        
        const parsedRate = parseInt(otJpRate, 10);
        if (!isNaN(parsedRate)) {
            const currentMultipliers = config.GLOBAL_MULTIPLIERS || {};
            await updateConfigValue('GLOBAL_MULTIPLIERS', {
                ...currentMultipliers,
                OT_JP_RATE_PER_HOUR: parsedRate
            });
        }
        
        await showAlert('บันทึกเวลาทำการเรียบร้อย ✅', 'สำเร็จ');
    };

    const handleSaveLocationConfig = async () => {
         const updateOrInsert = async (key: string, val: string) => {
            const existing = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === key);
            if (existing) {
                await onUpdate({ ...existing, label: val });
            } else {
                await onAdd({
                    type: 'WORK_CONFIG',
                    key: key,
                    label: val,
                    color: '',
                    isActive: true,
                    sortOrder: 0
                });
            }
        };

        await updateOrInsert('OFFICE_LAT', officeConfig.lat);
        await updateOrInsert('OFFICE_LNG', officeConfig.lng);
        await updateOrInsert('OFFICE_RADIUS', officeConfig.radius);
        
        await showAlert('บันทึกพิกัดเรียบร้อย! 🗺️', 'สำเร็จ');
    };

    const handleSaveSelfieConfig = async () => {
        setIsSavingSelfie(true);
        try {
            const updateOrInsert = async (key: string, val: string) => {
                const existing = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === key);
                if (existing) {
                    await onUpdate({ ...existing, label: val });
                } else {
                    await onAdd({
                        type: 'WORK_CONFIG',
                        key: key,
                        label: val,
                        color: '',
                        isActive: true,
                        sortOrder: 0
                    });
                }
            };

            await updateOrInsert('SELFIE_VERIFICATION_MODE', selfieMode);
            await updateOrInsert('SELFIE_VERIFICATION_DAYS', selfieDays);

            await showAlert('บันทึกการตั้งค่าการถ่ายรูปเรียบร้อย 📸', 'สำเร็จ');
        } catch (e: any) {
            await showAlert('เกิดข้อผิดพลาดในการบันทึก: ' + e.message, 'เกิดข้อผิดพลาด');
        } finally {
            setIsSavingSelfie(false);
        }
    };

    const getCurrentLocation = () => {
        setIsLocating(true);
        if (!navigator.geolocation) {
            showAlert('Browser ไม่รองรับ Geolocation', 'Error');
            setIsLocating(false);
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setOfficeConfig(prev => ({
                    ...prev,
                    lat: pos.coords.latitude.toString(),
                    lng: pos.coords.longitude.toString()
                }));
                setIsLocating(false);
            },
            (err) => {
                showAlert('ไม่สามารถระบุตำแหน่งได้: ' + err.message, 'Error');
                setIsLocating(false);
            },
            { enableHighAccuracy: true }
        );
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
                                officeConfig={officeConfig}
                                setOfficeConfig={setOfficeConfig}
                                getCurrentLocation={getCurrentLocation}
                                isLocating={isLocating}
                                handleSaveLocationConfig={handleSaveLocationConfig}
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
