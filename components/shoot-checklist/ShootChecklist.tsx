
import React, { useState, useMemo } from 'react';
import { Camera, Mic, Box, Plus, Trash2, Lightbulb, Layout, CheckCircle2, Archive, RotateCcw, PackageOpen, PlusCircle, Compass, Info, Edit2, Check, ArrowRight } from 'lucide-react';
import { ChecklistItem, ChecklistPreset, MasterOption, InventoryItem } from '../../types';
import MentorTip from '../MentorTip';
import { useChecklist } from '../../hooks/useChecklist';
import InventoryModal from './InventoryModal';
import PresetModal from './PresetModal';
import PresetEditorModal from './PresetEditorModal';
import ItemVerifyModal from './ItemVerifyModal';
import { useGlobalDialog } from '../../context/GlobalDialogContext';
import InfoModal from '../ui/InfoModal'; 
import ChecklistGuide from './ChecklistGuide'; 
import AppBackground from '../common/AppBackground';

interface ShootChecklistProps {
    items: ChecklistItem[]; 
    onToggle: (id: string, currentStatus: boolean) => void;
    onAdd: (text: string, categoryId: string) => void;
    onDelete: (id: string) => void;
    onReset: () => void;
    
    // Props below are kept for interface compatibility but we will override with local hook for instant updates
    presets: ChecklistPreset[];
    activePresetId?: string | null;
    activePresetName?: string | null;
    onLoadPreset: (id: string, clearFirst?: boolean) => void;
    onAddPreset: (name: string, inventoryIds?: string[]) => void;
    onDeletePreset: (id: string) => void;

    onOpenSettings: () => void;
    masterOptions?: MasterOption[];
}

