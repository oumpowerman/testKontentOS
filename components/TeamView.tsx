
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task, Channel, User, MasterOption } from '../types';
import { format, endOfWeek, eachDayOfInterval, isSameWeek, isToday, addWeeks, differenceInCalendarDays } from 'date-fns';
import { 
  ChevronLeft, ChevronRight, Check, X, ClipboardList, 
  History as HistoryIcon 
} from 'lucide-react';
import MentorTip from './MentorTip';
import { useRewards } from '../hooks/useRewards';
import MemberManagementModal from './member-management'; 
import MemberDetailModal from './MemberDetailModal'; 
import { useTeam } from '../hooks/useTeam';
import RewardShop from './RewardShop';
import RewardHistory from './RewardHistory';

// Import New Sub-components
import TeamHeader from './team/TeamHeader';
import TeamPoolRow from './team/TeamPoolRow';
import TeamMemberRow from './team/TeamMemberRow';
import MyWorkloadModal from './team/MyWorkloadModal'; 
import WorkHistoryModal from './team/WorkHistoryModal';
import MobileTeamList from './team/MobileTeamList'; 
import TeamToolbar from './team/TeamToolbar'; // NEW
import TeamPagination from './team/TeamPagination'; // NEW
import InternManagementView from './team/intern/index';
import RandomizerModal from './team/RandomizerModal';

// Lazy Load Tribunal Components
const TribunalReportModal = React.lazy(() => import('./team/TribunalReportModal'));

import { useInterns } from '../hooks/useInterns';

// Import DnD Hook
import { useTeamDragDrop } from '../hooks/useTeamDragDrop';

// Import New Logic Hooks
import { useTeamFilters } from '../hooks/useTeamFilters';
import { useTeamData } from '../hooks/useTeamData';
import { useMasterData } from '../hooks/useMasterData';

interface TeamViewProps {
  tasks: Task[];
  channels: Channel[];
  users: User[];
  currentUser: User | null;
  onEditTask: (task: Task) => void;
  onApproveMember?: (id: string) => void;
  onRemoveMember?: (id: string) => void;
  onToggleStatus?: (id: string, currentStatus: boolean) => void; 
  onAdjustStats?: (userId: string, adjustments: { hp?: number, xp?: number, points?: number }) => void;
  onOpenSettings: () => void;
  onAddTask?: (type?: any) => void; 
  onMoveTask?: (task: Task) => void; 
}

export type ColorLensMode = 'STATUS' | 'PRIORITY' | 'TYPE';

