import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { DeadlineRequest, User, Task } from '../../types';
import { useDeadlineRequests } from '../../hooks/useDeadlineRequests';
import { useToast } from '../../context/ToastContext';
import { useNotificationContext } from '../../context/NotificationContext';
import { useTaskContext } from '../../context/TaskContext';

// Import our modular sub-components
import DeadlineRequestsHeader from './deadline/DeadlineRequestsHeader';
import DeadlineRequestsFilters from './deadline/DeadlineRequestsFilters';
import DeadlineRequestsList from './deadline/DeadlineRequestsList';
import DeadlineRequestsInspector from './deadline/DeadlineRequestsInspector';
import DeadlineRequestsBatchBar from './deadline/DeadlineRequestsBatchBar';

interface AdminDeadlineRequestsModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: User;
    users?: User[];
    tasks?: Task[];
    metrics: {
        total: number;
        urgent: number;
        longExtensions: number;
        topRequester: string;
    };
}

const AdminDeadlineRequestsModal: React.FC<AdminDeadlineRequestsModalProps> = ({ 
    isOpen,
    onClose,
    currentUser, 
    users = [], 
    tasks = [] ,
    metrics: initialMetrics
}) => {
    const { resolveRequest } = useDeadlineRequests(currentUser);
    const { deadlineRequests: requests, isLoading: isFetching, refreshData } = useNotificationContext();
    const { fetchTasks } = useTaskContext();
    const { showToast } = useToast();
    
    // Command Center Interior States & Optimistic Store
    const [localRequests, setLocalRequests] = useState<DeadlineRequest[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isProcessingBatch, setIsProcessingBatch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState<'ALL' | 'URGENT' | 'LONG' | 'CRITICAL'>('ALL');
    const [sortBy, setSortBy] = useState<'NEWEST' | 'OLDEST' | 'NEW_DEADLINE' | 'EMPLOYEE'>('NEWEST');
    const [selectedReq, setSelectedReq] = useState<DeadlineRequest | null>(null);
    const [customDate, setCustomDate] = useState<string>('');

    // Preloaded fast rejection templates
    const rejectionTemplates = [
        'ข้อมูลเหตุผลไม่เพียงพอต่อการพิจารณาเลื่อนกำหนดเวลา',
        'งานชิ้นนี้มีกำหนดออนแอร์/ส่งมอบปลายสัปดาห์ด่วน บีบเลื่อนไม่ได้',
        'การขยายเวลาส่งผลกระทบสะสมต่องานย่อยอื่นๆ ในระบบทีม',
        'ระยะเวลาที่ขอเลื่อนนานเกินเกณฑ์เฉลี่ยบริษัทสูงสุด (เกิน 7 วัน)'
    ];

    // Keep optimistic local requests state synchronized with real-time notification push
    useEffect(() => {
        setLocalRequests(requests);
    }, [requests]);

    // Filter out selected IDs that are no longer active when lists change
    useEffect(() => {
        setSelectedIds(prev => prev.filter(id => localRequests.some(r => r.id === id)));
        if (selectedReq && !localRequests.some(r => r.id === selectedReq.id)) {
            setSelectedReq(null);
        }
    }, [localRequests]);

    useEffect(() => {
        if (selectedReq) {
            setCustomDate(selectedReq.newDeadline.toISOString().split('T')[0]);
        }
    }, [selectedReq]);

    // Dynamic, on-the-fly local metrics calculations during live optimistic deletion
    const metrics = useMemo(() => {
        const total = localRequests.length;
        const now = new Date();
        
        const urgent = localRequests.filter(r => {
            const matchedTask = tasks.find(t => t.id === r.taskId);
            if (!matchedTask) return false;
            const originalEnd = new Date(matchedTask.endDate);
            return originalEnd.getTime() < now.getTime() || (originalEnd.getTime() - now.getTime()) < 24 * 60 * 60 * 1000;
        }).length;

        const longExtensions = localRequests.filter(r => {
            const matchedTask = tasks.find(t => t.id === r.taskId);
            if (!matchedTask) return false;
            const originalEnd = new Date(matchedTask.endDate);
            const diffDays = Math.ceil((r.newDeadline.getTime() - originalEnd.getTime()) / (1000 * 60 * 60 * 24));
            return diffDays >= 7;
        }).length;

        const requestersCount: Record<string, number> = {};
        localRequests.forEach(r => {
            const name = r.user?.name || 'พนักงาน';
            requestersCount[name] = (requestersCount[name] || 0) + 1;
        });
        
        let topRequester = 'ไม่มี';
        let maxReqVal = 0;
        Object.entries(requestersCount).forEach(([name, count]) => {
            if (count > maxReqVal) {
                maxReqVal = count;
                topRequester = `${name} (${count} รายการ)`;
            }
        });

        return { total, urgent, longExtensions, topRequester };
    }, [localRequests, tasks]);

    // Data filtering and Sorting matching standard structures
    const filteredRequests = useMemo(() => {
        let result = [...localRequests];
        const now = new Date();

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(r => 
                r.user?.name?.toLowerCase().includes(query) ||
                (r as any).taskTitle?.toLowerCase().includes(query) ||
                r.reason?.toLowerCase().includes(query)
            );
        }

        if (filterCategory === 'URGENT') {
            result = result.filter(r => {
                const matchedTask = tasks.find(t => t.id === r.taskId);
                if (!matchedTask) return false;
                const originalEnd = new Date(matchedTask.endDate);
                return originalEnd.getTime() < now.getTime() || (originalEnd.getTime() - now.getTime()) < 24 * 60 * 60 * 1000;
            });
        } else if (filterCategory === 'LONG') {
            result = result.filter(r => {
                const matchedTask = tasks.find(t => t.id === r.taskId);
                if (!matchedTask) return false;
                const originalEnd = new Date(matchedTask.endDate);
                const diffDays = Math.ceil((r.newDeadline.getTime() - originalEnd.getTime()) / (1000 * 60 * 60 * 24));
                return diffDays >= 7;
            });
        } else if (filterCategory === 'CRITICAL') {
            result = result.filter(r => {
                const userPendingCount = tasks.filter(t => 
                    t.assigneeIds.includes(r.requestedBy) && 
                    t.status !== 'DONE' && 
                    t.status !== 'FINAL'
                ).length;
                return userPendingCount >= 3;
            });
        }

        if (sortBy === 'NEWEST') {
            result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        } else if (sortBy === 'OLDEST') {
            result.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        } else if (sortBy === 'NEW_DEADLINE') {
            result.sort((a, b) => a.newDeadline.getTime() - b.newDeadline.getTime());
        } else if (sortBy === 'EMPLOYEE') {
            result.sort((a, b) => (a.user?.name || '').localeCompare(b.user?.name || ''));
        }

        return result;
    }, [localRequests, searchQuery, filterCategory, sortBy, tasks]);

    const handleResolve = async (requestId: string, taskId: string, isApproved: boolean, targetDate: Date) => {
        setIsProcessingBatch(true);
        const previousLocal = [...localRequests];
        const previousSelected = selectedReq ? { ...selectedReq } : null;

        // Apply Optimistic Update immediately to clear from active view
        setLocalRequests(prev => prev.filter(r => r.id !== requestId));
        if (selectedReq?.id === requestId) {
            setSelectedReq(null);
        }

        const { success, error } = await resolveRequest(requestId, taskId, isApproved, targetDate);
        setIsProcessingBatch(false);
        
        if (success) {
            showToast(isApproved ? 'อนุมัติการยืดเวลาสำเร็จ' : 'ปฏิเสธคำขอสำเร็จ', 'success');
            // Parallel execution to sync tasks and notifications without lag
            Promise.all([
                fetchTasks(),
                refreshData()
            ]).catch(err => console.error("Error syncing after resolve:", err));
        } else {
            // Rollback on rejection/failure from service
            setLocalRequests(previousLocal);
            setSelectedReq(previousSelected);
            showToast('พบความผิดพลาด: ' + error, 'error');
        }
    };

    const handleCustomApprove = async (req: DeadlineRequest) => {
        if (!customDate) {
            showToast('กรุณาระบุเกณฑ์วันที่อนุมัติทางเลือกใหม่', 'error');
            return;
        }
        const parsedDate = new Date(customDate);
        if (isNaN(parsedDate.getTime())) {
            showToast('ฟอร์แมตข้อมูลในวันที่ยังไม่ถูกถ้วนหลักสากล', 'error');
            return;
        }
        handleResolve(req.id, req.taskId, true, parsedDate);
    };

    const handleRejectWithTemplate = async (req: DeadlineRequest, feedback: string) => {
        setIsProcessingBatch(true);
        const previousLocal = [...localRequests];
        const previousSelected = selectedReq ? { ...selectedReq } : null;

        // Apply Optimistic Update immediately
        setLocalRequests(prev => prev.filter(r => r.id !== req.id));
        if (selectedReq?.id === req.id) {
            setSelectedReq(null);
        }

        const { success, error } = await resolveRequest(req.id, req.taskId, false);
        setIsProcessingBatch(false);

        if (success) {
            showToast(`ปฏิเสธคำขอเดดไลน์พร้อมส่งคำฟีดแบ็ก: ${feedback}`, 'warning');
            // Parallel execution to sync tasks and notifications without lag
            Promise.all([
                fetchTasks(),
                refreshData()
            ]).catch(err => console.error("Error syncing after reject:", err));
        } else {
            // Rollback
            setLocalRequests(previousLocal);
            setSelectedReq(previousSelected);
            showToast('เกิดข้อผิดพลาดในการส่งคำสั่งปฏิเสธ: ' + error, 'error');
        }
    };

    const toggleSelect = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedIds(prev => 
            prev.includes(id) 
                ? prev.filter(item => item !== id) 
                : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (selectedIds.length === filteredRequests.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredRequests.map(r => r.id));
        }
    };

    const handleBatchResolve = async (isApproved: boolean) => {
        if (selectedIds.length === 0) return;
        setIsProcessingBatch(true);
        const previousLocal = [...localRequests];
        const previousSelected = selectedReq ? { ...selectedReq } : null;
        const previousSelectedIds = [...selectedIds];

        // Apply Optimistic Update immediately
        const resolvedIdsList = [...selectedIds];
        setLocalRequests(prev => prev.filter(r => !resolvedIdsList.includes(r.id)));
        setSelectedIds([]);
        if (selectedReq && resolvedIdsList.includes(selectedReq.id)) {
            setSelectedReq(null);
        }

        let successCount = 0;
        let failCount = 0;

        const targetRequests = previousLocal.filter(r => resolvedIdsList.includes(r.id));

        try {
            const results = await Promise.all(
                targetRequests.map(async (req) => {
                    const { success } = await resolveRequest(req.id, req.taskId, isApproved, req.newDeadline);
                    return success;
                })
            );
            successCount = results.filter(r => r === true).length;
            failCount = results.length - successCount;
        } catch (e) {
            console.error("Batch processing error:", e);
            failCount = targetRequests.length;
        }

        setIsProcessingBatch(false);

        if (successCount > 0) {
            showToast(isApproved 
                ? `อนุมัติคำขอเลื่อนเป็นกลุ่มสำเร็จ ${successCount} รายการ` 
                : `ปฏิเสธคำขอเป็นกลุ่มเสร็จสิ้น ${successCount} รายการ`, 'success');
            // Parallel execution to sync tasks and notifications without lag
            Promise.all([
                fetchTasks(),
                refreshData()
            ]).catch(err => console.error("Error syncing after batch resolve:", err));
        }
        if (failCount > 0) {
            setLocalRequests(previousLocal);
            setSelectedIds(previousSelectedIds);
            setSelectedReq(previousSelected);
            showToast(`ส่งการประมวลผลคำขอขัดข้อง ${failCount} รายการโปรดตรวจสอบอีกครั้ง`, 'error');
        }
    };

    // Deep diagnostics analysis for the selected card
    const insights = useMemo(() => {
        if (!selectedReq) return null;
        
        const requester = users.find(u => u.id === selectedReq.requestedBy);
        
        // Other open workload details (non-completed projects)
        const activeTasks = tasks.filter(t => 
            t.assigneeIds.includes(selectedReq.requestedBy) && 
            t.status !== 'DONE' && 
            t.status !== 'FINAL' && 
            t.id !== selectedReq.taskId
        );

        const parentTask = tasks.find(t => t.id === selectedReq.taskId);
        const originalEnd = parentTask ? new Date(parentTask.endDate) : null;
        const diffDays = originalEnd 
            ? Math.ceil((selectedReq.newDeadline.getTime() - originalEnd.getTime()) / (1000 * 60 * 60 * 24))
            : 0;

        return {
            requester,
            activeTasks,
            parentTask,
            diffDays,
            workloadRank: activeTasks.length >= 4 ? 'งานทับถมหนักมาก (Overload)' : activeTasks.length >= 2 ? 'ปานกลาง' : 'เบาบาง / งานเดียวเสร็จ'
        };
    }, [selectedReq, users, tasks]);

    if (!isOpen || typeof document === 'undefined') return null;

    return createPortal(
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-fadeIn">
            {/* Modal Glass Panel Container */}
            <div className="bg-slate-50 w-full max-w-7xl h-[92vh] rounded-[32px] border border-slate-200/90 shadow-2xl flex flex-col justify-between overflow-hidden relative">
                
                {/* Control Header & Metrics display */}
                <DeadlineRequestsHeader 
                    requestsCount={localRequests.length} 
                    metrics={metrics} 
                    onClose={onClose} 
                />

                {/* Subheader Filters line */}
                <DeadlineRequestsFilters 
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    filterCategory={filterCategory}
                    setFilterCategory={setFilterCategory}
                    sortBy={sortBy}
                    setSortBy={setSortBy}
                    requestsLength={localRequests.length}
                    filteredCount={filteredRequests.length}
                    metrics={metrics}
                />

                {/* Main operational Split pane workspace */}
                <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-0 relative">
                    
                    {/* Left Column Feed Drawer */}
                    <DeadlineRequestsList 
                        filteredRequests={filteredRequests}
                        selectedIds={selectedIds}
                        selectedReq={selectedReq}
                        isFetching={isFetching}
                        tasks={tasks}
                        toggleSelect={toggleSelect}
                        handleSelectAll={handleSelectAll}
                        setSelectedReq={setSelectedReq}
                    />

                    {/* Right Column Intelligence Inspector Card View */}
                    <DeadlineRequestsInspector 
                        selectedReq={selectedReq}
                        insights={insights}
                        customDate={customDate}
                        setCustomDate={setCustomDate}
                        isProcessingBatch={isProcessingBatch}
                        rejectionTemplates={rejectionTemplates}
                        handleCustomApprove={handleCustomApprove}
                        handleRejectWithTemplate={handleRejectWithTemplate}
                        setSelectedReq={setSelectedReq}
                        handleResolve={handleResolve}
                    />
                </div>

                {/* Batch multi control floating drawer bar */}
                <DeadlineRequestsBatchBar 
                    selectedIds={selectedIds}
                    isProcessingBatch={isProcessingBatch}
                    handleBatchResolve={handleBatchResolve}
                />
            </div>
        </div>,
        document.body
    );
};

export default AdminDeadlineRequestsModal;
