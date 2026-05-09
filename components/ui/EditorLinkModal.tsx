
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Link as LinkIcon, Check, Unlink } from 'lucide-react';

interface EditorLinkModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialUrl: string;
    onSave: (url: string) => void;
    onUnlink: () => void;
}

const EditorLinkModal: React.FC<EditorLinkModalProps> = ({ 
    isOpen, onClose, initialUrl, onSave, onUnlink 
}) => {
    const [url, setUrl] = useState(initialUrl);
    const inputRef = useRef<HTMLInputElement>(null);

    // Sync state when modal opens
    useEffect(() => {
        if (isOpen) {
            setUrl(initialUrl || '');
            // Focus input after a short delay to allow animation
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    }, [isOpen, initialUrl]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(url);
    };

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4 pointer-events-none">
                    {/* Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto"
                    />

                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-indigo-50 overflow-hidden relative z-10 pointer-events-auto"
                    >
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm uppercase tracking-tight">
                                <LinkIcon className="w-4 h-4 text-indigo-500" /> 
                                {initialUrl ? 'แก้ไขลิงก์' : 'ใส่ลิงก์'}
                            </h3>
                            <button 
                                onClick={onClose}
                                className="p-2 hover:bg-gray-200 rounded-full text-gray-400 transition-colors"
                                type="button"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div className="relative">
                                <input 
                                    ref={inputRef}
                                    type="url" 
                                    className="w-full px-4 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50 outline-none text-sm font-bold transition-all placeholder:text-gray-300"
                                    placeholder="https://example.com"
                                    value={url}
                                    onChange={e => setUrl(e.target.value)}
                                />
                            </div>

                            <div className="flex gap-2">
                                {initialUrl && (
                                    <motion.button 
                                        whileTap={{ scale: 0.95 }}
                                        type="button"
                                        onClick={() => { onUnlink(); onClose(); }}
                                        className="px-4 py-3 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-2xl text-sm font-black transition-all flex items-center justify-center"
                                        title="เอาลิงก์ออก"
                                    >
                                        <Unlink className="w-4 h-4" />
                                    </motion.button>
                                )}
                                <motion.button 
                                    whileTap={{ scale: 0.95 }}
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 py-3 text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-2xl text-sm font-bold transition-all"
                                >
                                    ยกเลิก
                                </motion.button>
                                <motion.button 
                                    whileTap={{ scale: 0.95 }}
                                    type="submit"
                                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-bold shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2 active:scale-95"
                                >
                                    <Check className="w-4 h-4" /> บันทึก
                                </motion.button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    if (typeof document === 'undefined') return null;
    return createPortal(modalContent, document.body);
};

export default EditorLinkModal;
