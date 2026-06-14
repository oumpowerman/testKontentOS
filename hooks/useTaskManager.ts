
import { useState, useEffect, useMemo } from 'react';
import { User } from '../types';

// Import split hooks
import { useAuth } from './useAuth';
import { useTeam } from './useTeam';
import { useChannels } from './useChannels';
import { useTasks } from './useTasks';
import { useChecklist } from './useChecklist';
import { useWeeklyQuests } from './useWeeklyQuests'; 
import { useUI } from './useUI';
import { useMasterData } from './useMasterData'; 

export const useTaskManager = (
    sessionUser: any, 
    currentUserProfile: User | null, 
    fetchProfile: () => Promise<User | null>,
    updateProfile: (updates: Partial<User>, avatarFile?: File) => Promise<boolean>
) => {
  const [isLoading, setIsLoading] = useState(true);

  // 1. Auth Hook - REMOVED redundant call
  // const { currentUserProfile, fetchProfile, updateProfile } = useAuth(sessionUser);

  // 2. UI Hook
  const { 
    isModalOpen, setIsModalOpen, editingTask, setEditingTask, initialViewMode, taskStack, selectedDate, setSelectedDate, notificationSettings,
    updateNotificationSettings, handleAddTask, handleEditTask, handleSelectDate, closeModal, lockedTaskType
  } = useUI();

  // 3. Team Hook
  const { allUsers, activeUsers, fetchTeamMembers, approveMember, removeMember, toggleUserStatus, updateMember, adjustStatsLocally, setAllUsers } = useTeam();

  // 4. Channels Hook
  const { channels, fetchChannels, handleAddChannel, handleUpdateChannel, handleDeleteChannel } = useChannels();

  // 5. Tasks Hook (Now with Range Controls)
  const { tasks, fetchTasks, fetchTaskById, handleSaveTask: saveTaskInternal, handleDeleteTask, handleDelayTask, checkAndExpandRange, fetchAllTasks, isFetching, fetchCompletedTasks } = useTasks(setIsModalOpen);

  // 6. Checklist Hook
  const { 
    checklistPresets, activeChecklistItems, loadChecklistData,
    activePresetId, activePresetName,
    handleToggleChecklist, handleAddChecklistItem, handleDeleteChecklistItem, handleResetChecklist,
    handleLoadPreset, handleAddPreset, handleDeletePreset
  } = useChecklist();

  // 7. Weekly Quests Hook (New)
  const { quests, fetchQuests, handleAddQuest, handleDeleteQuest, updateManualProgress, updateQuest } = useWeeklyQuests();

  // 8. Master Data Hook (New)
  const { masterOptions, fetchMasterOptions } = useMasterData();

  // --- Initialize Logic (Orchestrator) ---
  useEffect(() => {
    const init = async () => {
      // Only set loading if we don't have profile yet to prevent flicker on refocus
      if (!currentUserProfile) setIsLoading(true);
      
      const profile = await fetchProfile();
      
      if (profile && profile.isApproved) {
         await Promise.all([
             fetchChannels(), 
             fetchMasterOptions() 
         ]);
      }
      setIsLoading(false);
    };

    if (sessionUser?.id) init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionUser?.id]); 

  // Wrapper for handleSaveTask to match original signature expected by App.tsx
  // UPDATED: Pass context data (users, masterOptions, channels) for Smart Diffing
  const handleSaveTask = async (task: any) => {
    await saveTaskInternal(task, editingTask, {
      users: allUsers,
      masterOptions: masterOptions,
      channels: channels
    });
    
    // Update editingTask if it was being edited to keep the modal in sync
    if (editingTask && editingTask.id === task.id) {
      setEditingTask(task);
    }
  };

  const mergedUsers = useMemo(() => 
    allUsers.map(u => u.id === currentUserProfile?.id ? { ...u, ...currentUserProfile } : u),
    [allUsers, currentUserProfile]
  );

  const mergedActiveUsers = useMemo(() => 
    activeUsers.map(u => u.id === currentUserProfile?.id ? { ...u, ...currentUserProfile } : u),
    [activeUsers, currentUserProfile]
  );

  return {
    isLoading: isLoading || (tasks.length === 0 && isFetching), // Show load on initial empty
    isTaskFetching: isFetching, // Expose fetch state
    currentUserProfile,
    allUsers: mergedUsers,
    activeUsers: mergedActiveUsers,
    tasks,
    channels,
    masterOptions,
    fetchMasterOptions,
    
    // Checklist State
    checklistPresets,
    activeChecklistItems,
    activePresetId,
    activePresetName,
    
    // UI State
    isModalOpen,
    editingTask,
    initialViewMode,
    taskStack,
    selectedDate,
    notificationSettings,
    lockedTaskType, 
    setIsModalOpen, 
    setEditingTask,
    setSelectedDate,
    
    // UI Handlers
    handleAddTask,
    handleEditTask,
    handleSelectDate,
    closeModal,
    
    // Task Actions
    handleSaveTask,
    handleDeleteTask,
    handleDelayTask,
    fetchTaskById,
    checkAndExpandRange, // NEW: For Calendar
    fetchAllTasks,       // NEW: For Dashboard All Time
    fetchCompletedTasks,
    
    // Channel Actions
    handleAddChannel,
    handleUpdateChannel,
    handleDeleteChannel,
    handleAddChannels: () => {}, 
    
    // Notification Actions
    updateNotificationSettings,
    
    // Checklist Actions
    handleToggleChecklist,
    handleAddChecklistItem,
    handleDeleteChecklistItem,
    handleResetChecklist,
    handleLoadPreset,
    handleAddPreset,     
    handleDeletePreset,  
    
    // Admin Actions
    approveMember,
    removeMember,
    toggleUserStatus,
    updateMember,
    adjustStatsLocally,
    setAllUsers,

    // Quest Actions
    quests,
    handleAddQuest,
    handleDeleteQuest,
    updateManualProgress,
    updateQuest,

    // Profile Actions
    updateProfile,
    fetchProfile
  };
};