const ShootChecklist: React.FC<ShootChecklistProps> = ({ 
    items, onToggle, onAdd, onDelete, onReset,
    presets: initialPresets, // Rename to avoid conflict
    activePresetId: propActivePresetId,
    activePresetName: propActivePresetName,
    onLoadPreset: propOnLoadPreset, 
    onAddPreset: propOnAddPreset, 
    onDeletePreset: propOnDeletePreset,
    masterOptions = []
}) => {
    // Inventory Hook Logic - We use local state for Presets to ensure Optimistic Updates work instantly
    const { 
        inventoryItems, 
        checklistPresets, // Use this local state for latest presets
        handleAddInventoryItem, 
        handleUpdateInventoryItem, 
        handleDeleteInventoryItem, 
        handleUpdatePreset,
        // We DO NOT destructure handleLoadPreset here to avoid using the wrong instance
    } = useChecklist();
    
    const { showConfirm } = useGlobalDialog();

    // Modals State
    const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
    const [isPresetModalOpen, setIsPresetModalOpen] = useState(false); // Create New
    const [isPresetEditorOpen, setIsPresetEditorOpen] = useState(false); // Edit Existing
    const [editingPreset, setEditingPreset] = useState<ChecklistPreset | null>(null);
    const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
    const [verifyingItem, setVerifyingItem] = useState<ChecklistItem | null>(null);
    const [isInfoOpen, setIsInfoOpen] = useState(false); 
    
    // UI State
    const [quickAddText, setQuickAddText] = useState('');
    const [activeCategoryForQuickAdd, setActiveCategoryForQuickAdd] = useState<string | null>(null);

    // Filtered Master Options
    const mainCats = masterOptions.filter(o => o.type === 'INV_CAT_L1').sort((a,b) => a.sortOrder - b.sortOrder);
    const subCats = masterOptions.filter(o => o.type === 'INV_CAT_L2').sort((a,b) => a.sortOrder - b.sortOrder);

    // Calculations
    const totalItems = items.length;
    const checkedItems = items.filter(i => i.isChecked).length;
    const progress = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

    // Handlers
    const handlePresetClick = async (presetId: string) => {
        if (presetId === 'CLEAR') {
            const confirmed = await showConfirm('ต้องการลบรายการทั้งหมดหน้าจอใช่หรือไม่?', 'ยืนยันการล้างกระเป๋า 🗑️');
            if (confirmed) {
                // Use Prop function to ensure Parent State updates (Visual Sync)
                propOnLoadPreset('CLEAR');
            }
        } else {
            const preset = checklistPresets.find(p => p.id === presetId);
            // Use Prop function to ensure Parent State updates (Visual Sync)
            propOnLoadPreset(presetId, true); // Exclusive load
        }
    };

    const handleEditPresetClick = (e: React.MouseEvent, preset: ChecklistPreset) => {
        e.stopPropagation();
        setEditingPreset(preset);
        setIsPresetEditorOpen(true);
    };

    // Item Verification Flow
    const handleItemClick = (item: ChecklistItem) => {
        if (item.isChecked) {
            // If already checked, just toggle off quickly
            onToggle(item.id, true);
        } else {
            // Open Verify Modal
            setVerifyingItem(item);
            setIsVerifyModalOpen(true);
        }
    };
    
    const handleVerifyConfirm = () => {
        if (verifyingItem) {
            onToggle(verifyingItem.id, false); // Check it
            setVerifyingItem(null);
        }
    };

    // Helper: Find Parent L1 Key from an L2 Key
    const findParentL1 = (l2Key: string) => {
        const l2 = subCats.find(s => s.key === l2Key);
        if (l2 && l2.parentKey) {
            const l1 = mainCats.find(m => m.key === l2.parentKey);
            return l1 ? l1 : null;
        }
        return null;
    };

    // Group Items by L1
    const groupedActiveItems = useMemo(() => {
        const groups: Record<string, ChecklistItem[]> = {};
        mainCats.forEach(cat => { groups[cat.key] = []; });
        groups['MISC'] = [];

        items.forEach(item => {
            const l1 = findParentL1(item.categoryId);
            if (l1) {
                if (!groups[l1.key]) groups[l1.key] = [];
                groups[l1.key].push(item);
            } else {
                if (groups[item.categoryId]) groups[item.categoryId].push(item);
                else groups['MISC'].push(item);
            }
        });
        return groups;
    }, [items, mainCats, subCats]);

    const handleQuickAdd = (l1Key: string) => {
        if(quickAddText.trim()) {
            // Check for duplicates
            const isDuplicate = items.some(i => i.text.toLowerCase() === quickAddText.trim().toLowerCase());
            if (isDuplicate) {
                // We can use a toast here if we had access to it, but for now let's just not add
                return;
            }
            onAdd(quickAddText, l1Key);
            setQuickAddText('');
        }
    };

    const getIcon = (key: string) => {
        if (key.includes('CAMERA')) return <Camera className="w-5 h-5" />;
        if (key.includes('AUDIO')) return <Mic className="w-5 h-5" />;
        if (key.includes('LIGHT')) return <Lightbulb className="w-5 h-5" />;
        if (key.includes('GRIP')) return <Layout className="w-5 h-5" />;
        return <Box className="w-5 h-5" />;
    };

    // Find Inventory Item for Verification Modal (Match by Name)
    const currentInventoryItem = verifyingItem 
        ? inventoryItems.find(inv => inv.name === verifyingItem.text)
        : undefined;

    return (
        <AppBackground theme="pastel-orange" pattern="dots" className="px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in duration-500 relative z-10 min-h-[calc(100vh-64px)] overflow-y-auto w-full">
            <div className="w-full space-y-6">
                <MentorTip variant="pink" messages={["กดที่การ์ดเพื่อดูรูปก่อนเช็ค (Verify Mode)", "กดปุ่มดินสอที่ Preset เพื่อแก้ไขรายการข้างในได้แล้วนะ!"]} />

            {/* Header & Controls */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-4">
                    <div className="flex items-start gap-3">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                                จัดเป๋าออกกอง 🎒
                            </h1>
                            <div className="flex items-center gap-2 mt-1">
                                <p className="text-gray-500 font-medium">Smart Packer & Inventory</p>
                                {propActivePresetName && (
                                    <>
                                        <span className="text-gray-300">•</span>
                                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-black border border-indigo-100 flex items-center gap-1 animate-in zoom-in duration-300">
                                            <Layout className="w-3 h-3" />
                                            Active: {propActivePresetName}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                        <button 
                            onClick={() => setIsInfoOpen(true)}
                            className="p-1.5 bg-white text-teal-500 hover:text-teal-700 hover:bg-teal-50 rounded-full transition-colors shadow-sm border border-gray-100 mt-1"
                            title="คู่มือการใช้งาน"
                        >
                            <Info className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex gap-3 w-full xl:w-auto">
                        <button onClick={() => setIsInventoryModalOpen(true)} className="flex-1 xl:flex-none relative group overflow-hidden px-6 py-2.5 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white font-bold text-sm shadow-lg shadow-indigo-200 transition-all hover:scale-[1.02] flex items-center justify-center gap-2">
                            <Archive className="w-4 h-4 text-white/80" />
                            <span>คลังอุปกรณ์ (Inventory)</span>
                        </button>
                    </div>
                </div>

                {/* --- Preset Chips (Using local checklistPresets) --- */}
                <div className="overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2">
                    <div className="flex items-center gap-2 w-max">
                        {checklistPresets.map(p => (
                            <div 
                                key={p.id}
                                className={`
                                    flex items-center rounded-full border text-xs font-bold transition-all pr-1 pl-4 py-1 cursor-pointer
                                    ${propActivePresetId === p.id 
                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-200' 
                                        : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'}
                                `}
                                onClick={() => handlePresetClick(p.id)}
                            >
                                <span className="mr-2">{p.name}</span>
                                
                                {/* Edit Button */}
                                <button 
                                    onClick={(e) => handleEditPresetClick(e, p)}
                                    className={`p-1 rounded-full hover:bg-white/20 transition-colors ${propActivePresetId === p.id ? 'text-indigo-200 hover:text-white' : 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
                                >
                                    <Edit2 className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                        
                        <div className="w-px h-6 bg-gray-200 mx-2"></div>
                        
                        <button onClick={() => setIsPresetModalOpen(true)} className="px-3 py-2 bg-gray-100 rounded-full text-gray-500 hover:text-indigo-600 hover:bg-white border border-transparent hover:border-gray-200 transition-all text-xs font-bold flex items-center">
                            <PlusCircle className="w-3.5 h-3.5 mr-1" /> สร้างชุดใหม่
                        </button>
                        
                        <button onClick={() => handlePresetClick('CLEAR')} className="px-3 py-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors text-xs font-bold flex items-center">
                            <Trash2 className="w-3.5 h-3.5 mr-1" /> Clear
                        </button>
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 sticky top-0 z-30">
                <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1.5">
                        <span className="font-bold text-gray-700 flex items-center gap-2">
                            <Compass className={`w-4 h-4 ${progress === 100 ? 'text-green-500 animate-spin-slow' : 'text-orange-500'}`} />
                            ความพร้อม (Readiness)
                        </span>
                        <span className="font-black text-gray-800">{checkedItems}/{totalItems}</span>
                    </div>
                    <div className="h-4 bg-gray-100 rounded-full overflow-hidden border border-gray-200 p-0.5">
                        <div 
                            className={`h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden ${progress === 100 ? 'bg-gradient-to-r from-emerald-400 to-green-500' : 'bg-gradient-to-r from-amber-400 to-orange-500'}`} 
                            style={{ width: `${progress}%` }}
                        >
                            <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite] -translate-x-full"></div>
                        </div>
                    </div>
                </div>
                <button 
                    onClick={onReset}
                    className="p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-200" 
                    title="รีเซ็ตสถานะการเช็ค"
                >
                    <RotateCcw className="w-5 h-5" />
                </button>
            </div>

            {/* List Area */}
            {items.length === 0 ? (
                <div className="text-center py-24 bg-gray-50/50 rounded-[2rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setIsInventoryModalOpen(true)}>
                    <PackageOpen className="w-16 h-16 text-gray-300 mb-4" />
                    <h3 className="text-xl font-bold text-gray-600">กระเป๋าว่างเปล่า</h3>
                    <p className="text-gray-400 mb-6">เลือก Preset หรือเพิ่มของจากคลัง</p>
                    <button className="px-6 py-2.5 bg-white border border-gray-300 text-gray-600 rounded-xl font-bold hover:border-indigo-400 hover:text-indigo-600 shadow-sm transition-all">
                        เปิดคลังอุปกรณ์
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {mainCats.map(cat => {
                        const catItems = groupedActiveItems[cat.key] || [];
                        if (catItems.length === 0 && activeCategoryForQuickAdd !== cat.key) return null;
                        
                        // Category Progress
                        const catChecked = catItems.filter(i => i.isChecked).length;
                        const catTotal = catItems.length;
                        const catProgress = catTotal > 0 ? (catChecked / catTotal) * 100 : 0;
                        const isComplete = catProgress === 100 && catTotal > 0;

                        // Sort: Unchecked first
                        const sortedItems = [...catItems].sort((a, b) => Number(a.isChecked) - Number(b.isChecked));

                        return (
                            <div key={cat.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow">
                                {/* Header */}
                                <div className={`px-5 py-3 border-b border-gray-50 flex items-center justify-between ${isComplete ? 'bg-green-50/50' : (cat.color ? cat.color.replace('text-', 'bg-').replace('bg-', 'bg-opacity-10 ') : 'bg-gray-50')}`}>
                                    <div className="flex items-center space-x-2">
                                        <div className={`p-1.5 rounded-lg bg-white/80 ${cat.color}`}>
                                            {getIcon(cat.key)}
                                        </div>
                                        <h3 className="font-bold text-gray-800">{cat.label}</h3>
                                    </div>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isComplete ? 'bg-green-100 text-green-700' : 'bg-white text-gray-500 border border-gray-100'}`}>
                                        {catChecked}/{catTotal}
                                    </span>
                                </div>
                                
                                {/* Progress Line */}
                                <div className="h-1 w-full bg-gray-100">
                                    <div className={`h-full transition-all duration-500 ${isComplete ? 'bg-green-500' : 'bg-indigo-400'}`} style={{ width: `${catProgress}%` }}></div>
                                </div>

                                <div className="p-2 flex-1 space-y-1.5">
                                    {sortedItems.map(item => (
                                        <div 
                                            key={item.id}
                                            onClick={() => handleItemClick(item)}
                                            className={`
                                                flex items-center p-3 rounded-xl cursor-pointer transition-all group relative border
                                                ${item.isChecked 
                                                    ? 'bg-gray-50 border-transparent opacity-60 hover:opacity-100' 
                                                    : 'bg-white border-gray-100 hover:border-indigo-200 hover:shadow-sm'
                                                }
                                            `}
                                        >
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); onToggle(item.id, item.isChecked); }}
                                                className={`
                                                    w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3 transition-colors shrink-0
                                                    ${item.isChecked 
                                                        ? 'bg-green-500 border-green-500' 
                                                        : 'border-gray-300 bg-white group-hover:border-indigo-400'
                                                    }
                                                `}
                                            >
                                                {item.isChecked && <Check className="w-3.5 h-3.5 text-white stroke-[4px]" />}
                                            </button>
                                            
                                            <span className={`flex-1 text-sm font-medium ${item.isChecked ? 'text-gray-400 line-through decoration-2' : 'text-gray-700'}`}>
                                                {item.text}
                                            </span>
                                            
                                            {!item.isChecked && (
                                                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 transition-colors opacity-0 group-hover:opacity-100" />
                                            )}
                                        </div>
                                    ))}

                                    {/* Quick Add */}
                                    <div className="mt-2 pt-2 border-t border-gray-50 px-2">
                                        <div className="flex items-center gap-2 group focus-within:ring-2 ring-indigo-50 rounded-xl transition-all">
                                            <input 
                                                type="text" 
                                                placeholder="+ เพิ่มด่วน..." 
                                                className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-300 py-2 px-2 text-gray-600 font-medium"
                                                value={activeCategoryForQuickAdd === cat.key ? quickAddText : ''}
                                                onChange={e => {
                                                    setActiveCategoryForQuickAdd(cat.key);
                                                    setQuickAddText(e.target.value);
                                                }}
                                                onKeyDown={e => {
                                                    if(e.key === 'Enter') handleQuickAdd(cat.key);
                                                }}
                                            />
                                            <button onClick={() => handleQuickAdd(cat.key)} className="text-gray-300 hover:text-indigo-600 p-1.5 hover:bg-indigo-50 rounded-lg transition-colors">
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* --- Modals --- */}
            <InventoryModal 
                isOpen={isInventoryModalOpen}
                onClose={() => setIsInventoryModalOpen(false)}
                inventoryItems={inventoryItems}
                currentChecklistItems={items.map(i => ({ id: i.id, text: i.text }))} // Pass items with ID
                onAdd={(text, catId) => {
                    // Duplicate check
                    const isDuplicate = items.some(i => i.text.toLowerCase() === text.toLowerCase());
                    if (!isDuplicate) {
                        onAdd(text, catId);
                    }
                }}
                onRemove={onDelete} // Pass onDelete as onRemove
                onAddItem={handleAddInventoryItem}
                onUpdateItem={handleUpdateInventoryItem}
                onDeleteItem={handleDeleteInventoryItem}
                masterOptions={masterOptions}
            />

            <PresetModal 
                isOpen={isPresetModalOpen}
                onClose={() => setIsPresetModalOpen(false)}
                presets={checklistPresets}
                inventoryItems={inventoryItems}
                onAddPreset={(name, ids) => propOnAddPreset(name, ids)} // Use Prop
                onDeletePreset={(id) => propOnDeletePreset(id)} // Use Prop
            />

            {/* NEW: Preset Editor */}
            {editingPreset && (
                <PresetEditorModal 
                    isOpen={isPresetEditorOpen}
                    onClose={() => { setIsPresetEditorOpen(false); setEditingPreset(null); }}
                    preset={editingPreset}
                    inventoryItems={inventoryItems}
                    onSave={handleUpdatePreset}
                />
            )}

            {/* NEW: Item Verify Modal */}
            {verifyingItem && (
                <ItemVerifyModal 
                    isOpen={isVerifyModalOpen}
                    onClose={() => setIsVerifyModalOpen(false)}
                    item={verifyingItem}
                    inventoryItem={currentInventoryItem}
                    onConfirm={handleVerifyConfirm}
                />
            )}

             {/* INFO GUIDE MODAL */}
            <InfoModal 
                isOpen={isInfoOpen}
                onClose={() => setIsInfoOpen(false)}
                title="คู่มือจัดเป๋าออกกอง (Shoot Checklist)"
            >
                <ChecklistGuide />
            </InfoModal>
            </div>
        </AppBackground>
    );
};

export default ShootChecklist;
