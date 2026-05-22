import { useState, useCallback } from 'react';
import { Script, User, Task, ScriptSummary } from '../../../types';
import { ScriptHubMode } from './ScriptModeSwitcher';

interface UseScriptHubActionsProps {
    currentUser: User;
    scripts: ScriptSummary[];
    mode: ScriptHubMode;
    page: number;
    pageSize: number;
    searchQuery: string;
    viewTab: 'QUEUE' | 'LIBRARY' | 'HISTORY';
    setViewTab: (tab: 'QUEUE' | 'LIBRARY' | 'HISTORY') => void;
    filterOwner: string[];
    filterChannel: string[];
    filterCategory: string;
    filterTags: string[];
    filterStatus: string[];
    sortOrder: 'ASC' | 'DESC';
    isDeepSearch: boolean;
    
    // API / Callback functions from useScripts
    createScript: (data: any) => Promise<string | undefined>;
    updateScript: (id: string, data: any) => Promise<boolean>;
    deleteScript: (id: string) => Promise<void>;
    toggleShootQueue: (id: string, currentStatus: boolean) => Promise<boolean>;
    promoteToContent: (scriptId: string, taskData: any) => Promise<boolean>;
    getScriptById: (id: string) => Promise<Script | null>;
    fetchScripts: (options: any) => Promise<void>;

    // Global Modal Context utils
    showConfirm: (message: string, title?: string) => Promise<boolean>;
    showAlert: (message: string, title?: string) => void;
}

