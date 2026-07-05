
import { useState, useEffect, useCallback, useMemo } from 'react';
import { AttendanceStats } from '../../types/attendance';
import { format, startOfMonth, endOfMonth, subDays } from 'date-fns';
import { checkIsLate, getAttendanceSummary } from '../../lib/attendanceUtils';
import { useMasterData } from '../useMasterData';
import { useUserSession } from '../../context/UserSessionContext';
import { isWorkingDay } from '../../utils/judgeUtils';

export const useAttendanceStats = (userId: string) => {
    const { masterOptions, annualHolidays, calendarExceptions } = useMasterData();
    const { attendanceLogs, leaveRequests, allUsers, currentUserProfile } = useUserSession();
    const todayDateStr = format(new Date(), 'yyyy-MM-dd');

    const stats = useMemo(() => {
        if (!userId || !attendanceLogs) return {
            totalDays: 0,
            lateDays: 0,
            onTimeDays: 0,
            absentDays: 0,
            totalHours: 0,
            currentStreak: 0,
            hasPendingStreakRequest: false,
            monthlyLogs: []
        };

        const targetDate = new Date();
        const start = format(startOfMonth(targetDate), 'yyyy-MM-dd');
        const end = format(endOfMonth(targetDate), 'yyyy-MM-dd');

        // Filter logs for the current user
        const userLogs = attendanceLogs.filter(log => log.userId === userId);

        // Filter for current month
        const monthlyData = userLogs.filter(log => log.date >= start && log.date <= end);

        // Fetch Config
        const configData = masterOptions.filter(o => o.type === 'WORK_CONFIG');
        const startTimeStr = configData?.find(c => c.key === 'START_TIME')?.label || '10:00';
        const buffer = parseInt(configData?.find(c => c.key === 'LATE_BUFFER')?.label || '0');

        let lateCount = 0;
        let onTimeCount = 0;
        let totalHours = 0;

        monthlyData.forEach(log => {
            const summary = getAttendanceSummary(
                log.checkInTime,
                log.checkOutTime,
                { startTime: startTimeStr, buffer, minHours: 9 }
            );

            if (summary.isLate) {
                lateCount++;
            } else if (log.checkInTime) {
                onTimeCount++;
            }
            totalHours += summary.workHours;
        });

        // Calculate Streak using Strict Backward Date Walking (Day-by-Day Backward Walk)
        let currentStreak = 0;
        let hasPendingStreakRequest = false;
        
        const targetUser = allUsers.find(u => u.id === userId) || currentUserProfile;
        let consecutiveOnTime = 0;

        // Loop backward for up to 30 calendar days
        for (let i = 0; i < 30; i++) {
            const d = subDays(new Date(), i);
            const dateStr = format(d, 'yyyy-MM-dd');

            // Monthly Reset - do not count streak beyond the current month
            if (dateStr < start) {
                break;
            }

            // 1. Is it a working day for this user?
            const isWork = isWorkingDay(d, annualHolidays || [], calendarExceptions || [], targetUser);
            if (!isWork) {
                // Skip holidays/weekends, do not break the streak, do not count
                continue;
            }

            // 2. Check if user is on approved leave on this date
            // Exclude OVERTIME and corrections from being treated as actual leaves
            const approvedLeave = leaveRequests?.find(req => {
                if (req.userId !== userId || req.status !== 'APPROVED') return false;
                if (['OVERTIME', 'LATE_ENTRY', 'FORGOT_CHECKIN', 'FORGOT_CHECKOUT', 'FORGOT_BOTH'].includes(req.type)) return false;
                const s = format(new Date(req.startDate), 'yyyy-MM-dd');
                const e = format(new Date(req.endDate), 'yyyy-MM-dd');
                return dateStr >= s && dateStr <= e;
            });

            if (approvedLeave) {
                if (approvedLeave.type === 'VACATION') {
                    // Vacation counts for Streak
                    consecutiveOnTime++;
                }
                // Skip further checks for this day
                continue;
            }

            // 3. Find attendance log for this day
            const log = userLogs.find(l => l.date === dateStr);

            // Helper to check if there is a pending correction/leave request for this day (excluding OVERTIME)
            const checkHasPendingRequest = () => {
                return leaveRequests?.some(req => {
                    if (req.userId !== userId || req.status !== 'PENDING') return false;
                    if (req.type === 'OVERTIME') return false;
                    const s = format(new Date(req.startDate), 'yyyy-MM-dd');
                    const e = format(new Date(req.endDate), 'yyyy-MM-dd');
                    return dateStr >= s && dateStr <= e;
                }) || false;
            };

            if (dateStr === todayDateStr) {
                // --- Special Logic for Today ---
                if (!log) {
                    // Today is still ongoing and no log is created yet, so we don't break the streak.
                    // We just continue to yesterday to evaluate the active streak.
                    continue;
                }

                if (log.status === 'LEAVE') {
                    continue;
                }

                if (log.checkInTime) {
                    const summary = getAttendanceSummary(
                        log.checkInTime,
                        log.checkOutTime,
                        { startTime: startTimeStr, buffer, minHours: 9 }
                    );

                    const isLate = log.status === 'LATE' || summary.isLate;
                    if (isLate) {
                        if (checkHasPendingRequest()) {
                            hasPendingStreakRequest = true;
                        }
                        break; // Streak broken today due to lateness
                    }

                    if (log.checkOutTime) {
                        const isEarly = log.status === 'EARLY_LEAVE' || summary.isEarlyLeave;
                        if (isEarly) {
                            if (checkHasPendingRequest()) {
                                hasPendingStreakRequest = true;
                            }
                            break; // Streak broken today due to early leave
                        }

                        // Both check-in and check-out are present and on-time!
                        consecutiveOnTime++;
                    } else {
                        // Still working today, but checked in on-time! This counts for today.
                        consecutiveOnTime++;
                    }
                } else {
                    // Log exists but no checkInTime (e.g., marked ABSENT/No Show)
                    if (checkHasPendingRequest()) {
                        hasPendingStreakRequest = true;
                    }
                    break; // Streak broken today
                }
            } else {
                // --- Past Workdays ---
                if (!log) {
                    // Missing log on a past workday is ABSENT/No Show. Breaks streak!
                    if (checkHasPendingRequest()) {
                        hasPendingStreakRequest = true;
                    }
                    break;
                }

                if (log.status === 'LEAVE') {
                    continue; // Skip approved leave day
                }

                if (log.checkInTime && log.checkOutTime) {
                    const summary = getAttendanceSummary(
                        log.checkInTime,
                        log.checkOutTime,
                        { startTime: startTimeStr, buffer, minHours: 9 }
                    );

                    const isLate = log.status === 'LATE' || summary.isLate;
                    const isEarly = log.status === 'EARLY_LEAVE' || summary.isEarlyLeave;

                    if (isLate || isEarly) {
                        if (checkHasPendingRequest()) {
                            hasPendingStreakRequest = true;
                        }
                        break; // Streak broken on past workday due to late or early leave
                    }

                    // On-time check-in and check-out!
                    consecutiveOnTime++;
                } else {
                    // Missing check-in or check-out on a past workday. Breaks streak!
                    if (checkHasPendingRequest()) {
                        hasPendingStreakRequest = true;
                    }
                    break;
                }
            }
        }

        currentStreak = consecutiveOnTime;

        return {
            totalDays: monthlyData.length,
            lateDays: lateCount,
            onTimeDays: onTimeCount,
            absentDays: 0, 
            totalHours: Math.round(totalHours),
            currentStreak,
            hasPendingStreakRequest,
            monthlyLogs: monthlyData
        };
    }, [userId, attendanceLogs, leaveRequests, allUsers, currentUserProfile, masterOptions, annualHolidays, calendarExceptions, todayDateStr]);

    return { stats, isStatsLoading: false, refreshStats: () => {} };
};
