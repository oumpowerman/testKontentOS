
import React, { useState, useCallback, useMemo } from 'react';
import { Task, Channel, User, MasterOption } from '../../../types';
import { Search, Loader2 } from 'lucide-react';
import { isPast, isToday, isTomorrow, format } from 'date-fns';
import th from 'date-fns/locale/th';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorkboxContext } from '../../../context/WorkboxContext';

// Import Sub-components
import StockTableSettings, { ColumnKey, AVAILABLE_COLUMNS } from './table/StockTableSettings';
import StockTableHeader from './table/StockTableHeader';
import StockTableRow from './table/StockTableRow';
import StockTablePagination from './table/StockTablePagination';

interface StockTableProps {
    isLoading: boolean;
    isFiltering?: boolean;
    isOverdueFilterActive?: boolean;
    tasks: Task[];
    channels: Channel[];
    users: User[];
    masterOptions: MasterOption[];
    
    // Sort
    sortConfig: { key: string; direction: 'asc' | 'desc' } | null;
    onSort: (key: any) => void;
    
    // Pagination
    totalCount: number;
    currentPage: number;
    onPageChange: (page: number) => void;
    itemsPerPage: number;

    // Actions
    onEdit: (task: Task) => void;
    onSchedule: (task: Task) => void;
    onToggleQueue?: (id: string, currentStatus: boolean) => void;
    onAddToWorkbox?: (task: Task) => void;
    onEditScript?: (scriptId: string) => void;
    onOpenAnalytics?: (task: Task) => void;
}

