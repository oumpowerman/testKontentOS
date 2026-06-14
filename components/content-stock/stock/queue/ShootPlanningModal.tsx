
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Clock, AlertTriangle, Save, Loader2, Search, Check, ChevronDown, Sparkles } from 'lucide-react';
import { MergedQueueItem } from './types';
import { MasterOption } from '../../../../types';
import { useMasterData } from '../../../../hooks/useMasterData';
import { useGlobalDialog } from '../../../../context/GlobalDialogContext';
import TimePickerModal from '../../../ui/TimePickerModal';

interface ShootPlanningModalProps {
    item: MergedQueueItem;
    isOpen: boolean;
    onClose: () => void;
    onSave: (id: string, type: 'CONTENT' | 'SCRIPT', data: Partial<MergedQueueItem>) => Promise<void>;
    masterOptions: MasterOption[];
}

const ShootPlanningModal: React.FC<ShootPlanningModalProps> = ({ item, isOpen, onClose, onSave, masterOptions }) => {
    const { addMasterOption } = useMasterData();
    const { showConfirm } = useGlobalDialog();

    const [location, setLocation] = useState(item.shootLocation || '');
    const [timeStart, setTimeStart] = useState(item.shootTimeStart || '');
    const [timeEnd, setTimeEnd] = useState(item.shootTimeEnd || '');
    const [notes, setNotes] = useState(item.shootNotes || '');
    const [isSaving, setIsSaving] = useState(false);

    const [activeTimePicker, setActiveTimePicker] = useState<'START' | 'END' | null>(null);

    // Autocomplete State
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [isCreatingLocation, setIsCreatingLocation] = useState(false);

    const locationOptions = useMemo(() => {
        return masterOptions
            .filter(o => o.type === 'SHOOT_LOCATION' && o.isActive)
            .sort((a, b) => a.label.localeCompare(b.label));
    }, [masterOptions]);

    const filteredOptions = useMemo(() => {
        return locationOptions.filter(opt => 
            opt.label.toLowerCase().includes(location.toLowerCase())
        );
    }, [locationOptions, location]);

    const isExactMatch = useMemo(() => {
        return locationOptions.some(opt => 
            opt.label.toLowerCase() === location.trim().toLowerCase()
        );
    }, [locationOptions, location]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleCreateNewLocation = async () => {
        const trimmedName = location.trim();
        if (!trimmedName || isCreatingLocation) return;

        setIsCreatingLocation(true);
        try {
            const confirmed = await showConfirm(
                `ต้องการเพิ่มสถานที่ใหม่ "${trimmedName}" เข้าสู่ระบบหรือไม่?`,
                '✨ สร้าง Location ใหม่'
            );

            if (!confirmed) return;

            const generatedKey = trimmedName.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '');
            const newOption = {
                type: 'SHOOT_LOCATION',
                key: generatedKey.length > 2 ? generatedKey : `LOC_${Date.now()}`,
                label: trimmedName,
                color: 'bg-indigo-100 text-indigo-700',
                sortOrder: 99,
                isActive: true
            };

            const success = await addMasterOption(newOption);
            if (success) {
                setLocation(trimmedName);
                setIsDropdownOpen(false);
            }
        } catch (err) {
            console.error('Create location failed:', err);
        } finally {
            setIsCreatingLocation(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave(item.id, item.type, {
                shootLocation: location,
                shootTimeStart: timeStart,
                shootTimeEnd: timeEnd,
                shootNotes: notes
            });
            onClose();
        } finally {
            setIsSaving(false);
        }
    };

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
                    />
                    
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 40, rotateX: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 100 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-lg bg-white/80 backdrop-blur-2xl rounded-[2rem] md:rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-white/40 overflow-hidden flex flex-col h-auto max-h-[95vh] md:max-h-[850px]"
                    >
                        {/* Decorative Background Elements */}
                        <div className="absolute top-[-10%] right-[-10%] w-32 md:w-64 h-32 md:h-64 bg-indigo-200/40 rounded-full blur-2xl md:blur-3xl pointer-events-none animate-pulse" />
                        <div className="absolute bottom-[-5%] left-[-10%] w-24 md:w-48 h-24 md:h-48 bg-amber-100/30 rounded-full blur-2xl md:blur-3xl pointer-events-none" />

                        {/* Header */}
                        <div className="p-6 md:p-10 pb-4 md:pb-6 flex justify-between items-start shrink-0 relative z-10">
                            <div className="flex-1">
                                <motion.div 
                                    initial={{ scale: 0.9 }}
                                    animate={{ scale: 1 }}
                                    className={`text-[10px] md:text-[11px] font-extrabold uppercase tracking-[0.2em] px-3 md:px-4 py-1 md:py-1.5 rounded-full border mb-3 md:mb-4 inline-flex items-center gap-2 shadow-sm ${
                                        item.type === 'CONTENT' 
                                            ? 'bg-amber-100/50 text-amber-600 border-amber-200/50' 
                                            : 'bg-indigo-100/50 text-indigo-600 border-indigo-200/50'
                                    }`}
                                >
                                    <Sparkles className="w-2.5 h-2.5 md:w-3 h-3" />
                                    แผนการถ่ายทำ
                                </motion.div>
                                <h2 className="text-xl md:text-3xl font-extrabold text-slate-900 leading-tight tracking-tight">
                                    {item.title}
                                </h2>
                            </div>
                            <motion.button 
                                whileHover={{ rotate: 90, scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={onClose} 
                                className="p-2.5 md:p-3 bg-white/50 backdrop-blur-md border border-white/40 hover:bg-white/80 rounded-xl md:rounded-2xl transition-all shadow-sm"
                            >
                                <X className="w-5 h-5 md:w-6 h-6 text-slate-500" />
                            </motion.button>
                        </div>

                        {/* Content */}
                        <div className="p-6 md:p-10 pt-2 md:pt-4 space-y-6 md:space-y-8 overflow-y-auto flex-1 custom-scrollbar relative z-10">
                            {/* Location */}
                            <div ref={dropdownRef} className="space-y-2 md:space-y-3 relative">
                                <label className="text-[10px] md:text-xs font-bold text-indigo-500/80 uppercase tracking-widest flex items-center gap-2 px-1 md:px-2">
                                    <MapPin className="w-3.5 h-3.5 md:w-4 h-4" /> สถานที่ / สตูดิโอ
                                </label>
                                
                                <div className="relative group/loc">
                                    <div className="relative z-10 rounded-2xl md:rounded-[1.5rem] bg-white/40 border border-white/60 group-focus-within/loc:border-indigo-400 group-focus-within/loc:ring-[6px] md:group-focus-within/loc:ring-[8px] group-focus-within/loc:ring-indigo-100/30 transition-all duration-500 flex items-center overflow-hidden shadow-sm hover:shadow-md">
                                        <input 
                                            type="text"
                                            value={location}
                                            onChange={(e) => {
                                                setLocation(e.target.value);
                                                setIsDropdownOpen(true);
                                            }}
                                            onFocus={() => setIsDropdownOpen(true)}
                                            placeholder="ใส่สถานที่ เช่น Studio 1, Kitchen, Outdoor..."
                                            className="w-full pl-5 md:pl-6 pr-10 md:pr-12 py-4 md:py-5 bg-transparent outline-none font-bold text-slate-700 text-base md:text-lg placeholder:text-slate-300 placeholder:font-medium"
                                        />
                                        <div className="absolute right-4 md:right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            {isCreatingLocation ? (
                                                <Loader2 className="w-4 h-4 md:w-5 h-5 animate-spin text-indigo-500" />
                                            ) : (
                                                <ChevronDown className={`w-4 h-4 md:w-5 h-5 transition-transform duration-500 ${isDropdownOpen ? 'rotate-180 text-indigo-500' : ''}`} />
                                            )}
                                        </div>
                                    </div>

                                    {/* Dropdown */}
                                    <AnimatePresence>
                                        {isDropdownOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                className="absolute left-0 right-0 top-full mt-2 md:mt-3 bg-white/90 backdrop-blur-xl rounded-[1.5rem] md:rounded-[2rem] shadow-[0_20px_40px_rgba(0,0,0,0.1)] border border-white/60 z-[100] max-h-56 md:max-h-64 overflow-hidden flex flex-col shadow-indigo-100/50"
                                            >
                                                {filteredOptions.length > 0 ? (
                                                    <div className="overflow-y-auto p-2 md:p-3">
                                                        <div className="px-3 md:px-4 py-1.5 md:py-2 text-[9px] md:text-[10px] font-extrabold text-slate-300 uppercase tracking-[0.2em] flex items-center gap-2">
                                                            <Search className="w-3 h-3 md:w-3.5 h-3.5" /> สถานที่ล่าสุด
                                                        </div>
                                                        {filteredOptions.map(opt => (
                                                            <motion.button
                                                                whileHover={{ x: 5 }}
                                                                key={opt.id}
                                                                onClick={() => {
                                                                    setLocation(opt.label);
                                                                    setIsDropdownOpen(false);
                                                                }}
                                                                className={`w-full text-left px-4 md:px-5 py-3 md:py-4 rounded-xl md:rounded-2xl text-sm md:text-base font-bold flex items-center justify-between group/opt transition-all mb-1 ${
                                                                    location === opt.label 
                                                                        ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-100' 
                                                                        : 'text-slate-600 hover:bg-slate-50'
                                                                }`}
                                                            >
                                                                <span>{opt.label}</span>
                                                                {location === opt.label && <Check className="w-4 h-4 md:w-5 h-5" />}
                                                            </motion.button>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="p-8 md:p-10 text-center text-slate-300 italic text-sm font-medium">
                                                        ไม่มีข้อมูลที่พิมพ์... พิมพ์เพิ่มได้เลย!
                                                    </div>
                                                )}

                                                {/* Create New */}
                                                {location.trim() !== '' && !isExactMatch && (
                                                    <button
                                                        onClick={handleCreateNewLocation}
                                                        disabled={isCreatingLocation}
                                                        className="w-full p-4 md:p-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[10px] md:text-[11px] font-extrabold uppercase tracking-[0.15em] flex items-center justify-center gap-2 md:gap-3 hover:brightness-110 transition-all active:scale-[0.98] shadow-inner"
                                                    >
                                                        <Sparkles className="w-4 h-4 md:w-5 h-5 text-amber-300 animate-pulse" />
                                                        สร้างที่ใหม่: "{location}"
                                                    </button>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            {/* Time Slot */}
                            <div className="grid grid-cols-2 gap-4 md:gap-5">
                                <div className="space-y-2 md:space-y-3">
                                    <label className="text-[10px] md:text-xs font-bold text-indigo-500/80 uppercase tracking-widest flex items-center gap-2 px-1 md:px-2">
                                        <Clock className="w-3.5 h-3.5 md:w-4 h-4 text-emerald-500" /> เวลาเริ่ม
                                    </label>
                                    <div className="relative group/time text-left">
                                        <button 
                                            type="button"
                                            onClick={() => setActiveTimePicker('START')}
                                            className="w-full bg-white/40 border border-white/60 rounded-xl md:rounded-2xl px-4 md:px-6 py-4 md:py-5 focus:ring-[6px] md:focus:ring-[8px] focus:ring-emerald-100/30 focus:border-emerald-400 outline-none transition-all duration-500 font-bold text-slate-700 text-base md:text-lg shadow-sm hover:shadow-md text-left"
                                        >
                                            {timeStart || '--:--'}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2 md:space-y-3">
                                    <label className="text-[10px] md:text-xs font-bold text-indigo-500/80 uppercase tracking-widest flex items-center gap-2 px-1 md:px-2">
                                        <Clock className="w-3.5 h-3.5 md:w-4 h-4 text-rose-500" /> เวลาเลิก
                                    </label>
                                    <div className="relative group/time text-left">
                                        <button 
                                            type="button"
                                            onClick={() => setActiveTimePicker('END')}
                                            className="w-full bg-white/40 border border-white/60 rounded-xl md:rounded-2xl px-4 md:px-6 py-4 md:py-5 focus:ring-[6px] md:focus:ring-[8px] focus:ring-rose-100/30 focus:border-rose-400 outline-none transition-all duration-500 font-bold text-slate-700 text-base md:text-lg shadow-sm hover:shadow-md text-left"
                                        >
                                            {timeEnd || '--:--'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Precautions / Notes */}
                            <div className="space-y-2 md:space-y-3">
                                <label className="text-[10px] md:text-xs font-medium font-kanit text-amber-500 uppercase tracking-widest flex items-center gap-2 px-1 md:px-2">
                                    <AlertTriangle className="w-3.5 h-3.5 md:w-4 h-4 animate-bounce" /> บันทึกการถ่ายทำ
                                </label>
                                <div className="relative">
                                    <textarea 
                                        rows={3}
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="จดสิ่งที่ต้องระวัง เช่น แสงเข้า, เสียงรบกวน, ของที่ต้องเตรียม..."
                                        className="w-full bg-white/40 border border-white/60 rounded-[1.5rem] md:rounded-[2rem] px-5 md:px-6 py-4 md:py-5 focus:ring-[6px] md:focus:ring-[8px] focus:ring-amber-100/30 focus:border-amber-400 outline-none transition-all duration-500 font-bold text-slate-700 text-base md:text-lg placeholder:text-slate-300 placeholder:font-medium resize-none shadow-sm hover:shadow-md"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 md:p-10 border-t border-white/40 bg-white/20 backdrop-blur-xl flex flex-col md:flex-row gap-3 md:gap-4 shrink-0 pb-10 md:pb-10 relative z-10">
                            <motion.button 
                                whileHover={{ x: -2 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={onClose}
                                className="order-2 md:order-1 flex-1 py-4 md:py-5 px-6 md:px-8 rounded-xl md:rounded-2xl font-medium font-kanit text-[11px] md:text-[12px] uppercase tracking-[0.2em] text-slate-400 hover:text-slate-600 hover:bg-white/50 transition-all"
                            >
                                ยกเลิก
                            </motion.button>
                            <motion.button 
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleSave}
                                disabled={isSaving}
                                className="order-1 md:order-2 flex-[2] py-4 md:py-5 px-6 md:px-8 rounded-xl md:rounded-[1.5rem] bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 text-white font-medium font-kanit text-[13px] md:text-[12px] uppercase tracking-[0.2em] shadow-[0_10px_20px_rgba(79,70,229,0.3)] hover:shadow-[0_15px_30px_rgba(79,70,229,0.4)] flex items-center justify-center gap-2 md:gap-3 transition-all relative overflow-hidden group/save"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-150%] group-hover/save:translate-x-[150%] transition-transform duration-1000" />
                                {isSaving ? (
                                    <Loader2 className="w-4 h-4 md:w-5 h-5 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4 md:w-5 h-5" />
                                )}
                                บันทึกแผนการถ่าย
                            </motion.button>
                        </div>
                    </motion.div>

                    <TimePickerModal 
                        isOpen={activeTimePicker === 'START'}
                        onClose={() => setActiveTimePicker(null)}
                        initialTime={timeStart}
                        onSelect={(time) => setTimeStart(time)}
                    />
                    <TimePickerModal 
                        isOpen={activeTimePicker === 'END'}
                        onClose={() => setActiveTimePicker(null)}
                        initialTime={timeEnd}
                        onSelect={(time) => setTimeEnd(time)}
                    />
                </div>
            )}
        </AnimatePresence>
    );

    return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
};

export default ShootPlanningModal;
