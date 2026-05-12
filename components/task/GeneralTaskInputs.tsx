
import React, { useState, useEffect } from 'react';
import { Task, User, MasterOption, ScriptSummary, Channel, DeadlineRequest, ReviewSession } from '../../types';
import { useGeneralTaskForm } from '../../hooks/useGeneralTaskForm';
import { AlertTriangle, Trash2, Send, Loader2, Lock, Eye, CheckCircle, XCircle, Calendar as CalendarIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';
import { useGlobalDialog } from '../../context/GlobalDialogContext';
import TaskAssets from '../TaskAssets'; 
import { isTaskCompleted } from '../../constants';
import { format } from 'date-fns';
import { useScripts } from '../../hooks/useScripts'; 
import { useDeadlineRequests } from '../../hooks/useDeadlineRequests';
import { useTasks } from '../../hooks/useTasks';

// Import Form Parts
import GTAssigneeSelector from './form-parts/GTAssigneeSelector';
import GTHeaderInput from './form-parts/GTHeaderInput';
import GTProjectLinker from './form-parts/GTProjectLinker';
import GTCoreDetails from './form-parts/GTCoreDetails';
import GTGuidelines from './form-parts/GTGuidelines';
import GTGamification from './form-parts/GTGamification';
import GTDateScheduler from './form-parts/GTDateScheduler';
import GTScriptLinker from './form-parts/GTScriptLinker'; 
import CreateScriptModal from '../script/hub/CreateScriptModal';
import ContentActionFooter from './content-parts/ContentActionFooter';
import DeadlineExtensionModal from './form-parts/DeadlineExtensionModal';

interface GeneralTaskInputsProps {
    initialData?: Task | null;
    selectedDate?: Date | null;
    users: User[];
    masterOptions: MasterOption[];
    currentUser?: User; 
    onSave: (task: Task) => void;
    onDelete?: (taskId: string) => void;
    onClose: () => void;
    projects?: Task[]; 
    channels?: Channel[]; // Add optional channels prop
    // New Props for Script Editor interaction
    onEditScript: (scriptId: string) => void;
    onOpenTask?: (task: Task) => void;
}

const GeneralTaskInputs: React.FC<GeneralTaskInputsProps> = ({ 
    initialData, selectedDate, users, masterOptions, currentUser, onSave, onDelete, onClose, projects = [], channels = [], onEditScript, onOpenTask
}) => {
    const { showToast } = useToast();
    const { showConfirm, showAlert, showPrompt } = useGlobalDialog();
    const [isSendingQC, setIsSendingQC] = useState(false);
    const [qcSenderName, setQcSenderName] = useState<string>('');
    const isAdmin = currentUser?.role === 'ADMIN';
    const isCreative = currentUser?.position === 'Creative' || isAdmin;

    const {
        title, setTitle,
        description, setDescription,
        status, setStatus,
        priority, setPriority,
        startDate, setStartDate,
        endDate, setEndDate,
        assigneeType, setAssigneeType,
        assigneeIds, setAssigneeIds,
        targetPosition, setTargetPosition,
        caution, setCaution,
        importance, setImportance,
        difficulty, setDifficulty,
        estimatedHours, setEstimatedHours,
        contentId, handleSetParentProject,
        showOnBoard, setShowOnBoard,
        scriptId, setScriptId, 
        assets, addAsset, removeAsset,
        error,
        isSaving,
        taskStatusOptions,
        handleSubmit,
        toggleUserSelection
    } = useGeneralTaskForm({
        initialData,
        selectedDate,
        users,
        masterOptions,
        onSave,
        projects,
        currentUser
    });

    const { handleSendToQC: sendToQC } = useTasks();
    
    // --- Script Linking Logic (Local to Form) ---
    const { 
        getScriptById, 
        createScript 
    } = useScripts(currentUser || { id: '', name: '', role: 'MEMBER' } as User);

    const [linkedScript, setLinkedScript] = useState<ScriptSummary | null>(null);
    const [isLoadingScript, setIsLoadingScript] = useState(false);
    const [isCreateScriptModalOpen, setIsCreateScriptModalOpen] = useState(false);

    // Fetch Linked Script Summary (to show in the Linker Card)
    useEffect(() => {
        const fetchLinked = async () => {
            if (scriptId) {
                setIsLoadingScript(true);
                const script = await getScriptById(scriptId);
                if (script) setLinkedScript(script);
                setIsLoadingScript(false);
            } else {
                setLinkedScript(null);
            }
        };
        fetchLinked();
    }, [scriptId]);

    // Handle Create Script
    const handleCreateScriptSubmit = async (data: any) => {
        const newScriptId = await createScript({
            ...data,
        });
        if (newScriptId) {
            setScriptId(newScriptId);
            setIsCreateScriptModalOpen(false);
            // CHANGED: Removed auto-open. Just notify and link.
            showToast('สร้างสคริปต์เรียบร้อย! (Linked)', 'success');
        }
    };
    
    // --- Deadline Extension Logic ---
    const [isExtensionModalOpen, setIsExtensionModalOpen] = useState(false);
    const [pendingExtension, setPendingExtension] = useState<DeadlineRequest | null>(null);
    const { getPendingRequestForTask, createRequest, resolveRequest, isLoading: isProcessingExtension } = useDeadlineRequests(currentUser);

    useEffect(() => {
        const fetchPendingExtension = async () => {
            if (!initialData?.id) return;
            const request = await getPendingRequestForTask(initialData.id);
            setPendingExtension(request);
        };
        fetchPendingExtension();
    }, [initialData?.id, getPendingRequestForTask]);

    const handleRequestExtension = async (newDateStr: string, reason: string) => {
        if (!initialData?.id) return;
        
        const { success, data, error } = await createRequest(initialData.id, newDateStr, reason);
        
        if (success && data) {
            showToast('ส่งคำขอเลื่อน Deadline แล้ว รอ Admin อนุมัติ', 'success');
            setIsExtensionModalOpen(false);
            setPendingExtension(data);
        } else {
            showToast('เกิดข้อผิดพลาดในการส่งคำขอ: ' + error, 'error');
        }
    };

    const handleResolveExtension = async (requestId: string, isApproved: boolean, newDate?: Date) => {
        if (!initialData?.id) return;
        
        // Optimistic Update: Remove pending banner and update end date
        const previousExtension = pendingExtension;
        const previousEndDate = endDate;
        
        setPendingExtension(null);
        if (isApproved && newDate) {
            setEndDate(newDate.toISOString().split('T')[0]);
        }
        
        // Background API Call
        const { success, error } = await resolveRequest(requestId, initialData.id, isApproved, newDate);
        
        if (success) {
            showToast(isApproved ? 'อนุมัติการเลื่อน Deadline แล้ว' : 'ปฏิเสธคำขอแล้ว', 'success');
        } else {
            // Revert on failure
            setPendingExtension(previousExtension);
            setEndDate(previousEndDate);
            showToast('เกิดข้อผิดพลาด: ' + error, 'error');
        }
    };

    // --- Standard Task Logic ---

    useEffect(() => {
        const fetchSender = async () => {
            if (status === 'WAITING' && initialData?.id) {
                const { data } = await supabase
                    .from('task_logs')
                    .select('user_id, profiles(full_name)')
                    .eq('task_id', initialData.id)
                    .eq('action', 'SENT_TO_QC')
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();
                
                if (data && (data as any).profiles) {
                    setQcSenderName((data as any).profiles.full_name);
                }
            }
        };
        fetchSender();
    }, [status, initialData?.id]);

    const activeUsers = users.filter(u => u.isActive);
    
    // Fix: Permission should be based on INITIAL data to prevent self-unlocking
    const initialAssignees = initialData?.assigneeIds || [];
    const isOwnerOrAssignee = (currentUser && initialAssignees.includes(currentUser.id)) || isAdmin;
    
    const isWaiting = status === 'WAITING';
    const isReadOnly = (!!initialData && !isOwnerOrAssignee) || (isWaiting && !isAdmin);

    const filteredStatusOptions = React.useMemo(() => {
        if (isAdmin) return taskStatusOptions;
        // Member only Todo and Doing as requested
        return taskStatusOptions.filter(opt => opt.key === 'TODO' || opt.key === 'DOING');
    }, [taskStatusOptions, isAdmin]);

    const suggestedTasks = React.useMemo(() => {
        if (assigneeType !== 'INDIVIDUAL' || assigneeIds.length !== 1) return [];
        const user = users.find(u => u.id === assigneeIds[0]);
        if (!user || !user.position) return [];
        const positionOpt = masterOptions.find(o => o.type === 'POSITION' && o.label === user.position);
        if (positionOpt) {
            return masterOptions.filter(o => o.type === 'RESPONSIBILITY' && o.parentKey === positionOpt.key);
        }
        return [];
    }, [assigneeIds, assigneeType, users, masterOptions]);

    const handleSendToQC = async () => {
        if (isSendingQC) return;
        if (!isOwnerOrAssignee) {
             await showAlert('เฉพาะผู้รับผิดชอบงานนี้เท่านั้นที่สามารถส่งงานได้', '🔒 สิทธิ์ไม่เพียงพอ');
             return;
        }

        setIsSendingQC(true);

        if (!initialData?.id) {
            await showAlert('กรุณาบันทึกงานครั้งแรกก่อนส่งตรวจครับ', 'แจ้งเตือน');
            setIsSendingQC(false);
            return;
        }

        const currentRoundCount = initialData.reviews?.length || 0;
        const nextRound = currentRoundCount + 1;

        const submissionNotes = await showPrompt(
            `งานจะถูกเปลี่ยนสถานะเป็น "รอตรวจ (Waiting)" และส่งแจ้งเตือนให้หัวหน้าทราบ\n\nระบุหมายเหตุถึงผู้ตรวจ (ถ้ามี):`,
            '',
            `🚀 ยืนยันส่งตรวจ "Draft ${nextRound}"`
        );

        if (submissionNotes === null) {
            setIsSendingQC(false);
            return;
        }

        try {
            // Updated: Pass submission notes and assets directly to sendToQC to avoid double insertion
            const submissionAssetUrl = assets.length > 0 ? assets[assets.length - 1].url : undefined;
            const updatedTask = await sendToQC(initialData, currentUser!, submissionNotes || undefined, submissionAssetUrl);
            
            setStatus(updatedTask.status);
            onSave(updatedTask);
            
            await showAlert('ส่งงานเรียบร้อยแล้ว! 🚀 หัวหน้าจะได้รับแจ้งเตือนทันทีและงานจะย้ายไปที่ช่อง "รอตรวจ"', 'ส่งงานสำเร็จ');
            onClose();

        } catch (err: any) {
            console.error("Submission error details:", err);
            showToast(err.message || 'ส่งงานไม่สำเร็จ', 'error');
            setIsSendingQC(false); 
        }
    };

    const handleUserSelectWrapper = (userId: string) => {
        toggleUserSelection(userId);
        if (assigneeType === 'INDIVIDUAL') {
            const isSelecting = !assigneeIds.includes(userId);
            if (isSelecting) {
                const user = users.find(u => u.id === userId);
                if (user && user.position) {
                    setTargetPosition(user.position);
                }
            } else {
                setTargetPosition(''); 
            }
        }
    };

    const isTaskDone = isTaskCompleted(status);

    return (
        <>
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 h-full bg-white relative overflow-hidden text-slate-900">
                {/* Top Alert Banner for QC */}
                {isWaiting && (
                    <div className="bg-yellow-50 border-b border-yellow-100 px-6 py-3 flex items-center gap-3 animate-in slide-in-from-top duration-300 shrink-0">
                        <Lock className="w-5 h-5 text-yellow-600 shrink-0" />
                        <p className="text-sm text-yellow-800">
                            <span className="font-bold">⚠️ งานนี้อยู่ระหว่างการตรวจสอบ (Round {initialData?.reviews?.find(r => r.status === 'PENDING')?.round || initialData?.reviews?.length || 1})</span>
                            {' '}ส่งเมื่อวันที่ {initialData?.reviews?.find(r => r.status === 'PENDING')?.scheduledAt ? format(new Date(initialData.reviews.find(r => r.status === 'PENDING')!.scheduledAt), 'd MMM yyyy') : format(new Date(), 'd MMM yyyy')}
                            {qcSenderName && ` โดย ${qcSenderName}`} - ฟิลด์ข้อมูลจะถูกล็อคชั่วคราว
                        </p>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-200">
                    {isReadOnly && (
                        <div className="bg-slate-100 border-l-4 border-slate-400 p-4 rounded-r-lg animate-in slide-in-from-top-2">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <Eye className="h-5 w-5 text-slate-500" />
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-slate-700">
                                        <span className="font-bold">View Only Mode:</span> คุณไม่มีสิทธิ์แก้ไขงานนี้ (เฉพาะผู้รับผิดชอบหรือ Admin)
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-2xl text-sm flex items-center shadow-sm border border-red-100 animate-bounce"><AlertTriangle className="w-4 h-4 mr-2" />{error}</div>}

                    {/* Pending Extension Banner */}
                    {pendingExtension && (
                        <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl animate-in slide-in-from-top-2">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl shrink-0 mt-0.5">
                                        <CalendarIcon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-indigo-900">
                                            {isAdmin ? 'คำขอเลื่อน Deadline' : 'กำลังรออนุมัติเลื่อน Deadline'}
                                        </h4>
                                        <p className="text-xs text-indigo-700 mt-1">
                                            <span className="font-semibold">{pendingExtension.user?.name || 'Member'}</span> ขอเลื่อนเป็นวันที่ <span className="font-bold">{pendingExtension.newDeadline.toLocaleDateString('th-TH')}</span>
                                        </p>
                                        <div className="mt-2 text-xs text-indigo-600/80 bg-white/50 p-2 rounded-lg italic">
                                            "{pendingExtension.reason}"
                                        </div>
                                    </div>
                                </div>
                                {isAdmin && (
                                    <div className="flex flex-col gap-2 shrink-0 ml-4">
                                        <button 
                                            type="button"
                                            onClick={() => handleResolveExtension(pendingExtension.id, true, pendingExtension.newDeadline)}
                                            className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                                        >
                                            <CheckCircle className="w-3.5 h-3.5" /> อนุมัติ
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => handleResolveExtension(pendingExtension.id, false)}
                                            className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                                        >
                                            <XCircle className="w-3.5 h-3.5" /> ปฏิเสธ
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <fieldset disabled={isReadOnly} className={`space-y-6 ${isReadOnly ? 'opacity-95 pointer-events-none' : ''}`}>
                        
                        <GTAssigneeSelector 
                            assigneeType={assigneeType}
                            setAssigneeType={setAssigneeType}
                            assigneeIds={assigneeIds}
                            setAssigneeIds={setAssigneeIds}
                            targetPosition={targetPosition}
                            setTargetPosition={setTargetPosition}
                            activeUsers={activeUsers}
                            toggleUserSelection={handleUserSelectWrapper} 
                            startDate={startDate}
                            endDate={endDate}
                            isReadOnly={isReadOnly}
                        />

                        <GTHeaderInput 
                            title={title}
                            setTitle={setTitle}
                            assigneeType={assigneeType}
                            suggestedTasks={suggestedTasks} 
                        />
                        
                        {/* Script Linker with Bridge to Parent */}
                        {isCreative && (
                            <GTScriptLinker 
                                scriptId={scriptId}
                                linkedScript={linkedScript}
                                isLoadingScript={isLoadingScript}
                                onSelectScript={(id) => {
                                    setScriptId(id);
                                }}
                                onCreateScript={() => setIsCreateScriptModalOpen(true)}
                                onOpenScript={(script) => onEditScript(script.id)} // BRIDGE: Call Parent to Open Editor
                                onUnlink={() => setScriptId(undefined)}
                                currentUser={currentUser}
                            />
                        )}

                        {/* Updated Project Linker props */}
                        <GTProjectLinker 
                            projectId={contentId || ''}
                            setProjectId={(id) => handleSetParentProject(id || null)}
                            projects={projects}
                            channels={channels}
                            masterOptions={masterOptions}
                            onOpenTask={onOpenTask}
                        />

                        <GTCoreDetails 
                            description={description}
                            setDescription={setDescription}
                            priority={priority}
                            setPriority={setPriority}
                            status={status}
                            setStatus={setStatus}
                            showOnBoard={showOnBoard}
                            setShowOnBoard={setShowOnBoard}
                            taskStatusOptions={filteredStatusOptions} 
                            currentUser={currentUser}
                        />

                        <GTGuidelines 
                            caution={caution}
                            setCaution={setCaution}
                            importance={importance}
                            setImportance={setImportance}
                        />

                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                            <TaskAssets 
                                assets={assets}
                                onAdd={addAsset}
                                onDelete={removeAsset}
                            />
                        </div>

                        <GTGamification 
                            difficulty={difficulty}
                            setDifficulty={setDifficulty}
                            estimatedHours={estimatedHours}
                            setEstimatedHours={setEstimatedHours}
                        />

                        <GTDateScheduler 
                            startDate={startDate}
                            setStartDate={setStartDate}
                            endDate={endDate}
                            setEndDate={setEndDate}
                            isEndDateLocked={!!initialData && !isAdmin}
                            onRequestExtension={() => setIsExtensionModalOpen(true)}
                        />
                    </fieldset>
                </div>
                    
                <div className="bg-white shrink-0 z-30 px-3 sm:px-6 pb-3 sm:pb-6 pt-1 sm:pt-2 border-t border-gray-100">
                    <ContentActionFooter 
                        mode={initialData ? 'EDIT' : 'CREATE'}
                        onCancel={onClose}
                        onDelete={initialData && onDelete && isAdmin ? (async () => { if(await showConfirm('แน่ใจนะว่าจะลบงานนี้?', 'ยืนยันการลบ')) { onDelete(initialData.id); onClose(); } }) : undefined}
                        onSendQC={handleSendToQC}
                        isSaving={Boolean(isSaving)}
                        isSendingQC={isSendingQC}
                        canSendQC={isOwnerOrAssignee}
                        isReadOnly={isReadOnly}
                        showSendQC={Boolean(initialData && !isTaskDone && status !== 'WAITING')}
                        showDelete={Boolean(initialData && onDelete && isAdmin)}
                    />
                </div>
            </form>

            {/* Create Script Modal - Moved OUTSIDE the form */}
            <CreateScriptModal 
                isOpen={isCreateScriptModalOpen}
                onClose={() => setIsCreateScriptModalOpen(false)}
                onSubmit={handleCreateScriptSubmit}
                channels={channels}
                masterOptions={masterOptions}
                users={users}
                currentUser={currentUser || { id: '', name: '', role: 'MEMBER' } as User}
            />

            {/* Deadline Extension Modal */}
            <DeadlineExtensionModal 
                isOpen={isExtensionModalOpen}
                onClose={() => setIsExtensionModalOpen(false)}
                onSubmit={handleRequestExtension}
                currentEndDate={endDate}
            />
        </>
    );
};

export default GeneralTaskInputs;
