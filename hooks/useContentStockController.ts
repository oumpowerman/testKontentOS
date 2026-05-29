import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Task, Channel, User, MasterOption } from '../types';
import { useToast } from '../context/ToastContext';
import { useContentStock } from './useContentStock';
import { parseContentStockCSV } from '../services/csvService';
import { supabase } from '../lib/supabase';

export type SortKey = 'title' | 'status' | 'date' | 'remark' | 'publishDate' | 'shootDate' | 'shortNote' | 'ideaOwner' | 'editor' | 'helper' | 'createdAt';
export type SortDirection = 'asc' | 'desc';

const ITEMS_PER_PAGE = 20;

interface UseContentStockControllerProps {
    globalTasks: Task[];
    channels: Channel[];
    users: User[];
    masterOptions: MasterOption[];
}

export const useContentStockController = ({ globalTasks, channels, users, masterOptions }: UseContentStockControllerProps) => {
    const { showToast } = useToast();

    // --- Filter States ---
    const [searchQuery, setSearchQuery] = useState('');
    const [filterChannel, setFilterChannel] = useState<string[]>([]);
    const [filterFormat, setFilterFormat] = useState<string[]>([]);
    const [filterPillar, setFilterPillar] = useState<string[]>([]);
    const [filterCategory, setFilterCategory] = useState<string[]>([]);
    const [filterStatuses, setFilterStatuses] = useState<string[]>([]);
    const [filterOnlyOverdue, setFilterOnlyOverdue] = useState(false);
    const [filterOnlyMissingStorage, setFilterOnlyMissingStorage] = useState(false);
    
    // Range Filter
    const [filterHasShootDate, setFilterHasShootDate] = useState(false);
    const [filterShootDateStart, setFilterShootDateStart] = useState('');
    const [filterShootDateEnd, setFilterShootDateEnd] = useState('');
    
    const [showStockOnly, setShowStockOnly] = useState(false);
    const [isFiltering, setIsFiltering] = useState(false);
    const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
    const [selectedContentForAnalytics, setSelectedContentForAnalytics] = useState<Task | null>(null);
    const [searchParams, setSearchParams] = useSearchParams();
    
    const viewTab = (searchParams.get('stockMode') as 'LIST' | 'QUEUE') || 'LIST';
    const contentSubTab = (searchParams.get('stockTab') as 'ACTIVE' | 'ARCHIVE') || 'ACTIVE';

    const setViewTab = useCallback((tab: 'LIST' | 'QUEUE') => {
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            next.set('view', 'ContentStock');
            if (tab === 'QUEUE') {
                next.set('stockMode', 'QUEUE');
                next.delete('stockTab');
            } else {
                next.delete('stockMode');
            }
            return next;
        }, { replace: true });
    }, [setSearchParams]);

    const setContentSubTab = useCallback((tab: 'ACTIVE' | 'ARCHIVE' | ((prev: 'ACTIVE' | 'ARCHIVE') => 'ACTIVE' | 'ARCHIVE')) => {
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            next.set('view', 'ContentStock');
            const currentTab = (next.get('stockTab') as 'ACTIVE' | 'ARCHIVE') || 'ACTIVE';
            const nextTab = typeof tab === 'function' ? tab(currentTab) : tab;
            if (nextTab === 'ARCHIVE') {
                next.set('stockTab', 'ARCHIVE');
            } else {
                next.delete('stockTab');
            }
            return next;
        }, { replace: true });
    }, [setSearchParams]);

    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection } | null>({ key: 'createdAt', direction: 'desc' });
    const [currentPage, setCurrentPage] = useState(1);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isImporting, setIsImporting] = useState(false);

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, filterChannel, filterFormat, filterPillar, filterCategory, filterStatuses, filterHasShootDate, filterShootDateStart, filterShootDateEnd, showStockOnly, sortConfig, filterOnlyMissingStorage]);

    const filters = useMemo(() => ({
        channelId: filterChannel,
        format: filterFormat,
        pillar: filterPillar,
        category: filterCategory,
        statuses: filterStatuses,
        hasShootDate: filterHasShootDate,
        shootDateStart: filterShootDateStart,
        shootDateEnd: filterShootDateEnd,
        showStockOnly,
        onlyOverdue: filterOnlyOverdue,
        onlyMissingStorage: filterOnlyMissingStorage,
        contentSubTab
    }), [filterChannel, filterFormat, filterPillar, filterCategory, filterStatuses, filterHasShootDate, filterShootDateStart, filterShootDateEnd, showStockOnly, filterOnlyOverdue, filterOnlyMissingStorage, contentSubTab]);

    useEffect(() => {
        setIsFiltering(true);
        const timer = setTimeout(() => setIsFiltering(false), 500);
        return () => clearTimeout(timer);
    }, [filters]);

    const { contents: paginatedTasks, totalCount, overdueCount, missingStorageCount, isLoading, isRefreshing, fetchContents, updateLocalItem, toggleShootQueue } = useContentStock({
        page: currentPage,
        pageSize: ITEMS_PER_PAGE,
        searchQuery,
        filters,
        sortConfig
    });

    const handleSort = useCallback((key: SortKey) => {
        setSortConfig(current => {
            if (current && current.key === key) {
                return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
            }
            const isDateKey = key === 'date' || key === 'publishDate' || key === 'shootDate';
            return { key, direction: isDateKey ? 'desc' : 'asc' };
        });
    }, []);

    const clearFilters = useCallback(() => {
        setSearchQuery('');
        setFilterChannel([]);
        setFilterFormat([]);
        setFilterPillar([]);
        setFilterCategory([]);
        setFilterHasShootDate(false);
        setFilterShootDateStart('');
        setFilterShootDateEnd('');
        setFilterStatuses([]);
        setFilterOnlyOverdue(false);
        setFilterOnlyMissingStorage(false);
    }, []);

    const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        try {
            const newTasksPayload = await parseContentStockCSV(file, users, channels, masterOptions);
            if (newTasksPayload.length > 0) {
                const { error } = await supabase.from('contents').insert(newTasksPayload);
                if (error) throw error;
                showToast(`นำเข้าสำเร็จ ${newTasksPayload.length} รายการ 🎉`, 'success');
                setCurrentPage(1);
                fetchContents();
            } else {
                showToast('ไม่พบข้อมูลในไฟล์ หรือรูปแบบไม่ถูกต้อง', 'warning');
            }
        } catch (err: any) {
            console.error(err);
            showToast('เกิดข้อผิดพลาดในการนำเข้า: ' + err.message, 'error');
        } finally {
            setIsImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }, [channels, users, masterOptions, fetchContents, showToast]);

    const handleDownloadTemplate = useCallback(() => {
        const exampleFormat = masterOptions.filter(o => o.type === 'FORMAT').length > 0 ? masterOptions.filter(o => o.type === 'FORMAT')[0].key : "Short Form";
        const headers = ["Content Format","Pillar","Category","Content Topic","Status","Publish Date","Chanel","Owner","IDEA","Edit","Sub","Help","Remark หมายเหตุ","Post"];
        const exampleRow = [`"${exampleFormat}"`,"Education","Review",`"ตัวอย่าง: รีวิวกล้องใหม่"`,`"TODO"`,`"01/01/2024"`,`"Juijui Vlog"`,`"Admin"`,`"รายละเอียด"`,`"Editor"`,`"Support"`,``,`"หมายเหตุ"`,`"TikTok"`].join(",");
        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + headers.join(",") + "\n" + exampleRow;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `juijui_template.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, [masterOptions]);

    return {
        // Filter values & setters
        searchQuery, setSearchQuery,
        filterChannel, setFilterChannel,
        filterFormat, setFilterFormat,
        filterPillar, setFilterPillar,
        filterCategory, setFilterCategory,
        filterStatuses, setFilterStatuses,
        filterOnlyOverdue, setFilterOnlyOverdue,
        filterOnlyMissingStorage, setFilterOnlyMissingStorage,
        filterHasShootDate, setFilterHasShootDate,
        filterShootDateStart, setFilterShootDateStart,
        filterShootDateEnd, setFilterShootDateEnd,
        showStockOnly, setShowStockOnly,
        isFiltering,
        isInventoryModalOpen, setIsInventoryModalOpen,
        selectedContentForAnalytics, setSelectedContentForAnalytics,
        
        // Navigation / Routing Tabs
        viewTab, setViewTab,
        contentSubTab, setContentSubTab,
        
        // Sorting / Pagination
        sortConfig, setSortConfig,
        currentPage, setCurrentPage,
        ITEMS_PER_PAGE,
        
        // CSV Utilities
        fileInputRef,
        isImporting,
        handleFileUpload,
        handleDownloadTemplate,
        clearFilters,
        handleSort,
        
        // Data hook states & updates
        paginatedTasks,
        totalCount,
        overdueCount,
        missingStorageCount,
        isLoading,
        isRefreshing,
        fetchContents,
        updateLocalItem,
        toggleShootQueue,
        searchParams,
        setSearchParams
    };
};
