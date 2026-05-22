import React, { useState, useEffect, useRef } from 'react';
import { Task, Channel, User, MasterOption, ScriptSummary, Script } from '../../types';
import { useContentForm } from '../../hooks/useContentForm';
import { AlertTriangle, Trash2, Send, Loader2, Lock, Eye, Search, FileText, Check, X, Tag } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';
import { useGlobalDialog } from '../../context/GlobalDialogContext';
import TaskAssets from '../TaskAssets'; 
import { isTaskCompleted } from '../../constants';
import { useScripts } from '../../hooks/useScripts'; 
import { useSponsorship } from '../../hooks/useSponsorship';
import { SponsorshipDetail } from '../../types/task';
import CollapsibleTagInput, { CollapsibleTagInputRef } from '../shared/CollapsibleTagInput';

// Import Refactored Parts
import CFHeader from './content-parts/CFHeader';
import CFScriptLinker from './content-parts/CFScriptLinker';
import CFDateAndStock from './content-parts/CFDateAndStock';
import CFProductionInfo from './content-parts/CFProductionInfo';
import CFCategorization from './content-parts/CFCategorization';
import CFStatusChannel from './content-parts/CFStatusChannel';
import CFPlatformSelector from './content-parts/CFPlatformSelector';
import CFCrewSelector from './content-parts/CFCrewSelector';
import CFBrief from './content-parts/CFBrief';
import CFStoragePath from './content-parts/CFStoragePath';
import CFSponsorship from './form-parts/CFSponsorship';
import ContentActionFooter from './content-parts/ContentActionFooter'; // NEW

import ScriptEditor from '../script/ScriptEditor';

interface ContentFormProps {
    initialData?: Task | null;
    selectedDate?: Date | null;
    sourceScript?: Script | null; // NEW: Source script for promote flow
    channels: Channel[];
    users: User[];
    masterOptions: MasterOption[];
    currentUser?: User; 
    onSave: (task: Task) => void;
    onDelete?: (taskId: string) => void;
    onClose: () => void;
}

