
import { useState } from 'react';
import { Task, NotificationPreferences, TaskType } from '../types';
import { useToast } from '../context/ToastContext';

// Default preferences
const DEFAULT_PREFERENCES: NotificationPreferences = {
    newAssignments: true,
    upcomingDeadlines: true,
    taskCompletions: true,
    systemUpdates: false,
    emailAlerts: false,
};

const safeParse = (key: string, fallback: any) => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : fallback;
    } catch (e) {
        return fallback;
    }
};

export const useUI = () => {
    const { showToast } = useToast();
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [initialViewMode, setInitialViewMode] = useState<string | null>(null);
    const [taskStack, setTaskStack] = useState<{ task: Task; viewMode?: string }[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [lockedTaskType, setLockedTaskType] = useState<TaskType | null>(null); // New State

    const [notificationSettings, setNotificationSettings] = useState<NotificationPreferences>(() => {
        return safeParse('juijui_notification_prefs', DEFAULT_PREFERENCES);
    });

    const updateNotificationSettings = (p: NotificationPreferences) => {
        setNotificationSettings(p);
        localStorage.setItem('juijui_notification_prefs', JSON.stringify(p));
        showToast('Settings Updated (Local Only)', 'success');
    };

    // Updated to accept type for locking
    const handleAddTask = (type?: TaskType) => { 
        setTaskStack([]); // Clear stack when starting a new task
        setEditingTask(null); 
        setInitialViewMode(null);
        setSelectedDate(new Date());
        setLockedTaskType(type || null); // Lock type if provided
        setIsModalOpen(true); 
    };

    const handleEditTask = (t: Task, currentViewMode?: string) => { 
        // If we're already editing a task, and it's not the same one, push to stack
        if (editingTask && editingTask.id !== t.id) {
            setTaskStack(prev => [...prev, { task: editingTask, viewMode: currentViewMode }]);
        }
        setEditingTask(t); 
        setInitialViewMode(currentViewMode || null); 
        setSelectedDate(null);
        setLockedTaskType(null); // Unlock when editing existing (usually)
        setIsModalOpen(true); 
    };

    const handleSelectDate = (d: Date, type?: TaskType) => { 
        setTaskStack([]); // Clear stack
        setEditingTask(null); 
        setInitialViewMode(null);
        setSelectedDate(d); 
        setLockedTaskType(type || null); // Pass Type to Lock
        setIsModalOpen(true); 
    };

    const closeModal = () => {
        if (taskStack.length > 0) {
            // Go back to previous task in stack
            const lastItem = taskStack[taskStack.length - 1];
            setTaskStack(prev => prev.slice(0, -1));
            setEditingTask(lastItem.task);
            if (lastItem.viewMode) {
                setInitialViewMode(lastItem.viewMode);
            }
        } else {
            setIsModalOpen(false);
            // Delay reset to avoid UI jumping during close animation
            setTimeout(() => {
                setEditingTask(null);
                setInitialViewMode(null);
                setLockedTaskType(null);
                setTaskStack([]);
            }, 300);
        }
    };

    return {
        isModalOpen,
        setIsModalOpen,
        editingTask,
        setEditingTask,
        initialViewMode,
        selectedDate,
        setSelectedDate,
        lockedTaskType, // Export
        taskStack,
        notificationSettings,
        updateNotificationSettings,
        handleAddTask,
        handleEditTask,
        handleSelectDate,
        closeModal
    };
};
