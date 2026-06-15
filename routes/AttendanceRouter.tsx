
import React, { useState, useEffect, useMemo } from 'react';
import { User } from '../types';
import { 
    AttendanceWidget, 
    AttendanceHistory, 
    AdminAttendanceDashboard, 
    AdminWeeklyTimesheet, 
    LeaveApprovalList, 
    LeaveQuotaModal, 
    AttendanceInfoCard, 
    WeeklyAttendanceRace 
} from '../components/attendance';
import { useAttendanceStats } from '../hooks/attendance/useAttendanceStats'; 
import { useLeaveRequests } from '../hooks/useLeaveRequests';
import { Clock, Calendar, PieChart, FileCheck, TableProperties } from 'lucide-react';
import AppBackground, { BackgroundTheme } from '../components/common/AppBackground';

interface AttendanceRouterProps {
    currentUser: User;
    users: User[]; 
}

type AttendanceTab = 'CHECK_IN' | 'HISTORY' | 'TIMESHEET' | 'REPORT' | 'APPROVALS';

const AttendanceRouter: React.FC<AttendanceRouterProps> = ({ currentUser, users }) => {
    const [currentTab, setCurrentTab] = useState<AttendanceTab>('CHECK_IN');
    const [isQuotaOpen, setIsQuotaOpen] = useState(false); 
    
    // Hooks
    const { stats } = useAttendanceStats(currentUser.id);
    // Lift state up: Fetch all requests here so we can pass actions to child
    // If Admin, fetch all requests for the approval list
    const { requests, leaveUsage, isLoading: isRequestsLoading, approveRequest, rejectRequest } = useLeaveRequests(
        currentUser, 
        { all: currentUser.role === 'ADMIN' }
    );
    
    // Admin pending count (for approval list badge)
    const adminPendingCount = useMemo(() => requests.filter(r => r.status === 'PENDING').length, [requests]);
    
    // My personal pending count (for history badge)
    const myPendingCount = useMemo(() => 
        requests.filter(r => r.userId === currentUser.id && r.status === 'PENDING').length, 
    [requests, currentUser.id]);

    const bgTheme = useMemo(() => {
        const themes: BackgroundTheme[] = [
            'pastel-pink', 'pastel-blue', 'pastel-green', 'pastel-purple', 'pastel-orange', 'pastel-yellow', 'pastel-teal'
        ];
        return themes[Math.floor(Math.random() * themes.length)];
    }, []);

    return (
        <AppBackground theme={bgTheme} pattern="grid" className="p-4 md:p-8 min-h-screen">
            <div className="relative z-10 space-y-6 animate-in fade-in duration-500 pb-20">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-end gap-4 bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white/60 shadow-xl shadow-indigo-500/5">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 flex items-center tracking-tight">
                            <span className="text-4xl mr-2">⏱️</span>
                            ระบบลงเวลา (Time Tracking)
                        </h1>
                        <p className="text-gray-500 text-sm mt-1 font-medium">บันทึกเวลาเข้า-ออกงาน และตรวจสอบประวัติ</p>
                    </div>
                </div>

                {/* 8-bit Daily Attendance Racing track */}
                <WeeklyAttendanceRace />

                {/* Navigation Tabs & Actions */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex p-1 bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-xl shadow-indigo-500/5 w-fit overflow-x-auto scrollbar-hide">
                        <button 
                            onClick={() => setCurrentTab('CHECK_IN')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${currentTab === 'CHECK_IN' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'}`}
                        >
                            <Clock className="w-4 h-4" /> ลงเวลา
                        </button>
                        
                        <button 
                            onClick={() => setCurrentTab('HISTORY')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap relative ${currentTab === 'HISTORY' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'}`}
                        >
                            <Calendar className="w-4 h-4" /> ประวัติ
                            {myPendingCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full animate-bounce shadow-sm ring-2 ring-white">
                                    {myPendingCount}
                                </span>
                            )}
                        </button>

                        {/* Only Admin see these tabs */}
                        {currentUser.role === 'ADMIN' && (
                            <>
                                <div className="w-px h-6 bg-gray-300/50 mx-1 self-center"></div>
                                <button 
                                    onClick={() => setCurrentTab('TIMESHEET')}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${currentTab === 'TIMESHEET' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'}`}
                                >
                                    <TableProperties className="w-4 h-4" /> ตรวจสอบทีม
                                </button>
                                <button 
                                    onClick={() => setCurrentTab('APPROVALS')}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap relative ${currentTab === 'APPROVALS' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'}`}
                                >
                                    <FileCheck className="w-4 h-4" /> คำขออนุมัติ
                                    {adminPendingCount > 0 && (
                                        <span className="ml-1 bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full animate-pulse shadow-sm">
                                            {adminPendingCount}
                                        </span>
                                    )}
                                </button>
                                <button 
                                    onClick={() => setCurrentTab('REPORT')}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${currentTab === 'REPORT' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'}`}
                                >
                                    <PieChart className="w-4 h-4" /> สรุปผลรายเดือน
                                </button>
                            </>
                        )}
                    </div>

                    {/* Quota Button (Trigger) */}
                    <button
                        onClick={() => setIsQuotaOpen(true)}
                        className="ml-auto md:ml-0 px-4 py-2.5 bg-white/80 backdrop-blur-xl border border-white/60 hover:border-indigo-300 text-gray-500 hover:text-indigo-600 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-xl shadow-indigo-500/5 transition-all active:scale-95"
                    >
                        <PieChart className="w-4 h-4" /> เช็คโควต้า (My Quota)
                    </button>
                </div>

                {/* Content Area */}
                <div className="min-h-[400px]">
                    {currentTab === 'CHECK_IN' && (
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
                             {/* Left: Action Card */}
                             <div className="space-y-6">
                                 <AttendanceWidget 
                                    user={currentUser} 
                                    onNavigateToHistory={() => setCurrentTab('HISTORY')}
                                 />
                             </div>

                             {/* Right: Info */}
                             <div className="space-y-6 hidden xl:block">
                                 <AttendanceInfoCard />
                             </div>
                        </div>
                    )}

                    {currentTab === 'HISTORY' && (
                        <AttendanceHistory 
                            userId={currentUser.id}
                        />
                    )}

                    {currentTab === 'TIMESHEET' && currentUser.role === 'ADMIN' && (
                        <AdminWeeklyTimesheet users={users} />
                    )}
                    
                    {currentTab === 'APPROVALS' && currentUser.role === 'ADMIN' && (
                        <LeaveApprovalList 
                            requests={requests}
                            isLoading={isRequestsLoading}
                            onApprove={approveRequest}
                            onReject={rejectRequest}
                        />
                    )}

                    {currentTab === 'REPORT' && currentUser.role === 'ADMIN' && (
                        <AdminAttendanceDashboard users={users} />
                    )}
                </div>

                {/* Quota Modal */}
                <LeaveQuotaModal 
                    isOpen={isQuotaOpen}
                    onClose={() => setIsQuotaOpen(false)}
                    leaveUsage={leaveUsage}
                    onHistoryClick={() => {
                        setCurrentTab('HISTORY');
                        setIsQuotaOpen(false);
                    }}
                />
            </div>
        </AppBackground>
    );
};

export default AttendanceRouter;
