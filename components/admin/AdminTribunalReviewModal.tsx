import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { TribunalReport, User } from '../../types';
import { useTribunal } from '../../hooks/useTribunal';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../lib/supabase';

// Import our modular sub-components
import TribunalRequestsHeader from './tribunal/TribunalRequestsHeader';
import TribunalRequestsFilters from './tribunal/TribunalRequestsFilters';
import TribunalRequestsList from './tribunal/TribunalRequestsList';
import TribunalRequestsInspector from './tribunal/TribunalRequestsInspector';

interface AdminTribunalReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: User;
    allUsers?: User[];
}

const AdminTribunalReviewModal: React.FC<AdminTribunalReviewModalProps> = ({ 
    isOpen,
    onClose,
    currentUser, 
    allUsers = []
}) => {
    const { resolveReport, getReports, isLoading: isActionLoading } = useTribunal(currentUser);
    const { showToast } = useToast();
    
    const [reports, setReports] = useState<TribunalReport[]>([]);
    const [isLoadingReports, setIsLoadingReports] = useState(false);
    const [selectedReport, setSelectedReport] = useState<TribunalReport | null>(null);

    // Filter and Sort states
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState<'ALL' | 'TOILET' | 'KITCHEN' | 'BEHAVIOR' | 'PROPERTY' | 'OTHER' | 'CRITICAL_SEVERITY'>('ALL');
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
    const [sortBy, setSortBy] = useState<'NEWEST' | 'OLDEST' | 'REPORTER' | 'TARGET'>('NEWEST');

    // Load reports from DB on mount/open
    const loadReportsList = async () => {
        if (!isOpen) return;
        setIsLoadingReports(true);
        try {
            const data = await getReports('ALL');
            setReports(data || []);
        } catch (error) {
            console.error('Error fetching reports inside modal:', error);
        } finally {
            setIsLoadingReports(false);
        }
    };

    useEffect(() => {
        loadReportsList();
    }, [isOpen]);

    // Handle selections safety when list updates
    useEffect(() => {
        if (selectedReport && !reports.some(r => r.id === selectedReport.id)) {
            // Keep matching states if status changes on resolve
            const updated = reports.find(r => r.id === selectedReport.id);
            if (updated) {
                setSelectedReport(updated);
            } else {
                setSelectedReport(null);
            }
        }
    }, [reports]);

    // Summary intelligence calculations for Header metrics
    const metrics = useMemo(() => {
        const total = reports.length;
        const critical = reports.filter(r => r.category === 'property' || r.category === 'behavior').length;
        const warning = reports.filter(r => r.category === 'toilet' || r.category === 'kitchen' || r.category === 'other').length;
        
        // Count top recurring category
        const counts: Record<string, number> = {};
        reports.forEach(r => {
            counts[r.category] = (counts[r.category] || 0) + 1;
        });
        
        let mostCommonCategory = 'ไม่มี';
        let maxCount = 0;
        Object.entries(counts).forEach(([cat, val]) => {
            if (val > maxCount) {
                maxCount = val;
                mostCommonCategory = cat;
            }
        });

        return { total, critical, warning, mostCommonCategory };
    }, [reports]);

    // Perform query and local filter execution
    const filteredReports = useMemo(() => {
        let result = [...reports];

        // Search query filter (Sender or Target names)
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(r => {
                const reporter = allUsers.find(u => u.id === r.reporter_id);
                const target = r.target_id ? allUsers.find(u => u.id === r.target_id) : null;
                return (
                    reporter?.name?.toLowerCase().includes(query) ||
                    target?.name?.toLowerCase().includes(query) ||
                    r.description?.toLowerCase().includes(query)
                );
            });
        }

        // Category filter
        if (filterCategory !== 'ALL') {
            if (filterCategory === 'CRITICAL_SEVERITY') {
                result = result.filter(r => r.category === 'property' || r.category === 'behavior');
            } else {
                const targetCat = filterCategory.toLowerCase();
                result = result.filter(r => r.category === targetCat);
            }
        }

        // Status filter
        if (filterStatus !== 'ALL') {
            result = result.filter(r => r.status === filterStatus);
        }

        // Sorting
        if (sortBy === 'NEWEST') {
            result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        } else if (sortBy === 'OLDEST') {
            result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        } else if (sortBy === 'REPORTER') {
            result.sort((a, b) => {
                const nameA = allUsers.find(u => u.id === a.reporter_id)?.name || '';
                const nameB = allUsers.find(u => u.id === b.reporter_id)?.name || '';
                return nameA.localeCompare(nameB);
            });
        } else if (sortBy === 'TARGET') {
            result.sort((a, b) => {
                const nameA = a.target_id ? (allUsers.find(u => u.id === a.target_id)?.name || '') : '';
                const nameB = b.target_id ? (allUsers.find(u => u.id === b.target_id)?.name || '') : '';
                return nameA.localeCompare(nameB);
            });
        }

        return result;
    }, [reports, searchQuery, filterCategory, filterStatus, sortBy, allUsers]);

    // Resolve tribunal report handler
    const handleResolveReport = async (reportId: string, decision: 'APPROVE' | 'REJECT', feedback: string) => {
        // Optimistic backup
        const previousReports = [...reports];
        const previousSelected = selectedReport ? { ...selectedReport } : null;

        // Apply optimistic updates immediately
        const optimisticStatus = decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';
        setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: optimisticStatus } : r));
        if (selectedReport && selectedReport.id === reportId) {
            setSelectedReport(prev => prev ? { ...prev, status: optimisticStatus } : null);
        }

        try {
            const { success } = await resolveReport(reportId, decision, feedback);
            if (success) {
                showToast(decision === 'APPROVE' ? 'อนุมัติคำฟ้องและลงบทลงโทษสำเร็จแล้ว ⚖️' : 'ปฏิเสธและปัดตกคำร้องเรียนสำเร็จ', 'success');
                // Refresh list from server to ensure sync
                await loadReportsList();
            } else {
                // Rollback on rejection/failure from service
                setReports(previousReports);
                setSelectedReport(previousSelected);
                showToast('ไม่สามารถทำรายการตัดสินใจได้', 'error');
            }
        } catch (error: any) {
            // Rollback on network/query exception
            setReports(previousReports);
            setSelectedReport(previousSelected);
            console.error('Error resolving report:', error);
            showToast('เกิดข้อผิดพลาด: ' + (error.message || error), 'error');
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center bg-slate-900/40 backdrop-blur-xs animate-fade-in">
            <div className="bg-white w-full h-full md:w-[96vw] md:h-[92vh] md:rounded-[2.5rem] md:shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-slide-up">
                
                {/* 1. Header component */}
                <TribunalRequestsHeader 
                    reportsCount={reports.filter(r => r.status === 'PENDING').length}
                    metrics={metrics}
                    onClose={onClose}
                />

                {/* 2. Advanced filters search bar */}
                <TribunalRequestsFilters 
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    filterCategory={filterCategory}
                    setFilterCategory={setFilterCategory}
                    filterStatus={filterStatus}
                    setFilterStatus={setFilterStatus}
                    sortBy={sortBy}
                    setSortBy={setSortBy}
                    reportsLength={reports.length}
                    filteredCount={filteredReports.length}
                />

                {/* 3. Main Grid layout: left is listed feed, right is detailed inspector */}
                <div className="flex-1 min-h-0 flex flex-col md:flex-row">
                    {/* Left: list of reports container */}
                    <div className="w-full md:w-[420px] shrink-0 h-[280px] md:h-full border-b md:border-b-0 md:border-r border-slate-200">
                        <TribunalRequestsList 
                            filteredReports={filteredReports}
                            allUsers={allUsers}
                            selectedReport={selectedReport}
                            setSelectedReport={setSelectedReport}
                        />
                    </div>

                    {/* Right: details dynamic inspector */}
                    <div className="flex-1 min-h-0 md:h-full min-w-0">
                        <TribunalRequestsInspector 
                            selectedReport={selectedReport}
                            allUsers={allUsers}
                            onResolve={handleResolveReport}
                            isProcessing={isActionLoading}
                            setSelectedReport={setSelectedReport}
                        />
                    </div>
                </div>

            </div>
        </div>,
        document.body
    );
};

export default AdminTribunalReviewModal;
