
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Check, Loader2, Gift, Tag, Type, Palette, AlignLeft, Hash, Percent, ShieldCheck, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChannels } from '../../../hooks/useChannels';
import FilterDropdown from '../../common/FilterDropdown';
import { MasterOption } from '../../../types';

interface MasterFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    isSubmitting: boolean;
    isEditing: boolean;
    formData: any;
    setFormData: (data: any) => void;
    rewardFormData?: any;
    setRewardFormData?: (data: any) => void;
    activeTab: string;
    masterOptions?: MasterOption[];
}

const COLOR_PRESETS = [
    { name: 'Gray', class: 'bg-gray-100 text-gray-700 border-gray-200', hex: '#f3f4f6' },
    { name: 'Red', class: 'bg-red-50 text-red-700 border-red-200', hex: '#fef2f2' },
    { name: 'Orange', class: 'bg-orange-50 text-orange-700 border-orange-200', hex: '#fff7ed' },
    { name: 'Yellow', class: 'bg-yellow-50 text-yellow-700 border-yellow-200', hex: '#fefce8' },
    { name: 'Green', class: 'bg-green-50 text-green-700 border-green-200', hex: '#f0fdf4' },
    { name: 'Teal', class: 'bg-teal-50 text-teal-700 border-teal-200', hex: '#f0fdfa' },
    { name: 'Blue', class: 'bg-blue-50 text-blue-700 border-blue-200', hex: '#eff6ff' },
    { name: 'Indigo', class: 'bg-indigo-50 text-indigo-700 border-indigo-200', hex: '#eef2ff' },
    { name: 'Purple', class: 'bg-purple-50 text-purple-700 border-purple-200', hex: '#faf5ff' },
    { name: 'Pink', class: 'bg-pink-50 text-pink-700 border-pink-200', hex: '#fdf2f8' },
];

