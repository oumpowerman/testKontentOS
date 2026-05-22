
import React from 'react';
import { motion } from 'framer-motion';
import { Task, Channel, TaskType, User, MasterOption } from '../types';

import { useTaskModalState } from '../hooks/useTaskModalState';
import { TAB_CONFIGS } from './task-modal/constants';

import TaskModalHeader from './task-modal/TaskModalHeader';
import TaskModalNav from './task-modal/TaskModalNav';
import TaskModalBody from './task-modal/TaskModalBody';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Task) => void;
  onUpdate?: (task: Task) => void; 
  onDelete?: (taskId: string) => void;
  initialData?: Task | null;
  selectedDate?: Date | null;
  channels: Channel[];
  users: User[];
  lockedType?: TaskType | null; 
  masterOptions?: MasterOption[];
  currentUser?: User; 
  projects?: Task[]; 
  onOpenTask?: (task: Task, currentViewMode?: string) => void;
  hasHistory?: boolean;
  initialViewMode?: string | null;
  initialContentTab?: 'CONTENT' | 'INSIGHT';
}

const TaskModal: React.FC<TaskModalProps> = ({ 
    isOpen, onClose, onSave, onUpdate, onDelete, initialData, selectedDate, channels, users, lockedType, masterOptions = [], currentUser, projects = [], onOpenTask, hasHistory, initialViewMode, initialContentTab = 'CONTENT'
}) => {
  const {
      viewMode, setViewMode,
      mode, setMode,
      isMobile,
      isNavExpanded, setIsNavExpanded,
      isLoadingDetails,
      activeTab,
      taskData,
      taskScript,
      updateScript,
      subTaskCount,
      assetCount,
      commentCount,
      hasLinkedScript
  } = useTaskModalState({
      isOpen,
      initialData,
      initialViewMode,
      lockedType,
      currentUser
  });

  const isContent = taskData?.type === 'CONTENT' || activeTab === 'CONTENT';

  // --- Theme Logic ---
  const currentTheme = TAB_CONFIGS[viewMode] || TAB_CONFIGS.DETAILS;
  const themeColor = currentTheme.color;
  
  return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-0 sm:p-4 md:p-6 lg:p-8 font-kanit overflow-hidden">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="absolute inset-0 bg-indigo-950/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ 
              opacity: 0, 
              scale: 0.96, 
              y: 10,
              filter: 'blur(8px)',
              transition: { duration: 0.25, ease: 'easeOut' }
            }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`
                relative bg-white text-slate-900 w-full sm:max-w-5xl h-full sm:h-[92vh] sm:rounded-[2.5rem] shadow-[0_20px_70px_-12px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col 
                ${!isMobile ? 'border-[6px]' : 'border-t-4'} transition-colors duration-500
                border-${themeColor}-100 ring-1 ring-${themeColor}-200
            `}
          >
            <TaskModalHeader 
                viewMode={viewMode}
                setViewMode={setViewMode}
                hasHistory={hasHistory}
                onClose={onClose}
                isLoadingDetails={isLoadingDetails}
                themeColor={themeColor}
                currentTheme={currentTheme}
                taskData={taskData}
                activeTab={activeTab}
                channels={channels}
                masterOptions={masterOptions}
            />

            {initialData && (
                <TaskModalNav 
                    isNavExpanded={isNavExpanded}
                    setIsNavExpanded={setIsNavExpanded}
                    isMobile={isMobile}
                    currentTheme={currentTheme}
                    themeColor={themeColor}
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    isContent={isContent}
                    hasLinkedScript={hasLinkedScript}
                    assetCount={assetCount}
                    subTaskCount={subTaskCount}
                    commentCount={commentCount}
                />
            )}

            <TaskModalBody 
                viewMode={viewMode}
                setViewMode={setViewMode}
                mode={mode}
                setMode={setMode}
                taskData={taskData}
                taskScript={taskScript}
                currentUser={currentUser}
                users={users}
                channels={channels}
                masterOptions={masterOptions}
                projects={projects}
                selectedDate={selectedDate}
                activeTab={activeTab}
                initialContentTab={initialContentTab}
                onSave={onSave}
                onUpdate={onUpdate}
                onDelete={onDelete}
                onClose={onClose}
                onOpenTask={onOpenTask}
                updateScript={updateScript}
            />
          </motion.div>
        </div>
  );
};

export default TaskModal;
