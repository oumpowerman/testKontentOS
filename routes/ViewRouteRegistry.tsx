import React, { Suspense, lazy } from 'react';
import { ViewMode, Task, Channel, TaskType, WeeklyQuest } from '../types';
import VibrantChecklistBackground from '../components/common/VibrantChecklistBackground';

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
const ContentStock = lazy(() => import('../components/content-stock/ContentStock'));
const ShootChecklist = lazy(() => import('../components/shoot-checklist/ShootChecklist'));
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

interface ViewRouteRegistryProps {
  currentView: ViewMode;
  currentUserProfile: any;
  users: any[];
  activeUsers: any[];
  allUsers: any[];
  tasks: Task[];
  channels: any[];
  quests: any[];
  masterOptions: any;
  isTaskFetching: boolean;
  sysUnread: number;

  // Checklist State
  activeChecklistItems: any[];
  checklistPresets: any[];
  activePresetId: string | null;
  activePresetName: string | null;

  // Workbox State
  isWorkboxOpen: boolean;
  setIsWorkboxOpen: (open: boolean) => void;
  addToWorkbox: (item: any) => void;

  // Modal Controllers
  setIsNotifSettingsOpen: (open: boolean) => void;
  setIsProfileModalOpen: (open: boolean) => void;
  handleToggleNotification: () => void;

  // URL State Controllers
  setSearchParams: any;

  // Action Handlers
  handleNavigate: (view: ViewMode) => void;
  handleEditTask: (task: any, currentViewMode?: string) => void;
  handleSaveTask: (task: any) => void;
  handleDeleteTask: (task: any) => void;
  handleDelayTask: (taskId: string, targetDate: any, reason: string, profileId: string) => void;
  handleSelectDate: (date: any) => void;
  handleAddTask: (type?: TaskType) => void;
  approveMember: (id: string) => void;
  removeMember: (id: string) => void;
  toggleUserStatus: (id: string, active: boolean) => void;
  adjustStatsLocally: (userId: string, adjustments: { hp?: number; xp?: number; points?: number }) => void;

  handleToggleChecklist: (id: string, currentStatus: boolean) => Promise<void>;
  handleAddChecklistItem: (text: string, categoryId: string) => Promise<void>;
  handleDeleteChecklistItem: (id: string) => void;
  handleResetChecklist: () => void;
  handleLoadPreset: (presetId: string) => void;
  handleAddPreset: (name: string) => void;
  handleDeletePreset: (presetId: string) => void;

  handleAddChannel: (channel: Channel, file?: File) => Promise<boolean>;
  handleUpdateChannel: (channel: Channel, file?: File) => Promise<boolean>;
  handleDeleteChannel: (channelId: string) => Promise<boolean>;

  handleOpenTaskById: (taskOrId: any, currentViewMode?: string) => void;

  handleAddQuest: (quest: any) => void;
  handleDeleteQuest: (questId: string) => void;
  updateManualProgress: (questId: string, progress: number) => void;
  updateQuest: (id: string, updates: Partial<WeeklyQuest>) => Promise<void>;

  fetchAllTasks: () => void;
  fetchProfile: () => Promise<any>;
  PageLoader: React.ComponentType;
  checkAndExpandRange: (range: any) => void;
}

export const ViewRouteRegistry: React.FC<ViewRouteRegistryProps> = ({
  currentView,
  currentUserProfile,
  users,
  activeUsers,
  allUsers,
  tasks,
  channels,
  quests,
  masterOptions,
  isTaskFetching,
  sysUnread,

  activeChecklistItems,
  checklistPresets,
  activePresetId,
  activePresetName,

  isWorkboxOpen,
  setIsWorkboxOpen,
  addToWorkbox,

  setIsNotifSettingsOpen,
  setIsProfileModalOpen,
  handleToggleNotification,

  setSearchParams,

  handleNavigate,
  handleEditTask,
  handleSaveTask,
  handleDeleteTask,
  handleDelayTask,
  handleSelectDate,
  handleAddTask,
  approveMember,
  removeMember,
  toggleUserStatus,
  adjustStatsLocally,

  handleToggleChecklist,
  handleAddChecklistItem,
  handleDeleteChecklistItem,
  handleResetChecklist,
  handleLoadPreset,
  handleAddPreset,
  handleDeletePreset,

  handleAddChannel,
  handleUpdateChannel,
  handleDeleteChannel,

  handleOpenTaskById,

  handleAddQuest,
  handleDeleteQuest,
  updateManualProgress,
  updateQuest,

  fetchAllTasks,
  fetchProfile,
  PageLoader,
  checkAndExpandRange,
}) => {
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
                  setSearchParams((prev: any) => {
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
                tasks={tasks}
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
