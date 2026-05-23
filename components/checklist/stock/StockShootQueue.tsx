import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Task, ScriptSummary, Channel, User, MasterOption } from '../../../types';
import { supabase } from '../../../lib/supabase';
import { Loader2, Video, Film, Clapperboard, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../../context/ToastContext';
import { useGlobalDialog } from '../../../context/GlobalDialogContext';
import { useShootQueueContext } from '../../../context/ShootQueueContext';

// Sub-components
import { MergedQueueItem, QueueViewMode } from './queue/types';
import QueueHeader from './queue/QueueHeader';
import QueueGridView from './queue/QueueGridView';
import QueueTableView from './queue/QueueTableView';
import ShootPlanningModal from './queue/ShootPlanningModal';

interface StockShootQueueProps {
    channels: Channel[];
    users: User[];
    masterOptions: MasterOption[];
    onEditContent: (task: Task) => void;
    onEditScript?: (scriptId: string) => void;
}

const StockShootQueue: React.FC<StockShootQueueProps> = ({ channels, users, masterOptions, onEditContent, onEditScript }) => {
    const { showToast } = useToast();
    const { showConfirm, showLoading, hideLoading } = useGlobalDialog();
    const { 
        queueItems, 
        setQueueItems, 
        isLoading: isContextLoading, 
        refreshQueue, 
        checkAndRefreshIfNeeded,
        updateLocalItem,
        removeItemLocally
    } = useShootQueueContext();

    const [includeScripts, setIncludeScripts] = useState(true);
    const [isProcessing, setIsProcessing] = useState<string | null>(null);
    const [isBatchProcessing, setIsBatchProcessing] = useState(false);
    const [viewMode, setViewMode] = useState<QueueViewMode>('TABLE');
    const [planningItem, setPlanningItem] = useState<MergedQueueItem | null>(null);
    const [isRedirecting, setIsRedirecting] = useState(false);

    const finishedCount = useMemo(() => 
        queueItems.filter(i => i.isSoftFinished).map(i => i.id).length
    , [queueItems]);

    useEffect(() => {
        // Use smart refresh: show cache immediately, then check fingerprint
        checkAndRefreshIfNeeded(includeScripts);

        // Realtime Subscription (Lazy: Connects only when visible, Unsubscribes on unmount)
        const channel = supabase.channel('shoot-queue-realtime')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'contents' }, (payload) => {
                const updated = payload.new as any;
                if (!updated.is_in_shoot_queue) {
                    removeItemLocally(updated.id);
                } else {
                    updateLocalItem(updated.id, {
                        title: updated.title,
                        status: updated.status,
                        isSoftFinished: !!updated.is_soft_finished,
                        shootLocation: updated.shoot_location,
                        shootTimeStart: updated.shoot_time_start,
                        shootTimeEnd: updated.shoot_time_end,
                        shootNotes: updated.shoot_notes,
                        channelId: updated.channel_id
                    });
                    // Smart fingerprinted refresh to add newly queued items in real-time
                    checkAndRefreshIfNeeded(includeScripts);
                }
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'scripts' }, (payload) => {
                const updated = payload.new as any;
                if (!updated.is_in_shoot_queue) {
                    removeItemLocally(updated.id);
                } else {
                    updateLocalItem(updated.id, {
                        title: updated.title,
                        status: updated.status,
                        isSoftFinished: !!updated.is_soft_finished,
                        shootLocation: updated.shoot_location,
                        shootTimeStart: updated.shoot_time_start,
                        shootTimeEnd: updated.shoot_time_end,
                        shootNotes: updated.shoot_notes,
                        channelId: updated.channel_id
                    });
                    // Smart fingerprinted refresh to add newly queued items in real-time
                    checkAndRefreshIfNeeded(includeScripts);
                }
            })
            .subscribe();

        return () => {
            console.log('[StockShootQueue] Unsubscribing from Realtime to save Egress...');
            supabase.removeChannel(channel);
        };
    }, [includeScripts, checkAndRefreshIfNeeded, updateLocalItem, removeItemLocally]);

    const handleReorder = async (newItems: MergedQueueItem[]) => {
        // Optimistic update in context
        setQueueItems(newItems.map((item, index) => ({ ...item, sort_order: index })));

        try {
            const updates = newItems.map((item, index) => {
                const table = item.type === 'CONTENT' ? 'contents' : 'scripts';
                return supabase
                    .from(table)
                    .update({ sort_order: index })
                    .eq('id', item.id);
            });

            await Promise.all(updates);
        } catch (err) {
            console.error('Reorder update failed:', err);
            showToast('จัดลำดับไม่สำเร็จ', 'error');
            refreshQueue(includeScripts); // Revert from server
        }
    };

    const handleRemoveFromQueue = async (item: MergedQueueItem) => {
        const confirmed = await showConfirm(
            `คุณต้องการนำรายการ "${item.title}" ออกจากคิวถ่ายทำใช่หรือไม่?`,
            'ยืนยันการนำออก'
        );

        if (confirmed) {
            removeItemLocally(item.id);

            try {
                const table = item.type === 'CONTENT' ? 'contents' : 'scripts';
                const { error } = await supabase
                    .from(table)
                    .update({ is_in_shoot_queue: false })
                    .eq('id', item.id);

                if (error) throw error;
                showToast('นำออกจากคิวเรียบร้อย', 'success');
            } catch (err) {
                console.error('Remove from queue failed:', err);
                showToast('นำออกจากคิวไม่สำเร็จ', 'error');
                refreshQueue(includeScripts); // Revert
            }
        }
    };

    const toggleFinished = async (item: MergedQueueItem) => {
        const newStatus = !item.isSoftFinished;
        updateLocalItem(item.id, { isSoftFinished: newStatus });

        try {
            const table = item.type === 'CONTENT' ? 'contents' : 'scripts';
            const { error } = await supabase
                .from(table)
                .update({ is_soft_finished: newStatus })
                .eq('id', item.id);
            
            if (error) throw error;
        } catch (err) {
            console.error('Toggle soft finish failed:', err);
            updateLocalItem(item.id, { isSoftFinished: !newStatus });
            showToast('อัปเดตสถานะไม่สำเร็จ', 'error');
        }
    };

    const handleMarkAsDone = async (item: MergedQueueItem) => {
        const confirmed = await showConfirm(
            `คุณถ่ายทำรายการ "${item.title}" เสร็จแล้วใช่หรือไม่?`,
            'ยืนยันการถ่ายทำเสร็จสิ้น'
        );

        if (confirmed) {
            toggleFinished(item);
        }
    };

    const handleBatchProcess = async () => {
        if (finishedCount === 0 || isBatchProcessing) return;
        
        const confirmed = await showConfirm(
            `คุณต้องการประมวลผลรายการที่ถ่ายเสร็จแล้วทั้งหมด ${finishedCount} รายการ ใช่หรือไม่?`,
            'ยืนยันการประมวลผลทั้งหมด'
        );
        
        if (!confirmed) return;

        setIsBatchProcessing(true);
        showLoading('กำลังอัปเดตสถานะรายการทั้งหมด...');

        try {
            const itemsToProcess = queueItems.filter(i => i.isSoftFinished);
            const contentIds = itemsToProcess.filter(i => i.type === 'CONTENT').map(i => i.id);
            const scriptIds = itemsToProcess.filter(i => i.type === 'SCRIPT').map(i => i.id);

            const linkedScriptIds = itemsToProcess
                .filter(i => i.type === 'CONTENT' && i.scriptId)
                .map(i => i.scriptId as string);
            
            const linkedContentIds = itemsToProcess
                .filter(i => i.type === 'SCRIPT' && i.contentId)
                .map(i => i.contentId as string);

            const allContentIds = Array.from(new Set([...contentIds, ...linkedContentIds]));
            const allScriptIds = Array.from(new Set([...scriptIds, ...linkedScriptIds]));

            if (allContentIds.length > 0) {
                const { error: contentError } = await supabase
                    .from('contents')
                    .update({ 
                        status: 'EDIT_CLIP', 
                        is_in_shoot_queue: false,
                        is_soft_finished: false
                    })
                    .in('id', allContentIds);
                if (contentError) throw contentError;
            }

            if (allScriptIds.length > 0) {
                const { error: scriptError } = await supabase
                    .from('scripts')
                    .update({ 
                        status: 'DONE', 
                        is_in_shoot_queue: false,
                        is_soft_finished: false
                    })
                    .in('id', allScriptIds);
                if (scriptError) throw scriptError;
            }

            // Local update to remove processed items
            setQueueItems(queueItems.filter(i => !i.isSoftFinished));
            showToast(`ประมวลผลสำเร็จ ${itemsToProcess.length} รายการ! 🎬`, 'success');
        } catch (err) {
            console.error('Batch process failed:', err);
            showToast('เกิดข้อผิดพลาดในการประมวลผลบางรายการ', 'error');
            refreshQueue(includeScripts);
        } finally {
            setIsBatchProcessing(false);
            hideLoading();
        }
    };

    const handleSavePlanning = async (id: string, type: 'CONTENT' | 'SCRIPT', data: Partial<MergedQueueItem>) => {
        try {
            const table = type === 'CONTENT' ? 'contents' : 'scripts';
            const payload = {
                shoot_location: data.shootLocation,
                shoot_time_start: data.shootTimeStart,
                shoot_time_end: data.shootTimeEnd,
                shoot_notes: data.shootNotes
            };

            const { error } = await supabase.from(table).update(payload).eq('id', id);
            if (error) throw error;

            updateLocalItem(id, data);
            showToast('บันทึกแผนเรียบร้อย ✨', 'success');
        } catch (err) {
            console.error('Save planning failed:', err);
            showToast('บันทึกไม่สำเร็จ', 'error');
            throw err;
        }
    };

    const handleSortByTime = async () => {
        const sorted = [...queueItems].sort((a, b) => {
            const timeA = a.shootTimeStart || '99:99';
            const timeB = b.shootTimeStart || '99:99';
            return timeA.localeCompare(timeB);
        });

        const updates = sorted.map((item, index) => {
            const table = item.type === 'CONTENT' ? 'contents' : 'scripts';
            return supabase.from(table).update({ sort_order: index }).eq('id', item.id);
        });

        try {
            showLoading('กำลังจัดเรียงตามเวลา...');
            await Promise.all(updates);
            setQueueItems(sorted);
            showToast('จัดเรียงตามเวลาเรียบร้อย ⏳', 'success');
        } catch (err) {
            console.error('Sort by time failed:', err);
            showToast('จัดเรียงไม่สำเร็จ', 'error');
        } finally {
            hideLoading();
        }
    };

    const handleEditScript = (scriptId: string) => {
        if (!onEditScript || !scriptId) return;
        setIsRedirecting(true);
        setTimeout(() => {
            onEditScript(scriptId);
        }, 1200);
    };

    if (isContextLoading && queueItems.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <Loader2 className="w-10 h-10 animate-spin mb-4 text-indigo-500" />
                <p className="font-medium animate-pulse">กำลังเตรียมคิวถ่ายทำ...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <QueueHeader 
                includeScripts={includeScripts}
                setIncludeScripts={setIncludeScripts}
                viewMode={viewMode}
                setViewMode={setViewMode}
                finishedCount={finishedCount}
                isBatchProcessing={isBatchProcessing}
                onBatchProcess={handleBatchProcess}
                onSortByTime={handleSortByTime}
            />

            {queueItems.length === 0 ? (
                <div className="bg-white/40 backdrop-blur-md rounded-3xl border border-white/60 p-16 text-center flex flex-col items-center justify-center">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                        <Video className="w-10 h-10 text-gray-300" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">ยังไม่มีรายการในคิวถ่าย 🎬</h3>
                    <p className="text-gray-500 max-w-xs mx-auto">
                        เลือกคอนเทนต์จากหน้าคลัง หรือสคริปต์จากหน้า Hub เพื่อเพิ่มเข้าคิวถ่ายทำวันนี้
                    </p>
                </div>
            ) : (
                viewMode === 'GRID' ? (
                    <QueueGridView 
                        items={queueItems}
                        channels={channels}
                        masterOptions={masterOptions}
                        isProcessing={isProcessing}
                        onEditContent={onEditContent}
                        onEditScript={handleEditScript}
                        onToggleFinished={toggleFinished}
                        onMarkAsDone={handleMarkAsDone}
                        onRemove={handleRemoveFromQueue}
                        onOpenPlanning={(item) => setPlanningItem(item)}
                    />
                ) : (
                    <QueueTableView 
                        items={queueItems}
                        channels={channels}
                        masterOptions={masterOptions}
                        isProcessing={isProcessing}
                        onEditContent={onEditContent}
                        onEditScript={handleEditScript}
                        onToggleFinished={toggleFinished}
                        onMarkAsDone={handleMarkAsDone}
                        onReorder={handleReorder}
                        onRemove={handleRemoveFromQueue}
                        onOpenPlanning={(item) => setPlanningItem(item)}
                    />
                )
            )}

            {planningItem && (
                <ShootPlanningModal 
                    isOpen={!!planningItem}
                    item={planningItem}
                    onClose={() => setPlanningItem(null)}
                    onSave={handleSavePlanning}
                    masterOptions={masterOptions}
                />
            )}

            {/* Redirection Loading Modal */}
            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {isRedirecting && (
                        <motion.div
                            key="redirect-modal"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[10000] flex items-center justify-center bg-white"
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: -20 }}
                                className="flex flex-col items-center max-w-sm w-full mx-4"
                            >
                                <div className="relative mb-10">
                                    <motion.div 
                                        animate={{ 
                                            rotate: [0, -15, 0],
                                            scale: [1, 1.1, 1]
                                        }}
                                        transition={{ 
                                            duration: 2.5, 
                                            repeat: Infinity,
                                            ease: "easeInOut"
                                        }}
                                        className="w-28 h-28 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-indigo-200"
                                    >
                                        <Clapperboard className="w-14 h-14 text-white" />
                                    </motion.div>
                                    <motion.div
                                        animate={{ scale: [1, 1.3, 1], rotate: [0, 90, 0] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        className="absolute -top-3 -right-3 w-12 h-12 bg-amber-400 rounded-2xl flex items-center justify-center shadow-lg transform rotate-12"
                                    >
                                        <Sparkles className="w-6 h-6 text-white" />
                                    </motion.div>
                                </div>

                                <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Preparing Script...</h3>
                                <p className="text-slate-400 text-sm font-bold text-center mb-10 leading-relaxed px-6">
                                    กำลังพาคุณไปยังหน้า Script Hub<br/>เพื่อเริ่มอ่านบทสำหรับการถ่ายทำวันนี้
                                </p>

                                <div className="flex items-center gap-2.5">
                                    {[0, 1, 2].map((i) => (
                                        <motion.div 
                                            key={i}
                                            animate={{ 
                                                scale: [1, 1.6, 1],
                                                opacity: [0.3, 1, 0.3]
                                            }}
                                            transition={{ 
                                                duration: 1, 
                                                repeat: Infinity, 
                                                delay: i * 0.2 
                                            }}
                                            className="w-2.5 h-2.5 bg-indigo-500 rounded-full shadow-sm shadow-indigo-100" 
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
};

export default StockShootQueue;
