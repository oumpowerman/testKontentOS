
// Trigger re-process
import React, { useState, Suspense, lazy, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { ViewMode, Task } from '../types';
import PendingApprovalScreen from '../components/PendingApprovalScreen';
import InactiveScreen from '../components/InactiveScreen';
import DeathScreen from '../components/gamification/DeathScreen';
import AppShell from '../components/layout/AppShell';
import NotificationPopover from '../components/NotificationPopover';
import { useTaskManager } from '../hooks/useTaskManager';
import { useAuth } from '../hooks/useAuth';
import { useSystemNotifications } from '../hooks/useSystemNotifications';
import { useChatUnread } from '../hooks/useChatUnread';
import { useAutoJudge } from '../hooks/useAutoJudge'; 
import { useLeaveRequests } from '../hooks/useLeaveRequests';
import { useGameEventListener } from '../hooks/useGameEventListener'; 
import { useToast } from '../context/ToastContext';
import NegligenceLockModal from '../components/duty/NegligenceLockModal'; // NEW IMPORT
import DeathLockModal from '../components/gamification/DeathLockModal';
import ResurrectionModal from '../components/gamification/ResurrectionModal';
import ShortcutManager from '../components/common/ShortcutManager';
import { Loader2, Search, Inbox } from 'lucide-react';
import { WorkboxProvider, useWorkboxContext } from '../context/WorkboxContext';
import { GoogleDriveProvider } from '../context/GoogleDriveContext';
import VibrantChecklistBackground from '../components/common/VibrantChecklistBackground';
import WorkboxPanel from '../components/workbox/WorkboxPanel';
import WorkboxTrigger from '../components/workbox/WorkboxTrigger';

// --- LAZY LOAD PAGES ---
const Dashboard = lazy(() => import('../components/Dashboard'));
const CalendarView = lazy(() => import('../components/CalendarView'));
const TeamView = lazy(() => import('../components/TeamView'));
const TeamChat = lazy(() => import('../components/TeamChat'));
const ScriptHubView = lazy(() => import('../components/script/ScriptHubView'));
const MeetingView = lazy(() => import('../components/MeetingView'));
const DutyView = lazy(() => import('../components/DutyView'));
const QualityGateView = lazy(() => import('../components/QualityGateView'));
const KPIView = lazy(() => import('../components/KPIView'));
const FeedbackView = lazy(() => import('../components/feedback/FeedbackView'));
const ContentStock = lazy(() => import('../components/checklist/ContentStock'));
const ShootChecklist = lazy(() => import('../components/ShootChecklist'));
const WeeklyQuestBoard = lazy(() => import('../components/WeeklyQuestBoard'));
const GoalView = lazy(() => import('../components/GoalView'));
const WikiView = lazy(() => import('../components/WikiView'));
const LeaderboardView = lazy(() => import('../components/LeaderboardView')); 
const NexusHub = lazy(() => import('../components/nexus/NexusHub'));
const RoadmapView = lazy(() => import('../components/roadmap/RoadmapView'));
const ContentAnalyticsView = lazy(() => import('../components/analytics/ContentAnalyticsView'));

// --- NEW MODULE BRIDGES (Lazy Loaded) ---
const AttendanceRouter = lazy(() => import('./AttendanceRouter'));
const FinanceRouter = lazy(() => import('./FinanceRouter'));
const AdminRouter = lazy(() => import('./AdminRouter'));
const CommandPalette = lazy(() => import('../components/ui/CommandPalette')); 

// --- LAZY LOAD MODALS ---
const TaskModal = lazy(() => import('../components/TaskModal'));
const ProfileEditModal = lazy(() => import('../components/ProfileEditModal'));
const NotificationSettingsModal = lazy(() => import('../components/NotificationSettingsModal'));
import TaskModalSkeleton from '../components/task/TaskModalSkeleton';

// Loading Fallback
const PageLoader = () => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="flex-1 w-full flex flex-col items-center justify-center text-indigo-300 gap-6 min-h-[70vh] py-20"
  >
    <div className="relative">
        <Loader2 className="w-16 h-16 animate-spin text-indigo-500" />
        <div className="absolute inset-0 blur-2xl bg-indigo-500/20 animate-pulse rounded-full" />
    </div>
    <div className="flex flex-col items-center gap-2">
        <span className="text-lg font-black font-kanit uppercase tracking-[0.3em] text-indigo-400/80 animate-pulse">กำลังโหลดข้อมูล...</span>
        <div className="w-12 h-1 bg-indigo-500/20 rounded-full overflow-hidden">
            <motion.div 
                className="h-full bg-indigo-500"
                animate={{ x: [-48, 48] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            />
        </div>
    </div>
  </motion.div>
);

interface AppRouterProps {
    user: any; // Session User from Supabase Auth
}

const AppRouterInner: React.FC<AppRouterProps> = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // --- STABILITY GUARD: Memory for the last known valid view ---
  const lastValidView = useRef<ViewMode>((searchParams.get('view') as ViewMode) || 'DASHBOARD');

  // Derived currentView from URL - Single Source of Truth with Stability Fallback
  const currentView = useMemo(() => {
    const v = searchParams.get('view') as ViewMode;
    
    if (v) {
        lastValidView.current = v;
        return v;
    }

    // RACE CONDITION PROTECTION:
    // If we are at root ('/') and have OTHER query params, but 'view' is missing,
    // it's almost certainly a race condition during setSearchParams inside a component.
    // In this case, we fallback to the last valid view instead of jumping to DASHBOARD.
    if (location.pathname === '/' && searchParams.toString().length > 0) {
        return lastValidView.current;
    }

    return 'DASHBOARD';
  }, [searchParams, location.pathname]);

  // Sync URL with default view - Enhanced stability
  useEffect(() => {
    const view = searchParams.get('view');
    // If we are at root and no view is set, set to DASHBOARD
    if (!view && location.pathname === '/') {
      setSearchParams(next => {
        // Double check inside the update to handle race conditions in StrictMode
        if (next.has('view')) return next;
        next.set('view', 'DASHBOARD');
        return next;
      }, { replace: true });
    }
  }, [location.pathname, searchParams, setSearchParams]);

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isNotifSettingsOpen, setIsNotifSettingsOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false); 
  const [isWorkboxOpen, setIsWorkboxOpen] = useState(false);

  const handleLogout = async () => {
      await supabase.auth.signOut();
  };

  // --- NAVIGATION HANDLER (Sync with URL - Preserving existing params) ---
  const handleNavigate = useCallback((view: ViewMode) => {
      setSearchParams(prev => {
          const next = new URLSearchParams(prev);
          
          // 1. Set the new view
          next.set('view', view);

          // 2. Cleanup Logic: Remove view-specific params when leaving that view
          
          // Special case: If navigating TO ContentStock, ensure its params are NOT cleared
          // and if moving AWAY, then clear them.
          if (view !== 'ContentStock') {
              next.delete('stockMode');
              next.delete('stockTab');
          }

          // If we move away from SCRIPT_HUB, clear its sub-params
          if (view !== 'SCRIPT_HUB') {
              next.delete('scriptId');
              next.delete('q');
              next.delete('deep');
          }

          return next;
      }, { replace: true });
  }, [setSearchParams]);

  // --- AUTH HOOK ---
  const { currentUserProfile, fetchProfile, updateProfile } = useAuth(user);

  // --- MAIN LOGIC HOOK (Orchestrator) ---
  const {
    isLoading: isManagerLoading,
    isTaskFetching,
    allUsers,
    activeUsers,
    tasks,
    channels,
    masterOptions,
    
    checklistPresets,
    activeChecklistItems,
    activePresetId,
    activePresetName,
    
    isModalOpen, editingTask, initialViewMode, taskStack, selectedDate, notificationSettings, lockedTaskType,
    setIsModalOpen, setEditingTask,
    
    handleAddTask, handleEditTask, handleSelectDate, closeModal,
    handleSaveTask, handleDeleteTask, handleDelayTask,
    checkAndExpandRange, fetchAllTasks,
    
    handleAddChannel, handleUpdateChannel, handleDeleteChannel,
    updateNotificationSettings,
    
    handleToggleChecklist, handleAddChecklistItem, handleDeleteChecklistItem, handleResetChecklist,
    handleLoadPreset, handleAddPreset, handleDeletePreset,
    
    approveMember, removeMember, toggleUserStatus, adjustStatsLocally,

    quests, handleAddQuest, handleDeleteQuest, updateManualProgress, updateQuest,
    fetchTaskById
  } = useTaskManager(user, currentUserProfile, fetchProfile, updateProfile);

  const { showToast } = useToast();

  // --- TASK OPENER (Robust ID Resolution) ---
  const handleOpenTaskById = useCallback(async (taskOrId: any, currentViewMode?: string) => {
    if (!taskOrId) return;

    let finalTask: Task | undefined;
    
    // 1. Resolve from input or local state
    if (typeof taskOrId === 'string') {
        finalTask = tasks.find(t => t.id === taskOrId);
    } else if (taskOrId.title && taskOrId.type && taskOrId.status) {
        // It's already a full Task object
        finalTask = taskOrId as Task;
    } else if (taskOrId.id) {
        // It's a partial object (likely from TaskDetail's Linked Content)
        finalTask = tasks.find(t => t.id === taskOrId.id);
    }

    // 2. Fetch from Supabase if not found locally
    if (!finalTask && taskOrId) {
        const targetId = typeof taskOrId === 'string' ? taskOrId : taskOrId.id;
        const targetType = (typeof taskOrId !== 'string' && taskOrId.type) ? taskOrId.type : 'CONTENT'; // Default to CONTENT if unsure
        
        if (targetId) {
            showToast('กำลังดึงข้อมูลโครงการ...', 'info');
            const fetchedTask = await fetchTaskById(targetId, targetType);
            if (fetchedTask) {
                finalTask = fetchedTask;
            }
        }
    }

    if (finalTask) {
        handleEditTask(finalTask, currentViewMode);
    } else {
        console.warn("[AppRouter] Task not found for resolution:", taskOrId);
        showToast('ไม่พบข้อมูลโครงการที่ต้องการเปิด', 'error');
    }
  }, [tasks, handleEditTask, fetchTaskById, showToast]);

  // --- WORKBOX CONTEXT ---
  const { items: workboxItems, addItem: addToWorkbox, setIsDragging } = useWorkboxContext();

  // --- SUB-HOOKS ---
  const { notifications, unreadCount: sysUnread, dismissNotification, markNotificationAsRead, markAllAsRead, markAsViewed } = useSystemNotifications(tasks, currentUserProfile, fetchProfile);
  const { unreadCount: chatUnread } = useChatUnread(currentUserProfile);
  const { requests: leaveRequests, approveRequest, rejectRequest } = useLeaveRequests(
    currentUserProfile, 
    { all: currentUserProfile?.role === 'ADMIN' }
  );
  
  // --- BACKGROUND SERVICES ---
  useAutoJudge(currentUserProfile); 
  useGameEventListener(currentUserProfile, fetchProfile); 

  // --- GLOBAL KEYBOARD SHORTCUTS REMOVED (Moved to ShortcutManager) ---

  // --- DETECT LOCK NOTIFICATION ---
  const negligenceNotification = notifications.find(n => n.type === 'NEGLIGENCE' && !n.isRead);
  const deathWarningNotification = notifications.find(n => n.type === 'DEATH_WARNING' && !n.isRead);
  const resurrectionNotification = notifications.find(n => n.type === 'RESURRECTION' && !n.isRead);

  const handleToggleNotification = () => {
      // Changed: Do NOT mark as viewed immediately upon opening
      // Let the user read it first. Marking happens on Close or explicit 'Read All'
      setIsNotificationOpen(!isNotificationOpen);
  };

  // Handler for Popover Close
  const handleCloseNotification = () => {
      setIsNotificationOpen(false);
      markAsViewed(); // Mark read when closing
  };
  
  // Handler for Lock Modal Acknowledge
  const handleAcknowledgeLock = async (notifId: string) => {
      await markNotificationAsRead(notifId); // Remove/Mark Read
      // Trigger refresh if needed, usually handled by realtime
  };

  const handleForceLogout = async () => {
      try {
          await supabase.auth.signOut();
      } catch (error) {
          console.warn("Logout error:", error);
      } finally {
          localStorage.clear(); 
          navigate('/');
      }
  };

  if (isManagerLoading) {
     return (
        <div className="flex h-screen items-center justify-center bg-slate-50 flex-col">
            <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mb-4" />
            <p className="text-gray-500 font-medium animate-pulse">กำลังเชื่อมต่อฐานข้อมูล...</p>
        </div>
     );
  }

  if (!currentUserProfile) {
     return <div className="p-10 text-center text-gray-500">ไม่พบข้อมูลโปรไฟล์ผู้ใช้ (User Profile Not Found)</div>;
  }
  
  if (!currentUserProfile.isApproved) {
    return <PendingApprovalScreen user={currentUserProfile} onLogout={handleForceLogout} />;
  }

  if (currentUserProfile.status === 'DEATH') {
    return <DeathScreen user={currentUserProfile} onLogout={handleForceLogout} />;
  }

  if (!currentUserProfile.isActive) {
    return <InactiveScreen user={currentUserProfile} onLogout={handleForceLogout} />;
  }

  const renderContent = () => {
    return (
      <Suspense fallback={<PageLoader />}>
        {(() => {
          switch (currentView) {
            case 'DASHBOARD':
              return (
                <Dashboard
                  tasks={tasks}
                  channels={channels}
                  users={activeUsers}
                  currentUser={currentUserProfile}
                  onEditTask={handleEditTask}
                  onNavigateToCalendar={() => handleNavigate('CALENDAR')}
                  onNavigate={(view) => handleNavigate(view)} 
                  onOpenSettings={() => setIsNotifSettingsOpen(true)}
                  onOpenNotifications={handleToggleNotification}
                  unreadCount={sysUnread}
                  onEditProfile={() => setIsProfileModalOpen(true)}
                  masterOptions={masterOptions}
                  onFetchAllData={fetchAllTasks}
                  onRefreshProfile={fetchProfile}
                  isFetching={isTaskFetching}
                />
              );
            case 'CALENDAR':
              return (
                <CalendarView
                  tasks={tasks}
                  channels={channels}
                  users={activeUsers}
                  currentUser={currentUserProfile}
                  masterOptions={masterOptions}
                  onSelectTask={handleEditTask}
                  onSelectDate={handleSelectDate}
                  onMoveTask={handleSaveTask}
                  onDelayTask={(tid, date, reason) => handleDelayTask(tid, date, reason, currentUserProfile.id)}
                  onOpenSettings={() => setIsNotifSettingsOpen(true)}
                  onOpenNotifications={handleToggleNotification}
                  unreadCount={sysUnread}
                  onAddTask={(status, type) => { 
                      const t = { status, type: type || 'TASK' }; 
                      // @ts-ignore
                      handleSaveTask(t); 
                  }}
                  onUpdateStatus={(t, s) => handleSaveTask({ ...t, status: s })}
                  onRangeChange={checkAndExpandRange}
                  isFetching={isTaskFetching}
                  onToggleWorkbox={() => setIsWorkboxOpen(!isWorkboxOpen)}
                  isWorkboxOpen={isWorkboxOpen}
                />
              );
            case 'TEAM':
              return (
                <TeamView 
                  tasks={tasks}
                  users={allUsers}
                  channels={channels}
                  currentUser={currentUserProfile}
                  onEditTask={handleEditTask}
                  onApproveMember={approveMember}
                  onRemoveMember={removeMember}
                  onToggleStatus={toggleUserStatus}
                  onAdjustStats={adjustStatsLocally}
                  onOpenSettings={() => setIsNotifSettingsOpen(true)}
                  onAddTask={(type) => handleAddTask(type)}
                  onMoveTask={(t) => handleSaveTask(t)}
                />
              );
            case 'CHAT':
              return (
                  <TeamChat 
                      currentUser={currentUserProfile}
                      allUsers={activeUsers}
                      onAddTask={handleSaveTask}
                  />
              );
            case 'ContentStock':
              return (
                <ContentStock
                  tasks={tasks}
                  channels={channels}
                  users={activeUsers}
                  masterOptions={masterOptions}
                  onSchedule={handleEditTask}
                  onEdit={handleEditTask}
                  onAdd={() => handleAddTask('CONTENT')}
                  onOpenSettings={() => setIsNotifSettingsOpen(true)}
                  onAddToWorkbox={(task) => addToWorkbox({ title: task.title, content_id: task.id, type: 'CONTENT' })}
                  onEditScript={(id) => {
                      // Consolidate into a single URL update to prevent flickering/race conditions
                      setSearchParams(prev => {
                          const next = new URLSearchParams(prev);
                          next.set('view', 'SCRIPT_HUB');
                          next.set('scriptId', id);
                          next.set('origin', 'SHOOT_QUEUE');
                          return next;
                      }, { replace: true });
                  }}
                />
              );
            case 'CHECKLIST':
              return (
                <VibrantChecklistBackground className="pb-20">
                  <ShootChecklist 
                      items={activeChecklistItems}
                      onToggle={handleToggleChecklist}
                      onAdd={handleAddChecklistItem}
                      onDelete={handleDeleteChecklistItem}
                      onReset={handleResetChecklist}
                      presets={checklistPresets}
                      activePresetId={activePresetId}
                      activePresetName={activePresetName}
                      onLoadPreset={handleLoadPreset}
                      onAddPreset={handleAddPreset}
                      onDeletePreset={handleDeletePreset}
                      onOpenSettings={() => setIsNotifSettingsOpen(true)}
                      masterOptions={masterOptions}
                  />
                </VibrantChecklistBackground>
              );
            case 'CHANNELS':
            case 'MASTER_DATA':
            case 'SYSTEM_GUIDE':
            case 'ASSETS':
                return (
                    <AdminRouter 
                        currentView={currentView}
                        tasks={tasks}
                        channels={channels}
                        users={activeUsers}
                        masterOptions={masterOptions}
                        onAddChannel={handleAddChannel}
                        onUpdateChannel={handleUpdateChannel}
                        onDeleteChannel={handleDeleteChannel}
                        onOpenSettings={() => setIsNotifSettingsOpen(true)}
                    />
                );
            case 'SCRIPT_HUB':
                return (
                    <ScriptHubView 
                        currentUser={currentUserProfile}
                        users={allUsers}
                    />
                );
            case 'MEETINGS':
                return (
                    <MeetingView 
                        users={activeUsers} 
                        currentUser={currentUserProfile}
                        tasks={tasks} 
                        masterOptions={masterOptions}
                    />
                );
            case 'DUTY': 
                return (
                    <DutyView 
                        users={activeUsers}
                        currentUser={currentUserProfile}
                    />
                );
            case 'QUALITY_GATE':
                return (
                    <QualityGateView 
                        channels={channels}
                        users={activeUsers}
                        masterOptions={masterOptions}
                        onOpenTask={handleOpenTaskById}
                        currentUser={currentUserProfile}
                        tasks={tasks} // Pass tasks here!
                    />
                );
            case 'KPI':
                return (
                    <KPIView 
                        users={allUsers}
                        currentUser={currentUserProfile}
                    />
                );
            case 'FEEDBACK':
                return <FeedbackView currentUser={currentUserProfile} users={allUsers} />;
            case 'WEEKLY':
                return (
                    <WeeklyQuestBoard 
                        tasks={tasks}
                        channels={channels}
                        quests={quests}
                        masterOptions={masterOptions}
                        onAddQuest={handleAddQuest}
                        onDeleteQuest={handleDeleteQuest}
                        onOpenSettings={() => setIsNotifSettingsOpen(true)}
                        onUpdateProgress={updateManualProgress}
                        onUpdateQuest={updateQuest}
                    />
                );
            case 'GOALS':
                return (
                    <GoalView 
                        channels={channels}
                        users={activeUsers}
                        currentUser={currentUserProfile}
                    />
                );
            case 'WIKI':
                return <WikiView currentUser={currentUserProfile} />;
                
            case 'LEADERBOARD':
                return <LeaderboardView users={activeUsers} currentUser={currentUserProfile} />;

            case 'ATTENDANCE':
                return <AttendanceRouter currentUser={currentUserProfile} users={activeUsers} />;
            case 'FINANCE':
                return <FinanceRouter currentUser={currentUserProfile} users={activeUsers} />;

            case 'NEXUS':
                return <NexusHub currentUser={currentUserProfile} />;

            case 'ROADMAP':
                return <RoadmapView />;

            case 'ANALYTICS':
                return <ContentAnalyticsView />;

            default:
              return <div className="p-10 text-center text-gray-500">เร็วๆ นี้... (Coming Soon)</div>;
          }
        })()}
      </Suspense>
    );
  };

  return (
    <AppShell
          currentUser={currentUserProfile}
          currentView={currentView}
          onNavigate={handleNavigate}
          onLogout={handleForceLogout}
          onEditProfile={() => setIsProfileModalOpen(true)}
          onAddTask={handleAddTask}
          onOpenTask={handleOpenTaskById}
          chatUnreadCount={chatUnread}
          systemUnreadCount={sysUnread}
          isNotificationOpen={isNotificationOpen}
          onToggleNotification={handleToggleNotification}
          tasks={tasks}
          allUsers={activeUsers}
      >
          <ShortcutManager 
              onNavigate={handleNavigate}
              onAddTask={() => handleAddTask('TASK')}
              onOpenProfile={() => setIsProfileModalOpen(true)}
              onOpenCommandPalette={() => setIsCommandPaletteOpen(prev => !prev)}
          />
  
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ 
                duration: 0.3, 
                ease: "easeOut"
              }}
              className="flex flex-col min-h-full w-full"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
  
          {/* --- WORKBOX TRIGGER & PANEL --- */}
          <WorkboxTrigger 
              onClick={() => setIsWorkboxOpen(true)} 
              itemCount={workboxItems.length} 
              onDrop={(data) => addToWorkbox(data)}
          />
          <WorkboxPanel 
              isOpen={isWorkboxOpen} 
              onClose={() => setIsWorkboxOpen(false)} 
              currentUser={currentUserProfile} 
          />
          
          {/* --- SPECIAL LOCK MODAL --- */}
          <NegligenceLockModal 
              notification={negligenceNotification} 
              onAcknowledge={handleAcknowledgeLock} 
          />

          <DeathLockModal 
              notification={deathWarningNotification}
              onAcknowledge={handleAcknowledgeLock}
              onLogout={handleForceLogout}
          />

          <ResurrectionModal 
              notification={resurrectionNotification}
              onAcknowledge={handleAcknowledgeLock}
          />
  
          {/* --- GLOBAL MODALS --- */}
          <Suspense fallback={<TaskModalSkeleton />}>
              <AnimatePresence mode="wait">
                  {isModalOpen && (
                      <TaskModal
                          isOpen={isModalOpen}
                          onClose={closeModal}
                          onSave={(t) => handleSaveTask(t)}
                          onUpdate={(t) => handleSaveTask(t)} 
                          onDelete={handleDeleteTask}
                          initialData={editingTask}
                          selectedDate={selectedDate}
                          channels={channels}
                          users={activeUsers}
                          lockedType={lockedTaskType}
                          masterOptions={masterOptions}
                          currentUser={currentUserProfile}
                          projects={tasks.filter(t => t.type === 'CONTENT')} 
                          onOpenTask={handleOpenTaskById}
                          hasHistory={taskStack.length > 0}
                          initialViewMode={initialViewMode}
                      />
                  )}
              </AnimatePresence>

              <AnimatePresence mode="wait">
                  {isProfileModalOpen && (
                      <ProfileEditModal 
                          isOpen={isProfileModalOpen}
                          onClose={() => setIsProfileModalOpen(false)}
                          user={currentUserProfile}
                          onSave={updateProfile}
                      />
                  )}
              </AnimatePresence>

              <AnimatePresence mode="wait">
                  {isNotifSettingsOpen && (
                      <NotificationSettingsModal 
                          isOpen={isNotifSettingsOpen}
                          onClose={() => setIsNotifSettingsOpen(false)}
                          preferences={notificationSettings}
                          onUpdate={updateNotificationSettings}
                      />
                  )}
              </AnimatePresence>
          </Suspense>
          
          <NotificationPopover 
              isOpen={isNotificationOpen}
              onClose={handleCloseNotification} // Changed to new handler
              notifications={notifications}
              tasks={tasks}
              onOpenTask={handleOpenTaskById}
              onOpenSettings={() => setIsNotifSettingsOpen(true)}
              onDismiss={dismissNotification}
              onMarkRead={markNotificationAsRead}
              onMarkAllRead={markAllAsRead}
              onNavigate={handleNavigate} 
              onApproveLeave={approveRequest}
              onRejectLeave={rejectRequest}
              leaveRequests={leaveRequests}
          />
  
      </AppShell>
  );
};

import { MasterDataProvider } from '../context/MasterDataContext';

const AppRouter: React.FC<{ user: any }> = ({ user }) => {
  return <AppRouterInner user={user} />;
};

export default AppRouter;