export const useScriptHubActions = ({
    currentUser,
    scripts,
    mode,
    page,
    pageSize,
    searchQuery,
    viewTab,
    setViewTab,
    filterOwner,
    filterChannel,
    filterCategory,
    filterTags,
    filterStatus,
    sortOrder,
    isDeepSearch,

    createScript,
    updateScript,
    deleteScript,
    toggleShootQueue,
    promoteToContent,
    getScriptById,
    fetchScripts,

    showConfirm,
    showAlert
}: UseScriptHubActionsProps) => {
    // UI Local States
    const [activeScript, setActiveScript] = useState<Script | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isFetchingDetail, setIsFetchingDetail] = useState(false);
    const [isInfoOpen, setIsInfoOpen] = useState(false);
    const [refreshStatsKey, setRefreshStatsKey] = useState(0);
    const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
    const [promoteScriptData, setPromoteScriptData] = useState<Script | null>(null);

    const handleCreateSubmit = async (data: any) => {
        const id = await createScript({
            ...data,
            isPersonal: mode === 'STUDIO'
        });
        if (id) {
            const fullScript = await getScriptById(id);
            if (fullScript) setActiveScript(fullScript);
        }
        fetchScripts({ 
            page, pageSize, searchQuery, viewTab, filterOwner, filterChannel, 
            filterCategory, filterTags, filterStatus, sortOrder, isDeepSearch,
            isPersonal: mode === 'STUDIO'
        });
        setRefreshStatsKey(prev => prev + 1);
        setIsCreateModalOpen(false);
    };

    const handleOpenScript = async (summary: ScriptSummary) => {
        setIsFetchingDetail(true);
        const fullScript = await getScriptById(summary.id);
        setIsFetchingDetail(false);
        
        if (fullScript) {
            setActiveScript(fullScript);
        } else {
            showAlert("ไม่สามารถโหลดข้อมูลสคริปต์ได้", "ข้อผิดพลาด");
        }
    };

    const handleToggleQueue = async (id: string, currentStatus: boolean) => {
        const actionText = currentStatus ? 'นำออกจากคิวถ่ายทำ (เก็บเข้าคลัง)' : 'ย้ายเข้าคิวถ่ายทำ (Active Queue)';
        const confirmed = await showConfirm(
            `คุณต้องการ ${actionText} ใช่หรือไม่?`,
            'ยืนยันการย้ายรายการ'
        );
        
        if (confirmed) {
            const success = await toggleShootQueue(id, currentStatus);
            if (success) {
                setRefreshStatsKey(prev => prev + 1);
                if (viewTab === 'LIBRARY') {
                    setViewTab('QUEUE');
                } else if (viewTab === 'QUEUE') {
                    setViewTab('LIBRARY');
                }
            }
        }
    };

    const handleDeleteScript = async (id: string) => {
        const script = scripts.find(s => s.id === id);
        if (script && script.authorId !== currentUser.id && script.ideaOwnerId !== currentUser.id) {
            showAlert("คุณไม่ใช่เจ้าของสคริปต์นี้ ไม่สามารถลบได้", "ไม่อนุญาต");
            return;
        }

        const confirmed = await showConfirm(
            'สคริปต์จะถูกลบถาวรและไม่สามารถกู้คืนได้',
            '⚠️ ยืนยันการลบสคริปต์?'
        );
        if (confirmed) {
            await deleteScript(id);
            setRefreshStatsKey(prev => prev + 1);
        }
    };

    const handleDoneScript = async (id: string) => {
        const confirmed = await showConfirm(
            'รายการจะถูกย้ายไปที่ "ประวัติ (History)" และถือว่าถ่ายทำเสร็จสิ้นแล้ว',
            '🎉 ยืนยันจบงาน (Mark as Done)?'
        );
        if (confirmed) {
            const success = await updateScript(id, { status: 'DONE', isInShootQueue: false });
            if (success) {
                setRefreshStatsKey(prev => prev + 1);
                setViewTab('HISTORY');
            }
        }
    };

    const handleRestoreScript = async (id: string) => {
        const confirmed = await showConfirm(
            'สคริปต์จะถูกย้ายกลับมาที่คลัง (Library) ในสถานะ DRAFT',
            'ยืนยันการนำกลับมาใช้?'
        );
        if (confirmed) {
            const success = await updateScript(id, { status: 'DRAFT', isInShootQueue: false });
            if (success) {
                setRefreshStatsKey(prev => prev + 1);
                setViewTab('LIBRARY');
            }
        }
    };

    const handleTogglePersonal = async (id: string, currentStatus: boolean) => {
        const script = scripts.find(s => s.id === id);
        if (script && script.authorId !== currentUser.id && script.ideaOwnerId !== currentUser.id) {
            showAlert("คุณไม่ใช่เจ้าของสคริปต์นี้ ไม่สามารถเปลี่ยนสถานะได้", "ไม่อนุญาต");
            return;
        }

        const actionText = currentStatus ? 'ย้ายเข้าส่วนกลาง (Public Hub)' : 'เก็บเข้าพื้นที่ส่วนตัว (My Studio)';
        const confirmed = await showConfirm(
            `คุณต้องการ ${actionText} ใช่หรือไม่?`,
            'ยืนยันการเปลี่ยนสถานะการมองเห็น'
        );
        
        if (confirmed) {
            const success = await updateScript(id, { isPersonal: !currentStatus });
            if (success) {
                setRefreshStatsKey(prev => prev + 1);
                fetchScripts({ 
                    page, pageSize, searchQuery, viewTab, filterOwner, filterChannel, 
                    filterCategory, filterTags, filterStatus, sortOrder, isPersonal: mode === 'STUDIO' 
                });
            }
        }
    };

    const handlePromoteClick = useCallback((scriptId: string) => {
        if (activeScript) {
            setPromoteScriptData(activeScript);
            setIsPromoteModalOpen(true);
        }
    }, [activeScript]);

    const handlePromoteSubmit = async (contentTask: Task) => {
        if (!promoteScriptData) return;

        const payload = {
            title: contentTask.title,
            description: contentTask.description,
            status: contentTask.status,
            channel_id: contentTask.channelId,
            start_date: contentTask.startDate,
            end_date: contentTask.endDate,
            target_platform: contentTask.targetPlatforms,
            content_formats: contentTask.contentFormats,
            pillar: contentTask.pillar,
            category: contentTask.category,
            is_unscheduled: contentTask.isUnscheduled,
            idea_owner_ids: contentTask.ideaOwnerIds,
            editor_ids: contentTask.editorIds,
            assignee_ids: contentTask.assigneeIds,
            remark: contentTask.remark
        };

        const success = await promoteToContent(promoteScriptData.id, payload);
        
        if (success) {
            setIsPromoteModalOpen(false);
            setPromoteScriptData(null);
            const refreshed = await getScriptById(promoteScriptData.id);
            if (refreshed) setActiveScript(refreshed);
        }
    };

    return {
        activeScript,
        setActiveScript,
        isCreateModalOpen,
        setIsCreateModalOpen,
        isFetchingDetail,
        setIsFetchingDetail,
        isInfoOpen,
        setIsInfoOpen,
        refreshStatsKey,
        setRefreshStatsKey,
        isPromoteModalOpen,
        setIsPromoteModalOpen,
        promoteScriptData,
        setPromoteScriptData,
        handleCreateSubmit,
        handleOpenScript,
        handleToggleQueue,
        handleDeleteScript,
        handleDoneScript,
        handleRestoreScript,
        handleTogglePersonal,
        handlePromoteClick,
        handlePromoteSubmit
    };
};
