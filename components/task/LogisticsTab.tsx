
import React, { useState, useEffect } from 'react';
import { Task, User, MasterOption } from '../../types';
import { useTasks } from '../../hooks/useTasks';
import { AnimatePresence } from 'framer-motion';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../lib/supabase';
import { useGlobalDialog } from '../../context/GlobalDialogContext';
import LogisticsForm from './logistics/LogisticsForm';
import LogisticsList from './logistics/LogisticsList';
import UserPickerModal from './logistics/UserPickerModal';
import LogisticsActionModal from './logistics/LogisticsActionModal';

interface LogisticsTabProps {
    parentTask: Task;
    users: User[];
    currentUser: User;
    masterOptions: MasterOption[];
    onUpdate?: (task: Task) => void;
    onOpenTask?: (task: Task, currentViewMode?: string) => void;
}

const LogisticsTab: React.FC<LogisticsTabProps> = ({ parentTask, users, currentUser, masterOptions, onUpdate, onOpenTask }) => {
    const parentContentId = parentTask.id;
    // We reuse useTasks, which fetches by content_id correctly
    const { fetchSubTasks, handleSaveTask, handleDeleteTask, handleSendToQC: sendToQC } = useTasks(() => {});
    const { showAlert, showConfirm } = useGlobalDialog();
    const [subTasks, setSubTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { showToast } = useToast();

    // Form / Modal States
    const [isAdding, setIsAdding] = useState(false);
    const [isAssigneeModalOpen, setIsAssigneeModalOpen] = useState(false);
    const [newTaskAssignee, setNewTaskAssignee] = useState<string>('');

    // Action Modal State
    const [actionTask, setActionTask] = useState<Task | null>(null);
    const [isActionProcessing, setIsActionProcessing] = useState(false);

    const isAdmin = currentUser.role === 'ADMIN';

    const loadSubTasks = async () => {
        setIsLoading(true);
        // This function handles the query logic
        const data = await fetchSubTasks(parentContentId);
        setSubTasks(data);
        setIsLoading(false);
    };

    useEffect(() => {
        loadSubTasks();
    }, [parentContentId]);

    const handleAddSubTask = async (formData: { title: string, assigneeId: string, description: string, difficulty: 'EASY' | 'MEDIUM' | 'HARD', estimatedHours: number }) => {
        if (isAdding) return;

        setIsAdding(true);
        try {
            const selectedUser = users.find(u => u.id === formData.assigneeId);

            const newTask: Task = {
                id: crypto.randomUUID(),
                type: 'TASK',
                title: formData.title,
                description: formData.description || '',
                status: 'TODO',
                priority: 'MEDIUM',
                tags: parentTask.tags || [],
                startDate: new Date(),
                endDate: parentTask.endDate || new Date(),
                assigneeIds: formData.assigneeId ? [formData.assigneeId] : [],
                assigneeType: 'INDIVIDUAL',
                targetPosition: selectedUser?.position || '',
                difficulty: formData.difficulty,
                estimatedHours: formData.estimatedHours,
                contentId: parentContentId, 
                channelId: parentTask.channelId,
                pillar: parentTask.pillar,
                category: parentTask.category,
                showOnBoard: true,
                assets: [],
                reviews: [],
                logs: []
            };

            await handleSaveTask(newTask, null);
            setSubTasks(prev => [...prev, newTask]);
            setNewTaskAssignee('');
        } catch (error) {
            console.error("Failed to add subtask", error);
            showToast('เกิดข้อผิดพลาดในการเพิ่มงานย่อย', 'error');
        } finally {
            setIsAdding(false);
        }
    };

    // --- NEW LOGIC: CLICK HANDLER ---
    const handleItemClick = async (task: Task) => {
        if (task.status === 'WAITING') {
            // Blocked
            showToast('รายการนี้อยู่ระหว่างการตรวจสอบ (Waiting for Review)', 'warning');
            return;
        }

        if (task.status === 'DONE') {
            // Toggle Back to TODO (Simple Undo)
            if (await showConfirm('ต้องการยกเลิกสถานะเสร็จสิ้นหรือไม่?', 'ยกเลิกสถานะเสร็จสิ้น')) {
                toggleToTodo(task);
            }
            return;
        }

        // Open Action Modal for TODO items
        setActionTask(task);
    };

    const toggleToTodo = async (task: Task) => {
        const updatedTask = { ...task, status: 'TODO' };
        setSubTasks(prev => prev.map(t => t.id === task.id ? updatedTask : t));
        await handleSaveTask(updatedTask, task);
    };

    // --- ACTIONS ---
    const handleSendToQC = async () => {
        if (!actionTask) return;
        setIsActionProcessing(true);
        try {
            const updatedTask = await sendToQC(actionTask, currentUser);
            setSubTasks(prev => prev.map(t => t.id === actionTask.id ? updatedTask : t));
            
            await showAlert('ส่งงานเรียบร้อยแล้ว! 🚀 หัวหน้าจะได้รับแจ้งเตือนทันทีและงานจะย้ายไปที่ช่อง "รอตรวจ"', 'ส่งงานสำเร็จ');
            setActionTask(null);
        } catch (error: any) {
            console.error(error);
            showToast(error.message || 'เกิดข้อผิดพลาดในการส่งงาน', 'error');
        } finally {
            setIsActionProcessing(false);
        }
    };

    const handleAdminQuickPass = async (reason: string) => {
        if (!actionTask) return;
        setIsActionProcessing(true);
        try {
            // Set status to DONE
            const updatedTask = { ...actionTask, status: 'DONE' };
            setSubTasks(prev => prev.map(t => t.id === actionTask.id ? updatedTask : t));
            
            // This triggers Gamification in useTasks
            await handleSaveTask(updatedTask, actionTask);

            // Additional Log for Admin Reason
            await supabase.from('task_logs').insert({
                task_id: actionTask.id,
                user_id: currentUser.id,
                action: 'ADMIN_QUICK_PASS',
                details: `Admin อนุมัติทันที: ${reason}`
            });

            // Notification for Assignee
            if (actionTask.assigneeIds.length > 0) {
                 await supabase.from('notifications').insert({
                    user_id: actionTask.assigneeIds[0],
                    type: 'GAME_REWARD',
                    title: '✅ งานย่อยได้รับอนุมัติ (Quick Pass)',
                    message: `Admin อนุมัติ "${actionTask.title}" โดยไม่ต้องตรวจ: "${reason}"`,
                    is_read: false
                });
            }

            showToast('อนุมัติด่วนเรียบร้อย (แจกแต้มแล้ว) 🎉', 'success');
            setActionTask(null);
        } catch (error) {
            console.error(error);
            showToast('เกิดข้อผิดพลาด', 'error');
        } finally {
            setIsActionProcessing(false);
        }
    };

    const handleToggleShowOnBoard = async (task: Task) => {
        const newValue = !task.showOnBoard;
        const updatedTask = { ...task, showOnBoard: newValue };
        setSubTasks(prev => prev.map(t => t.id === task.id ? updatedTask : t));
        
        await handleSaveTask(updatedTask, task);
        showToast(newValue ? 'แสดงงานบนบอร์ดหลักแล้ว 👀' : 'ซ่อนงานจากบอร์ดหลักแล้ว 🙈', 'info');
    };

    const handleDelete = async (id: string) => {
        if(await showConfirm('ลบงานย่อยนี้?', 'ยืนยันการลบ')) {
             setSubTasks(prev => prev.filter(t => t.id !== id));
             await handleDeleteTask(id);
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-gray-50 overflow-hidden relative">
            {/* Header / Add Form */}
            <div className="p-3 sm:p-4 bg-white border-b border-gray-100 shrink-0">
                <LogisticsForm 
                    users={users} 
                    parentTask={parentTask} 
                    isAdding={isAdding}
                    selectedAssigneeId={newTaskAssignee}
                    onOpenUserPicker={() => setIsAssigneeModalOpen(true)}
                    onSubmit={handleAddSubTask}
                />
            </div>

            {/* List */}
            <LogisticsList 
                subTasks={subTasks}
                isLoading={isLoading}
                users={users}
                onItemClick={handleItemClick}
                onDelete={handleDelete}
                onToggleShowOnBoard={handleToggleShowOnBoard}
                onOpenTask={onOpenTask}
            />

            {/* Modals */}
            <AnimatePresence>
                {isAssigneeModalOpen && (
                    <UserPickerModal 
                        key="user-picker-modal"
                        isOpen={isAssigneeModalOpen}
                        onClose={() => setIsAssigneeModalOpen(false)}
                        users={users}
                        selectedUserId={newTaskAssignee}
                        onSelectUser={(id) => setNewTaskAssignee(id)}
                    />
                )}
                
                {actionTask && (
                    <LogisticsActionModal 
                        key="logistics-action-modal"
                        task={actionTask}
                        isAdmin={isAdmin}
                        isActionProcessing={isActionProcessing}
                        onClose={() => setActionTask(null)}
                        onSendToQC={handleSendToQC}
                        onAdminQuickPass={handleAdminQuickPass}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default LogisticsTab;
