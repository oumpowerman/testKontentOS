
import React, { useState, useRef, useEffect } from 'react';
import { X, Tag, Target, Layers, Layout, Save, Hash, ChevronDown, Loader2, Check, Type, Users, Edit3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScriptContext } from '../core/ScriptContext';
import SmartTagInput from '../hub/SmartTagInput';

const ScriptMetadataModal: React.FC = () => {
    const { 
        isMetadataOpen, setIsMetadataOpen,
        channelId, setChannelId,
        category, setCategory,
        tags, setTags,
        objective, setObjective,
        ideaOwnerId, setIdeaOwnerId,
        authorId, setAuthorId,
        currentUser, users,
        channels, masterOptions,
        handleSave, isSaving
    } = useScriptContext();

    // Dropdown states
    const [isChannelOpen, setIsChannelOpen] = useState(false);
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    
    const channelRef = useRef<HTMLDivElement>(null);
    const categoryRef = useRef<HTMLDivElement>(null);

    // Permission check: Only current owner, writer or admin can edit metadata
    const canEdit = currentUser.role === 'ADMIN' || currentUser.id === ideaOwnerId || currentUser.id === authorId;

    // Close dropdowns on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (channelRef.current && !channelRef.current.contains(event.target as Node)) {
                setIsChannelOpen(false);
            }
            if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
                setIsCategoryOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const scriptCategories = masterOptions.filter(o => o.type === 'SCRIPT_CATEGORY' && o.isActive);
    const selectedChannel = channels.find(c => c.id === channelId);
    const selectedCategory = scriptCategories.find(c => c.key === category);
    const activeUsers = users.filter(u => u.isActive);

    const handleClose = async () => {
        await handleSave(); // Auto save on close
        setIsMetadataOpen(false);
    };

    return (
        <AnimatePresence>
            {isMetadataOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-indigo-950/40 backdrop-blur-sm p-4 font-sans"
                >
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
                        className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border-4 border-white ring-1 ring-gray-100"
                    >
                
                {/* Header with Gradient */}
                <div className="px-8 py-6 bg-gradient-to-br from-indigo-600 to-violet-700 text-white flex justify-between items-start shrink-0 relative overflow-hidden">
                     {/* Decorative shapes */}
                     <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                     <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500 opacity-20 rounded-full blur-2xl -ml-5 -mb-5 pointer-events-none"></div>
                     
                     <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-sm shadow-inner border border-white/10">
                                <Layers className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold tracking-tight">Script Details</h3>
                        </div>
                        <p className="text-indigo-100 text-sm font-medium ml-1 opacity-90">ข้อมูลจำเพาะ & เป้าหมายของงาน</p>
                     </div>

                     <button 
                        onClick={handleClose} 
                        className="relative z-10 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all text-white/80 hover:text-white backdrop-blur-md active:scale-95"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body Content */}
                <div className="p-8 overflow-y-auto space-y-6 flex-1 bg-[#f8fafc] scrollbar-thin scrollbar-thumb-gray-200">
                    
                    {/* Row 0: Handover System (Writer & Owner) */}
                    <div className="grid grid-cols-1 gap-4">
                        {/* Writer Selection */}
                        <div className="space-y-3 bg-white p-4 rounded-2xl border border-indigo-100 shadow-sm">
                            <div className="flex items-center justify-between">
                                <label className="text-[14px] font-kanit font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <Edit3 className="w-3 h-3" /> Writer (ผู้รับผิดชอบเขียนบท)
                                </label>
                                {!canEdit && (
                                    <span className="text-[9px] font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                                        Read Only
                                    </span>
                                )}
                            </div>
                            
                            <div className="flex flex-wrap gap-3">
                                {activeUsers.map(user => {
                                    const isSelected = authorId === user.id;
                                    return (
                                        <button
                                            key={user.id}
                                            type="button"
                                            disabled={!canEdit}
                                            onClick={() => setAuthorId(user.id)}
                                            className={`
                                                relative group transition-all duration-300 
                                                ${isSelected ? 'scale-110' : 'opacity-60 hover:opacity-100 hover:scale-105'}
                                                ${!canEdit && !isSelected ? 'hidden' : ''}
                                                ${!canEdit ? 'cursor-default' : 'cursor-pointer'}
                                            `}
                                            title={user.name}
                                        >
                                            <div className={`
                                                w-10 h-10 rounded-full overflow-hidden border-2 transition-all
                                                ${isSelected ? 'border-indigo-500 shadow-lg ring-4 ring-indigo-100' : 'border-white shadow-sm'}
                                            `}>
                                                {user.avatarUrl ? (
                                                    <img src={user.avatarUrl} className="w-full h-full object-cover" alt={user.name} referrerPolicy="no-referrer" />
                                                ) : (
                                                    <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs">
                                                        {user.name.charAt(0)}
                                                    </div>
                                                )}
                                            </div>
                                            {isSelected && canEdit && (
                                                <div className="absolute -top-1 -right-1 bg-indigo-500 text-white rounded-full p-0.5 shadow-md">
                                                    <Check className="w-2.5 h-2.5" />
                                                </div>
                                            )}
                                            {/* Tooltip */}
                                            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[8px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                                {user.name}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                            <p className="text-[12px] text-slate-400 italic">
                                * เปลี่ยนคนเขียนบทเพื่อให้งานไปปรากฏในคิวของคนนั้น
                            </p>
                        </div>

                        {/* Idea Owner Selection */}
                        <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm opacity-80">
                            <div className="flex items-center justify-between">
                                <label className="text-[12px] font-kanit font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <Users className="w-3 h-3" /> Idea Owner (เจ้าของไอเดีย)
                                </label>
                            </div>
                            
                            <div className="flex flex-wrap gap-2.5">
                                {activeUsers.map(user => {
                                    const isSelected = ideaOwnerId === user.id;
                                    return (
                                        <button
                                            key={user.id}
                                            type="button"
                                            disabled={!canEdit}
                                            onClick={() => setIdeaOwnerId(user.id)}
                                            className={`
                                                relative group transition-all duration-300 
                                                ${isSelected ? 'scale-105' : 'opacity-40 hover:opacity-100'}
                                                ${!canEdit && !isSelected ? 'hidden' : ''}
                                            `}
                                            title={user.name}
                                        >
                                            <div className={`
                                                w-8 h-8 rounded-full overflow-hidden border transition-all
                                                ${isSelected ? 'border-amber-500 shadow-md ring-2 ring-amber-50' : 'border-white shadow-sm'}
                                            `}>
                                                {user.avatarUrl ? (
                                                    <img src={user.avatarUrl} className="w-full h-full object-cover" alt={user.name} referrerPolicy="no-referrer" />
                                                ) : (
                                                    <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-[10px]">
                                                        {user.name.charAt(0)}
                                                    </div>
                                                )}
                                            </div>
                                            {isSelected && (
                                                <div className="absolute -top-1 -right-1 bg-amber-500 text-white rounded-full p-0.5 shadow-md">
                                                    <Check className="w-2 h-2" />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Row 1: Channel & Category */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {/* Channel Dropdown */}
                        <div className="space-y-2 relative" ref={channelRef}>
                            <label className="text-[12px] font-kanit font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                                <Layout className="w-3 h-3" /> Channel
                            </label>
                            <button
                                type="button"
                                onClick={() => setIsChannelOpen(!isChannelOpen)}
                                className={`
                                    w-full flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all duration-300
                                    ${isChannelOpen 
                                        ? 'bg-blue-50/50 border-blue-400 ring-4 ring-blue-50 shadow-md' 
                                        : 'bg-white border-slate-100 hover:border-blue-200 hover:bg-blue-50/10'
                                    }
                                `}
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    {selectedChannel ? (
                                        <>
                                            {selectedChannel.logoUrl ? (
                                                <img src={selectedChannel.logoUrl} className="w-7 h-7 rounded-lg object-cover bg-gray-100 shrink-0 shadow-sm" alt="" />
                                            ) : (
                                                <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-[10px] shrink-0 border border-blue-200">
                                                    {selectedChannel.name.charAt(0)}
                                                </div>
                                            )}
                                            <span className="font-bold text-slate-700 text-sm truncate">{selectedChannel.name}</span>
                                        </>
                                    ) : (
                                        <span className="text-slate-400 text-sm font-medium pl-1">เลือกช่องทาง...</span>
                                    )}
                                </div>
                                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isChannelOpen ? 'rotate-180 text-blue-500' : ''}`} />
                            </button>

                            {isChannelOpen && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 max-h-60 overflow-y-auto p-1.5 animate-in fade-in zoom-in-95 slide-in-from-top-2">
                                    <button
                                        type="button"
                                        onClick={() => { setChannelId(''); setIsChannelOpen(false); }}
                                        className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-50 transition-colors mb-1 ${!channelId ? 'bg-slate-50 text-slate-800' : ''}`}
                                    >
                                        -- ไม่ระบุ --
                                    </button>
                                    {channels.map(c => (
                                        <button
                                            key={c.id}
                                            type="button"
                                            onClick={() => { setChannelId(c.id); setIsChannelOpen(false); }}
                                            className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all ${channelId === c.id ? 'bg-blue-50 text-blue-700 shadow-sm' : 'hover:bg-blue-50/50 hover:pl-4'}`}
                                        >
                                            {c.logoUrl ? (
                                                <img src={c.logoUrl} className="w-7 h-7 rounded-lg object-cover bg-gray-100 border border-gray-200" alt="" />
                                            ) : (
                                                <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-[10px] border border-blue-200">
                                                    {c.name.charAt(0)}
                                                </div>
                                            )}
                                            <span className="font-bold text-sm">{c.name}</span>
                                            {channelId === c.id && <Check className="w-4 h-4 ml-auto text-blue-500" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Category Dropdown */}
                        <div className="space-y-2 relative" ref={categoryRef}>
                            <label className="text-[12px] font-kanit font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                                <Type className="w-3 h-3" /> Category
                            </label>
                            <button
                                type="button"
                                onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                                className={`
                                    w-full flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all duration-300
                                    ${isCategoryOpen 
                                        ? 'bg-purple-50/50 border-purple-400 ring-4 ring-purple-50 shadow-md' 
                                        : 'bg-white border-slate-100 hover:border-purple-200 hover:bg-purple-50/10'
                                    }
                                `}
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${selectedCategory ? 'bg-purple-100 text-purple-600 border-purple-200' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                        <Layers className="w-4 h-4" />
                                    </div>
                                    <span className={`font-bold text-sm truncate ${selectedCategory ? 'text-slate-700' : 'text-slate-400'}`}>
                                        {selectedCategory ? selectedCategory.label : 'เลือกหมวด...'}
                                    </span>
                                </div>
                                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isCategoryOpen ? 'rotate-180 text-purple-500' : ''}`} />
                            </button>

                            {isCategoryOpen && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 max-h-60 overflow-y-auto p-1.5 animate-in fade-in zoom-in-95 slide-in-from-top-2">
                                    <button
                                        type="button"
                                        onClick={() => { setCategory(''); setIsCategoryOpen(false); }}
                                        className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-50 transition-colors mb-1 ${!category ? 'bg-slate-50 text-slate-800' : ''}`}
                                    >
                                        -- ไม่ระบุ --
                                    </button>
                                    {scriptCategories.map(c => (
                                        <button
                                            key={c.key}
                                            type="button"
                                            onClick={() => { setCategory(c.key); setIsCategoryOpen(false); }}
                                            className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all ${category === c.key ? 'bg-purple-50 text-purple-700 shadow-sm' : 'hover:bg-purple-50/50 hover:pl-4'}`}
                                        >
                                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${category === c.key ? 'bg-purple-100 text-purple-600 border-purple-200' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                                <Layers className="w-3.5 h-3.5" />
                                            </div>
                                            <span className="font-bold text-sm">{c.label}</span>
                                            {category === c.key && <Check className="w-4 h-4 ml-auto text-purple-500" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Row 2: Smart Tags Input */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                            <Tag className="w-3 h-3" /> Hashtags / Mood
                        </label>
                        <SmartTagInput 
                            selectedTags={tags}
                            onTagsChange={setTags}
                            placeholder="พิมพ์แท็ก (เช่น #สนุก, #สาระ)..."
                        />
                    </div>

                    {/* Row 3: Objective */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-1">
                            <Target className="w-3 h-3" /> Objective / Goal
                        </label>
                        <div className="relative group">
                            <textarea 
                                className="w-full px-5 py-4 bg-white border-2 border-slate-100 rounded-2xl outline-none text-sm font-medium text-slate-700 resize-none h-32 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50/50 transition-all placeholder:text-slate-300 leading-relaxed shadow-sm hover:border-slate-200"
                                placeholder="คลิปนี้ทำเพื่ออะไร? กลุ่มเป้าหมายคือใคร? สาระสำคัญคืออะไร?..."
                                value={objective}
                                onChange={e => setObjective(e.target.value)}
                            />
                        </div>
                    </div>

                </div>

                {/* Footer Action */}
                <div className="p-6 border-t border-slate-100 bg-white shrink-0">
                    <button 
                        onClick={handleClose} 
                        disabled={isSaving}
                        className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2 transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        บันทึกการเปลี่ยนแปลง
                    </button>
                </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ScriptMetadataModal;
