
import React, { useState, useEffect, useMemo } from 'react';
import { Channel, MasterOption } from '../../types';
import { X, Check, Filter, RotateCcw, ChevronDown, ChevronUp, Type, Layers, Tag, LayoutTemplate, Activity, CalendarDays } from 'lucide-react';
import { createPortal } from 'react-dom';

interface StockFilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    channels: Channel[];
    masterOptions: MasterOption[];
    
    // Current State passed from parent
    filters: {
        channels: string[];
        statuses: string[];
        formats: string[];
        pillars: string[];
        categories: string[];
        shootDateStart: string;
        shootDateEnd: string;
    };
    
    // Action
    onApply: (newFilters: any) => void;
}

const StockFilterModal: React.FC<StockFilterModalProps> = ({
    isOpen, onClose, channels, masterOptions,
    filters,
    onApply
}) => {
    // Local State for "Drafting" filters
    const [localFilters, setLocalFilters] = useState(filters);
    
    // UI State for Collapsible Zones
    const [expandedZones, setExpandedZones] = useState<{
        DNA: boolean;
        WORKFLOW: boolean;
        TIMELINE: boolean;
    }>({
        DNA: false,
        WORKFLOW: false,
        TIMELINE: false
    });

    // Sync when opening
    useEffect(() => {
        if (isOpen) {
            setLocalFilters(filters);
        }
    }, [isOpen, filters]);

    // --- Master Data Options ---
    const contentStatuses = useMemo(() => masterOptions.filter(o => o.type === 'STATUS' && o.isActive).sort((a, b) => a.sortOrder - b.sortOrder), [masterOptions]);
    const formatOptions = useMemo(() => masterOptions.filter(o => o.type === 'FORMAT' && o.isActive).sort((a, b) => a.sortOrder - b.sortOrder), [masterOptions]);
    const pillarOptions = useMemo(() => masterOptions.filter(o => o.type === 'PILLAR' && o.isActive).sort((a, b) => a.sortOrder - b.sortOrder), [masterOptions]);
    const categoryOptions = useMemo(() => masterOptions.filter(o => o.type === 'CATEGORY' && o.isActive).sort((a, b) => a.sortOrder - b.sortOrder), [masterOptions]);

    const toggleFilter = (key: keyof typeof localFilters, value: string) => {
        setLocalFilters(prev => {
            const currentList = prev[key] as string[];
            const newList = currentList.includes(value) 
                ? currentList.filter(item => item !== value) 
                : [...currentList, value];
            return { ...prev, [key]: newList };
        });
    };

    const handleDateChange = (key: 'shootDateStart' | 'shootDateEnd', value: string) => {
        setLocalFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleReset = () => {
        setLocalFilters({
            channels: [],
            statuses: [],
            formats: [],
            pillars: [],
            categories: [],
            shootDateStart: '',
            shootDateEnd: ''
        });
    };

    const handleApply = () => {
        onApply(localFilters);
        onClose();
    };

    const toggleZone = (zone: keyof typeof expandedZones) => {
        setExpandedZones(prev => ({ ...prev, [zone]: !prev[zone] }));
    };

    if (!isOpen) return null;

    // Calc Counts for Badges
    const countDNA = localFilters.formats.length + localFilters.pillars.length + localFilters.categories.length;
    const countWorkflow = localFilters.channels.length + localFilters.statuses.length;
    const countTimeline = localFilters.shootDateStart ? 1 : 0;

    // Helper for rendering chip section
    const RenderSection = ({ title, icon: Icon, options, filterKey, colorTheme = 'indigo' }: any) => (
        <div className="mb-6 last:mb-0">
            <label className={`text-xs font-black uppercase tracking-wider mb-3 flex items-center gap-1.5 text-${colorTheme}-400`}>
                <Icon className="w-3.5 h-3.5" /> {title}
            </label>
            <div className="flex flex-wrap gap-2">
                {options.map((opt: any) => {
                    const isSelected = (localFilters[filterKey as keyof typeof localFilters] as string[]).includes(opt.key || opt.id);
                    const activeClass = opt.color || `bg-${colorTheme}-100 text-${colorTheme}-700 border-${colorTheme}-200`;
                    
                    return (
                        <button
                            key={opt.key || opt.id}
                            onClick={() => toggleFilter(filterKey, opt.key || opt.id)}
                            className={`
                                px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5
                                ${isSelected 
                                    ? `ring-2 ring-offset-1 ring-${colorTheme}-200 ${activeClass}` 
                                    : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300 hover:bg-gray-50'}
                            `}
                        >
                            {opt.label || opt.name}
                            {isSelected && <Check className="w-3 h-3" />}
                        </button>
                    );
                })}
            </div>
        </div>
    );

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-indigo-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-300 font-sans">
            <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300 border-4 border-white ring-1 ring-gray-200">
                
                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 bg-white shrink-0 flex justify-between items-center bg-gradient-to-r from-gray-50 to-white relative z-20">
                    <div>
                        <h3 className="text-[26px] font-bold text-gray-800 flex items-center gap-2">
                            <span className="bg-indigo-600 text-white p-2 rounded-xl shadow-lg shadow-indigo-200">
                                <Filter className="w-5 h-5" />
                            </span>
                            Content Equalizer
                        </h3>
                        <p className="text-gray-400 text-xs font-medium ml-1 mt-1">ปรับแต่งการค้นหาคอนเทนต์แบบละเอียด</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-400 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 md:p-8 overflow-y-auto flex-1 bg-[#f8fafc] scrollbar-thin scrollbar-thumb-indigo-100 space-y-4">
                    
                    {/* ZONE A: Content DNA */}
                    <div className={`bg-white rounded-3xl border transition-all duration-300 ${expandedZones.DNA ? 'border-pink-200 shadow-md ring-1 ring-pink-50' : 'border-gray-200 shadow-sm hover:border-pink-200'}`}>
                        <button 
                            onClick={() => toggleZone('DNA')}
                            className="w-full px-6 py-5 flex items-center justify-between bg-transparent hover:bg-pink-50/30 transition-colors group rounded-3xl"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-2xl group-hover:scale-110 transition-transform duration-300 drop-shadow-sm">🧬</span>
                                <div className="text-left">
                                    <h4 className="text-sm font-black text-gray-800 group-hover:text-pink-600 transition-colors">Content DNA</h4>
                                    <p className="text-[10px] text-gray-400">Format, Pillar, Category</p>
                                </div>
                                {countDNA > 0 && (
                                    <span className="bg-pink-100 text-pink-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-pink-200 ml-2 animate-in zoom-in">
                                        {countDNA} Selected
                                    </span>
                                )}
                            </div>
                            <div className={`p-2 rounded-full transition-all duration-500 ease-in-out ${expandedZones.DNA ? 'bg-pink-100 text-pink-500 rotate-180' : 'bg-gray-50 text-gray-400 group-hover:bg-white'}`}>
                                <ChevronDown className="w-4 h-4" />
                            </div>
                        </button>
                        
                        {/* Smooth Height Transition Wrapper */}
                        <div className={`grid transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${expandedZones.DNA ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                            <div className="overflow-hidden">
                                <div className="px-6 pb-6 pt-2 border-t border-gray-50 relative">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-pink-50 rounded-bl-full opacity-50 pointer-events-none transition-opacity duration-500"></div>
                                    <div className="relative z-10 space-y-6 pt-2">
                                        <RenderSection title="Format (รูปแบบ)" icon={Type} options={formatOptions} filterKey="formats" colorTheme="pink" />
                                        <RenderSection title="Pillar (แกนเนื้อหา)" icon={Layers} options={pillarOptions} filterKey="pillars" colorTheme="blue" />
                                        <RenderSection title="Category (หมวดหมู่)" icon={Tag} options={categoryOptions} filterKey="categories" colorTheme="slate" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ZONE B: Workflow */}
                    <div className={`bg-white rounded-3xl border transition-all duration-300 ${expandedZones.WORKFLOW ? 'border-indigo-200 shadow-md ring-1 ring-indigo-50' : 'border-gray-200 shadow-sm hover:border-indigo-200'}`}>
                         <button 
                            onClick={() => toggleZone('WORKFLOW')}
                            className="w-full px-6 py-5 flex items-center justify-between bg-transparent hover:bg-indigo-50/30 transition-colors group rounded-3xl"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-2xl group-hover:scale-110 transition-transform duration-300 drop-shadow-sm">🚦</span>
                                <div className="text-left">
                                    <h4 className="text-sm font-black text-gray-800 group-hover:text-indigo-600 transition-colors">Workflow & Origin</h4>
                                    <p className="text-[10px] text-gray-400">Channel, Status</p>
                                </div>
                                {countWorkflow > 0 && (
                                    <span className="bg-indigo-100 text-indigo-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-200 ml-2 animate-in zoom-in">
                                        {countWorkflow} Selected
                                    </span>
                                )}
                            </div>
                            <div className={`p-2 rounded-full transition-all duration-500 ease-in-out ${expandedZones.WORKFLOW ? 'bg-indigo-100 text-indigo-500 rotate-180' : 'bg-gray-50 text-gray-400 group-hover:bg-white'}`}>
                                <ChevronDown className="w-4 h-4" />
                            </div>
                        </button>

                        <div className={`grid transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${expandedZones.WORKFLOW ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                            <div className="overflow-hidden">
                                <div className="px-6 pb-6 pt-2 border-t border-gray-50 relative">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full opacity-50 pointer-events-none transition-opacity duration-500"></div>
                                    <div className="relative z-10 space-y-6 pt-2">
                                        <RenderSection title="Channel (ช่องทาง)" icon={LayoutTemplate} options={channels} filterKey="channels" colorTheme="indigo" />
                                        <RenderSection title="Status (สถานะ)" icon={Activity} options={contentStatuses} filterKey="statuses" colorTheme="orange" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ZONE C: Timeline */}
                    <div className={`bg-white rounded-3xl border transition-all duration-300 ${expandedZones.TIMELINE ? 'border-purple-200 shadow-md ring-1 ring-purple-50' : 'border-gray-200 shadow-sm hover:border-purple-200'}`}>
                         <button 
                            onClick={() => toggleZone('TIMELINE')}
                            className="w-full px-6 py-5 flex items-center justify-between bg-transparent hover:bg-purple-50/30 transition-colors group rounded-3xl"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-2xl group-hover:scale-110 transition-transform duration-300 drop-shadow-sm">⏳</span>
                                <div className="text-left">
                                    <h4 className="text-sm font-black text-gray-800 group-hover:text-purple-600 transition-colors">Timeline</h4>
                                    <p className="text-[10px] text-gray-400">Shoot Date Range</p>
                                </div>
                                {countTimeline > 0 && (
                                    <span className="bg-purple-100 text-purple-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-200 ml-2 animate-in zoom-in">
                                        Active
                                    </span>
                                )}
                            </div>
                            <div className={`p-2 rounded-full transition-all duration-500 ease-in-out ${expandedZones.TIMELINE ? 'bg-purple-100 text-purple-500 rotate-180' : 'bg-gray-50 text-gray-400 group-hover:bg-white'}`}>
                                <ChevronDown className="w-4 h-4" />
                            </div>
                        </button>

                        <div className={`grid transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${expandedZones.TIMELINE ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                            <div className="overflow-hidden">
                                <div className="px-6 pb-6 pt-2 border-t border-gray-50 relative">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-bl-full opacity-50 pointer-events-none transition-opacity duration-500"></div>
                                    <div className="relative z-10 pt-2">
                                        <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-2xl border border-gray-200 focus-within:border-purple-300 focus-within:ring-4 focus-within:ring-purple-50 transition-all">
                                            <div className="relative flex-1">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><CalendarDays className="w-4 h-4" /></span>
                                                <input 
                                                    type="date" 
                                                    className="w-full pl-9 pr-3 py-2 bg-white rounded-xl text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-200"
                                                    value={localFilters.shootDateStart}
                                                    onChange={(e) => handleDateChange('shootDateStart', e.target.value)}
                                                />
                                            </div>
                                            <span className="text-gray-400 font-bold">➜</span>
                                            <div className="relative flex-1">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><CalendarDays className="w-4 h-4" /></span>
                                                <input 
                                                    type="date" 
                                                    className="w-full pl-9 pr-3 py-2 bg-white rounded-xl text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-200"
                                                    value={localFilters.shootDateEnd}
                                                    onChange={(e) => handleDateChange('shootDateEnd', e.target.value)}
                                                    min={localFilters.shootDateStart}
                                                />
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-gray-400 mt-2 ml-1">
                                            * เลือกช่วงเวลาวันที่ถ่ายทำ (Shoot Date) เพื่อดูคิวงาน
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-6 bg-white border-t border-gray-100 flex justify-between items-center shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-20">
                    <button 
                        onClick={handleReset}
                        className="flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                        <RotateCcw className="w-4 h-4" /> ล้างค่า (Reset)
                    </button>
                    <button 
                        onClick={handleApply}
                        className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-2xl font-black shadow-lg shadow-indigo-200 transition-all active:scale-95 text-sm flex items-center gap-2 transform hover:-translate-y-0.5"
                    >
                        <Filter className="w-4 h-4" />
                        ดูผลลัพธ์ (Show Results)
                    </button>
                </div>

            </div>
        </div>,
        document.body
    );
};

export default StockFilterModal;
