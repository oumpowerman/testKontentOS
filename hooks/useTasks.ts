
import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Task, TaskLog, User, MasterOption, Channel } from '../types';
import { useToast } from '../context/ToastContext';
import { isTaskCompleted } from '../constants';
import { useGamification } from './useGamification';
import { useTaskContext } from '../context/TaskContext';
import { format, isValid } from 'date-fns';

// --- 1. SMART DIFF CONFIGURATION ---

interface SmartDiffContext {
    users: User[];
    masterOptions: MasterOption[];
    channels: Channel[];
}

const TASK_FIELD_META: Record<string, { label: string; type: 'TEXT' | 'DATE' | 'USER_ARRAY' | 'ARRAY' | 'STATUS' | 'MASTER' | 'CHANNEL' | 'MONEY' }> = {
    // Core
    title: { label: 'ชื่องาน', type: 'TEXT' },
    description: { label: 'รายละเอียด', type: 'TEXT' },
    status: { label: 'สถานะ', type: 'STATUS' },
    priority: { label: 'ความสำคัญ', type: 'TEXT' },
    remark: { label: 'หมายเหตุ', type: 'TEXT' },
    
    // Dates
    startDate: { label: 'วันเริ่ม', type: 'DATE' },
    endDate: { label: 'กำหนดส่ง', type: 'DATE' },
    
    // People
    assigneeIds: { label: 'ผู้รับผิดชอบ', type: 'USER_ARRAY' },
    ideaOwnerIds: { label: 'เจ้าของไอเดีย', type: 'USER_ARRAY' },
    editorIds: { label: 'คนตัดต่อ', type: 'USER_ARRAY' },

    // Content Specific
    channelId: { label: 'ช่องทาง', type: 'CHANNEL' },
    contentFormat: { label: 'รูปแบบ', type: 'MASTER' },
    contentFormats: { label: 'รูปแบบ (หลาย)', type: 'ARRAY' },
    pillar: { label: 'แกนเนื้อหา', type: 'MASTER' },
    category: { label: 'หมวดหมู่', type: 'MASTER' },
    targetPlatforms: { label: 'แพลตฟอร์ม', type: 'ARRAY' },
    
    // Production
    shootDate: { label: 'วันถ่ายทำ', type: 'DATE' },
    shootLocation: { label: 'สถานที่ถ่าย', type: 'TEXT' },
    
    // Gamification
    difficulty: { label: 'ความยาก', type: 'TEXT' },
    estimatedHours: { label: 'เวลาที่ประเมิน', type: 'TEXT' }
};

// --- 2. HELPER FUNCTIONS ---

const formatDateVal = (date: Date | string | undefined) => {
    if (!date) return '-';
    const d = new Date(date);
    return isValid(d) ? format(d, 'dd/MM/yyyy') : '-';
};

const getMasterLabel = (key: string | undefined, options: MasterOption[]) => {
    if (!key) return '-';
    return options.find(o => o.key === key)?.label || key;
};

const getChannelName = (id: string | undefined, channels: Channel[]) => {
    if (!id) return '-';
    return channels.find(c => c.id === id)?.name || 'Unknown Channel';
};

const getUserNames = (ids: string[], users: User[]) => {
    return ids.map(id => users.find(u => u.id === id)?.name || 'Unknown');
};

