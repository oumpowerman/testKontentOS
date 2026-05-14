import { useState, useEffect, useRef } from 'react';
import { Task, User, TaskType, Script } from '../types';
import { useTaskContext } from '../context/TaskContext';
import { useScripts } from './useScripts';

export interface UseTaskModalStateProps {
    isOpen: boolean;
    initialData?: Task | null;
    initialViewMode?: string | null;
    lockedType?: TaskType | null;
    currentUser?: User;
}

export const useTaskModalState = ({
    isOpen,
    initialData,
    initialViewMode,
    lockedType,
    currentUser,
}: UseTaskModalStateProps) => {
    const { fetchTaskById, setTasks, fetchSubTasksCount } = useTaskContext();
    const { getScriptById, updateScript } = useScripts(currentUser || { id: '', name: '', role: 'MEMBER' } as User);

    // Subtask count
    const [subTaskCount, setSubTaskCount] = useState<number>(0);

    // Main View State
    const [viewMode, setViewMode] = useState<'DETAILS' | 'COMMENTS' | 'ASSETS' | 'HISTORY' | 'WIKI' | 'LOGISTICS' | 'SCRIPT'>((initialViewMode as any) || 'DETAILS');
    const [mode, setMode] = useState<'VIEW' | 'EDIT'>('VIEW');
    const [isMobile, setIsMobile] = useState(false);
    const [isNavExpanded, setIsNavExpanded] = useState(false);
    
    // Lazy Loading Data State
    const [detailedData, setDetailedData] = useState<Task | null>(null);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);

    // Tab State (Content vs Task) - Synced with props
    const [activeTab, setActiveTab] = useState<TaskType>('CONTENT');

    // Script Data for General Task
    const [taskScript, setTaskScript] = useState<Script | null>(null);

    // Mobile Detection
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Sync state when modal opens or props change
    const lastTaskIdRef = useRef<string | null>(null);
    const wasOpenRef = useRef(false);

    useEffect(() => {
        if (isOpen) {
            const isNewTask = initialData?.id !== lastTaskIdRef.current;
            const justOpened = !wasOpenRef.current;

            if (justOpened || isNewTask) {
                setViewMode((initialViewMode as any) || 'DETAILS');
                setIsNavExpanded(false); 
                
                if (initialData) {
                    setActiveTab(initialData.type || 'CONTENT');
                    setMode('VIEW');
                } else {
                    setMode('EDIT');
                    setDetailedData(null);
                    setIsLoadingDetails(false);
                    if (lockedType) {
                        setActiveTab(lockedType);
                    } else {
                        setActiveTab('CONTENT');
                    }
                }
                lastTaskIdRef.current = initialData?.id || null;
            }

            // LAZY LOADING LOGIC (Always check if we need full data when viewing a task)
            if (initialData && (initialData as any)._isPartial && detailedData?.id !== initialData.id) {
                const loadDetails = async () => {
                    setIsLoadingDetails(true);
                    console.log(`🔍 [TaskModal] Lazy loading full data for ${initialData.type}: ${initialData.id}`);
                    const fullTask = await fetchTaskById(initialData.id, initialData.type);
                    if (fullTask) {
                        setDetailedData(fullTask);
                        setTasks((prev: Task[]) => prev.map((t: Task) => t.id === fullTask.id ? fullTask : t));
                    }
                    setIsLoadingDetails(false);
                };
                loadDetails();
            } else if (initialData && !(initialData as any)._isPartial && detailedData) {
                // If we have full data and the new initialData is also full, we can clear detailedData
                setDetailedData(null);
            }

            wasOpenRef.current = true;
        } else {
            wasOpenRef.current = false;
        }
    }, [isOpen, initialData?.id, initialData?.type, lockedType, initialViewMode, fetchTaskById, setTasks, detailedData?.id]);

    const taskData = detailedData || initialData;

    // Load Script if viewing script tab
    useEffect(() => {
        if (viewMode === 'SCRIPT' && taskData?.scriptId) {
            const loadScript = async () => {
                const script = await getScriptById(taskData.scriptId!);
                setTaskScript(script);
            };
            loadScript();
        }
    }, [viewMode, taskData?.scriptId, getScriptById]);

    // Fetch Subtask Count if it's a CONTENT type
    useEffect(() => {
        if (isOpen && taskData?.id && taskData.type === 'CONTENT') {
            const loadCount = async () => {
                const count = await fetchSubTasksCount(taskData.id);
                setSubTaskCount(count);
            };
            loadCount();
        } else {
            setSubTaskCount(0);
        }
    }, [isOpen, taskData?.id, taskData?.type, fetchSubTasksCount]);

    return {
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
        assetCount: taskData?.assets?.length || 0
    };
};
