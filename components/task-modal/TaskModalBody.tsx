import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task, User, Channel, MasterOption, Script, TaskType } from '../../types';

import TaskHistory from '../task/TaskHistory';
import TaskComments from '../TaskComments';
import TaskAssets from '../TaskAssets';
import LogisticsTab from '../task/LogisticsTab';
import TaskWiki from '../task/TaskWiki';
import ScriptEditor from '../script/ScriptEditor';
import ContentDetail from '../task/ContentDetail';
import TaskDetail from '../task/TaskDetail';
import ContentForm from '../task/ContentForm';
import GeneralTaskForm from '../task/GeneralTaskForm';

interface TaskModalBodyProps {
    viewMode: string;
    setViewMode: (mode: any) => void;
    mode: 'VIEW' | 'EDIT';
    setMode: (mode: 'VIEW' | 'EDIT') => void;
    taskData?: Task | null;
    taskScript?: Script | null;
    currentUser?: User;
    users: User[];
    channels: Channel[];
    masterOptions: MasterOption[];
    projects?: Task[];
    selectedDate?: Date | null;
    activeTab: TaskType;
    initialContentTab?: 'CONTENT' | 'INSIGHT';
    
    // Handlers
    onSave: (task: Task) => void;
    onUpdate?: (task: Task) => void;
    onDelete?: (taskId: string) => void;
    onClose: () => void;
    onOpenTask?: (task: Task, currentViewMode?: string) => void;
    updateScript: (id: string, updates: Partial<Script>) => Promise<any>;
}

const TaskModalBody: React.FC<TaskModalBodyProps> = ({
    viewMode,
    setViewMode,
    mode,
    setMode,
    taskData,
    taskScript,
    currentUser,
    users,
    channels,
    masterOptions,
    projects = [],
    selectedDate,
    activeTab,
    initialContentTab = 'CONTENT',
    
    onSave,
    onUpdate,
    onDelete,
    onClose,
    onOpenTask,
    updateScript
}) => {
    return (
        <div className="flex-1 overflow-hidden relative bg-white flex flex-col">
            <AnimatePresence mode="wait">
                <motion.div 
                    key={`${viewMode}-${mode}-${taskData?.id || 'new'}`} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="flex-1 overflow-hidden flex flex-col h-full"
                >
                    {viewMode === 'HISTORY' && taskData ? (
                        <TaskHistory task={taskData} currentUser={currentUser} onSaveTask={onSave} />
                    ) : viewMode === 'COMMENTS' && taskData && currentUser ? (
                        <div className="flex-1 overflow-hidden p-0 bg-gray-50">
                            <TaskComments taskId={taskData.id} taskType={taskData.type} currentUser={currentUser} />
                        </div>
                    ) : viewMode === 'ASSETS' && taskData ? (
                        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                            <TaskAssets 
                                assets={taskData.assets || []} 
                                onAdd={(newAsset) => {
                                    const updatedAssets = [...(taskData.assets || []), newAsset];
                                    onSave({ ...taskData, assets: updatedAssets });
                                }} 
                                onDelete={(id) => {
                                    const updatedAssets = (taskData.assets || []).filter(a => a.id !== id);
                                    onSave({ ...taskData, assets: updatedAssets });
                                }} 
                            />
                        </div>
                    ) : viewMode === 'LOGISTICS' && taskData && currentUser ? (
                        <LogisticsTab 
                            parentTask={taskData}
                            users={users}
                            currentUser={currentUser}
                            masterOptions={masterOptions}
                            onUpdate={onUpdate}
                            onOpenTask={(t, customMode) => onOpenTask && onOpenTask(t, customMode || viewMode)}
                        />
                    ) : viewMode === 'WIKI' ? (
                        <TaskWiki className="flex-1" />
                    ) : viewMode === 'SCRIPT' && taskData && currentUser ? (
                        // SCRIPT EDITOR EMBED
                        <div className="flex-1 relative overflow-hidden flex flex-col">
                            {taskScript ? (
                                <ScriptEditor 
                                    script={taskScript}
                                    users={users}
                                    channels={channels}
                                    masterOptions={masterOptions}
                                    currentUser={currentUser}
                                    onClose={() => setViewMode('DETAILS')} // Back to details
                                    onSave={updateScript}
                                    onGenerateAI={async () => null} 
                                    onPromote={() => {}} 
                                />
                            ) : (
                                <div className="p-8 text-center text-slate-500">Loading Script...</div>
                            )}
                        </div>
                    ) : (
                        // Form Selection Logic (DETAILS)
                        mode === 'VIEW' && taskData ? (
                            taskData.type === 'CONTENT' ? (
                                <ContentDetail 
                                    task={taskData}
                                    users={users}
                                    channels={channels}
                                    masterOptions={masterOptions}
                                    currentUser={currentUser}
                                    mode={mode}
                                    setMode={setMode}
                                    onSave={onSave}
                                    onDelete={onDelete ? () => onDelete(taskData.id) : undefined}
                                    onClose={onClose}
                                    initialTab={initialContentTab}
                                />
                            ) : (
                                <TaskDetail 
                                    task={taskData}
                                    users={users}
                                    masterOptions={masterOptions}
                                    onEdit={() => setMode('EDIT')}
                                    onDelete={onDelete ? () => onDelete(taskData.id) : undefined}
                                    onClose={onClose}
                                    onOpenTask={(t) => onOpenTask && onOpenTask(t, viewMode)}
                                />
                            )
                        ) : activeTab === 'CONTENT' ? (
                            taskData ? (
                                <ContentDetail 
                                    task={taskData}
                                    users={users}
                                    channels={channels}
                                    masterOptions={masterOptions}
                                    currentUser={currentUser}
                                    mode={mode}
                                    setMode={setMode}
                                    onSave={onSave}
                                    onDelete={onDelete && taskData ? () => onDelete(taskData.id) : undefined}
                                    onClose={onClose}
                                    initialTab="EDIT"
                                />
                            ) : (
                                <ContentForm 
                                    key="new-content"
                                    initialData={null}
                                    selectedDate={selectedDate}
                                    channels={channels}
                                    users={users}
                                    masterOptions={masterOptions}
                                    currentUser={currentUser} 
                                    onSave={(task) => { onSave(task); onClose(); }}
                                    onDelete={onDelete}
                                    onClose={onClose}
                                />
                            )
                        ) : (
                            <GeneralTaskForm 
                                key={taskData ? `task-${taskData.id}` : 'new-task'}
                                initialData={taskData}
                                selectedDate={selectedDate}
                                users={users}
                                masterOptions={masterOptions}
                                currentUser={currentUser} 
                                projects={projects}
                                channels={channels}
                                onSave={(task) => { onSave(task); if (taskData) setMode('VIEW'); else onClose(); }}
                                onDelete={onDelete}
                                onClose={taskData ? () => setMode('VIEW') : onClose}
                                onOpenTask={(t) => onOpenTask && onOpenTask(t, viewMode)}
                            />
                        )
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default TaskModalBody;