const TeamView: React.FC<TeamViewProps> = ({ 
  tasks, 
  channels,
  users, 
  currentUser,
  onEditTask, 
  onApproveMember, 
  onRemoveMember, 
  onToggleStatus,
  onAdjustStats,
  onAddTask,
  onMoveTask
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'TEAM' | 'INTERNS'>('TEAM');
  const [direction, setDirection] = useState(0);

  const handleSetViewMode = (newMode: 'TEAM' | 'INTERNS') => {
    if (newMode === viewMode) return;
    setDirection(newMode === 'INTERNS' ? 1 : -1);
    setViewMode(newMode);
  };
  
  // --- UI CONTROLS ---
  const [isWorkloadModalOpen, setIsWorkloadModalOpen] = useState(false);
  const [isWorkHistoryOpen, setIsWorkHistoryOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isRandomizerOpen, setIsRandomizerOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<User | null>(null);

  // --- HOOKS ---
  const { 
    rewards, 
    allRedemptions, 
    userRedemptions, 
    redeemReward, 
    useReward,
    adminUpdateRedemption,
    fetchAllRedemptions 
  } = useRewards(currentUser);
  const { updateMember } = useTeam();
  const { masterOptions } = useMasterData(); // Fetch here for modal
  const internData = useInterns(viewMode === 'INTERNS'); // Lazy load interns only when needed
  
  const isAdmin = currentUser?.role === 'ADMIN';

  // --- 1. FILTER HOOK ---
  const {
      viewScope, setViewScope,
      searchQuery, setSearchQuery,
      selectedPosition, setSelectedPosition,
      availablePositions, resetFilters
  } = useTeamFilters(users, currentUser);

  // --- Date Logic (Memoized) ---
  const { start, end, weekDays } = useMemo(() => {
      const d = new Date(currentDate);
      const day = d.getDay();
      const diff = (day === 0 ? -6 : 1); // Monday start
      d.setDate(d.getDate() - day + diff);
      d.setHours(0, 0, 0, 0);
      
      const start = new Date(d);
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      const weekDays = eachDayOfInterval({ start, end });
      return { start, end, weekDays };
  }, [currentDate]);

  // --- 2. DATA HOOK (The Heavy Lifter) ---
  const { visibleUsers, userTaskMap, pagination } = useTeamData({
      allUsers: users,
      allTasks: tasks,
      currentUser,
      filters: { scope: viewScope, search: searchQuery, position: selectedPosition },
      dateRange: { start, end },
      pageSize: 10 // Show 10 people per page for performance
  });

  // --- Pool Tasks Logic (Global, not per user) ---
  const { teamPoolTasks, unassignedTasks } = useMemo(() => {
      // Logic for pool tasks remains mostly same, just checking date range
      const generalTasks = tasks.filter(t => t.type === 'TASK' && t.status !== 'DONE');
      
      const tasksInWeek = generalTasks.filter(t => {
          const taskStart = new Date(t.startDate); taskStart.setHours(0,0,0,0);
          const taskEnd = new Date(t.endDate); taskEnd.setHours(23,59,59,999);
          return taskStart <= end && taskEnd >= start;
      });

      return {
          teamPoolTasks: tasksInWeek.filter(t => t.assigneeType === 'TEAM' && (!t.assigneeIds || t.assigneeIds.length === 0)),
          unassignedTasks: tasksInWeek.filter(t => t.assigneeType !== 'TEAM' && (!t.assigneeIds || t.assigneeIds.length === 0))
      };
  }, [tasks, start, end]);

  // --- Optimized Helper ---
  const isTaskOnDay = useCallback((task: Task, day: Date) => {
      const taskStart = new Date(task.startDate); taskStart.setHours(0,0,0,0);
      const taskEnd = new Date(task.endDate); taskEnd.setHours(23,59,59,999);
      const targetDayStart = new Date(day); targetDayStart.setHours(0,0,0,0);
      const targetDayEnd = new Date(day); targetDayEnd.setHours(23,59,59,999);
      
      return (taskStart <= targetDayEnd) && (taskEnd >= targetDayStart);
  }, []);

  // --- DnD Hook Initialization ---
  const [dragOffsetDays, setDragOffsetDays] = useState(0);
  const { handleDragStart, handleDragOver, handleDrop } = useTeamDragDrop({
    tasks,
    onDragStartExtra: (taskId, clickDate) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const start = new Date(task.startDate);
    const diffDays = differenceInCalendarDays(clickDate, start);

    setDragOffsetDays(diffDays);
    },
    onTaskMove: (taskId, newAssigneeId, newDate) => {
        const task = tasks.find(t => t.id === taskId);
        if (task && onMoveTask) {

            const oldStart = new Date(task.startDate);
            const oldEnd = new Date(task.endDate);

            const correctedStart = new Date(newDate);
            correctedStart.setDate(correctedStart.getDate() - dragOffsetDays);

            const duration =
                oldEnd.getTime() - oldStart.getTime();

            const newStart = correctedStart;
            const newEnd = new Date(newStart.getTime() + duration);

            const updatedTask = {
                ...task,
                assigneeIds: [newAssigneeId],
                startDate: newStart,
                endDate: newEnd,
                isUnscheduled: false
            };

            onMoveTask(updatedTask);
        }
    }
  });

  // --- Handlers ---
  const nextWeek = () => setCurrentDate(prev => addWeeks(prev, 1));
  const prevWeek = () => setCurrentDate(prev => addWeeks(prev, -1));
  const goToToday = () => setCurrentDate(new Date());

  const handleAction = async (action: 'APPROVE' | 'REMOVE' | 'TOGGLE_STATUS', userId: string, currentStatus?: boolean) => {
      if (action === 'APPROVE') {
          await onApproveMember?.(userId);
      } else if (action === 'REMOVE') {
          await onRemoveMember?.(userId);
      } else if (action === 'TOGGLE_STATUS' && onToggleStatus && currentStatus !== undefined) {
          await onToggleStatus(userId, currentStatus);
      }
  };

  const pendingMembers = useMemo(() => users.filter(u => !u.isApproved && u.isActive), [users]);

  const [bgTheme, setBgTheme] = useState('');
  const themes = [
    'bg-[#fff5f5]', // Soft Pink
    'bg-[#f0f7ff]', // Soft Blue
    'bg-[#f2fcf5]', // Soft Green
    'bg-[#f8f5ff]', // Soft Purple
    'bg-[#fff9f0]', // Soft Orange
    'bg-[#fefff0]', // Soft Yellow
    'bg-[#f0fffa]'  // Soft Teal
  ];

  useEffect(() => {
    setBgTheme(themes[Math.floor(Math.random() * themes.length)]);
  }, []);

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0,
      scale: 0.98,
      filter: 'blur(10px)'
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
      filter: 'blur(0px)'
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 50 : -50,
      opacity: 0,
      scale: 0.98,
      filter: 'blur(10px)'
    })
  };

  return (
    <div className={`min-h-screen -m-4 p-8 space-y-6 animate-in fade-in duration-500 pb-20 transition-colors duration-1000 relative ${bgTheme}`}>
      {/* Grid/Notebook Pattern Gimmick */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" 
           style={{ 
               backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
               backgroundSize: '40px 40px' 
           }} 
      />
      
      <div className="relative z-10 space-y-6">
        <MentorTip variant="blue" messages={[
            "ใหม่! ระบบกรองทีมแบบใหม่: เลือกดูเฉพาะ Squad ตัวเอง หรือดูทั้งหมดได้ง่ายๆ",
            "ใครว่าง/ไม่ว่าง ดูที่สถานะแบตเตอรี่และไอคอนสถานะ (Online/Sick) ได้เลย",
            "ใช้ปุ่ม My Tasks เพื่อดูงานตัวเองแบบรวมทุกที่",
        ]} />
        
        {/* Header */}
        <TeamHeader 
            onAddTask={onAddTask}
            onManageClick={() => setIsManageModalOpen(true)}
            currentUser={currentUser}
            isShopOpen={isShopOpen}
            toggleShop={() => setIsShopOpen(!isShopOpen)}
            viewMode={viewMode}
            setViewMode={handleSetViewMode}
            onOpenRandomizer={() => setIsRandomizerOpen(true)}
            onOpenReport={() => setIsReportModalOpen(true)}
        />

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={viewMode}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.3 },
              filter: { duration: 0.3 }
            }}
            className="space-y-6"
          >
            {viewMode === 'TEAM' ? (
              <>
                {/* Shop & History Sections */}
                {isShopOpen && (
                    <div className="animate-in slide-in-from-top-4 fade-in">
                        <RewardShop 
                            rewards={rewards} 
                            userPoints={currentUser?.availablePoints || 0}
                            userRedemptions={userRedemptions}
                            onRedeem={redeemReward}
                            onUseReward={useReward}
                            onClose={() => setIsShopOpen(false)}
                            onOpenHistory={() => { setIsHistoryOpen(true); fetchAllRedemptions(); }}
                        />
                    </div>
                )}

                {isHistoryOpen && (
                    <div className="animate-in slide-in-from-top-4 fade-in">
                        <RewardHistory 
                            redemptions={allRedemptions.filter(r => isAdmin || r.userId === currentUser?.id)} 
                            onClose={() => setIsHistoryOpen(false)} 
                            isAdmin={isAdmin}
                            onUpdateStatus={adminUpdateRedemption}
                        />
                    </div>
                )}

                {/* Pending Approvals */}
                {isAdmin && pendingMembers.length > 0 && (
                    <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 animate-in slide-in-from-top-2">
                        <h3 className="font-bold text-orange-800 mb-3 flex items-center text-sm">
                            <span className="bg-orange-200 text-orange-800 px-2 py-0.5 rounded-lg mr-2 text-xs">Waiting</span>
                            รออนุมัติเข้าทีม ({pendingMembers.length})
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {pendingMembers.map(member => (
                                <div key={member.id} className="bg-white p-3 rounded-xl shadow-sm border border-orange-100 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        {member.avatarUrl ? (
                                            <img src={member.avatarUrl} className="w-10 h-10 rounded-full object-cover bg-gray-200" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold">{member.name.charAt(0)}</div>
                                        )}
                                        <div>
                                            <p className="font-bold text-sm text-gray-800">{member.name}</p>
                                            <p className="text-xs text-gray-500">{member.position || 'No Position'}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => handleAction('APPROVE', member.id)} className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"><Check className="w-4 h-4" /></button>
                                        <button onClick={() => handleAction('REMOVE', member.id)} className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"><X className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- CONTROLS ROW: Date & Toolbar --- */}
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 relative z-[150] bg-white/80 backdrop-blur-xl py-3 px-4 rounded-3xl border border-white/40 shadow-lg">
                  
                  {/* Date Navigator */}
                  <div className="flex items-center bg-white p-1.5 rounded-2xl border border-gray-200 shadow-sm w-fit shrink-0">
                          <button onClick={prevWeek} className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition-colors"><ChevronLeft className="w-5 h-5" /></button>
                          <div className="flex flex-col items-center px-4 min-w-[140px]">
                              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{isSameWeek(currentDate, new Date(), { weekStartsOn: 1 }) ? 'สัปดาห์นี้' : 'ช่วงวันที่'}</span>
                              <span className="text-sm font-black text-indigo-600">{format(start, 'd MMM')} - {format(end, 'd MMM')}</span>
                          </div>
                          <button onClick={nextWeek} className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition-colors"><ChevronRight className="w-5 h-5" /></button>
                          {!isSameWeek(currentDate, new Date(), { weekStartsOn: 1 }) && (
                              <div className="border-l border-gray-200 pl-1 ml-1">
                                  <button onClick={goToToday} className="px-3 py-1.5 text-xs font-bold bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors ml-1">Today</button>
                              </div>
                          )}
                  </div>
                  
                  {/* View Controls & Filter Toolbar */}
                  <div className="flex flex-col md:flex-row flex-wrap xl:flex-nowrap gap-3 w-full xl:w-auto items-center">
                       <div className="flex-1 w-full md:w-auto overflow-x-auto no-scrollbar">
                           <TeamToolbar 
                              viewScope={viewScope} setViewScope={setViewScope}
                              searchQuery={searchQuery} setSearchQuery={setSearchQuery}
                              selectedPosition={selectedPosition} setSelectedPosition={setSelectedPosition}
                              availablePositions={availablePositions}
                              onReset={resetFilters}
                           />
                       </div>
                       
                       {/* My Tasks Button */}
                       <div className="flex gap-2 w-full md:w-auto shrink-0">
                            <button 
                                onClick={() => setIsWorkloadModalOpen(true)}
                                className="flex-1 md:flex-none flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold transition-all bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-100 shadow-sm justify-center min-w-fit"
                            >
                                <ClipboardList className="w-4 h-4" />
                                <span className="hidden sm:inline">My Tasks</span>
                            </button>

                            <button 
                                onClick={() => setIsWorkHistoryOpen(true)}
                                className="flex-1 md:flex-none flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold transition-all bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200 shadow-sm justify-center group min-w-fit"
                            >
                                <HistoryIcon className="w-4 h-4 group-hover:rotate-[-45deg] transition-transform" />
                                <span className="hidden xl:inline">Work History</span>
                                <span className="xl:hidden hidden sm:inline">History</span>
                            </button>
                       </div>
                  </div>
                </div>

                {/* --- MOBILE VIEW (Card List) --- */}
                <div className="block md:hidden">
                    <MobileTeamList 
                        users={visibleUsers}
                        userTaskMap={userTaskMap}
                        weekDays={weekDays}
                        onEditTask={onEditTask}
                    />
                    {/* Mobile Pagination */}
                    <div className="mt-4">
                         <TeamPagination 
                            currentPage={pagination.currentPage}
                            totalPages={pagination.totalPages}
                            totalItems={pagination.totalItems}
                            onPageChange={pagination.setCurrentPage}
                         />
                    </div>
                </div>

                {/* --- DESKTOP VIEW: GANG TABLE --- */}
                <div className="hidden md:block bg-white rounded-3xl shadow-sm border border-gray-200 overflow-visible">
                  {/* Table Header - Sticky */}
                  <div className="grid grid-cols-8 border-b border-gray-200 bg-gray-50 rounded-t-3xl sticky top-[-2rem] z-50">
                     <div className="col-span-1 py-4 px-4 text-xs font-black text-gray-400 uppercase tracking-wider">สมาชิก ({pagination.totalItems})</div>
                     {weekDays.map(day => (
                         <div key={day.toString()} className={`col-span-1 py-3 text-center border-l border-gray-100 ${isToday(day) ? 'bg-indigo-50/50' : ''}`}>
                             <p className="text-xs text-gray-400 uppercase font-semibold">{format(day, 'EEE')}</p>
                             <p className={`text-sm font-bold ${isToday(day) ? 'text-indigo-600' : 'text-gray-700'}`}>{format(day, 'dd')}</p>
                         </div>
                     ))}
                  </div>

                  <div className="divide-y divide-gray-100">
                      {/* Team Pool Rows (Show only on Page 1) */}
                      {pagination.currentPage === 1 && (
                          <>
                              <TeamPoolRow type="POOL" tasks={teamPoolTasks} weekDays={weekDays} onEditTask={onEditTask} isTaskOnDay={isTaskOnDay} />
                              <TeamPoolRow type="UNASSIGNED" tasks={unassignedTasks} weekDays={weekDays} onEditTask={onEditTask} isTaskOnDay={isTaskOnDay} />
                          </>
                      )}

                      {/* Member Rows */}
                      {visibleUsers.map(user => (
                          <TeamMemberRow 
                              key={user.id}
                              user={user}
                              tasks={userTaskMap.get(user.id) || []}
                              weekDays={weekDays}
                              currentUser={currentUser}
                              onEditTask={onEditTask}
                              onSelectUser={setSelectedMember}
                              isTaskOnDay={isTaskOnDay}
                              onDragStart={handleDragStart}
                              onDragOver={handleDragOver}
                              onDrop={handleDrop}
                          />
                      ))}
                  </div>
                  
                  {/* Desktop Pagination */}
                  <TeamPagination 
                      currentPage={pagination.currentPage}
                      totalPages={pagination.totalPages}
                      totalItems={pagination.totalItems}
                      onPageChange={pagination.setCurrentPage}
                  />
                </div>
              </>
            ) : (
              <InternManagementView {...internData} />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Modals */}
        <MemberDetailModal isOpen={!!selectedMember} onClose={() => setSelectedMember(null)} user={selectedMember} />


        {isAdmin && currentUser && (
            <MemberManagementModal 
                isOpen={isManageModalOpen}
                onClose={() => setIsManageModalOpen(false)}
                users={users}
                currentUser={currentUser}
                masterOptions={masterOptions} // Pass masterOptions here
                tasks={tasks} // Pass tasks to show workload
                onToggleStatus={(uid, status) => handleAction('TOGGLE_STATUS', uid, status)}
                onRemoveMember={(uid) => handleAction('REMOVE', uid)}
                onUpdateMember={updateMember}
                onAdjustStats={onAdjustStats}
            />
        )}


        {/* WORKLOAD MODAL */}
        {currentUser && (
            <MyWorkloadModal 
                users={users}            // 👈 เพิ่มบรรทัดนี้
                isOpen={isWorkloadModalOpen}
                onClose={() => setIsWorkloadModalOpen(false)}
                tasks={tasks}
                currentUser={currentUser}
                channels={channels}
                onOpenTask={onEditTask}
                onOpenHistory={() => {
                    setIsWorkloadModalOpen(false);
                    setIsWorkHistoryOpen(true);
                }}
            />
        )}

        {/* WORK HISTORY MODAL */}
        {currentUser && (
            <WorkHistoryModal
                isOpen={isWorkHistoryOpen}
                onClose={() => setIsWorkHistoryOpen(false)}
                currentUser={currentUser}
                channels={channels}
                onOpenTask={onEditTask}
            />
        )}

        {/* RANDOMIZER MODAL */}
        <RandomizerModal 
            isOpen={isRandomizerOpen}
            onClose={() => setIsRandomizerOpen(false)}
            users={users}
            currentUser={currentUser}
        />

        {/* TRIBUNAL REPORT MODAL */}
        <React.Suspense fallback={null}>
          {isReportModalOpen && (
            <TribunalReportModal 
              isOpen={isReportModalOpen}
              onClose={() => setIsReportModalOpen(false)}
              currentUser={currentUser}
            />
          )}
        </React.Suspense>
      </div>
    </div>
  );
};

export default TeamView;