const generateSmartDiff = (oldTask: Task, newTask: Task, context?: SmartDiffContext) => {
    const changes: string[] = [];
    const users = context?.users || [];
    const masterOptions = context?.masterOptions || [];
    const channels = context?.channels || [];

    Object.entries(TASK_FIELD_META).forEach(([key, config]) => {
        const oldVal = (oldTask as any)[key];
        const newVal = (newTask as any)[key];

        // Skip if both are empty/null/undefined
        if ((!oldVal && !newVal) || (Array.isArray(oldVal) && oldVal.length === 0 && (!newVal || newVal.length === 0))) {
            return;
        }

        // Compare based on Type
        let isDifferent = false;
        let changeText = '';

        switch (config.type) {
            case 'TEXT':
            case 'STATUS': // Status uses label lookup but simple compare first
            case 'MASTER': // Master uses label lookup but simple compare first
            case 'CHANNEL':
                if (String(oldVal || '') !== String(newVal || '')) {
                    isDifferent = true;
                    
                    let displayOld = String(oldVal || '-');
                    let displayNew = String(newVal || '-');

                    if (config.type === 'STATUS') {
                        displayOld = getMasterLabel(oldVal, masterOptions);
                        displayNew = getMasterLabel(newVal, masterOptions);
                    } else if (config.type === 'MASTER') {
                        displayOld = getMasterLabel(oldVal, masterOptions);
                        displayNew = getMasterLabel(newVal, masterOptions);
                    } else if (config.type === 'CHANNEL') {
                        displayOld = getChannelName(oldVal, channels);
                        displayNew = getChannelName(newVal, channels);
                    }

                    // Special case for Description (Too long)
                    if (key === 'description') {
                        changeText = `${config.label}มีการแก้ไข`;
                    } else {
                        changeText = `${config.label}: ${displayOld} -> ${displayNew}`;
                    }
                }
                break;

            case 'DATE':
                const tOld = oldVal ? new Date(oldVal).getTime() : 0;
                const tNew = newVal ? new Date(newVal).getTime() : 0;
                // Ignore minimal time diffs (e.g. seconds) if logic dictates, but here exact check
                // However, dates from DB might be strings, dates from Form might be Date objects.
                if (tOld !== tNew) {
                    isDifferent = true;
                    changeText = `${config.label}: ${formatDateVal(oldVal)} -> ${formatDateVal(newVal)}`;
                }
                break;

            case 'USER_ARRAY':
            case 'ARRAY':
                const arrOld = Array.isArray(oldVal) ? oldVal : [];
                const arrNew = Array.isArray(newVal) ? newVal : [];
                
                // Sort for comparison
                const sortedOld = [...arrOld].sort();
                const sortedNew = [...arrNew].sort();
                
                if (JSON.stringify(sortedOld) !== JSON.stringify(sortedNew)) {
                    isDifferent = true;
                    
                    // Calculate Added/Removed
                    const added = arrNew.filter((x: any) => !arrOld.includes(x));
                    const removed = arrOld.filter((x: any) => !arrNew.includes(x));
                    
                    let diffParts = [];
                    
                    if (config.type === 'USER_ARRAY') {
                        if (added.length > 0) diffParts.push(`+${getUserNames(added, users).join(', ')}`);
                        if (removed.length > 0) diffParts.push(`-${getUserNames(removed, users).join(', ')}`);
                    } else {
                        if (added.length > 0) diffParts.push(`+${added.join(', ')}`);
                        if (removed.length > 0) diffParts.push(`-${removed.join(', ')}`);
                    }

                    changeText = `${config.label}: ${diffParts.join(' | ')}`;
                }
                break;
        }

        if (isDifferent && changeText) {
            changes.push(changeText);
        }
    });

    return changes;
};

// --- END SMART DIFF ENGINE ---

