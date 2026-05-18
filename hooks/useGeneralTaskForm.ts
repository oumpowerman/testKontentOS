
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Task, Status, Priority, MasterOption, Difficulty, AssigneeType, TaskAsset, User } from '../types';

interface UseGeneralTaskFormProps {
    initialData?: Task | null;
    selectedDate?: Date | null;
    users: any[];
    masterOptions: MasterOption[];
    currentUser?: User;
    onSave: (task: Task) => void;
    projects?: Task[]; // Add projects prop
}

export const useGeneralTaskForm = ({ initialData, selectedDate, masterOptions, onSave, projects = [], currentUser }: UseGeneralTaskFormProps) => {
    // --- State ---
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    
    // Status & Dates
    const [status, setStatus] = useState<string>(''); 
    const [priority, setPriority] = useState<Priority>('MEDIUM');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [scheduledTime, setScheduledTime] = useState(''); 
    
    // Task Specifics
    const [assigneeType, setAssigneeType] = useState<AssigneeType>('INDIVIDUAL'); 
    const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
    const [targetPosition, setTargetPosition] = useState('');
    const [caution, setCaution] = useState('');
    const [importance, setImportance] = useState('');
    
    // Hidden Fields (Preservation) & Linking
    const [contentId, setContentId] = useState<string | undefined>(undefined);
    const [roadmapId, setRoadmapId] = useState<string | undefined>(undefined);
    const [showOnBoard, setShowOnBoard] = useState(true);

    // Script Linking
    const [scriptId, setScriptId] = useState<string | undefined>(undefined);

    // Gamification & Assets
    const [difficulty, setDifficulty] = useState<Difficulty>('MEDIUM');
    const [estimatedHours, setEstimatedHours] = useState<number>(0);
    const [assets, setAssets] = useState<TaskAsset[]>([]);

    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const taskStatusOptions = masterOptions.filter(o => o.type === 'TASK_STATUS' && o.isActive).sort((a,b) => a.sortOrder - b.sortOrder);

    // --- Initialization ---
    useEffect(() => {
        if (initialData && initialData.type === 'TASK') {
            setTitle(initialData.title);
            setDescription(initialData.description);
            setStatus(initialData.status);
            setPriority(initialData.priority ?? 'MEDIUM');
            setStartDate(initialData.startDate ? format(initialData.startDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
            setEndDate(initialData.endDate ? format(initialData.endDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
            setScheduledTime(initialData.scheduledTime || '');
            
            setAssigneeType(initialData.assigneeType || 'INDIVIDUAL');
            setAssigneeIds(initialData.assigneeIds || []);
            setTargetPosition(initialData.targetPosition || '');
            setCaution(initialData.caution || '');
            setImportance(initialData.importance || '');
            
            // Link & Board State
            setContentId(initialData.contentId);
            setRoadmapId(initialData.roadmapId);
            setShowOnBoard(initialData.showOnBoard || false);
            setScriptId(initialData.scriptId);
            
            setDifficulty(initialData.difficulty || 'MEDIUM');
            setEstimatedHours(initialData.estimatedHours || 0);
            setAssets(initialData.assets || []);
        } else {
            // Defaults
            setTitle(initialData?.title || '');
            setDescription('');
            
            const defaultStatus = taskStatusOptions.find(o => o.isDefault)?.key || (taskStatusOptions.length > 0 ? taskStatusOptions[0].key : 'TODO');
            setStatus(defaultStatus);
            setPriority('MEDIUM');
            
            const defaultDate = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
            setStartDate(initialData?.startDate ? format(initialData.startDate, 'yyyy-MM-dd') : defaultDate);
            setEndDate(initialData?.endDate ? format(initialData.endDate, 'yyyy-MM-dd') : defaultDate);
            setScheduledTime(initialData?.scheduledTime || '');
            
            setAssigneeType('INDIVIDUAL'); 
            setAssigneeIds(currentUser ? [currentUser.id] : []);
            setTargetPosition(currentUser?.position || '');
            setCaution('');
            setImportance('');
            
            setContentId(undefined);
            setRoadmapId(initialData?.roadmapId);
            setShowOnBoard(true);
            setScriptId(undefined);
            
            setDifficulty('MEDIUM');
            setEstimatedHours(0);
            setAssets([]);
        }
        setError('');
    }, [initialData, selectedDate, masterOptions]);

    // --- Handlers ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!title.trim()) {
            setError('อย่าลืมตั้งชื่องานนะ!');
            return;
        }
        if (new Date(startDate) > new Date(endDate)) {
            setError('วันเริ่มต้องมาก่อนวันจบสิครับผม');
            return;
        }

        setIsSaving(true);
        try {
            // Fix Timezone Issue: Explicitly parse as Local Midnight
            const [sy, sm, sd] = startDate.split('-').map(Number);
            const startObj = new Date(sy, sm - 1, sd);
            
            const [ey, em, ed] = endDate.split('-').map(Number);
            const endObj = new Date(ey, em - 1, ed);

            const newTask: Task = {
                id: initialData?.id || crypto.randomUUID(),
                type: 'TASK',
                title,
                description,
                status: status as Status, 
                priority,
                tags: initialData?.tags || [], // Preserve Tags
                
                // Dates
                startDate: startObj,
                endDate: endObj,
                isUnscheduled: false,
                scheduledTime: scheduledTime || undefined,

                // People & Type
                assigneeType,
                assigneeIds,
                targetPosition: assigneeType === 'INDIVIDUAL' ? targetPosition : undefined,
                
                // Details
                caution,
                importance,
                
                // Context / Parent Link (CRITICAL FIX)
                contentId: contentId,
                roadmapId: roadmapId,
                showOnBoard: showOnBoard,
                
                // Script Link
                scriptId: scriptId,

                // Gamification & Assets
                difficulty,
                estimatedHours,
                assets,
                
                // Empty Content Fields
                reviews: initialData?.reviews || [],
                logs: []
            };

            await onSave(newTask);
        } catch (err) {
            console.error(err);
            setError('เกิดข้อผิดพลาดในการบันทึก');
        } finally {
            setIsSaving(false);
        }
    };

    const toggleUserSelection = (userId: string) => {
        if (assigneeType === 'INDIVIDUAL') {
            setAssigneeIds(prev => prev.includes(userId) ? [] : [userId]);
        } else {
            setAssigneeIds(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
        }
    };
    
    const handleSetParentProject = (id: string | null) => {
        setContentId(id || undefined);
    };

    const addAsset = (newAsset: TaskAsset) => setAssets(prev => [...prev, newAsset]);
    const removeAsset = (id: string) => setAssets(prev => prev.filter(a => a.id !== id));

    return {
        title, setTitle,
        description, setDescription,
        status, setStatus,
        priority, setPriority,
        startDate, setStartDate,
        endDate, setEndDate,
        scheduledTime, setScheduledTime,
        
        assigneeType, setAssigneeType,
        assigneeIds, setAssigneeIds,
        targetPosition, setTargetPosition,
        caution, setCaution,
        importance, setImportance,
        
        contentId, handleSetParentProject,
        showOnBoard, setShowOnBoard,
        scriptId, setScriptId,
        
        difficulty, setDifficulty,
        estimatedHours, setEstimatedHours,
        assets, addAsset, removeAsset,
        
        error,
        isSaving,
        taskStatusOptions,
        handleSubmit,
        toggleUserSelection
    };
};