const ContentForm: React.FC<ContentFormProps> = ({ 
    initialData, selectedDate, sourceScript, channels, users, masterOptions, currentUser, onSave, onDelete, onClose 
}) => {
    const { showToast } = useToast();
    const { showAlert, showConfirm, showPrompt } = useGlobalDialog(); 
    
    // Script Hook
    const { createScript, getScriptByContentId, getScriptById, updateScript, generateScriptWithAI } = useScripts(currentUser || { id: '', name: '', role: 'MEMBER' } as User);
    const [linkedScript, setLinkedScript] = useState<ScriptSummary | null>(null);
    const [scriptToEdit, setScriptToEdit] = useState<Script | null>(null); 
    const [isLoadingScript, setIsLoadingScript] = useState(false);
    const [isSendingQC, setIsSendingQC] = useState(false);
    
    // Sponsorship state
    const { sponsorship: existingSponsorship } = useSponsorship(initialData?.id);
    const [sponsorshipData, setSponsorshipData] = useState<Partial<SponsorshipDetail> | null>(null);

    const tagInputRef = useRef<CollapsibleTagInputRef>(null);

    const {
        title, setTitle,
        description, setDescription,
        startDate, setStartDate,
        endDate, setEndDate,
        isStock, setIsStock,
        scheduledTime, setScheduledTime,
        status, setStatus,
        tags, setTags,
        channelId, setChannelId,
        targetPlatforms, 
        pillar, setPillar,
        contentFormats, setContentFormats,
        category, setCategory,
        publishedLinks, handleLinkChange,
        shootDate, setShootDate,
        shootLocation, setShootLocation,
        localPath, setLocalPath,
        driveLabel, setDriveLabel,
        ideaOwnerIds, setIdeaOwnerIds,
        editorIds, setEditorIds,
        assigneeIds, setAssigneeIds,
        assets, addAsset, removeAsset,
        error,
        formatOptions, pillarOptions, categoryOptions, statusOptions,
        handleSubmit: originalHandleSubmit, togglePlatform, toggleUserSelection,
        scriptId, setScriptId,
        isSaving
    } = useContentForm({
        initialData,
        selectedDate,
        sourceScript,
        channels,
        masterOptions,
        onSave: (task) => {
            const taskWithSponsorship = {
                ...task,
                sponsorship: sponsorshipData ? {
                    ...sponsorshipData,
                    taskId: task.id || initialData?.id || ''
                } : undefined
            };
            onSave(taskWithSponsorship as Task);
        },
        currentUser,
        tagInputRef
    });

    const activeUsers = users.filter(u => u.isActive);

    // --- SCRIPT LOGIC ---
    useEffect(() => {
        const checkScript = async () => {
            if (initialData?.id) {
                setIsLoadingScript(true);
                const script = await getScriptByContentId(initialData.id);
                if (script) {
                    setLinkedScript(script);
                    setScriptId(script.id); // Sync hook state
                }
                setIsLoadingScript(false);
            } else if (sourceScript) {
                // NEW: If new content but has sourceScript, show it as linked
                setLinkedScript({
                    id: sourceScript.id,
                    title: sourceScript.title,
                    status: sourceScript.status,
                    updatedAt: sourceScript.updatedAt,
                    author: sourceScript.author,
                    channelId: sourceScript.channelId
                } as ScriptSummary);
                setScriptId(sourceScript.id);
            }
        };
        checkScript();
    }, [initialData?.id, sourceScript]);

    const handleCreateScript = async () => {
        if (!initialData?.id) {
            await showAlert('กรุณาบันทึกงาน (Save) ก่อนสร้างสคริปต์ครับ', 'แจ้งเตือน');
            return;
        }
        
        const confirmed = await showConfirm('ต้องการสร้างสคริปต์ใหม่สำหรับงานนี้?', 'สร้างสคริปต์');
        
        if (confirmed) {
            setIsLoadingScript(true);
            const newScriptId = await createScript({
                title: title || 'Untitled Script',
                contentId: initialData.id,
                channelId: channelId || undefined,
                category: category || undefined
            });
            if (newScriptId) {
                // Refresh link
                const script = await getScriptByContentId(initialData.id);
                setLinkedScript(script);
                setScriptId(newScriptId); // Update Hook
                
                // Optional: Open Editor Immediately
                const fullData = await getScriptById(newScriptId);
                if (fullData) setScriptToEdit(fullData);
            }
            setIsLoadingScript(false);
        }
    };
    
    // NEW: Handle Link Existing Script
    const handleLinkScript = async (targetScriptId: string) => {
        if (!initialData?.id) return;
        
        setIsLoadingScript(true);
        try {
            // 1. Link script to this content in DB
            await updateScript(targetScriptId, { contentId: initialData.id });
            
            // 2. Fetch updated details to refresh UI
            const script = await getScriptByContentId(initialData.id);
            setLinkedScript(script);
            setScriptId(targetScriptId);
            
            showToast('เชื่อมโยงสคริปต์เรียบร้อย ✅', 'success');
        } catch (err) {
            console.error(err);
            showToast('เชื่อมโยงไม่สำเร็จ', 'error');
        } finally {
            setIsLoadingScript(false);
        }
    };

    // NEW: Handle Unlink Script
    const handleUnlinkScript = async () => {
        if (!linkedScript) return;
        
        const confirmed = await showConfirm('ต้องการยกเลิกการเชื่อมโยงสคริปต์นี้ใช่หรือไม่?', 'Unlink Script');
        if (!confirmed) return;

        setIsLoadingScript(true);
        try {
            // 1. Remove content_id from script
            // Note: updateScript expects Partial<Script> which maps keys to snake_case in hook.
            // But checking useScripts hook, it maps contentId -> content_id correctly.
            await updateScript(linkedScript.id, { contentId: null as any }); 
            
            setLinkedScript(null);
            setScriptId(undefined);
            showToast('ยกเลิกการเชื่อมโยงแล้ว', 'info');
        } catch (err) {
            console.error(err);
            showToast('ยกเลิกไม่สำเร็จ', 'error');
        } finally {
            setIsLoadingScript(false);
        }
    };

    const handleOpenScript = async () => {
        if (!linkedScript) return;
        setIsLoadingScript(true);
        const fullData = await getScriptById(linkedScript.id);
        setIsLoadingScript(false);
        
        if (fullData) {
            setScriptToEdit(fullData);
        } else {
            await showAlert('ไม่สามารถโหลดข้อมูลสคริปต์ได้', 'เกิดข้อผิดพลาด');
        }
    };

    const handleDeleteTask = async () => {
        console.log("handleDeleteTask called");
        const confirmed = await showConfirm('แน่ใจนะว่าจะลบงานนี้? การกระทำนี้ไม่สามารถย้อนกลับได้', 'ยืนยันการลบ');
        if (confirmed && initialData && onDelete) {
            console.log("Delete confirmed, calling onDelete");
            onDelete(initialData.id);
            onClose();
        }
    };

    const handleSendToQC = async () => {
        if (isSendingQC) return; // Prevent double submission
        
        if (!isOwnerOrAssignee) {
             await showAlert('เฉพาะผู้รับผิดชอบงานนี้เท่านั้นที่สามารถส่งงานได้', '🔒 สิทธิ์ไม่เพียงพอ');
             return;
        }
        
        // Critical: Lock immediate to prevent race condition
        setIsSendingQC(true);

        if (!initialData?.id) {
            await showAlert('กรุณาบันทึกงานครั้งแรกก่อนส่งตรวจครับ', 'แจ้งเตือน');
            setIsSendingQC(false);
            return;
        }

        // Check against current props to be safe, but local lock is primary
        const existingPendingReview = initialData.reviews?.find(r => r.status === 'PENDING');
        if (existingPendingReview) {
             await showAlert(`มีรายการ "Draft ${existingPendingReview.round}" รอตรวจอยู่แล้ว`, '⚠️ ส่งซ้ำไม่ได้');
             setIsSendingQC(false);
             return;
        }

        const currentRoundCount = initialData.reviews?.length || 0;
        const nextRound = currentRoundCount + 1;
        
        const submissionNotes = await showPrompt(
            `งานจะถูกเปลี่ยนสถานะเป็น "Waiting" และส่งแจ้งเตือนให้ Admin ทราบ\n\nระบุหมายเหตุถึงผู้ตรวจ (ถ้ามี):`,
            '',
            `🚀 ยืนยันส่งตรวจ "Draft ${nextRound}"`
        );

        if (submissionNotes === null) {
            setIsSendingQC(false);
            return;
        }

        try {
            const { error: reviewError } = await supabase.from('task_reviews').insert({
                content_id: initialData.id, 
                task_id: null,
                round: nextRound,
                scheduled_at: new Date().toISOString(),
                status: 'PENDING',
                reviewer_id: null,
                submission_notes: submissionNotes || null,
                submission_asset_url: assets.length > 0 ? assets[assets.length - 1].url : null
            });
            if (reviewError) throw reviewError;

            await supabase.from('task_logs').insert({
                content_id: initialData.id,
                action: 'SENT_TO_QC',
                details: `ส่งตรวจงาน (Draft ${nextRound})`,
                user_id: currentUser?.id
            });

            const targetStatus = 'FEEDBACK'; 
            
            // Construct pseudo-review object for immediate UI update (Prevent flickering empty state)
            const newOptimisticReview = {
                id: `temp-${Date.now()}`,
                taskId: initialData.id,
                round: nextRound,
                scheduledAt: new Date(),
                status: 'PENDING',
                reviewerId: null
            };

            // 1. Create updatedTask for Optimistic Update
            const updatedTask: Task = {
                ...initialData!,
                title,
                description,
                status: targetStatus,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                assigneeIds,
                // Add new review to array to block duplicate button clicks if re-opened
                reviews: [...(initialData.reviews || []), newOptimisticReview as any],
                // ...
                targetPosition: initialData.targetPosition,
                assets,
                showOnBoard: true 
            };

            // 2. Update DB
            const { error: updateError } = await supabase
                .from('contents')
                .update({ status: targetStatus })
                .eq('id', initialData.id);

            if (updateError) throw updateError;

            // 3. Sync to Parent
            setStatus(targetStatus);
            onSave(updatedTask);

            // --- NOTIFY ADMINS ---
            const admins = users.filter(u => u.role === 'ADMIN');
            if (admins.length > 0) {
                 const notifications = admins.map(admin => ({
                     user_id: admin.id,
                     type: 'REVIEW',
                     title: `🔍 งานส่งตรวจใหม่: ${title}`,
                     message: `ส่งโดย ${currentUser?.name || 'Unknown'} (Draft ${nextRound})`,
                     related_id: initialData.id,
                     link_path: 'QUALITY_GATE',
                     is_read: false
                 }));
                 await supabase.from('notifications').insert(notifications);
            }
            
            showToast(`ส่ง Draft ${nextRound} เรียบร้อย! 🚀`, 'success');
            onClose();

        } catch (err: any) {
            console.error(err);
            showToast('ส่งตรวจไม่สำเร็จ: ' + err.message, 'error');
            setIsSendingQC(false); 
        } finally {
            // Keep loading true if successful to prevent button re-enable before close
            // If error, we already set false in catch, but safety here:
            // setIsSendingQC(false); // Only if we didn't close
        }
    };

    const isEditorOpen = scriptToEdit && currentUser;

    // --- Determine Permission ---
    const isOwnerOrAssignee = (currentUser && (
        ideaOwnerIds.includes(currentUser.id) || 
        editorIds.includes(currentUser.id) || 
        assigneeIds.includes(currentUser.id)
    )) || currentUser?.role === 'ADMIN';

    // Show QC Button Condition - Set to false since only task type "tasks" will support QC
    const shouldShowSendQC = false;

    return (
        <div className="relative h-full w-full overflow-hidden">
            {/* Form Mode */}
            <div className={`h-full w-full ${isEditorOpen || isLoadingScript ? 'hidden' : ''}`}>
                <form onSubmit={originalHandleSubmit} className="flex flex-col flex-1 min-h-0 h-full bg-white relative overflow-hidden text-slate-900">
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-200">
                        {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-2xl text-sm flex items-center shadow-sm border border-red-100 animate-bounce"><AlertTriangle className="w-4 h-4 mr-2" />{error}</div>}

                        <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                            
                            {/* 1. Title Input */}
                            <CFHeader title={title} setTitle={setTitle} />
                            
                            {/* 2. Status & Channel (Command Bar) - MOVED TO TOP */}
                            <CFStatusChannel 
                                status={status} setStatus={setStatus}
                                channelId={channelId} setChannelId={setChannelId}
                                statusOptions={statusOptions} channels={channels}
                            />

                            {/* MOVED: 10. File Storage Path */}
                            <CFStoragePath 
                                localPath={localPath} setLocalPath={setLocalPath} 
                                driveLabel={driveLabel} setDriveLabel={setDriveLabel}
                            />

                            {/* 3. Script Integration - Updated for Linking */}
                            <CFScriptLinker 
                                hasContentId={!!initialData?.id}
                                sourceScript={sourceScript}
                                linkedScript={linkedScript}
                                isLoadingScript={isLoadingScript}
                                onOpenScript={handleOpenScript}
                                onCreateScript={handleCreateScript}
                                onLinkScript={handleLinkScript} 
                                onUnlinkScript={handleUnlinkScript}
                                currentUser={currentUser} 
                            />

                            {/* 4. Date & Stock */}
                            <CFDateAndStock 
                                startDate={startDate} setStartDate={setStartDate}
                                endDate={endDate} setEndDate={setEndDate}
                                isStock={isStock} setIsStock={setIsStock}
                                scheduledTime={scheduledTime} setScheduledTime={setScheduledTime}
                            />

                            {/* 5. Production Info */}
                            <CFProductionInfo 
                                shootDate={shootDate} setShootDate={setShootDate}
                                shootLocation={shootLocation} setShootLocation={setShootLocation}
                                masterOptions={masterOptions} 
                            />

                            {/* 6. Format & Pillar */}
                            <CFCategorization 
                                contentFormats={contentFormats} setContentFormats={setContentFormats}
                                pillar={pillar} setPillar={setPillar}
                                category={category} setCategory={setCategory}
                                formatOptions={formatOptions} pillarOptions={pillarOptions} categoryOptions={categoryOptions}
                            />

                            {/* Tags / Hashtags Section */}
                            <CollapsibleTagInput 
                                ref={tagInputRef}
                                tags={tags} 
                                onTagsChange={setTags} 
                                placeholder="พิมพ์แท็ก (เช่น #ความรู้, #vlog) แล้วกด Enter..." 
                            />

                            {/* 7. Platforms & Links */}
                            <CFPlatformSelector 
                                targetPlatforms={targetPlatforms}
                                togglePlatform={togglePlatform}
                                publishedLinks={publishedLinks}
                                handleLinkChange={handleLinkChange}
                            />

                            {/* 8. Crew Selection */}
                            <CFCrewSelector 
                                users={activeUsers}
                                ideaOwnerIds={ideaOwnerIds} editorIds={editorIds} assigneeIds={assigneeIds}
                                setIdeaOwnerIds={setIdeaOwnerIds} setEditorIds={setEditorIds} setAssigneeIds={setAssigneeIds}
                                toggleUserSelection={toggleUserSelection}
                            />

                            {/* Sponsorship Section */}
                            <CFSponsorship 
                                taskId={initialData?.id}
                                initialData={existingSponsorship}
                                onChange={setSponsorshipData}
                            />

                            {/* 9. Description */}
                            <CFBrief description={description} setDescription={setDescription} />

                            {/* 11. Assets */}
                             <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                <TaskAssets 
                                    assets={assets}
                                    onAdd={addAsset}
                                    onDelete={removeAsset}
                                />
                            </div>
                        </div>
                    </div>

                    {/* NEW FOOTER COMPONENT - IN FLOW */}
                    <div className="bg-white shrink-0 z-30 px-3 sm:px-6 pb-3 sm:pb-6 pt-1 sm:pt-2 border-t border-gray-100">
                        <ContentActionFooter 
                            mode={initialData ? 'EDIT' : 'CREATE'}
                            onCancel={onClose}
                            onDelete={handleDeleteTask}
                            onSendQC={handleSendToQC}
                            isSaving={Boolean(isSaving)} // Cast or check undefined from hook
                            isSendingQC={isSendingQC}
                            canSendQC={isOwnerOrAssignee}
                            showSendQC={Boolean(shouldShowSendQC)}
                            showDelete={Boolean(initialData && onDelete)}
                        />
                    </div>
                </form>
            </div>

            {/* Loading Overlay */}
            {isLoadingScript && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-[60]">
                    <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
                    <p className="text-gray-500 font-bold">กำลังโหลดข้อมูล...</p>
                </div>
            )}

            {/* Script Editor Overlay */}
            {isEditorOpen && (
                <div className="absolute inset-0 z-50 bg-white animate-in zoom-in-95 duration-200">
                    <ScriptEditor 
                        script={scriptToEdit}
                        users={users}
                        channels={channels}
                        masterOptions={masterOptions}
                        currentUser={currentUser}
                        onClose={() => {
                            setScriptToEdit(null);
                            if (initialData?.id) {
                                getScriptByContentId(initialData.id).then(setLinkedScript);
                            }
                        }}
                        onSave={updateScript}
                        onGenerateAI={async (prompt, type) => {
                            const result = await generateScriptWithAI(prompt, type);
                            return result ?? null;
                        }}
                        onPromote={() => {}} // Pass handler
                    />
                </div>
            )}
        </div>
    );
};


export default ContentForm;