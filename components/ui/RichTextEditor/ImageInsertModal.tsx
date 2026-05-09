
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Link as LinkIcon, Upload, Check, Image as ImageIcon, Cloud, AlertCircle, Loader2 } from 'lucide-react';
import { googleDriveService } from '../../../services/googleDriveService';
import { supabase } from '../../../lib/supabase';
import { resizeImage, fileToBase64 } from '../../../utils/imageUtils';

interface ImageInsertModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUrlInsert: (url: string) => void;
}

const ImageInsertModal: React.FC<ImageInsertModalProps> = ({ isOpen, onClose, onUrlInsert }) => {
    const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
    const [url, setUrl] = useState('');
    const [isConnected, setIsConnected] = useState<boolean | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Check Google Drive status when modal opens
    useEffect(() => {
        if (isOpen) {
            checkStatus();
        }
    }, [isOpen]);

    const checkStatus = async () => {
        try {
            const status = await googleDriveService.getStatus();
            setIsConnected(status);
        } catch (e) {
            console.error('Failed to check Google Drive status:', e);
            setIsConnected(false);
        }
    };

    const handleConnect = async () => {
        try {
            const authUrl = await googleDriveService.getAuthUrl();
            const width = 600;
            const height = 700;
            const left = window.screenX + (window.outerWidth - width) / 2;
            const top = window.screenY + (window.outerHeight - height) / 2;
            
            const authWindow = window.open(
                authUrl,
                'google_auth_popup',
                `width=${width},height=${height},left=${left},top=${top}`
            );

            // Listen for success message from popup
            const handleMessage = (event: MessageEvent) => {
                if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
                    setIsConnected(true);
                    window.removeEventListener('message', handleMessage);
                }
            };
            window.addEventListener('message', handleMessage);
        } catch (e) {
            setError('Failed to get Google Auth URL');
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setError(null);

        try {
            // --- STEP 1: Try Google Drive ---
            if (isConnected) {
                try {
                    const result = await googleDriveService.uploadFile(file);
                    onUrlInsert(result.url);
                    onClose();
                    return;
                } catch (e) {
                    console.warn('Google Drive upload failed, falling back to Supabase...', e);
                }
            }

            // --- STEP 2: Try Supabase Storage (with resizing) ---
            try {
                // Resize image first
                const resizedBlob = await resizeImage(file, 1200, 1200);
                const fileName = `upload-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
                
                const { data, error: storageError } = await supabase.storage
                    .from('images')
                    .upload(fileName, resizedBlob, {
                        contentType: 'image/jpeg',
                        cacheControl: '3600',
                        upsert: false
                    });

                if (storageError) throw storageError;

                // Get public URL
                const { data: { publicUrl } } = supabase.storage
                    .from('images')
                    .getPublicUrl(fileName);

                onUrlInsert(publicUrl);
                onClose();
                return;
            } catch (e) {
                console.warn('Supabase Storage upload failed, falling back to Base64...', e);
            }

            // --- STEP 3: Fallback to Base64 (Last Resort) ---
            const base64 = await fileToBase64(file);
            onUrlInsert(base64);
            onClose();

        } catch (e: any) {
            setError(e.message || 'All upload methods failed');
        } finally {
            setIsUploading(false);
        }
    };

    const handleUrlSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (url.trim()) {
            onUrlInsert(url.trim());
            onClose();
        }
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
                        className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden relative z-10 pointer-events-auto"
                    >
                        {/* Header */}
                        <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm uppercase tracking-tight">
                                <ImageIcon className="w-5 h-5 text-indigo-500" />
                                เพิ่มรูปภาพ
                            </h3>
                            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-400 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex p-2 bg-gray-100/50 mx-8 mt-8 rounded-2xl">
                            <button 
                                onClick={() => setActiveTab('upload')}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'upload' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <Upload className="w-4 h-4" />
                                อัปโหลด
                            </button>
                            <button 
                                onClick={() => setActiveTab('url')}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'url' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <LinkIcon className="w-4 h-4" />
                                ลิงก์ URL
                            </button>
                        </div>

                        <div className="p-8">
                            {error && (
                                <motion.div 
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-bold"
                                >
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    {error}
                                </motion.div>
                            )}

                            {activeTab === 'upload' ? (
                                <div className="space-y-4">
                                    {!isConnected ? (
                                        <div className="border-2 border-dashed border-indigo-100 rounded-[2rem] p-10 flex flex-col items-center justify-center gap-5 bg-indigo-50/20">
                                            <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center shadow-inner">
                                                <Cloud className="w-10 h-10 text-indigo-500" />
                                            </div>
                                            <div className="text-center">
                                                <p className="font-bold text-gray-800">เชื่อมต่อ Google Drive</p>
                                                <p className="text-xs text-gray-500 mt-2 max-w-[240px] mx-auto leading-relaxed">
                                                    เราจะเก็บรูปภาพของคุณไว้ใน Google Drive เพื่อความรวดเร็วและประหยัดพื้นที่
                                                </p>
                                            </div>
                                            <motion.button 
                                                whileTap={{ scale: 0.95 }}
                                                onClick={handleConnect}
                                                className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all"
                                            >
                                                Connect Google Drive
                                            </motion.button>
                                        </div>
                                    ) : (
                                        <motion.div 
                                            whileHover={{ scale: 1.01 }}
                                            whileTap={{ scale: 0.99 }}
                                            onClick={() => !isUploading && fileInputRef.current?.click()}
                                            className={`border-2 border-dashed border-gray-200 rounded-[2rem] p-12 flex flex-col items-center justify-center gap-5 hover:border-indigo-300 hover:bg-indigo-50/30 cursor-pointer transition-all group ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            <input 
                                                type="file" 
                                                ref={fileInputRef} 
                                                className="hidden" 
                                                accept="image/*" 
                                                onChange={handleFileChange} 
                                                disabled={isUploading}
                                            />
                                            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform relative shadow-inner">
                                                {isUploading ? (
                                                    <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                                                ) : (
                                                    <Upload className="w-10 h-10 text-indigo-500" />
                                                )}
                                            </div>
                                            <div className="text-center">
                                                <p className="font-black text-gray-700 text-lg">
                                                    {isUploading ? 'กำลังประมวลผล...' : 'คลิกเพื่อเลือกรูปภาพ'}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-2">
                                                    {isUploading ? 'ระบบกำลังเลือกช่องทางที่เร็วที่สุด' : 'ระบบจะเลือกเก็บใน Google Drive หรือ Supabase ให้อัตโนมัติ'}
                                                </p>
                                            </div>
                                        </motion.div>
                                    )}
                                    
                                    {!isConnected && !isUploading && (
                                        <div className="p-5 bg-amber-50 rounded-[1.5rem] border border-amber-100 flex items-start gap-4">
                                            <AlertCircle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">แนะนำ: เชื่อมต่อ Google Drive</p>
                                                <p className="text-[11px] text-amber-700 mt-1 leading-relaxed">
                                                    หากไม่เชื่อมต่อ ระบบจะใช้ Supabase หรือ Base64 แทน ซึ่งอาจทำให้บทความโหลดช้าลง
                                                </p>
                                                <button 
                                                    onClick={handleConnect}
                                                    className="mt-2 text-[11px] font-bold text-indigo-600 hover:underline"
                                                >
                                                    เชื่อมต่อตอนนี้เลย →
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <form onSubmit={handleUrlSubmit} className="space-y-5">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1 tracking-widest">Image URL</label>
                                        <input 
                                            autoFocus
                                            type="url"
                                            className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-indigo-500 focus:bg-white outline-none transition-all text-sm font-bold"
                                            placeholder="https://example.com/image.jpg"
                                            value={url}
                                            onChange={e => setUrl(e.target.value)}
                                        />
                                    </div>
                                    <motion.button 
                                        whileTap={{ scale: 0.95 }}
                                        type="submit"
                                        disabled={!url.trim()}
                                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Check className="w-5 h-5" />
                                        แทรกรูปภาพ
                                    </motion.button>
                                </form>
                            )}
                        </div>

                        <div className="px-8 pb-8">
                            <button 
                                onClick={onClose}
                                className="w-full py-4 text-gray-400 hover:text-gray-600 font-bold text-sm transition-colors uppercase tracking-widest"
                            >
                                ยกเลิก
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    if (typeof document === 'undefined') return null;
    return createPortal(modalContent, document.body);
};

export default ImageInsertModal;