export const useTasks = (setIsModalOpen?: (isOpen: boolean) => void) => {
    // Consume state and fetchers from Context
    const { 
        tasks, setTasks, 
        fetchTasks, fetchSubTasks, fetchTaskById,
        checkAndExpandRange, fetchAllTasks, 
        isFetching 
    } = useTaskContext();
    
    const { showToast } = useToast();
    const { processAction } = useGamification();

    // --- ACTIONS (Write Operations) ---
    // Updated signature to accept Context Data for Diffing
    const handleSaveTask = async (
        task: Task, 
        editingTask: Task | null, 
        contextData?: SmartDiffContext
    ) => {
        const isContent = task.type === 'CONTENT';
        const table = isContent ? 'contents' : 'tasks';
        
        // Check update based on ID existence in current list, or explicit editingTask passed
        const existingTask = editingTask || tasks.find(t => t.id === task.id);
        const isUpdate = !!existingTask;

        // --- 🚀 Resiliency for Partial Tasks ---
        let taskToSave = { ...task };
        if ((task as any)._isPartial) {
            const fullTask = await fetchTaskById(task.id, task.type);
            if (fullTask) {
                taskToSave = { ...fullTask, ...task };
            }
        }

        const basePayload = {
            title: taskToSave.title,
            description: taskToSave.description,
            status: taskToSave.status,
            priority: taskToSave.priority,
            tags: taskToSave.tags,
            start_date: taskToSave.startDate.toISOString(),
            end_date: taskToSave.endDate.toISOString(),
            assignee_ids: taskToSave.assigneeIds || [],
            difficulty: taskToSave.difficulty || 'MEDIUM',
            estimated_hours: taskToSave.estimatedHours || 0,
            assignee_type: taskToSave.assigneeType,
            target_position: taskToSave.targetPosition,
            caution: taskToSave.caution,
            importance: taskToSave.importance,
            assets: taskToSave.assets || [], 
            ...(isContent ? {} : { 
                type: 'TASK', 
                content_id: taskToSave.contentId || null,
                roadmap_id: taskToSave.roadmapId || null,
                show_on_board: taskToSave.showOnBoard || false,
                script_id: taskToSave.scriptId || null 
            }) 
        };

        const contentPayload = isContent ? {
            pillar: taskToSave.pillar,
            content_format: taskToSave.contentFormat || (taskToSave.contentFormats && taskToSave.contentFormats.length > 0 ? taskToSave.contentFormats[0] : null),
            content_formats: taskToSave.contentFormats || [],
            category: taskToSave.category || null,
            remark: taskToSave.remark || null,
            channel_id: taskToSave.channelId || null,
            target_platform: taskToSave.targetPlatforms || null,
            is_unscheduled: taskToSave.isUnscheduled || false,
            idea_owner_ids: taskToSave.ideaOwnerIds || [],
            editor_ids: taskToSave.editorIds || [],
            performance: taskToSave.performance || null,
            published_links: taskToSave.publishedLinks || null,
            shoot_date: taskToSave.shootDate ? taskToSave.shootDate.toISOString() : null,
            shoot_location: taskToSave.shootLocation || null,
            local_path: taskToSave.localPath || null,
            drive_label: taskToSave.driveLabel || null,
        } : {};

        const nowStr = format(new Date(), 'yyyy-MM-dd');
        const isCurrentlyOverdue = !taskToSave.isUnscheduled && format(taskToSave.endDate, 'yyyy-MM-dd') < nowStr;

        const dbPayload = { 
            ...basePayload, 
            ...contentPayload,
            // Reset penalization if it's no longer overdue
            ...(isUpdate && existingTask?.is_penalized && !isCurrentlyOverdue ? {
                is_penalized: false,
                last_penalized_at: null
            } : {})
        };

        // --- Optimistic Update ---
        if (isUpdate) {
            const previousTasks = [...tasks];
            
            // Update Context State Immediately
            if (tasks.some(t => t.id === task.id)) {
                if (task.contentId && task.showOnBoard === false) {
                     setTasks(prev => prev.filter(t => t.id !== task.id));
                } else {
                     setTasks(prev => prev.map(t => t.id === task.id ? { ...t, ...task } : t));
                }
            } else {
                if (task.contentId && task.showOnBoard === true) {
                    setTasks(prev => [...prev, task]);
                }
            }
            
            if (!task.contentId && setIsModalOpen) {
                setIsModalOpen(false); 
            }

            try {
                const { error } = await supabase.from(table).update(dbPayload).eq('id', task.id);
                if (error) throw error;
                
                // --- NOTIFICATION: NEW ASSIGNMENT (ON UPDATE) ---
                if (existingTask && task.assigneeIds) {
                    const newAssignees = task.assigneeIds.filter(id => !existingTask.assigneeIds.includes(id));
                    if (newAssignees.length > 0) {
                        const notifications = newAssignees.map(uid => ({
                            user_id: uid,
                            type: 'NEW_ASSIGNMENT',
                            title: `⚡ งานใหม่: ${task.title}`,
                            message: `คุณได้รับมอบหมายงานใหม่: "${task.title}" กำหนดส่ง ${format(task.endDate, 'dd/MM/yyyy')}`,
                            related_id: task.id,
                            link_path: isContent ? 'ContentStock' : 'DASHBOARD',
                            is_read: false
                        }));
                        await supabase.from('notifications').insert(notifications);
                    }
                }

                // --- SMART AUDIT LOGGING (V10) ---
                const { data: { user } } = await supabase.auth.getUser();
                if (user && existingTask) {
                    // Compare old vs new with Smart Engine
                    const diffs = generateSmartDiff(existingTask, task, contextData);
                    
                    if (diffs.length > 0) {
                        await supabase.from('task_logs').insert({
                            task_id: isContent ? null : task.id,
                            content_id: isContent ? task.id : null,
                            user_id: user.id,
                            action: 'UPDATED',
                            details: `แก้ไข: ${diffs.join(', ')}`
                        });
                    }
                }
                
                showToast('แก้ไขข้อมูลสำเร็จ (Synced)', 'success');
                
                // Gamification
                const isCompleted = isTaskCompleted(task.status as string);
                const wasCompleted = existingTask && isTaskCompleted(existingTask.status as string);
                if (isCompleted && !wasCompleted) {
                    const peopleToReward = new Set([
                        ...(task.assigneeIds || []),
                        ...(task.ideaOwnerIds || []),
                        ...(task.editorIds || [])
                    ]);
                    peopleToReward.forEach(uid => processAction(uid, 'TASK_COMPLETE', { ...task, id: task.id }));
                }

            } catch (dbError: any) {
                console.error(dbError);
                setTasks(previousTasks); // Rollback
                showToast('บันทึกไม่สำเร็จ: ' + dbError.message, 'error');
            }
        } 
        else {
            // Create New
            try {
                const insertPayload = { id: task.id, ...dbPayload };
                const { error } = await supabase.from(table).insert(insertPayload);
                
                if (error) throw error;
                
                // --- NOTIFICATION: NEW ASSIGNMENT ---
                if (task.assigneeIds && task.assigneeIds.length > 0) {
                    const notifications = task.assigneeIds.map(uid => ({
                        user_id: uid,
                        type: 'NEW_ASSIGNMENT',
                        title: `⚡ งานใหม่: ${task.title}`,
                        message: `คุณได้รับมอบหมายงานใหม่: "${task.title}" กำหนดส่ง ${format(task.endDate, 'dd/MM/yyyy')}`,
                        related_id: task.id,
                        link_path: isContent ? 'ContentStock' : 'DASHBOARD',
                        is_read: false
                    }));
                    await supabase.from('notifications').insert(notifications);
                }

                // Update Context State (if suitable for list)
                if (!task.contentId) {
                    setTasks(prev => [...prev, task]);
                    if (setIsModalOpen) setIsModalOpen(false);
                }

                // Log Creation (Always log creations)
                const { data: { user } } = await supabase.auth.getUser();
                const logPayload: any = {
                     action: 'CREATED',
                     details: `สร้างใหม่: ${task.title}`,
                     user_id: user?.id
                };
                if (isContent) logPayload.content_id = task.id;
                else logPayload.task_id = task.id;
                await supabase.from('task_logs').insert(logPayload);

                showToast('สร้างใหม่สำเร็จ', 'success');

            } catch (dbError: any) {
                 console.error(dbError);
                 showToast('สร้างไม่สำเร็จ: ' + dbError.message, 'error');
            }
        }
    };

    const handleDelayTask = async (taskId: string, newDate: Date, reason: string, userId: string) => {
        const previousTasks = [...tasks];
        
        // Optimistic
        setTasks(prev => prev.map(t => t.id === taskId ? { 
            ...t, 
            startDate: newDate, 
            endDate: newDate 
        } : t));

        try {
            const targetTask = tasks.find(t => t.id === taskId);
            if (!targetTask) return;
            const table = targetTask.type === 'CONTENT' ? 'contents' : 'tasks';

            const { error: taskError } = await supabase
                .from(table)
                .update({ 
                    end_date: newDate.toISOString(), 
                    start_date: newDate.toISOString()
                })
                .eq('id', taskId);
            
            if (taskError) throw taskError;

            // Delayed tasks are significant, always log
            const logPayload: any = {
                user_id: userId,
                action: 'DELAYED',
                details: `เลื่อนกำหนดส่งเป็น ${format(newDate, 'dd/MM/yyyy')}`,
                reason: reason
            };
            if (targetTask.type === 'CONTENT') logPayload.content_id = taskId;
            else logPayload.task_id = taskId;

            await supabase.from('task_logs').insert(logPayload);
            showToast('บันทึกการเลื่อนงานแล้ว ⏳', 'warning');

        } catch (err: any) {
            setTasks(previousTasks); // Rollback
            showToast('เกิดข้อผิดพลาด: ' + err.message, 'error');
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        const previousTasks = [...tasks];
        
        setTasks(prev => prev.filter(t => t.id !== taskId));
        if (setIsModalOpen) setIsModalOpen(false);
        showToast('ลบเรียบร้อย', 'info');

        try {
            const targetTask = previousTasks.find(t => t.id === taskId);
            const table = targetTask?.type === 'CONTENT' ? 'contents' : 'tasks';

            const { error } = await supabase.from(table).delete().eq('id', taskId);
            if (error) throw error;
            
        } catch (dbError) {
             setTasks(previousTasks); // Rollback
             showToast('ลบไม่สำเร็จ (กู้คืนข้อมูล)', 'error');
        }
    };

    const handleSendToQC = async (task: Task, currentUser: User, submissionNotes?: string, submissionAssetUrl?: string) => {
        // 0. Fetch latest state from DB to ensure round consistency and prevent double submission
        // This is critical for resiliency against stale frontend state
        const { data: dbReviews, error: fetchError } = await supabase
            .from('task_reviews')
            .select('round, status')
            .eq('task_id', task.id)
            .order('round', { ascending: false });

        if (fetchError) throw fetchError;

        // 0.1 Check for existing pending review in DB
        const hasPending = dbReviews?.some(r => r.status === 'PENDING');
        if (hasPending) {
             const pendingRound = dbReviews?.find(r => r.status === 'PENDING')?.round;
             throw new Error(`ตวรจพบรายการ "Draft ${pendingRound}" ที่รอการตรวจสอบอยู่แล้วในระบบ กรุณารอการตรวจสอบรอบนี้ให้เสร็จสิ้นก่อนครับ`);
        }

        // 0.2 Calculate correct next round from DB
        const maxRoundInDB = dbReviews && dbReviews.length > 0 ? dbReviews[0].round : 0;
        const nextRound = maxRoundInDB + 1;

        // 1. Insert Review Record
        const { error: reviewError } = await supabase.from('task_reviews').insert({
            task_id: task.id,
            content_id: null,
            round: nextRound,
            scheduled_at: new Date().toISOString(),
            status: 'PENDING',
            reviewer_id: null,
            submission_notes: submissionNotes || null,
            submission_asset_url: submissionAssetUrl || null
        });

        if (reviewError) {
            // Handle unique constraint failure specifically if it still happens despite our check
            if (reviewError.code === '23505') {
                throw new Error('เกิดการส่งงานซ้ำซ้อนในเวลาเดียวกัน (Round Conflict) กรุณารีเฟรชและลองใหม่อีกครั้ง');
            }
            throw reviewError;
        }

        // 2. Log Action
        await supabase.from('task_logs').insert({
            task_id: task.id,
            user_id: currentUser.id,
            action: 'SENT_TO_QC',
            details: `ส่งงาน (Submission ${nextRound})`
        });

        // 3. Update Task Status to WAITING and show on board
        const targetStatus = 'WAITING';
        const { error: updateError } = await supabase
            .from('tasks')
            .update({ 
                status: targetStatus,
                show_on_board: true 
            })
            .eq('id', task.id);

        if (updateError) throw updateError;

        // 4. Send Notifications to Admins
        try {
            const { data: admins } = await supabase
                .from('profiles')
                .select('id')
                .eq('role', 'ADMIN')
                .eq('is_active', true);

            if (admins && admins.length > 0) {
                const notifications = admins.map(admin => ({
                    user_id: admin.id,
                    type: 'QC_REQUEST',
                    title: `🚀 งานรอตรวจ: ${task.title}`,
                    message: `${currentUser.name} ส่งงานให้ตรวจสอบ (รอบที่ ${nextRound})`,
                    related_id: task.id,
                    link_path: 'QUALITY_GATE',
                    is_read: false
                }));
                await supabase.from('notifications').insert(notifications);
            }
        } catch (notifError) {
            console.error("Failed to send QC notifications:", notifError);
            // Non-blocking error
        }

        // 5. Return updated task for optimistic UI
        const newOptimisticReview = {
            id: `temp-${Date.now()}`,
            taskId: task.id,
            round: nextRound,
            scheduledAt: new Date(),
            status: 'PENDING',
            reviewerId: null
        };

        const updatedTask: Task = { 
            ...task, 
            status: targetStatus,
            showOnBoard: true,
            reviews: [...(task.reviews || []), newOptimisticReview as any]
        };

        // Update global state if it's in the list
        setTasks(prev => prev.map(t => t.id === task.id ? updatedTask : t));

        return updatedTask;
    };

    return {
        tasks,
        fetchTasks,
        fetchSubTasks,
        fetchTaskById,
        handleSaveTask,
        handleDeleteTask,
        handleDelayTask,
        handleSendToQC,
        checkAndExpandRange,
        fetchAllTasks,
        isFetching
    };
};