const MasterFormModal: React.FC<MasterFormModalProps> = ({ 
    isOpen, onClose, onSubmit, isSubmitting, isEditing, 
    formData, setFormData, rewardFormData, setRewardFormData, activeTab,
    masterOptions = []
}) => {
    const { channels, fetchChannels } = useChannels();

    useEffect(() => {
        if (isOpen && channels.length === 0) {
            fetchChannels();
        }
    }, [isOpen, channels.length, fetchChannels]);

    const isRewardMode = activeTab === 'REWARDS' && rewardFormData && setRewardFormData;

    // Filter potential target positions for QC routing (type POSITION, active, excluding itself)
    const positionOptions = masterOptions
        .filter(o => o.type === 'POSITION' && o.key !== formData.key)
        .sort((a, b) => a.sortOrder - b.sortOrder);

    // Parse default quota and advance days from description if it's LEAVE_TYPE
    let defaultQuotaValue = 0;
    let advanceDaysValue = 0;
    let maxFutureDaysValue = 0;
    let maxPastDaysValue = 0;
    const isLeaveType = activeTab === 'LEAVE_TYPE' || formData.type === 'LEAVE_TYPE';
    if (isLeaveType) {
        try {
            const meta = formData.description ? JSON.parse(formData.description) : {};
            defaultQuotaValue = typeof meta.defaultQuota === 'number' ? meta.defaultQuota : parseInt(meta.defaultQuota) || 0;
            advanceDaysValue = typeof meta.advanceDays === 'number' ? meta.advanceDays : parseInt(meta.advanceDays) || 0;
            maxFutureDaysValue = typeof meta.maxFutureDays === 'number' ? meta.maxFutureDays : parseInt(meta.maxFutureDays) || 0;
            maxPastDaysValue = typeof meta.maxPastDays === 'number' ? meta.maxPastDays : parseInt(meta.maxPastDays) || 0;
        } catch (e) {
            // Description might not be valid JSON yet if it's empty or custom text
        }
    }

    const handleLeaveQuotaChange = (newQuotaVal: string) => {
        const val = parseInt(newQuotaVal) || 0;
        let currentMeta: any = {};
        try {
            currentMeta = formData.description ? JSON.parse(formData.description) : {};
        } catch (e) {
            currentMeta = {};
        }
        if (!currentMeta.icon) currentMeta.icon = "FileText";
        if (!currentMeta.category) currentMeta.category = "STANDARD";
        if (!currentMeta.placeholder) currentMeta.placeholder = "ระบุเหตุผลการลา...";
        
        currentMeta.defaultQuota = val;
        setFormData({
            ...formData,
            description: JSON.stringify(currentMeta)
        });
    };

    const handleLeaveAdvanceDaysChange = (newAdvanceVal: string) => {
        const val = parseInt(newAdvanceVal) || 0;
        let currentMeta: any = {};
        try {
            currentMeta = formData.description ? JSON.parse(formData.description) : {};
        } catch (e) {
            currentMeta = {};
        }
        if (!currentMeta.icon) currentMeta.icon = "FileText";
        if (!currentMeta.category) currentMeta.category = "STANDARD";
        if (!currentMeta.placeholder) currentMeta.placeholder = "ระบุเหตุผลการลา...";
        
        currentMeta.advanceDays = val;
        setFormData({
            ...formData,
            description: JSON.stringify(currentMeta)
        });
    };

    const handleLeaveMaxFutureDaysChange = (newVal: string) => {
        const val = parseInt(newVal) || 0;
        let currentMeta: any = {};
        try {
            currentMeta = formData.description ? JSON.parse(formData.description) : {};
        } catch (e) {
            currentMeta = {};
        }
        if (!currentMeta.icon) currentMeta.icon = "FileText";
        if (!currentMeta.category) currentMeta.category = "STANDARD";
        if (!currentMeta.placeholder) currentMeta.placeholder = "ระบุเหตุผลการลา...";
        
        currentMeta.maxFutureDays = val;
        setFormData({
            ...formData,
            description: JSON.stringify(currentMeta)
        });
    };

    const handleLeaveMaxPastDaysChange = (newVal: string) => {
        const val = parseInt(newVal) || 0;
        let currentMeta: any = {};
        try {
            currentMeta = formData.description ? JSON.parse(formData.description) : {};
        } catch (e) {
            currentMeta = {};
        }
        if (!currentMeta.icon) currentMeta.icon = "FileText";
        if (!currentMeta.category) currentMeta.category = "STANDARD";
        if (!currentMeta.placeholder) currentMeta.placeholder = "ระบุเหตุผลการลา...";
        
        currentMeta.maxPastDays = val;
        setFormData({
            ...formData,
            description: JSON.stringify(currentMeta)
        });
    };

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div id="master-modal-overlay" className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                    />

                    {/* Modal Container */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 20, rotateX: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", bounce: 0.3, duration: 0.5 }}
                        className="relative w-full max-w-lg bg-white/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/40 overflow-hidden"
                        style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.5) inset' }}
                    >
                        {/* Header */}
                        <div className="px-6 py-5 border-b border-white/20 flex justify-between items-center bg-gradient-to-r from-white/50 to-transparent">
                            <div className="flex items-center gap-3">
                                <div className={`p-2.5 rounded-xl ${isEditing ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'} shadow-sm`}>
                                    {isRewardMode ? <Gift className="w-5 h-5" /> : <Tag className="w-5 h-5" />}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-slate-800 tracking-tight">
                                        {isEditing ? 'Edit Item' : 'New Item'}
                                    </h3>
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        {activeTab} Management
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={onClose} 
                                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        {/* Form Content */}
                        <form onSubmit={onSubmit} className="p-6 space-y-5">
                            {isRewardMode ? (
                                // --- REWARD FORM ---
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            <Type className="w-3 h-3" /> Reward Title
                                        </label>
                                        <input 
                                            type="text" 
                                            value={rewardFormData.title || ''} 
                                            onChange={e => setRewardFormData({...rewardFormData, title: e.target.value})} 
                                            className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold text-slate-700 placeholder:text-slate-300"
                                            placeholder="Ex: Gift Card 500 THB"
                                            required 
                                        />
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            <AlignLeft className="w-3 h-3" /> Description
                                        </label>
                                        <textarea 
                                            rows={3} 
                                            value={rewardFormData.description || ''} 
                                            onChange={e => setRewardFormData({...rewardFormData, description: e.target.value})} 
                                            className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm resize-none placeholder:text-slate-300" 
                                            placeholder="Detail about this reward..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                <Hash className="w-3 h-3" /> Cost (Points)
                                            </label>
                                            <div className="relative">
                                                <input 
                                                    type="number" 
                                                    value={rewardFormData.cost || 0} 
                                                    onChange={e => setRewardFormData({...rewardFormData, cost: parseInt(e.target.value) || 0})} 
                                                    className="w-full pl-4 pr-10 py-3 bg-white/50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono font-bold text-slate-700" 
                                                />
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">PTS</div>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                Icon (Emoji)
                                            </label>
                                            <input 
                                                type="text" 
                                                value={rewardFormData.icon || ''} 
                                                onChange={e => setRewardFormData({...rewardFormData, icon: e.target.value})} 
                                                className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-center text-xl" 
                                                placeholder="🎁"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                // --- MASTER DATA FORM ---
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            <Type className="w-3 h-3" /> Label Name
                                        </label>
                                        <input 
                                            type="text" 
                                            value={formData.label} 
                                            onChange={e => setFormData({...formData, label: e.target.value})} 
                                            className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold text-slate-700 placeholder:text-slate-300" 
                                            placeholder="Ex: Pending Approval"
                                            required 
                                            autoFocus 
                                        />
                                    </div>

                                    {/* QC Target Position Dropdown for POSITION type only */}
                                    {activeTab === 'POSITION' && (formData.type === 'POSITION' || !formData.type) && (
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                <ShieldCheck className="w-3 h-3 text-emerald-500" /> ตำแหน่งผู้ตรวจงาน/หัวหน้าสายงาน (QC Target Position)
                                            </label>
                                            <select
                                                value={formData.parentKey || ''}
                                                onChange={e => setFormData({ ...formData, parentKey: e.target.value })}
                                                className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold text-slate-700 text-sm"
                                            >
                                                <option value="">-- เลือกตำแหน่งผู้ตรวจ (ไม่มี/ข้ามตรวจอัตโนมัติ) --</option>
                                                {positionOptions.map(pos => (
                                                    <option key={pos.key} value={pos.key}>{pos.label} ({pos.key})</option>
                                                ))}
                                            </select>
                                            <p className="text-[10px] text-slate-400 italic">
                                                * เมื่อคนทำมีตำแหน่งนี้ ระบบจะค้นหาพนักงานในตำแหน่งผู้ตรวจนี้เป็นผู้ตรวจเริ่มต้นโดยอัตโนมัติ
                                            </p>
                                        </div>
                                    )}

                                    {/* Channel Selector for PILLAR, CATEGORY & SCRIPT_CATEGORY */}
                                    {(activeTab === 'PILLAR' || activeTab === 'CATEGORY' || activeTab === 'SCRIPT_CATEGORY') && (
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                ช่องรายการที่ต้องการเปิดใช้งาน (Select Channel)
                                            </label>
                                            <FilterDropdown
                                                label="เลือกช่องรายการ"
                                                options={channels.map(channel => ({ key: channel.id, label: channel.name }))}
                                                value={formData.parentKey || 'ALL'}
                                                onChange={(val) => setFormData({ ...formData, parentKey: val === 'ALL' ? '' : val })}
                                                multiSelect={false}
                                                activeColorClass="bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm ring-2 ring-indigo-500/10"
                                                showAllOption={true}
                                                placeholder="ทุกช่อง (Global - ใช้งานร่วมกัน)"
                                                clearable={true}
                                            />
                                        </div>
                                    )}

                                    {formData.parentKey && activeTab !== 'PILLAR' && activeTab !== 'CATEGORY' && activeTab !== 'SCRIPT_CATEGORY' && (
                                        <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg">
                                                    <Tag className="w-3 h-3" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Parent Category</p>
                                                    <p className="text-xs font-bold text-indigo-700">{formData.parentKey}</p>
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-bold bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full uppercase">Sub-item</span>
                                        </div>
                                    )}
                                    
                                    {isLeaveType && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                    <Hash className="w-3 h-3 text-indigo-500" /> โควตาวันลา (วัน) / Quota (Days)
                                                </label>
                                                <input 
                                                    type="number" 
                                                    min="0"
                                                    max="999"
                                                    value={defaultQuotaValue} 
                                                    onChange={e => handleLeaveQuotaChange(e.target.value)} 
                                                    className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold text-slate-700 placeholder:text-slate-300 text-sm"
                                                    placeholder="ระบุวันลาสูงสุดต่อปี..."
                                                    required
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                    <Calendar className="w-3 h-3 text-emerald-500" /> ต้องแจ้งล่วงหน้า (วัน)
                                                </label>
                                                <input 
                                                    type="number" 
                                                    min="0"
                                                    max="365"
                                                    value={advanceDaysValue} 
                                                    onChange={e => handleLeaveAdvanceDaysChange(e.target.value)} 
                                                    className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold text-slate-700 placeholder:text-slate-300 text-sm"
                                                    placeholder="ต้องแจ้งล่วงหน้า (วัน)..."
                                                    required
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                    <Calendar className="w-3 h-3 text-blue-500" /> ขอล่วงหน้าสูงสุดไม่เกิน (วัน)
                                                </label>
                                                <input 
                                                    type="number" 
                                                    min="0"
                                                    max="365"
                                                    value={maxFutureDaysValue} 
                                                    onChange={e => handleLeaveMaxFutureDaysChange(e.target.value)} 
                                                    className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold text-slate-700 placeholder:text-slate-300 text-sm"
                                                    placeholder="ไม่มีการจำกัดถ้าเป็น 0..."
                                                    required
                                                />
                                                <p className="text-[10.5px] font-medium text-slate-400 mt-1 flex items-center gap-1">
                                                    <span>💡</span>
                                                    <span>ใส่เลข 0 หรือปล่อยว่างไว้ หากไม่ต้องการจำกัดวันขอล่วงหน้า</span>
                                                </p>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                    <Calendar className="w-3 h-3 text-rose-500" /> ขอลาย้อนหลังสูงสุดไม่เกิน (วัน)
                                                </label>
                                                <input 
                                                    type="number" 
                                                    min="0"
                                                    max="365"
                                                    value={maxPastDaysValue} 
                                                    onChange={e => handleLeaveMaxPastDaysChange(e.target.value)} 
                                                    className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold text-slate-700 placeholder:text-slate-300 text-sm"
                                                    placeholder="ไม่มีการจำกัดถ้าเป็น 0..."
                                                    required
                                                />
                                                <p className="text-[10.5px] font-medium text-slate-400 mt-1 flex items-center gap-1">
                                                    <span>💡</span>
                                                    <span>ใส่เลข 0 หรือปล่อยว่างไว้ หากไม่ต้องการจำกัดวันขอลาย้อนหลัง</span>
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {!isLeaveType && (
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                <AlignLeft className="w-3 h-3" /> Description
                                            </label>
                                            <textarea 
                                                rows={2}
                                                value={formData.description || ''} 
                                                onChange={e => setFormData({...formData, description: e.target.value})} 
                                                className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm resize-none placeholder:text-slate-300" 
                                                placeholder="Optional description..."
                                            />
                                        </div>
                                    )}
                                    
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            <Hash className="w-3 h-3" /> Key (ID)
                                        </label>
                                        <input 
                                            type="text" 
                                            value={formData.key} 
                                            onChange={e => setFormData({...formData, key: e.target.value})} 
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-mono font-medium text-slate-600 uppercase tracking-wider" 
                                            placeholder="AUTO_GENERATED_KEY"
                                            required 
                                            disabled={isEditing} 
                                        />
                                    </div>

                                    {/* Progress Value for Status */}
                                    {activeTab === 'STATUS' && (
                                        <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-3">
                                            <div className="flex justify-between items-center">
                                                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                    <Percent className="w-3 h-3" /> Progress Value
                                                </label>
                                                <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                                                    {formData.progressValue || 0}%
                                                </span>
                                            </div>
                                            <input 
                                                type="range" 
                                                min="0" 
                                                max="100" 
                                                step="5"
                                                value={formData.progressValue || 0} 
                                                onChange={e => setFormData({...formData, progressValue: parseInt(e.target.value)})} 
                                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" 
                                            />
                                            <p className="text-[10px] text-slate-400 italic text-right">* Shows on progress bar</p>
                                        </div>
                                    )}
                                    
                                    <div className="space-y-3 pt-2">
                                        <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            <Palette className="w-3 h-3" /> Color Theme
                                        </label>
                                        <div className="grid grid-cols-5 gap-3">
                                            {COLOR_PRESETS.map(c => (
                                                <motion.button 
                                                    key={c.name} 
                                                    type="button" 
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => setFormData({...formData, color: c.class})} 
                                                    className={`
                                                        relative h-10 w-full rounded-xl border-2 flex items-center justify-center transition-all shadow-sm
                                                        ${c.class.split(' ')[0]} 
                                                        ${formData.color === c.class ? 'border-slate-600 ring-2 ring-slate-200 ring-offset-2' : 'border-transparent opacity-80 hover:opacity-100'}
                                                    `}
                                                >
                                                    {formData.color === c.class && (
                                                        <motion.div
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            className="bg-white/20 p-1 rounded-full"
                                                        >
                                                            <Check className="w-4 h-4 text-slate-800" />
                                                        </motion.div>
                                                    )}
                                                </motion.button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            <div className="pt-4">
                                <motion.button 
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="submit" 
                                    disabled={isSubmitting} 
                                    className={`
                                        w-full py-3.5 rounded-xl font-bold text-white shadow-lg shadow-indigo-500/20 flex justify-center items-center gap-2 transition-all
                                        ${isSubmitting ? 'bg-indigo-400 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:shadow-indigo-500/40'}
                                    `}
                                >
                                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                    <span>{isEditing ? 'Save Changes' : 'Create New Item'}</span>
                                </motion.button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default MasterFormModal;