const StockTable: React.FC<StockTableProps> = React.memo(({ 
    isLoading, isFiltering, isOverdueFilterActive, tasks, channels, users, masterOptions,
    sortConfig, onSort,
    totalCount, currentPage, onPageChange, itemsPerPage,
    onEdit, onSchedule, onToggleQueue, onAddToWorkbox, onEditScript, onOpenAnalytics
}) => {
    const { setIsDragging, items: workboxItems } = useWorkboxContext();
    
    // Column States
    const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>(
        AVAILABLE_COLUMNS.filter(c => c.defaultVisible).map(c => c.key)
    );
    const [columnOrder, setColumnOrder] = useState<ColumnKey[]>(
        AVAILABLE_COLUMNS.map(c => c.key)
    );
    const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
        title: 350,
        shortNote: 250,
        status: 140,
        publishDate: 120,
        shootDate: 120,
        ideaOwner: 80,
        editor: 80,
        helper: 80
    });

    // --- Handlers ---
    const handleToggleColumn = useCallback((key: ColumnKey) => {
        setVisibleColumns(prev => 
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        );
    }, []);

    const handleResizeColumn = useCallback((key: string, width: number) => {
        setColumnWidths(prev => ({ ...prev, [key]: width }));
    }, []);

    const handleReorderColumns = useCallback((startIndex: number, endIndex: number) => {
        setColumnOrder(prev => {
            const result = Array.from(prev);
            const [removed] = result.splice(startIndex, 1);
            result.splice(endIndex, 0, removed);
            return result;
        });
    }, []);

    const handleResetColumns = useCallback((type: 'all' | 'minimal') => {
        if (type === 'all') {
            setVisibleColumns(AVAILABLE_COLUMNS.map(c => c.key));
        } else {
            setVisibleColumns(['shortNote', 'status']);
        }
    }, []);

    // --- Helpers derived from Master Data with useMemo ---
    const formatOptions = useMemo(() => masterOptions.filter(o => o.type === 'FORMAT' && o.isActive), [masterOptions]);
    const pillarOptions = useMemo(() => masterOptions.filter(o => o.type === 'PILLAR' && o.isActive), [masterOptions]);
    const categoryOptions = useMemo(() => masterOptions.filter(o => o.type === 'CATEGORY' && o.isActive), [masterOptions]);
    const statusOptions = useMemo(() => masterOptions.filter(o => o.type === 'STATUS' && o.isActive), [masterOptions]);

    const getFormatLabel = (key?: string) => formatOptions.find(o => o.key === key)?.label || key || '';
    const getPillarLabel = (key?: string) => pillarOptions.find(o => o.key === key)?.label || key || '';
    const getCategoryLabel = (key?: string) => categoryOptions.find(o => o.key === key || o.label === key)?.label || key || '';
    
    const getStatusInfo = (key: string) => {
        const option = statusOptions.find(o => o.key === key);
        if (option) {
            return { 
                label: option.label, 
                color: option.color || 'bg-gray-100 text-gray-600 border-gray-200' 
            };
        }
        return { label: key, color: 'bg-gray-100 text-gray-600 border-gray-200' };
    };

    const getStatusProgress = (key: string) => {
        const option = statusOptions.find(o => o.key === key);
        return option?.progressValue || 0;
    };

    const getChannel = (channelId: string | undefined) => {
        if (!channelId) return null;
        return channels.find(c => c.id === channelId) || null;
    };

    const renderUserAvatars = (userIds: string[] | undefined) => {
        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return <span className="text-gray-300 text-xs">-</span>;
        }
        
        return (
            <div className="flex justify-center -space-x-1.5">
                {userIds.map(id => {
                    const user = users.find(u => u.id === id);
                    if (!user) return null;
                    return (
                        <div key={id} className="w-8 h-8 rounded-full border-2 border-white ring-1 ring-gray-100 bg-gray-100 shadow-sm flex items-center justify-center overflow-hidden transition-transform hover:scale-110 hover:z-10" title={user.name}>
                            {user.avatarUrl ? <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover"/> : <span className="text-[9px] font-bold text-gray-500">{user.name.charAt(0).toUpperCase()}</span>}
                        </div>
                    );
                })}
            </div>
        );
    };
    
    const formatDateDisplay = (date: Date | undefined, type: 'PUBLISH' | 'SHOOT') => {
        if (!date) return <span className="text-gray-300 text-xs">-</span>;
        const d = new Date(date);
        
        const isTodayDate = isToday(d);
        const isTmr = isTomorrow(d);
        const isOverdue = isPast(d) && !isTodayDate;

        let colorClass = "text-gray-600";
        if (type === 'PUBLISH') {
             if (isTodayDate) colorClass = "text-orange-600 font-bold";
             else if (isOverdue) colorClass = "text-red-500 font-bold";
        } else {
             if (isTodayDate) colorClass = "text-indigo-600 font-bold";
        }

        return (
            <span className={`text-xs ${colorClass}`}>
                {isTodayDate ? 'วันนี้!' : isTmr ? 'พรุ่งนี้' : format(d, 'd MMM yy', { locale: th })}
            </span>
        );
    };

    const totalPages = Math.ceil(totalCount / itemsPerPage);

    if (isLoading || isFiltering) {
        return (
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-200 overflow-hidden min-h-[400px] p-16 flex flex-col items-center justify-center text-gray-400">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ duration: 0.3, type: 'spring' }}
                    className="flex flex-col items-center"
                >
                    <div className="relative mb-4">
                        <div className="w-16 h-16 bg-indigo-100 rounded-full animate-ping absolute opacity-20"></div>
                        <div className="w-16 h-16 bg-white rounded-full border-4 border-indigo-100 flex items-center justify-center relative z-10 shadow-sm">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                        </div>
                    </div>
                    <p className="font-bold text-gray-400 animate-pulse">กำลังโหลดข้อมูล...</p>
                </motion.div>
            </div>
        );
    }

    if (tasks.length === 0) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden min-h-[400px] p-16 text-center flex flex-col items-center justify-center h-full">
                {isOverdueFilterActive ? (
                    <>
                        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6 border border-emerald-100 shadow-inner">
                            <motion.div
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: 'spring', damping: 10 }}
                            >
                                <span className="text-4xl">✨</span>
                            </motion.div>
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2 font-kanit">เย้! กรอกสถิติครบหมดแล้ว 🏆</h3>
                        <p className="text-slate-400 max-w-xs mx-auto text-sm">ไม่มีคอนเทนต์ที่ค้างกรอกข้อมูลสถิติในขณะนี้ ทีมงานเก่งมากครับ!</p>
                    </>
                ) : (
                    <>
                        <Search className="w-12 h-12 text-gray-300 mb-4" />
                        <h3 className="text-lg font-bold text-gray-800">ไม่พบรายการที่ค้นหา 🔍</h3>
                        <p className="text-gray-400 text-sm">ลองเปลี่ยนตัวกรอง หรือเพิ่มรายการใหม่ดูนะครับ</p>
                    </>
                )}
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-200 overflow-hidden min-h-[400px] flex flex-col relative">
            {/* Column Settings Trigger */}
            <div className="absolute top-4 right-4 z-40">
                <StockTableSettings 
                    visibleColumns={visibleColumns}
                    columnOrder={columnOrder}
                    onToggleColumn={handleToggleColumn}
                    onReorderColumns={setColumnOrder}
                    onReset={handleResetColumns}
                />
            </div>

            <div className="overflow-x-auto flex-1 scrollbar-hide relative">
                <table className="w-full text-left border-collapse table-fixed">
                    <StockTableHeader 
                        columnOrder={columnOrder}
                        visibleColumns={visibleColumns}
                        columnWidths={columnWidths}
                        sortConfig={sortConfig}
                        onSort={onSort}
                        onResize={handleResizeColumn}
                        onReorder={handleReorderColumns}
                    />
                    <tbody className="divide-y divide-gray-100 text-sm relative">
                        <AnimatePresence mode='popLayout'>
                        {tasks.map((task) => (
                            <StockTableRow 
                                key={task.id}
                                task={task}
                                channel={getChannel(task.channelId)}
                                statusInfo={getStatusInfo(task.status as string)}
                                visibleColumns={visibleColumns}
                                columnOrder={columnOrder}
                                columnWidths={columnWidths}
                                statusProgress={getStatusProgress(task.status as string)}
                                isInWorkbox={workboxItems.some(item => item.id === task.id)}
                                renderUserAvatars={renderUserAvatars}
                                formatDateDisplay={formatDateDisplay}
                                onEdit={onEdit}
                                onSchedule={onSchedule}
                                onToggleQueue={onToggleQueue}
                                onAddToWorkbox={onAddToWorkbox}
                                onEditScript={onEditScript}
                                onOpenAnalytics={onOpenAnalytics}
                                setIsDragging={setIsDragging}
                                getFormatLabel={getFormatLabel}
                                getPillarLabel={getPillarLabel}
                                getCategoryLabel={getCategoryLabel}
                            />
                        ))}
                        </AnimatePresence>
                    </tbody>
                </table>
                
                {/* Right Edge Fade Overlay for Mobile */}
                <div className="absolute top-0 right-0 bottom-0 w-16 bg-gradient-to-l from-white via-white/80 to-transparent pointer-events-none z-50 md:hidden" />
            </div>

            {/* Pagination Footer */}
            <StockTablePagination 
                totalCount={totalCount}
                currentPage={currentPage}
                totalPages={totalPages}
                itemsPerPage={itemsPerPage}
                onPageChange={onPageChange}
            />
        </div>
    );
});

export default StockTable;
