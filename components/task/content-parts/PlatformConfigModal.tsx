import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Globe, Info } from 'lucide-react';
import { MasterOption, Platform } from '../../../types';
import { PLATFORM_ICONS } from '../../../constants';
import { useMasterData } from '../../../hooks/useMasterData';
import { motion, AnimatePresence } from 'framer-motion';

interface PlatformConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const PlatformConfigModal: React.FC<PlatformConfigModalProps> = ({ isOpen, onClose }) => {
    const { masterOptions, updateMasterOption, addMasterOption, fetchMasterOptions } = useMasterData();
    const [configs, setConfigs] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const platformConfigs = masterOptions.filter(opt => opt.type === 'PLATFORM_CONFIG');
            const configMap: Record<string, string> = {};
            platformConfigs.forEach(opt => {
                configMap[opt.key] = opt.description || '';
            });
            setConfigs(configMap);
        }
    }, [isOpen]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const platformConfigs = masterOptions.filter(opt => opt.type === 'PLATFORM_CONFIG');
            for (const p of ['YOUTUBE', 'FACEBOOK', 'TIKTOK', 'INSTAGRAM']) {
                const opt = platformConfigs.find(o => o.key === p);
                const newLink = (configs[p] || '').trim();
                const oldLink = (opt?.description || '').trim();
                
                if (opt) {
                    if (newLink !== oldLink) {
                        await updateMasterOption({
                            ...opt,
                            description: newLink
                        });
                    }
                } else if (newLink) {
                    // Create if not exists and has a link
                    await addMasterOption({
                        type: 'PLATFORM_CONFIG',
                        key: p,
                        label: `${p} Studio`,
                        color: 'bg-slate-50 text-slate-600',
                        sortOrder: 100,
                        isActive: true,
                        description: newLink
                    });
                }
            }
            await fetchMasterOptions();
            onClose();
        } catch (error) {
            console.error('Failed to save platform configs:', error);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    const modalContent = (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden border border-slate-200 flex flex-col"
            >
                {/* Header */}
                <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl shadow-inner">
                            <Globe className="w-5 h-5 text-indigo-500" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 tracking-tight text-left">Platform Settings</h2>
                            <p className="text-[10px] font-bold text-slate-400 text-left uppercase tracking-widest">Base URL Configuration</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all text-slate-300 hover:text-rose-500 shadow-sm border border-transparent hover:border-slate-100">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 space-y-6 overflow-y-auto max-h-[60vh]">
                    <div className="bg-indigo-50/50 border border-indigo-100/50 p-4 rounded-2xl flex gap-3">
                        <Info className="w-5 h-5 text-indigo-400 shrink-0" />
                        <p className="text-[11px] font-medium text-indigo-700/80 leading-relaxed text-left">
                            ลิงก์เหล่านี้จะถูกใช้เป็น "ลิงก์สำรอง" เมื่อคุณกดไอคอนแพลตฟอร์มที่ยังไม่มีการแปะลิงก์งานที่เผยแพร่จริง ช่วยให้คุณเข้าถึงหน้า Upload ของแต่ละเจ้าได้ไวขึ้น
                        </p>
                    </div>

                    <div className="space-y-4">
                        {['YOUTUBE', 'FACEBOOK', 'TIKTOK', 'INSTAGRAM'].map(p => {
                            const Icon = PLATFORM_ICONS[p as Platform] || Globe;
                            return (
                                <div key={p} className="space-y-1.5 group">
                                    <label className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest px-1">
                                        <Icon className="w-3 h-3 opacity-60 group-focus-within:opacity-100 transition-opacity" />
                                        {p} Upload URL
                                    </label>
                                    <input 
                                        type="url"
                                        value={configs[p] || ''}
                                        onChange={(e) => setConfigs(prev => ({ ...prev, [p]: e.target.value }))}
                                        placeholder={`https://...`}
                                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-50 bg-slate-50 focus:bg-white focus:border-indigo-400 transition-all text-sm font-bold text-slate-700 placeholder:text-slate-200"
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                    <button 
                        onClick={onClose}
                        className="flex-1 px-5 py-3.5 rounded-xl font-medium text-slate-400 hover:text-slate-600 hover:bg-white transition-all text-xs uppercase"
                    >
                        ยกเลิก
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex-[1.5] px-5 py-3.5 rounded-xl bg-slate-800 font-bold text-white hover:bg-slate-900 transition-all text-xs uppercase shadow-lg shadow-slate-200 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isSaving ? (
                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                บันทึกการตั้งค่า
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </div>
    );

    return createPortal(
        <AnimatePresence>
            {isOpen && modalContent}
        </AnimatePresence>,
        document.body
    );
};

export default PlatformConfigModal;
