
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
import { useTaskManager } from '../hooks/useTaskManager';
import { useAuth } from '../hooks/useAuth';
import { useSystemNotifications } from '../hooks/useSystemNotifications';
import { useChatUnread } from '../hooks/useChatUnread';
import { useAutoJudge } from '../hooks/useAutoJudge'; 
import { useLeaveRequests } from '../hooks/useLeaveRequests';
import { useGameEventListener } from '../hooks/useGameEventListener'; 
import { useToast } from '../context/ToastContext';
import ShortcutManager from '../components/common/ShortcutManager';
import { Loader2 } from 'lucide-react';
import { useWorkboxContext } from '../context/WorkboxContext';
import WorkboxPanel from '../components/workbox/WorkboxPanel';
import WorkboxTrigger from '../components/workbox/WorkboxTrigger';

// --- REFRACTORED MODULE REGISTRIES ---
import { ViewRouteRegistry } from './ViewRouteRegistry';
import { GlobalModalRegistry } from './GlobalModalRegistry';

// --- LAZY LOAD ULTIMATE SCREEN & PALETTE ---
const UltimateWorkroomView = lazy(() => import('../components/dashboard/member/UltimateWorkroomView'));
const CommandPalette = lazy(() => import('../components/ui/CommandPalette')); 

import { WarpGateOverlay } from '../components/dashboard/member/ultimate/WarpGateOverlay';

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

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isNotifSettingsOpen, setIsNotifSettingsOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false); 
  const [isWorkboxOpen, setIsWorkboxOpen] = useState(false);

  const handleLogout = async () => {
      await supabase.auth.signOut();
  };

  // --- STATE: GLOBAL COSMIC PORTAL WARP ANIMATION ---
  const [globalWarpStage, setGlobalWarpStage] = useState<'IDLE' | 'WARPING_IN' | 'WARPING_OUT'>('IDLE');
  const [warpTargetView, setWarpTargetView] = useState<ViewMode | null>(null);

  // Play a highly immersive deep interstellar sound when warp gates open inside browser using Web Audio context
  const playWarpSound = useCallback(() => {
      try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (!AudioContextClass) return;
          const ctx = new AudioContextClass();
          const now = ctx.currentTime;

          // Low rumble bass sound
          const oscBass = ctx.createOscillator();
          const oscTreble = ctx.createOscillator();
          const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
          const filter = ctx.createBiquadFilter();
          const gainNode = ctx.createGain();

          oscBass.type = 'sawtooth';
          oscBass.frequency.setValueAtTime(65, now);
          oscBass.frequency.exponentialRampToValueAtTime(320, now + 1.2);

          oscTreble.type = 'sine';
          oscTreble.frequency.setValueAtTime(330, now);
          oscTreble.frequency.exponentialRampToValueAtTime(1600, now + 0.95);

          filter.type = 'lowpass';
          filter.Q.setValueAtTime(12, now);
          filter.frequency.setValueAtTime(150, now);
          filter.frequency.exponentialRampToValueAtTime(2400, now + 0.8);

          gainNode.gain.setValueAtTime(0.04, now);
          gainNode.gain.linearRampToValueAtTime(0.12, now + 0.45);
          gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);

          oscBass.connect(filter);
          oscTreble.connect(filter);

          if (panner) {
              panner.pan.setValueAtTime(-1, now);
              panner.pan.linearRampToValueAtTime(1, now + 1.2);
              filter.connect(panner);
              panner.connect(gainNode);
          } else {
              filter.connect(gainNode);
          }

          gainNode.connect(ctx.destination);

          oscBass.start();
          oscTreble.start();
          oscBass.stop(now + 1.6);
          oscTreble.stop(now + 1.6);
      } catch (err) {
          console.warn("Warp gate audio failed:", err);
      }
  }, []);

  // --- NAVIGATION HANDLER (Sync with URL - Enhanced with fluid cosmic portals) ---
  const handleNavigate = useCallback((view: ViewMode) => {
      const isDimensionJump = (currentView === 'ULTIMATE_WORKROOM') || (view === 'ULTIMATE_WORKROOM');

      if (isDimensionJump && globalWarpStage === 'IDLE') {
          // Play the sound of opening wormholes
          playWarpSound();
          setWarpTargetView(view);
          setGlobalWarpStage('WARPING_IN');

          // Change page in background at peak opacity (850ms)
          setTimeout(() => {
              setSearchParams((prev: any) => {
                  const next = new URLSearchParams(prev);
                  next.set('view', view);
                  
                  if (view !== 'ContentStock') {
                      next.delete('stockMode');
                      next.delete('stockTab');
                  }
                  if (view !== 'SCRIPT_HUB') {
                      next.delete('scriptId');
                      next.delete('q');
                      next.delete('deep');
                  }
                  return next;
              }, { replace: true });
              
              setGlobalWarpStage('WARPING_OUT');
              setTimeout(() => {
                  setGlobalWarpStage('IDLE');
                  setWarpTargetView(null);
              }, 1100);
          }, 950);
      } else {
          // Normal instant page switches for efficiency
          setSearchParams((prev: any) => {
              const next = new URLSearchParams(prev);
              next.set('view', view);
              
              if (view !== 'ContentStock') {
                  next.delete('stockMode');
                  next.delete('stockTab');
              }
              if (view !== 'SCRIPT_HUB') {
                  next.delete('scriptId');
                  next.delete('q');
                  next.delete('deep');
              }
              return next;
          }, { replace: true });
      }
  }, [currentView, globalWarpStage, playWarpSound, setSearchParams]);

  // --- AUTH HOOK ---
  const { currentUserProfile, fetchProfile, updateProfile } = useAuth(user);

  // Sync URL with default view - Enhanced stability with custom member redirect
  useEffect(() => {
    const view = searchParams.get('view');
    // If we are at root and no view is set, determine default view for members
    if (!view && location.pathname === '/') {
      setSearchParams((next: any) => {
        // Double check inside the update to handle race conditions in StrictMode
        if (next.has('view')) return next;
        
        let targetView: ViewMode = 'DASHBOARD';
        if (currentUserProfile && currentUserProfile.role === 'MEMBER' && currentUserProfile.status === 'ACTIVE') {
          if (currentUserProfile.ultimateWorkroomEnabled !== false) {
            targetView = 'ULTIMATE_WORKROOM';
          }
        }
        next.set('view', targetView);
        return next;
      }, { replace: true });
    }
  }, [location.pathname, searchParams, setSearchParams, currentUserProfile]);

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

  const isUltimateRoom = currentView === 'ULTIMATE_WORKROOM';

  return (
    <>
      <AnimatePresence mode="wait" initial={false}>
        {isUltimateRoom ? (
          <motion.div
            key="ultimate-workroom-screen"
            initial={{ opacity: 0, scale: 0.94, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 1.06, filter: 'blur(15px)' }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="min-h-screen w-full bg-[#0e101a] overflow-hidden"
          >
            <Suspense fallback={<PageLoader />}>
              <UltimateWorkroomView
                tasks={tasks}
                masterOptions={masterOptions}
                users={activeUsers}
                currentUser={currentUserProfile}
                onEditTask={handleEditTask}
                onUpdateTask={handleSaveTask}
                onDeleteTask={handleDeleteTask}
                onNavigateBack={() => handleNavigate('DASHBOARD')}
                onRefreshProfile={fetchProfile}
                isFetching={isTaskFetching}
              />
            </Suspense>
          </motion.div>
        ) : (
          <motion.div
            key="standard-appshell-screen"
            initial={{ opacity: 0, scale: 1.06, filter: 'blur(12px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.94, filter: 'blur(12px)' }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="min-h-screen w-full"
          >
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
                      <ViewRouteRegistry
                        currentView={currentView}
                        currentUserProfile={currentUserProfile}
                        users={allUsers}
                        activeUsers={activeUsers}
                        allUsers={allUsers}
                        tasks={tasks}
                        channels={channels}
                        quests={quests}
                        masterOptions={masterOptions}
                        isTaskFetching={isTaskFetching}
                        sysUnread={sysUnread}
                        activeChecklistItems={activeChecklistItems}
                        checklistPresets={checklistPresets}
                        activePresetId={activePresetId}
                        activePresetName={activePresetName}
                        isWorkboxOpen={isWorkboxOpen}
                        setIsWorkboxOpen={setIsWorkboxOpen}
                        addToWorkbox={addToWorkbox}
                        setIsNotifSettingsOpen={setIsNotifSettingsOpen}
                        setIsProfileModalOpen={setIsProfileModalOpen}
                        handleToggleNotification={handleToggleNotification}
                        setSearchParams={setSearchParams}
                        handleNavigate={handleNavigate}
                        handleEditTask={handleEditTask}
                        handleSaveTask={handleSaveTask}
                        handleDeleteTask={handleDeleteTask}
                        handleDelayTask={handleDelayTask}
                        handleSelectDate={handleSelectDate}
                        handleAddTask={handleAddTask}
                        approveMember={approveMember}
                        removeMember={removeMember}
                        toggleUserStatus={toggleUserStatus}
                        adjustStatsLocally={adjustStatsLocally}
                        handleToggleChecklist={handleToggleChecklist}
                        handleAddChecklistItem={handleAddChecklistItem}
                        handleDeleteChecklistItem={handleDeleteChecklistItem}
                        handleResetChecklist={handleResetChecklist}
                        handleLoadPreset={handleLoadPreset}
                        handleAddPreset={handleAddPreset}
                        handleDeletePreset={handleDeletePreset}
                        handleAddChannel={handleAddChannel}
                        handleUpdateChannel={handleUpdateChannel}
                        handleDeleteChannel={handleDeleteChannel}
                        handleOpenTaskById={handleOpenTaskById}
                        handleAddQuest={handleAddQuest}
                        handleDeleteQuest={handleDeleteQuest}
                        updateManualProgress={updateManualProgress}
                        updateQuest={updateQuest}
                        fetchAllTasks={fetchAllTasks}
                        fetchProfile={fetchProfile}
                        PageLoader={PageLoader}
                        checkAndExpandRange={checkAndExpandRange}
                      />
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
                  
              </AppShell>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- GLOBAL MODAL REGISTRY --- */}
      <GlobalModalRegistry
        negligenceNotification={negligenceNotification}
        deathWarningNotification={deathWarningNotification}
        resurrectionNotification={resurrectionNotification}
        handleAcknowledgeLock={handleAcknowledgeLock}
        handleForceLogout={handleForceLogout}
        isModalOpen={isModalOpen}
        closeModal={closeModal}
        handleSaveTask={handleSaveTask}
        handleDeleteTask={handleDeleteTask}
        editingTask={editingTask}
        selectedDate={selectedDate}
        channels={channels}
        activeUsers={activeUsers}
        lockedTaskType={lockedTaskType}
        masterOptions={masterOptions}
        currentUserProfile={currentUserProfile}
        tasks={tasks}
        handleOpenTaskById={handleOpenTaskById}
        taskStack={taskStack}
        initialViewMode={initialViewMode}
        isProfileModalOpen={isProfileModalOpen}
        setIsProfileModalOpen={setIsProfileModalOpen}
        updateProfile={updateProfile}
        isNotifSettingsOpen={isNotifSettingsOpen}
        setIsNotifSettingsOpen={setIsNotifSettingsOpen}
        notificationSettings={notificationSettings}
        updateNotificationSettings={updateNotificationSettings}
        isNotificationOpen={isNotificationOpen}
        handleCloseNotification={handleCloseNotification}
        notifications={notifications}
        dismissNotification={dismissNotification}
        markNotificationAsRead={markNotificationAsRead}
        markAllAsRead={markAllAsRead}
        handleNavigate={handleNavigate}
        approveRequest={approveRequest}
        rejectRequest={rejectRequest}
        leaveRequests={leaveRequests}
      />

      {/* --- GLOBAL HIGH-FIDELITY DIMENSIONAL WARP GATE OVERLAY --- */}
      <WarpGateOverlay globalWarpStage={globalWarpStage} warpTargetView={warpTargetView} />
    </>
  );
};

import { MasterDataProvider } from '../context/MasterDataContext';

const AppRouter: React.FC<{ user: any }> = ({ user }) => {
  return <AppRouterInner user={user} />;
};

export default AppRouter;
