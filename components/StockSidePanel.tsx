
import React, { useState, useMemo } from 'react';
import { Task, Channel, MasterOption } from '../types';
import { 
    Search, Package, GripVertical, Calendar, Archive, X, 
    LayoutTemplate, SlidersHorizontal, Video, Hash, Sparkles,
    ChevronDown, Loader2
} from 'lucide-react';
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import StockFilterModal from './stock/StockFilterModal';
import { useTaskContext } from '../context/TaskContext';

interface StockSidePanelProps {
    isOpen: boolean;
    onClose: () => void;
    tasks: Task[];
    channels: Channel[];
    masterOptions: MasterOption[];
    onEditTask: (task: Task) => void;
}

const StockSidePanel: React.FC<StockSidePanelProps> = ({
    isOpen,
    onClose,
    tasks,
    channels,
    masterOptions,
    onEditTask
}) => {
    const { isAllLoaded, isFetching, fetchAllTasks } = useTaskContext();
    // --- State ---
    const [searchQuery, setSearchQuery] = useState('');
    
    // V4 Filter State Object
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [filters, setFilters] = useState({
        channels: [] as string[],
        statuses: [] as string[],
        formats: [] as string[],
        pillars: [] as string[],
        categories: [] as string[],
        shootDateStart: '',
        shootDateEnd: ''
    });

    // --- Derived Data ---
    const statusOptions = useMemo(() => 
        masterOptions.filter(o => o.type === 'STATUS' && o.isActive).sort((a,b) => a.sortOrder - b.sortOrder), 
    [masterOptions]);

    // --- Filter Logic (The Brain V4) ---
    const stockTasks = useMemo(() => {
        return tasks.filter(t => {
            // 1. Critical Base Condition: Content Only & Stock Only
            if (t.type !== 'CONTENT') return false;
            if (!t.isUnscheduled) return false;

            // 2. Search Text
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchTitle = t.title.toLowerCase().includes(query);
                const matchDesc = (t.description || '').toLowerCase().includes(query);
                if (!matchTitle && !matchDesc) return false;
            }

            // 3. Multi-Select Filters
            if (filters.channels.length > 0 && !filters.channels.includes(t.channelId || '')) return false;
            if (filters.statuses.length > 0 && !filters.statuses.includes(t.status as string)) return false;
            if (filters.formats.length > 0) {
                const formats = t.contentFormats || [];
                if (!filters.formats.some(f => formats.includes(f))) return false;
            }
            if (filters.pillars.length > 0 && !filters.pillars.includes(t.pillar || '')) return false;
            if (filters.categories.length > 0 && !filters.categories.includes(t.category || '')) return false;

            // 4. Shoot Date Range Logic
            if (filters.shootDateStart) {
                if (!t.shootDate) return false; // Must have date to be filtered by date
                const taskDate = startOfDay(new Date(t.shootDate));
                const start = startOfDay(new Date(filters.shootDateStart));
                
                if (filters.shootDateEnd) {
                    const end = endOfDay(new Date(filters.shootDateEnd));
                    if (!isWithinInterval(taskDate, { start, end })) return false;
                } else {
                    // Only start date provided -> Date >= Start
                    if (taskDate < start) return false;
                }
            }

            return true;
        });
    }, [tasks, searchQuery, filters]);

    // --- Helpers ---
    const handleDragStart = (e: React.DragEvent, taskId: string) => {
        e.dataTransfer.setData('source', 'ContentStock'); 
        e.dataTransfer.setData('taskId', taskId);
        e.dataTransfer.effectAllowed = 'move';
        e.currentTarget.classList.add('opacity-50');
    };

    const handleDragEnd = (e: React.DragEvent) => {
        e.currentTarget.classList.remove('opacity-50');
    };

    const getChannelInfo = (id?: string) => channels.find(c => c.id === id);

    // Calculate active filters count
    const activeFilterCount = 
        filters.channels.length + 
        filters.statuses.length + 
        filters.formats.length + 
        filters.pillars.length + 
        filters.categories.length + 
        (filters.shootDateStart ? 1 : 0);

    if (!isOpen) return null;

    return (
        <>
            <div className="w-80 bg-white border-l border-gray-200 h-full flex flex-col shadow-xl animate-in slide-in-from-right duration-300 z-40 relative">
                
                {/* 1. Fixed Header */}
                <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-white shrink-0 z-20">
                    <div className="flex items-center gap-2 text-indigo-900">
                        <div className="p-1.5 bg-indigo-50 rounded-lg">
                            <Package className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-md leading-none">คลังงาน</h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Content Stock</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full text-[10px] font-bold min-w-[24px] text-center">
                            {stockTasks.length}
                        </span>
                        <button onClick={onClose} className="p-1.5 hover:bg-red-50 rounded-full text-gray-400 hover:text-red-500 transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* 2. Control Deck (Search & Command Center Trigger) */}
                <div className="p-4 border-b border-gray-100 bg-white z-10 space-y-3 shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
                    
                    {/* Search Bar */}
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input 
                            type="text" 
                            placeholder="ค้นหาชื่อ, รายละเอียด..." 
                            className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-indigo-200 rounded-xl text-xs font-bold text-gray-700 outline-none transition-all placeholder:text-gray-400"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Filter Trigger Button (The Content Equalizer) */}
                    <button 
                        onClick={() => setIsFilterModalOpen(true)}
                        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${activeFilterCount > 0 ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-transparent shadow-md shadow-indigo-200' : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-300'}`}
                    >
                        <div className="flex items-center gap-2">
                            <SlidersHorizontal className="w-4 h-4" />
                            <span>ตัวกรองขั้นสูง (Equalizer)</span>
                        </div>
                        {activeFilterCount > 0 && (
                            <span className="bg-white text-indigo-600 px-1.5 py-0.5 rounded-md text-[10px] font-black min-w-[20px] text-center flex items-center gap-1">
                                <Sparkles className="w-2 h-2" /> {activeFilterCount}
                            </span>
                        )}
                    </button>
                </div>

                {/* 3. Scrollable List */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-[#f8fafc] scrollbar-thin scrollbar-thumb-gray-200">
                    {stockTasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-400 text-center select-none">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <Archive className="w-10 h-10 opacity-30" />
                            </div>
                            <p className="text-md font-kanit font-bold text-gray-500">ไม่พบงานในคลัง</p>
                            <p className="text-[14px] mt-1 text-gray-400 max-w-[200px]">ลองปรับตัวกรอง หรือเพิ่มงานใหม่และเลือก "Stock Mode"</p>
                        </div>
                    ) : (
                        stockTasks.map(task => {
                            const channel = getChannelInfo(task.channelId);
                            // Find Status Option from Master Data
                            const statusOption = statusOptions.find(o => o.key === task.status);
                            const statusLabel = statusOption ? statusOption.label : task.status;
                            const statusColor = statusOption ? statusOption.color : 'bg-gray-100 text-gray-500';
                            
                            const hasShootDate = !!task.shootDate;
                            
                            return (
                                <div
                                    key={task.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, task.id)}
                                    onDragEnd={handleDragEnd}
                                    onClick={() => onEditTask(task)}
                                    className="group relative bg-white p-3.5 rounded-2xl border border-gray-200 shadow-sm cursor-grab active:cursor-grabbing hover:border-indigo-300 hover:shadow-md transition-all overflow-hidden"
                                >
                                    {/* Hover Indicator Strip */}
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gray-200 group-hover:bg-indigo-500 transition-colors"></div>
                                    
                                    <div className="flex gap-3 pl-2">
                                        {/* Drag Handle & Icon */}
                                        <div className="mt-1 text-gray-300 group-hover:text-indigo-400 flex flex-col items-center gap-1 shrink-0">
                                            <GripVertical className="w-4 h-4" />
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                            {/* Tags Row */}
                                            <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                                                {channel && (
                                                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border uppercase tracking-wider ${channel.color}`}>
                                                        {channel.name}
                                                    </span>
                                                )}
                                                {hasShootDate && (
                                                    <span className="text-[9px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100 flex items-center">
                                                        <Video className="w-2.5 h-2.5 mr-1" />
                                                        {format(new Date(task.shootDate!), 'd MMM')}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Title */}
                                            <h4 className="text-sm font-bold text-gray-700 leading-snug line-clamp-2 group-hover:text-indigo-700 transition-colors mb-2">
                                                {task.title}
                                            </h4>
                                            
                                            {/* Footer Row */}
                                            <div className="flex items-center justify-between pt-2 border-t border-gray-50 mt-1">
                                                <div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium">
                                                    {task.contentFormats && task.contentFormats.length > 0 ? (
                                                        <span className="bg-gray-100 px-1.5 rounded">{task.contentFormats[0]}</span>
                                                    ) : (
                                                        <>
                                                            <LayoutTemplate className="w-3 h-3" />
                                                            <span>Content</span>
                                                        </>
                                                    )}
                                                </div>
                                                
                                                {/* Status Dot with Label from Master Data */}
                                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${statusColor}`}>
                                                    <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                                                    {statusLabel}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}

                    {/* Load More Button - Only show if not all loaded and we have some tasks or empty */}
                    {!isAllLoaded && (
                        <div className="pt-2 pb-4">
                            <button 
                                onClick={() => fetchAllTasks()}
                                disabled={isFetching}
                                className="w-full py-3 px-4 bg-white border border-dashed border-gray-300 rounded-2xl text-xs font-bold text-gray-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 group"
                            >
                                {isFetching ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>กำลังโหลดข้อมูล...</span>
                                    </>
                                ) : (
                                    <>
                                        <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                                        <span>โหลดงานในคลังที่เก่ากว่า 2 เดือน</span>
                                    </>
                                )}
                            </button>
                            <p className="text-[10px] text-gray-400 text-center mt-2 px-4">
                                * เพื่อความรวดเร็ว ระบบจะโหลดเฉพาะงาน 2 เดือนล่าสุดมาให้ก่อน
                            </p>
                        </div>
                    )}
                </div>

                {/* 4. Footer Hint */}
                <div className="p-3 bg-indigo-50 border-t border-indigo-100 text-[10px] text-indigo-600 text-center font-bold flex items-center justify-center gap-2">
                    <Calendar className="w-3.5 h-3.5" />
                    ลากการ์ดไปวางในปฏิทินเพื่อลงตาราง
                </div>
            </div>

            {/* Filter Modal V4 */}
            <StockFilterModal 
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                channels={channels}
                masterOptions={masterOptions}
                filters={filters}
                onApply={setFilters}
            />
        </>
    );
};

export default StockSidePanel;
