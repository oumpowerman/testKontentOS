
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, X, Search, Box, Trash2, Edit2, Info, Check, CheckCircle2, Image as ImageIcon, LayoutGrid, List as ListIcon, Filter } from 'lucide-react';
import { InventoryItem, MasterOption, AssetGroup } from '../../types';
import { useGlobalDialog } from '../../context/GlobalDialogContext';

interface InventoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    inventoryItems: InventoryItem[];
    currentChecklistItems?: { id: string; text: string }[]; // Updated to include ID
    onAdd: (text: string, categoryId: string) => void;
    onRemove?: (id: string) => void; // New prop
    // Updated: Now accepts optional assetGroup
    onAddItem: (name: string, desc: string, catId: string, img?: File, assetGroup?: string) => Promise<boolean>;
    onUpdateItem: (id: string, updates: Partial<InventoryItem>, img?: File) => Promise<boolean>;
    onDeleteItem: (id: string) => Promise<void>;
    masterOptions: MasterOption[];
}

const InventoryModal: React.FC<InventoryModalProps> = ({ 
    isOpen, onClose, inventoryItems, currentChecklistItems = [], onAdd, onRemove, onAddItem, onUpdateItem, onDeleteItem, masterOptions 
}) => {
    const { showAlert, showConfirm } = useGlobalDialog();
    
    // Filtered Master Options
    const mainCats = useMemo(() => masterOptions.filter(o => o.type === 'INV_CAT_L1').sort((a,b) => a.sortOrder - b.sortOrder), [masterOptions]);
    const subCats = useMemo(() => masterOptions.filter(o => o.type === 'INV_CAT_L2').sort((a,b) => a.sortOrder - b.sortOrder), [masterOptions]);

    // View States
    const [viewType, setViewType] = useState<'GRID' | 'LIST'>('GRID');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterL1, setFilterL1] = useState<string>('ALL');
    const [filterL2, setFilterL2] = useState<string>('ALL');

    // Detail/Edit States
    const [viewingItem, setViewingItem] = useState<InventoryItem | null>(null);
    const [isEditingMode, setIsEditingMode] = useState(false);

    // Form States (Add/Edit)
    const [invName, setInvName] = useState('');
    const [invDesc, setInvDesc] = useState('');
    const [invL1, setInvL1] = useState('');
    const [invL2, setInvL2] = useState('');
    const [invImage, setInvImage] = useState<File | null>(null);
    const [invImagePreview, setInvImagePreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Mobile Layout State
    const [showMobileForm, setShowMobileForm] = useState(false);
    
    // Layout Calculation State
    const [modalStyle, setModalStyle] = useState<React.CSSProperties>({});
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- Dynamic Layout Logic ---
    useEffect(() => {
        if (!isOpen) return;

        const updatePosition = () => {
            // Always use full screen overlay for consistency and to ensure it covers everything
            setModalStyle({
                position: 'fixed',
                inset: 0,
                zIndex: 9999, // High z-index to cover everything including sidebar
                padding: window.innerWidth >= 1024 ? '2rem' : 0
            });
        };

        // Initial update
        updatePosition();

        // Listen to window resize
        window.addEventListener('resize', updatePosition);
        
        // Listen to main element size changes (e.g. sidebar collapse transition)
        const mainEl = document.querySelector('main');
        const observer = new ResizeObserver(updatePosition);
        if (mainEl) observer.observe(mainEl);

        return () => {
            window.removeEventListener('resize', updatePosition);
            observer.disconnect();
        };
    }, [isOpen]);

    // --- Helpers ---
    const findParentL1 = (l2Key: string) => {
        const l2 = subCats.find(s => s.key === l2Key);
        if (l2 && l2.parentKey) {
            const l1 = mainCats.find(m => m.key === l2.parentKey);
            return l1 ? l1 : null;
        }
        return null;
    };

    const validSubCatsForForm = invL1 ? subCats.filter(s => s.parentKey === invL1) : [];
    const validSubCatsForFilter = filterL1 !== 'ALL' ? subCats.filter(s => s.parentKey === filterL1) : subCats;

    // Filter Logic
    const filteredItems = useMemo(() => {
        return inventoryItems.filter(item => {
            // Search
            const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                (item.description || '').toLowerCase().includes(searchQuery.toLowerCase());
            if (!matchSearch) return false;

            // Category Filter
            const itemL2 = subCats.find(s => s.key === item.categoryId);
            const itemL1Key = itemL2?.parentKey;

            if (filterL1 !== 'ALL' && itemL1Key !== filterL1) return false;
            if (filterL2 !== 'ALL' && item.categoryId !== filterL2) return false;

            return true;
        });
    }, [inventoryItems, searchQuery, filterL1, filterL2, subCats, mainCats]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setInvImage(file);
            setInvImagePreview(URL.createObjectURL(file));
        }
    };

    const handleOpenDetail = (item: InventoryItem) => {
        setViewingItem(item);
        setIsEditingMode(false);
        // Pre-fill form data for potential editing
        setInvName(item.name);
        setInvDesc(item.description || '');
        setInvL2(item.categoryId);
        const l1 = findParentL1(item.categoryId);
        setInvL1(l1 ? l1.key : '');
        setInvImagePreview(item.imageUrl || null);
        setInvImage(null);
    };

    const handleSave = async () => {
        if (!invName.trim() || !invL2) {
            showAlert('กรุณากรอกชื่อและเลือกประเภทให้ครบ');
            return;
        }
        setIsSubmitting(true);
        let success = false;

        if (viewingItem && isEditingMode) {
            success = await onUpdateItem(viewingItem.id, {
                name: invName,
                description: invDesc,
                categoryId: invL2,
                assetGroup: (invL1 as AssetGroup) || undefined, // Update group too if changed
                imageUrl: invImagePreview || undefined
            }, invImage || undefined);
            if (success) {
                setIsEditingMode(false);
                setViewingItem(null);
            }
        } else {
            // Pass invL1 as assetGroup
            success = await onAddItem(invName, invDesc, invL2, invImage || undefined, (invL1 as AssetGroup));
            if (success) {
                setInvName('');
                setInvDesc('');
                setInvImage(null);
                setInvImagePreview(null);
            }
        }
        setIsSubmitting(false);
        if (success) setShowMobileForm(false); // Close drawer on success
    };

    const handleEditClick = () => {
        setIsEditingMode(true);
    };

    if (!isOpen) return null;

    // Use CreatePortal to render at body level for better Z-Index management vs Sidebar
    return createPortal(
        <div 
            style={modalStyle} 
            className="flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in transition-all duration-300 ease-out"
        >
            <div className="bg-white w-full h-full md:h-[90%] md:w-[95%] rounded-none md:rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 border-none md:border border-gray-200 relative">
                
                {/* LEFT: Add Form (Responsive: Sidebar on Desktop, Overlay on Mobile) */}
                <div className={`
                    bg-gray-50/80 border-b md:border-b-0 md:border-r border-gray-200 p-6 flex-col overflow-y-auto shrink-0 backdrop-blur-sm transition-all duration-300
                    md:flex md:w-[320px] lg:w-[350px] md:relative
                    ${showMobileForm ? 'fixed inset-0 z-[110] w-full h-full flex bg-white' : 'hidden'}
                `}>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-gray-800 flex items-center">
                            <Plus className="w-6 h-6 mr-2 text-indigo-600" /> เพิ่มของใหม่
                        </h3>
                        {/* Mobile Close Form Button */}
                        <button 
                            onClick={() => setShowMobileForm(false)} 
                            className="md:hidden p-2 text-gray-500 hover:bg-gray-200 rounded-full"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="space-y-4 pb-20 md:pb-0">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">1. ประเภทหลัก</label>
                                <select className="w-full p-2.5 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-700 outline-none focus:border-indigo-500" value={invL1} onChange={e => { setInvL1(e.target.value); setInvL2(''); }}>
                                    <option value="">-- หมวด --</option>
                                    {mainCats.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">2. ชนิด</label>
                                <select className="w-full p-2.5 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-700 outline-none focus:border-indigo-500 disabled:bg-gray-100" value={invL2} onChange={e => setInvL2(e.target.value)} disabled={!invL1}>
                                    <option value="">-- เลือก --</option>
                                    {validSubCatsForForm.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">3. ชื่ออุปกรณ์</label>
                            <input type="text" className="w-full p-3 rounded-xl border border-gray-200 text-sm font-bold outline-none focus:border-indigo-500" placeholder="เช่น Sony A7IV" value={invName} onChange={e => setInvName(e.target.value)} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">4. รายละเอียด (Optional)</label>
                            <textarea rows={3} className="w-full p-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-indigo-500 resize-none" placeholder="เช่น มีแบต 2 ก้อน..." value={invDesc} onChange={e => setInvDesc(e.target.value)} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">5. รูปภาพ (Optional)</label>
                            <div className="mt-1 border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:bg-white relative flex items-center justify-center min-h-[140px]" onClick={() => fileInputRef.current?.click()}>
                                {invImagePreview ? (
                                    <img src={invImagePreview} className="w-full h-32 object-contain" />
                                ) : (
                                    <div className="flex flex-col items-center text-gray-400">
                                        <ImageIcon className="w-8 h-8 mb-2" />
                                        <span className="text-xs">คลิกเพื่ออัปโหลด</span>
                                    </div>
                                )}
                                <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileChange} accept="image/*" />
                                {invImagePreview && (
                                    <button onClick={(e) => { e.stopPropagation(); setInvImage(null); setInvImagePreview(null); }} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"><X className="w-3 h-3" /></button>
                                )}
                            </div>
                        </div>
                        <button onClick={handleSave} disabled={isSubmitting} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 flex justify-center items-center">
                            {isSubmitting ? 'กำลังบันทึก...' : <><Plus className="w-5 h-5 mr-2" /> บันทึกเข้าคลัง</>}
                        </button>
                    </div>
                </div>

                {/* RIGHT: List (Main Content) */}
                <div className="flex-1 bg-white flex flex-col relative min-w-0 h-full">
                    {/* Header Controls (Sticky Top) */}
                    <div className="px-4 md:px-6 py-4 border-b border-gray-100 flex flex-col xl:flex-row justify-between items-start xl:items-center bg-white gap-4 z-10 shrink-0">
                        <div className="flex items-center gap-4 w-full xl:w-auto justify-between xl:justify-start">
                            <h3 className="font-bold text-gray-800 text-lg whitespace-nowrap flex items-center">
                                📦 คลังอุปกรณ์ <span className="ml-2 text-sm text-gray-500 font-normal">({filteredItems.length})</span>
                            </h3>
                            
                            <div className="flex bg-gray-100 p-1 rounded-lg shrink-0">
                                <button 
                                    onClick={() => setViewType('GRID')}
                                    className={`p-1.5 rounded-md transition-all ${viewType === 'GRID' ? 'bg-white shadow text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                                    title="Grid View"
                                >
                                    <LayoutGrid className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => setViewType('LIST')}
                                    className={`p-1.5 rounded-md transition-all ${viewType === 'LIST' ? 'bg-white shadow text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                                    title="List View"
                                >
                                    <ListIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
                            {/* Search */}
                            <div className="relative flex-1 xl:flex-none">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input 
                                    type="text" 
                                    placeholder="ค้นหา..." 
                                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:border-indigo-500 outline-none xl:w-48 transition-all focus:w-64"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)} 
                                />
                            </div>

                            {/* Filters */}
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <select 
                                        className="appearance-none pl-3 pr-8 py-2 border border-gray-200 rounded-xl text-sm font-medium bg-gray-50 focus:bg-white focus:border-indigo-500 outline-none cursor-pointer max-w-[140px] truncate"
                                        value={filterL1}
                                        onChange={e => { setFilterL1(e.target.value); setFilterL2('ALL'); }}
                                    >
                                        <option value="ALL">ทุกหมวดหมู่</option>
                                        {mainCats.map(c => <option key={c.key} value={c.key}>{c.label.split('(')[0]}</option>)}
                                    </select>
                                    <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                                </div>

                                <div className="relative hidden sm:block">
                                    <select 
                                        className="appearance-none pl-3 pr-8 py-2 border border-gray-200 rounded-xl text-sm font-medium bg-gray-50 focus:bg-white focus:border-indigo-500 outline-none cursor-pointer max-w-[140px] truncate"
                                        value={filterL2}
                                        onChange={e => setFilterL2(e.target.value)}
                                        disabled={filterL1 === 'ALL'}
                                    >
                                        <option value="ALL">ทุกชนิด</option>
                                        {validSubCatsForFilter.map(c => <option key={c.key} value={c.key}>{c.label.split('(')[0]}</option>)}
                                    </select>
                                    <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                                </div>
                            </div>

                            {/* Close Modal (Always visible on mobile here if user prefers, but we have FAB for adding) */}
                            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 ml-auto xl:ml-2"><X className="w-5 h-5" /></button>
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50/30 pb-24 overscroll-contain">
                        {viewType === 'GRID' ? (
                            // --- GRID VIEW ---
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 content-start">
                                {filteredItems.map(item => {
                                    const subCat = subCats.find(s => s.key === item.categoryId);
                                    const checklistItem = currentChecklistItems.find(ci => ci.text.toLowerCase() === item.name.toLowerCase());
                                    const isAlreadyInChecklist = !!checklistItem;

                                    return (
                                        <div key={item.id} onClick={() => handleOpenDetail(item)} className={`bg-white border rounded-2xl p-3 flex flex-col gap-2 transition-all cursor-pointer group relative overflow-hidden ${isAlreadyInChecklist ? 'border-green-200 bg-green-50/20' : 'border-gray-200 hover:border-indigo-300 hover:shadow-lg hover:-translate-y-1'}`}>
                                            <div className="aspect-square bg-gray-50 rounded-xl flex items-center justify-center overflow-hidden relative border border-gray-100">
                                                {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" /> : <Box className="w-8 h-8 text-gray-300" />}
                                                
                                                {isAlreadyInChecklist ? (
                                                    <div className="absolute inset-0 bg-green-500/10 backdrop-blur-[1px] flex items-center justify-center">
                                                        <div className="bg-green-500 text-white p-1.5 rounded-full shadow-lg">
                                                            <Check className="w-4 h-4 stroke-[4px]" />
                                                        </div>
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); if(onRemove && checklistItem) onRemove(checklistItem.id); }} 
                                                            className="absolute bottom-2 right-2 p-2 bg-red-500 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all hover:bg-red-600 active:scale-95" 
                                                            title="นำออกจากกระเป๋า"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button onClick={(e) => { e.stopPropagation(); onAdd(item.name, item.categoryId); }} className="absolute bottom-2 right-2 p-2 bg-indigo-600 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all hover:bg-indigo-700 active:scale-95" title="เพิ่มลงรายการทันที">
                                                        <Plus className="w-4 h-4 stroke-[3px]" />
                                                    </button>
                                                )}
                                            </div>
                                            <div>
                                                <h4 className={`font-bold text-sm truncate ${isAlreadyInChecklist ? 'text-green-700' : 'text-gray-800'}`} title={item.name}>{item.name}</h4>
                                                <div className="flex justify-between items-center mt-1">
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full truncate max-w-[70%] ${isAlreadyInChecklist ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                                                        {subCat ? subCat.label.split(' ')[0] : item.categoryId}
                                                    </span>
                                                    {isAlreadyInChecklist && <span className="text-[9px] font-black text-green-500 uppercase tracking-tighter">In Bag</span>}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            // --- LIST VIEW ---
                            <div className="flex flex-col gap-2">
                                {filteredItems.map(item => {
                                    const subCat = subCats.find(s => s.key === item.categoryId);
                                    const parentL1 = subCat ? mainCats.find(m => m.key === subCat.parentKey) : null;
                                    const checklistItem = currentChecklistItems.find(ci => ci.text.toLowerCase() === item.name.toLowerCase());
                                    const isAlreadyInChecklist = !!checklistItem;
                                    
                                    return (
                                        <div key={item.id} onClick={() => handleOpenDetail(item)} className={`flex items-center gap-4 p-3 rounded-xl border transition-all cursor-pointer group ${isAlreadyInChecklist ? 'bg-green-50/30 border-green-100' : 'bg-white border-gray-200 hover:border-indigo-300 hover:shadow-md'}`}>
                                            {/* Image */}
                                            <div className="w-12 h-12 bg-gray-50 rounded-lg shrink-0 overflow-hidden border border-gray-100 flex items-center justify-center relative">
                                                {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover" /> : <Box className="w-5 h-5 text-gray-300" />}
                                                {isAlreadyInChecklist && (
                                                    <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                                                        <Check className="w-4 h-4 text-green-600 stroke-[4px]" />
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className={`font-bold text-sm truncate ${isAlreadyInChecklist ? 'text-green-700' : 'text-gray-800'}`}>{item.name}</h4>
                                                    {isAlreadyInChecklist && <span className="text-[8px] font-black bg-green-500 text-white px-1 rounded uppercase">In Bag</span>}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs">
                                                    {parentL1 && (
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${parentL1.color || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                                            {parentL1.label.split('(')[0]}
                                                        </span>
                                                    )}
                                                    <span className="text-gray-400">/</span>
                                                    <span className="text-gray-500 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                                                        {subCat ? subCat.label.split('(')[0] : item.categoryId}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Action */}
                                            {isAlreadyInChecklist ? (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); if(onRemove && checklistItem) onRemove(checklistItem.id); }} 
                                                    className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-colors flex items-center gap-2 text-xs font-bold shrink-0"
                                                >
                                                    <Trash2 className="w-4 h-4" /> <span className="hidden sm:inline">นำออก</span>
                                                </button>
                                            ) : (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); onAdd(item.name, item.categoryId); }} 
                                                    className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-colors flex items-center gap-2 text-xs font-bold shrink-0"
                                                >
                                                    <Plus className="w-4 h-4" /> <span className="hidden sm:inline">เลือก</span>
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {filteredItems.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                                <Search className="w-12 h-12 mb-3 opacity-20" />
                                <p>ไม่พบรายการที่ค้นหา</p>
                            </div>
                        )}
                    </div>

                    {/* Mobile Floating Action Button */}
                    <button 
                        onClick={() => setShowMobileForm(true)}
                        className="md:hidden absolute bottom-6 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-xl flex items-center justify-center z-50 hover:bg-indigo-700 active:scale-90 transition-all"
                    >
                        <Plus className="w-8 h-8" />
                    </button>
                </div>

                {/* DETAIL POPUP */}
                {viewingItem && (
                    <div className="absolute inset-0 bg-white/90 backdrop-blur-md z-[120] flex items-center justify-center p-4 animate-in fade-in" onClick={() => setViewingItem(null)}>
                        <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-full animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">{isEditingMode ? <Edit2 className="w-5 h-5 text-indigo-600"/> : <Info className="w-5 h-5 text-indigo-600"/>}{isEditingMode ? 'แก้ไขข้อมูล' : 'รายละเอียดอุปกรณ์'}</h3>
                                <button onClick={() => setViewingItem(null)} className="p-2 hover:bg-gray-200 rounded-full text-gray-500"><X className="w-5 h-5" /></button>
                            </div>
                            <div className="p-6 overflow-y-auto flex-1">
                                {isEditingMode ? (
                                    <div className="space-y-4">
                                        <div className="flex justify-center mb-4">
                                            <div className="w-32 h-32 bg-gray-100 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer relative" onClick={() => fileInputRef.current?.click()}>
                                                {invImagePreview ? <img src={invImagePreview} className="w-full h-full object-cover rounded-xl" /> : <ImageIcon className="w-8 h-8 text-gray-300" />}
                                            </div>
                                        </div>
                                        <input type="text" className="w-full p-3 border rounded-xl font-bold" value={invName} onChange={e => setInvName(e.target.value)} placeholder="ชื่ออุปกรณ์" />
                                        <textarea className="w-full p-3 border rounded-xl text-sm h-24 resize-none" value={invDesc} onChange={e => setInvDesc(e.target.value)} placeholder="รายละเอียด..." />
                                        <select className="w-full p-3 border rounded-xl text-sm font-bold bg-white" value={invL2} onChange={e => setInvL2(e.target.value)}>{subCats.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}</select>
                                    </div>
                                ) : (
                                    <div className="flex flex-col md:flex-row gap-6">
                                        <div className="w-full md:w-1/2 aspect-square bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center overflow-hidden">{viewingItem.imageUrl ? <img src={viewingItem.imageUrl} className="w-full h-full object-cover" /> : <Box className="w-20 h-20 text-gray-200" />}</div>
                                        <div className="flex-1 space-y-4">
                                            <div><h2 className="text-2xl font-black text-gray-800 leading-tight">{viewingItem.name}</h2><span className="inline-block mt-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold border border-indigo-100">{subCats.find(s => s.key === viewingItem.categoryId)?.label || viewingItem.categoryId}</span></div>
                                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100"><h4 className="text-xs font-bold text-gray-400 uppercase mb-2">รายละเอียด (Details)</h4><p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{viewingItem.description || "ไม่มีรายละเอียดเพิ่มเติม"}</p></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                                {isEditingMode ? (
                                    <div className="flex gap-3 w-full"><button onClick={() => setIsEditingMode(false)} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-200 rounded-xl transition-colors">ยกเลิก</button><button onClick={handleSave} disabled={isSubmitting} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition-all flex justify-center">{isSubmitting ? 'บันทึก...' : 'บันทึกการแก้ไข'}</button></div>
                                ) : (
                                    <>
                                        <div className="flex gap-2">
                                            <button onClick={handleEditClick} className="p-2.5 text-gray-500 hover:text-indigo-600 hover:bg-white rounded-xl border border-transparent hover:border-gray-200 transition-all"><Edit2 className="w-5 h-5" /></button>
                                            <button onClick={async () => { if(await showConfirm('ลบออกจากคลังถาวร?')) { onDeleteItem(viewingItem.id); setViewingItem(null); } }} className="p-2.5 text-gray-500 hover:text-red-600 hover:bg-white rounded-xl border border-transparent hover:border-red-100 transition-all"><Trash2 className="w-5 h-5" /></button>
                                        </div>
                                        {(() => {
                                            const checklistItem = currentChecklistItems.find(ci => ci.text.toLowerCase() === viewingItem.name.toLowerCase());
                                            return checklistItem ? (
                                                <button 
                                                    onClick={async () => { 
                                                        if(await showConfirm(`ต้องการนำ "${viewingItem.name}" ออกจากกระเป๋าใช่หรือไม่?`, 'ยืนยันการนำออก')) { 
                                                            if(onRemove) onRemove(checklistItem.id); 
                                                            setViewingItem(null); 
                                                        } 
                                                    }} 
                                                    className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-200 transition-all active:scale-95 flex items-center"
                                                >
                                                    <Trash2 className="w-5 h-5 mr-2" /> นำออกจากกระเป๋า
                                                </button>
                                            ) : (
                                                <button 
                                                    onClick={() => { onAdd(viewingItem.name, viewingItem.categoryId); setViewingItem(null); onClose(); }} 
                                                    className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-200 transition-all active:scale-95 flex items-center"
                                                >
                                                    <Check className="w-5 h-5 mr-2" /> เลือกใส่กระเป๋า
                                                </button>
                                            );
                                        })()}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>,
        document.body
    );
};

export default InventoryModal;
