import React, { Suspense, lazy } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ViewMode, Task, LeaveRequest } from '../types';

import NegligenceLockModal from '../components/duty/NegligenceLockModal';
import DeathLockModal from '../components/gamification/DeathLockModal';
import ResurrectionModal from '../components/gamification/ResurrectionModal';
import NotificationPopover from '../components/NotificationPopover';
import TaskModalSkeleton from '../components/task/TaskModalSkeleton';

// --- LAZY LOAD MODALS ---
const TaskModal = lazy(() => import('../components/TaskModal'));
const ProfileEditModal = lazy(() => import('../components/ProfileEditModal'));
const NotificationSettingsModal = lazy(() => import('../components/NotificationSettingsModal'));

interface GlobalModalRegistryProps {
  // Lock Notification States
  negligenceNotification: any;
  deathWarningNotification: any;
  resurrectionNotification: any;
  handleAcknowledgeLock: (notifId: string) => Promise<void>;
  handleForceLogout: () => Promise<void>;

  // Project/Task Modal
  isModalOpen: boolean;
  closeModal: () => void;
  handleSaveTask: (task: any) => void;
  handleDeleteTask: (task: any) => void;
  editingTask: any;
  selectedDate: any;
  channels: any[];
  activeUsers: any[];
  lockedTaskType: any;
  masterOptions: any;
  currentUserProfile: any;
  tasks: Task[];
  handleOpenTaskById: (taskOrId: any) => void;
  taskStack: any[];
  initialViewMode: any;

  // Profile Edit Modal
  isProfileModalOpen: boolean;
  setIsProfileModalOpen: (open: boolean) => void;
  updateProfile: (profile: any) => Promise<any>;

  // Notification Settings Modal
  isNotifSettingsOpen: boolean;
  setIsNotifSettingsOpen: (open: boolean) => void;
  notificationSettings: any;
  updateNotificationSettings: (settings: any) => Promise<void> | void;

  // Notification Popover
  isNotificationOpen: boolean;
  handleCloseNotification: () => void;
  notifications: any[];
  dismissNotification: (id: string) => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<any>;
  handleNavigate: (view: ViewMode) => void;
  approveRequest: (request: LeaveRequest) => Promise<void>;
  rejectRequest: (id: string, reason: string) => Promise<void>;
  leaveRequests: any[];
}

export const GlobalModalRegistry: React.FC<GlobalModalRegistryProps> = ({
  negligenceNotification,
  deathWarningNotification,
  resurrectionNotification,
  handleAcknowledgeLock,
  handleForceLogout,

  isModalOpen,
  closeModal,
  handleSaveTask,
  handleDeleteTask,
  editingTask,
  selectedDate,
  channels,
  activeUsers,
  lockedTaskType,
  masterOptions,
  currentUserProfile,
  tasks,
  handleOpenTaskById,
  taskStack,
  initialViewMode,

  isProfileModalOpen,
  setIsProfileModalOpen,
  updateProfile,

  isNotifSettingsOpen,
  setIsNotifSettingsOpen,
  notificationSettings,
  updateNotificationSettings,

  isNotificationOpen,
  handleCloseNotification,
  notifications,
  dismissNotification,
  markNotificationAsRead,
  markAllAsRead,
  handleNavigate,
  approveRequest,
  rejectRequest,
  leaveRequests,
}) => {
  return (
    <>
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
              onSave={handleSaveTask}
              onUpdate={handleSaveTask}
              onDelete={handleDeleteTask}
              initialData={editingTask}
              selectedDate={selectedDate}
              channels={channels}
              users={activeUsers}
              lockedType={lockedTaskType}
              masterOptions={masterOptions}
              currentUser={currentUserProfile}
              projects={tasks.filter((t) => t.type === 'CONTENT')}
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
        onClose={handleCloseNotification}
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
    </>
  );
};

export default GlobalModalRegistry;
