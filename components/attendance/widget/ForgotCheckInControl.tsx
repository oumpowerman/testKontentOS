
import React, { useState, useEffect } from 'react';
import { History } from 'lucide-react';
import LeaveRequestModal from '../leave-request/LeaveRequestModal';
import { LeaveType, LeaveUsage } from '../../../types/attendance';
import { setHours, setMinutes, addMinutes, addHours, isWithinInterval } from 'date-fns';

interface ForgotCheckInControlProps {
    startTime: string; // "HH:mm" from MasterData
    lateBuffer: number; // Minutes
    isCheckedIn: boolean;
    onSubmit: (type: LeaveType, start: Date, end: Date, reason: string, file?: File) => Promise<boolean>;
    leaveUsage?: LeaveUsage;
}

const ForgotCheckInControl: React.FC<ForgotCheckInControlProps> = ({
    startTime,
    lateBuffer,
    isCheckedIn,
    onSubmit,
    leaveUsage
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const checkVisibility = () => {
            // If already checked in, hide the button
            if (isCheckedIn) {
                setIsVisible(false);
                return;
            }

            if (!startTime) return;

            const now = new Date();
            const [startHour, startMinute] = startTime.split(':').map(Number);
            
            // Base Start Time (Today)
            const workStartTime = setMinutes(setHours(now, startHour), startMinute);
            
            // Start Window: Start Time + Buffer (Before this, user should use normal Check-in)
            const showAfterTime = addMinutes(workStartTime, lateBuffer);
            
            // End Window: Start Time + 12 Hours (Prevent overnight/late night confusion)
            const hideAfterTime = addHours(workStartTime, 12);

            try {
                // Check if NOW is within the window
                const shouldShow = isWithinInterval(now, { start: showAfterTime, end: hideAfterTime });
                setIsVisible(shouldShow);
            } catch (e) {
                // Handle edge cases where interval might be invalid (rare)
                setIsVisible(false);
            }
        };

        // Initial Check
        checkVisibility();

        // Re-check every minute
        const interval = setInterval(checkVisibility, 60000);
        return () => clearInterval(interval);
    }, [startTime, lateBuffer, isCheckedIn]);

    const handleSubmit = async (type: LeaveType, start: Date, end: Date, reason: string, file?: File) => {
        const success = await onSubmit(type, start, end, reason, file);
        if (success) {
            setIsModalOpen(false);
        }
        return success;
    };

    if (!isVisible) return null;

    return (
        <>
            <button 
                onClick={() => setIsModalOpen(true)}
                className="py-2 bg-white border border-gray-200 text-gray-400 hover:text-indigo-500 hover:border-indigo-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 animate-in fade-in"
            >
                <History className="w-4 h-4" /> ลืมลงเวลาเข้า?
            </button>

            <LeaveRequestModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSubmit}
                leaveUsage={leaveUsage}
                fixedType="FORGOT_CHECKIN"
            />
        </>
    );
};

export default ForgotCheckInControl;
