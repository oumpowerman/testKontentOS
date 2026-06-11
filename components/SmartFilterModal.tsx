
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Settings, Plus, Trash2, X, Filter, Palette, Check, Save, Edit3, MonitorPlay, CheckSquare, Ban, CheckCircle2, ChevronDown, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChipConfig, FilterType, Channel, MasterOption, User } from '../types';
import { COLOR_THEMES } from '../constants';
import { useGlobalDialog } from '../context/GlobalDialogContext';

interface SmartFilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    chips: ChipConfig[];
    channels: Channel[];
    masterOptions?: MasterOption[];
    users?: User[];
    onSave: (chip: ChipConfig) => void;
    onDelete: (id: string) => void;
}

const SmartFilterModal: React.FC<SmartFilterModalProps> = ({ 
    isOpen, onClose, chips, channels, masterOptions = [], users = [], onSave, onDelete 
}) => {
    const [editingChip, setEditingChip] = useState<ChipConfig | null>(null);
    const { showAlert, showConfirm } = useGlobalDialog();

    const handleDelete = async (id: string, label: string) => {
        const confirmed = await showConfirm(
            `คุณแน่ใจหรือไม่ว่าต้องการลบปุ่ม "${label || 'ไม่มีชื่อ'}"?`,
            'ยืนยันการลบ'
        );
        if (confirmed) {
            onDelete(id);
            if (editingChip?.id === id) {
                setEditingChip(null);
            }
        }
    };

    // --- Custom Select Component ---
    const CustomSelect: React.FC<{
        value: string;
        options: { value: string; label: string; logo?: string }[];
        onChange: (val: string) => void;
        placeholder: string;
        showLogo?: boolean;
    }> = ({ value, options, onChange, placeholder, showLogo }) => {
        const [isDropdownOpen, setIsDropdownOpen] = useState(false);
        const [search, setSearch] = useState('');
        const containerRef = useRef<HTMLDivElement>(null);
        const selectedOption = options.find(o => o.value === value);

        useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                    setIsDropdownOpen(false);
                }
            };
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }, []);

        const filteredOptions = options.filter(o => 
            o.label.toLowerCase().includes(search.toLowerCase())
        );

        return (
            <div className="relative" ref={containerRef}>
                <div 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className={`w-full px-5 py-4 bg-white border-2 rounded-2xl transition-all duration-300 font-bold text-slate-700 cursor-pointer shadow-sm flex items-center justify-between group ${isDropdownOpen ? 'border-indigo-400 ring-4 ring-indigo-500/10' : 'border-slate-100 hover:border-indigo-200'}`}
                >
                    <div className="flex items-center gap-3 overflow-hidden">
                        {showLogo && selectedOption && (
                            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-slate-100 bg-white flex-shrink-0">
                                {selectedOption.logo ? (
                                    <img src={selectedOption.logo} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                    <div className="w-full h-full bg-slate-100 flex items-center justify-center text-xs text-slate-400">
                                        {selectedOption.label.substring(0, 1)}
                                    </div>
                                )}
                            </div>
                        )}
                        <span className={`truncate ${!selectedOption ? 'text-slate-300' : ''}`}>
                            {selectedOption ? selectedOption.label : placeholder}
                        </span>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-indigo-300 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180 text-indigo-500' : 'group-hover:text-indigo-400'}`} />
                </div>

                <AnimatePresence>
                    {isDropdownOpen && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ 
                                opacity: 1, 
                                y: 5, 
                                scale: 1
                            }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute left-0 right-0 mt-1 z-[16000] bg-white border border-slate-200 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden"
                        >
                            {options.length > 8 && (
                                <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                                    <Search className="w-4 h-4 text-slate-400" />
                                    <input 
                                        autoFocus
                                        type="text"
                                        className="bg-transparent border-none outline-none text-sm font-bold text-slate-600 w-full placeholder:text-slate-300"
                                        placeholder="ค้นหา..."
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        onClick={e => e.stopPropagation()}
                                    />
                                </div>
                            )}
                            <div className="max-h-[250px] overflow-y-auto p-2 scrollbar-thin">
                                {filteredOptions.length > 0 ? filteredOptions.map(opt => (
                                    <div 
                                        key={opt.value}
                                        onClick={() => {
                                            onChange(opt.value);
                                            setIsDropdownOpen(false);
                                            setSearch('');
                                        }}
                                        className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all duration-200 ${value === opt.value ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-slate-50 text-slate-600'}`}
                                    >
                                        {showLogo && (
                                            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-slate-100 bg-white flex-shrink-0 shadow-sm">
                                                {opt.logo ? (
                                                    <img src={opt.logo} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                                ) : (
                                                    <div className="w-full h-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-400">
                                                        {opt.label.substring(0, 1)}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        <span className="font-bold text-sm">{opt.label}</span>
                                        {value === opt.value && <Check className="w-4 h-4 ml-auto" />}
                                    </div>
                                )) : (
                                    <div className="p-8 text-center text-slate-400 text-xs font-bold">ไม่พบข้อมูล</div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    };

    // Derive Options from Master Data
    const formatOptions = masterOptions.filter(o => o.type === 'FORMAT' && o.isActive !== false);
    const pillarOptions = masterOptions.filter(o => o.type === 'PILLAR' && o.isActive !== false);
    const statusOptions = masterOptions.filter(o => o.type === 'STATUS' && o.isActive !== false);

    const initNewChip = () => {
        setEditingChip({
            id: `chip_${Date.now()}`,
            label: '',
            type: 'FORMAT',
            value: '',
            colorTheme: 'indigo',
            scope: 'CONTENT',
            mode: 'INCLUDE'
        });
    };

    const handleSaveSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(editingChip && editingChip.value) {
            onSave(editingChip);
            setEditingChip(null);
        } else {
            showAlert('กรุณาเลือกค่าที่ต้องการกรองด้วยครับ', 'ข้อมูลไม่ครบ');
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[15000] flex items-center justify-center p-0 sm:p-4">
                    {/* Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 bg-indigo-950/40 backdrop-blur-md" 
                        onClick={onClose}
                    />
                    
                    {/* Modal Content */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="bg-white/90 backdrop-blur-2xl w-full max-w-5xl h-full sm:h-[85vh] sm:rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col md:flex-row border border-white/50 relative z-10"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Decorative Elements */}
                        <div className="absolute -top-32 -left-32 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
                        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

                        {/* Left Panel: Filter Chips List */}
                        <div className="w-full md:w-[320px] bg-slate-50/40 backdrop-blur-xl border-r border-slate-200/50 flex flex-col relative z-20">
                            <div className="p-8 border-b border-slate-100 bg-white/40">
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="w-10 h-10 bg-indigo-500 rounded-xl shadow-lg shadow-indigo-200 flex items-center justify-center">
                                        <Settings className="w-5 h-5 text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-800 tracking-tight">Smart UI</h3>
                                </div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Custom Filter Presets</p>
                            </div>

                            <div className="flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar">
                                <button 
                                    onClick={initNewChip}
                                    className="w-full py-4 border-2 border-dashed border-slate-200/60 rounded-[1.5rem] text-slate-400 hover:text-indigo-500 hover:border-indigo-300 hover:bg-white hover:shadow-md transition-all duration-300 flex items-center justify-center gap-3 font-bold group active:scale-95"
                                >
                                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                                    <span className="text-xs uppercase tracking-widest">New Filter</span>
                                </button>

                                {chips.map(chip => {
                                    const theme = COLOR_THEMES.find(t => t.id === chip.colorTheme) || COLOR_THEMES[0];
                                    const isEditingThis = editingChip?.id === chip.id;
                                    const scope = chip.scope || 'CONTENT';
                                    const isExclude = chip.mode === 'EXCLUDE';
                                    
                                    return (
                                        <motion.div 
                                            key={chip.id}
                                            layoutId={`chip-${chip.id}`}
                                            onClick={() => setEditingChip({...chip})}
                                            className={`
                                                group p-4 rounded-2xl border transition-all duration-300 cursor-pointer flex items-center justify-between relative overflow-hidden
                                                ${isEditingThis 
                                                    ? `bg-white ${theme.ring} shadow-xl shadow-indigo-500/10 scale-[1.02] translate-x-1` 
                                                    : 'bg-white/50 border-transparent hover:border-slate-200/50 hover:bg-white hover:shadow-sm'
                                                }
                                            `}
                                        >
                                            {isEditingThis && <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${theme.activeBg}`} />}
                                            
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className={`w-3 h-3 rounded-full shrink-0 shadow-sm ${isExclude ? 'bg-rose-400 animate-pulse' : theme.bg}`} />
                                                <div className="min-w-0">
                                                    <p className={`font-bold text-sm truncate ${isEditingThis ? 'text-slate-900' : 'text-slate-600'} flex items-center gap-2`}>
                                                        {chip.label || 'Untitled'}
                                                        <span className={`text-[8px] px-1.5 py-0.5 rounded-full border font-black tracking-tighter ${scope === 'CONTENT' ? 'bg-indigo-50 text-indigo-500 border-indigo-100' : 'bg-emerald-50 text-emerald-500 border-emerald-100'}`}>
                                                            {scope}
                                                        </span>
                                                    </p>
                                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest truncate">{chip.type}: {chip.value}</p>
                                                </div>
                                            </div>

                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleDelete(chip.id, chip.label); }}
                                                className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Right Panel: Editor Content */}
                        <div className="flex-1 bg-white p-6 sm:p-12 overflow-y-auto relative z-10 custom-scrollbar">
                            <button onClick={onClose} className="absolute top-8 right-8 p-3 text-slate-300 hover:bg-slate-50 hover:text-slate-500 rounded-full transition-all active:scale-95 z-50">
                                <X className="w-6 h-6" />
                            </button>

                            <AnimatePresence mode="wait">
                                {editingChip ? (
                                    <motion.div 
                                        key="editor"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="max-w-md mx-auto"
                                    >
                                        <div className="text-center mb-12">
                                            <div className={`w-20 h-20 rounded-[2rem] mx-auto mb-6 flex items-center justify-center shadow-2xl transition-all duration-500 ${editingChip.mode === 'EXCLUDE' ? 'bg-gradient-to-br from-rose-500 to-pink-600 shadow-rose-200' : (COLOR_THEMES.find(t => t.id === editingChip.colorTheme)?.activeBg || 'bg-indigo-500 shadow-indigo-200')} animate-float`}>
                                                {editingChip.mode === 'EXCLUDE' ? <Ban className="w-10 h-10 text-white" /> : <Filter className="w-10 h-10 text-white" />}
                                            </div>
                                            <h3 className="text-3xl font-bold text-slate-800 tracking-tight">
                                                {chips.find(c => c.id === editingChip.id) ? 'Edit Token' : 'Build Token'}
                                            </h3>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em] mt-3">Configure logic engine</p>
                                        </div>

                                        <form onSubmit={handleSaveSubmit} className="space-y-8">
                                            {/* Mode Selector */}
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Logic Behavior</label>
                                                <div className="flex gap-4 p-2 bg-slate-50 rounded-[1.5rem] border border-slate-100">
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditingChip({...editingChip, mode: 'INCLUDE'})}
                                                        className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${editingChip.mode === 'INCLUDE' || !editingChip.mode ? 'bg-white text-indigo-600 shadow-sm border border-indigo-100' : 'text-slate-400 hover:text-slate-600'}`}
                                                    >
                                                        <CheckCircle2 className="w-4 h-4" /> SHOW ONLY
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditingChip({...editingChip, mode: 'EXCLUDE'})}
                                                        className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${editingChip.mode === 'EXCLUDE' ? 'bg-white text-rose-600 shadow-sm border border-rose-100' : 'text-slate-400 hover:text-slate-600'}`}
                                                    >
                                                        <Ban className="w-4 h-4" /> HIDE THESE
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Label Input */}
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Token Label</label>
                                                <input 
                                                    type="text"
                                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 focus:bg-white outline-none transition-all duration-300 font-bold text-slate-700 placeholder:text-slate-300 shadow-inner"
                                                    placeholder="e.g., Priority, Urgent..."
                                                    value={editingChip.label}
                                                    onChange={e => setEditingChip({...editingChip, label: e.target.value})}
                                                    required
                                                />
                                            </div>

                                            {/* Filter Logic */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Filter Type</label>
                                                    <CustomSelect 
                                                        value={editingChip.type}
                                                        options={
                                                            editingChip.scope === 'TASK'
                                                                ? [
                                                                    { value: 'STATUS', label: 'Status' },
                                                                    { value: 'FORMAT', label: 'Format' },
                                                                    { value: 'PILLAR', label: 'Pillar' },
                                                                    { value: 'ASSIGNEE', label: 'Assignee' },
                                                                  ]
                                                                : [
                                                                    { value: 'STATUS', label: 'Status' },
                                                                    { value: 'FORMAT', label: 'Format' },
                                                                    { value: 'CHANNEL', label: 'Channel' },
                                                                    { value: 'PILLAR', label: 'Pillar' },
                                                                  ]
                                                        }
                                                        onChange={(val) => setEditingChip({...editingChip, type: val as FilterType, value: ''})}
                                                        placeholder="Pick type"
                                                    />
                                                </div>

                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Value</label>
                                                    <CustomSelect 
                                                        value={editingChip.value}
                                                        options={
                                                            editingChip.type === 'CHANNEL' 
                                                                ? channels.map(c => ({ value: c.id, label: c.name, logo: c.logoUrl }))
                                                                : editingChip.type === 'FORMAT' 
                                                                    ? formatOptions.map(opt => ({ value: opt.key, label: opt.label }))
                                                                    : editingChip.type === 'STATUS' 
                                                                        ? statusOptions.map(opt => ({ value: opt.key, label: opt.label }))
                                                                        : editingChip.type === 'ASSIGNEE'
                                                                            ? users.map(u => ({ value: u.id, label: u.name, logo: u.avatarUrl }))
                                                                            : pillarOptions.map(opt => ({ value: opt.key, label: opt.label }))
                                                        }
                                                        onChange={(val) => setEditingChip({...editingChip, value: val})}
                                                        placeholder="Pick value"
                                                        showLogo={editingChip.type === 'CHANNEL' || editingChip.type === 'ASSIGNEE'}
                                                    />
                                                </div>
                                            </div>

                                            {/* Scope & Theme */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-start">
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Target Scope</label>
                                                    <div className="flex flex-col gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const nextType = editingChip.type === 'ASSIGNEE' ? 'STATUS' : editingChip.type;
                                                                setEditingChip({...editingChip, scope: 'CONTENT', type: nextType as FilterType, value: ''});
                                                            }}
                                                            className={`py-3.5 px-5 rounded-2xl text-[11px] font-black border-2 flex items-center gap-3 transition-all duration-300 ${editingChip.scope === 'CONTENT' || !editingChip.scope ? 'bg-indigo-50 border-indigo-200 text-indigo-600 shadow-md ring-4 ring-indigo-500/5' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
                                                        >
                                                            <MonitorPlay className="w-4 h-4" /> CONTENT
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const nextType = editingChip.type === 'CHANNEL' ? 'STATUS' : editingChip.type;
                                                                setEditingChip({...editingChip, scope: 'TASK', type: nextType as FilterType, value: ''});
                                                            }}
                                                            className={`py-3.5 px-5 rounded-2xl text-[11px] font-black border-2 flex items-center gap-3 transition-all duration-300 ${editingChip.scope === 'TASK' ? 'bg-emerald-50 border-emerald-200 text-emerald-600 shadow-md ring-4 ring-emerald-500/5' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
                                                        >
                                                            <CheckSquare className="w-4 h-4" /> TASK
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className={`space-y-4 ${editingChip.mode === 'EXCLUDE' ? 'opacity-40 pointer-events-none grayscale' : ''}`}>
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Visual Theme</label>
                                                    <div className="flex flex-wrap gap-2.5">
                                                        {COLOR_THEMES.map(theme => (
                                                            <button
                                                                key={theme.id}
                                                                type="button"
                                                                onClick={() => setEditingChip({...editingChip, colorTheme: theme.id})}
                                                                className={`w-9 h-9 rounded-full border-2 transition-all duration-300 ${theme.bg} ${editingChip.colorTheme === theme.id ? `ring-4 ring-offset-2 ${theme.ring} border-white scale-110 shadow-lg` : 'border-transparent hover:scale-110'}`}
                                                            >
                                                                {editingChip.colorTheme === theme.id && <Check className={`w-4 h-4 mx-auto ${theme.text}`} />}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pt-10 flex gap-4">
                                                <button 
                                                    type="button" 
                                                    onClick={() => setEditingChip(null)} 
                                                    className="flex-1 py-4 text-slate-400 hover:text-slate-600 font-bold text-xs uppercase tracking-widest transition-all"
                                                >
                                                    Cancel
                                                </button>
                                                <button 
                                                    type="submit" 
                                                    className="flex-[2] py-4 bg-indigo-600 text-white font-bold text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-indigo-200 hover:bg-slate-900 transition-all active:scale-95 flex items-center justify-center gap-2 group"
                                                >
                                                    <Save className="w-4 h-4 group-hover:rotate-12 transition-transform" /> 
                                                    Sync Changes
                                                </button>
                                            </div>
                                        </form>
                                    </motion.div>
                                ) : (
                                    <motion.div 
                                        key="empty"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="h-full flex flex-col items-center justify-center text-center"
                                    >
                                        <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mb-6 shadow-inner animate-float">
                                            <Edit3 className="w-10 h-10 text-slate-200" />
                                        </div>
                                        <h4 className="text-xl font-bold text-slate-400 tracking-tight">Select a token to edit</h4>
                                        <p className="text-sm text-slate-300 mt-2 max-w-[200px] mx-auto">Build custom filter components to organize your workspace</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default SmartFilterModal;
