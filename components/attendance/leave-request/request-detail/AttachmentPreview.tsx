import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, FileText, X } from 'lucide-react';
import { getDirectDriveUrl } from '../../../../lib/imageUtils';

interface AttachmentPreviewProps {
    attachmentUrl: string;
}

export const AttachmentPreview: React.FC<AttachmentPreviewProps> = ({ attachmentUrl }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!attachmentUrl) return null;

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">เอกสารประกอบหรือรูปภาพหลักฐาน</span>
            </div>
            <div 
                onClick={() => setIsExpanded(true)}
                className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50 flex items-center justify-center p-2 group relative cursor-pointer hover:scale-[1.01] hover:shadow-md active:scale-[0.99] transition-all duration-300"
                id="attachment-preview-box"
            >
                <img 
                    src={getDirectDriveUrl(attachmentUrl)} 
                    alt="Attachment" 
                    className="max-h-60 rounded-xl object-contain shadow-sm group-hover:opacity-90 transition-opacity"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                        // Handle non-image file type preview or load error
                        e.currentTarget.style.display = 'none';
                        const sibling = e.currentTarget.nextElementSibling;
                        if (sibling) sibling.classList.remove('hidden');
                    }}
                />
                {/* Hover interactive magnifier overlay */}
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-2 text-white font-semibold text-xs rounded-2xl backdrop-blur-[2px]">
                    <div className="bg-white/20 px-4 py-2.5 rounded-full flex items-center gap-2 border border-white/30 shadow-lg scale-90 group-hover:scale-100 transition-all duration-300">
                        <ExternalLink className="w-4 h-4" />
                        <span>คลิกเพื่อขยายภาพเต็มจอ</span>
                    </div>
                </div>
                <div className="hidden flex-col items-center justify-center py-8 text-slate-400">
                    <FileText className="w-12 h-12 mb-2" />
                    <p className="text-xs font-bold">ไฟล์เอกสารแนบประกอบ</p>
                </div>
            </div>

            {/* Image Fullscreen Lightbox */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsExpanded(false)}
                        className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 cursor-zoom-out"
                        id="attachment-lightbox-overlay"
                    >
                        {/* Close button with interactive rotate on hover */}
                        <button 
                            onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
                            className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 hover:rotate-90 text-white rounded-full transition-all duration-300 z-[130] shadow-lg border border-white/10 cursor-pointer"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <motion.div
                            initial={{ scale: 0.9, y: 15 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 15 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative max-w-[90vw] max-h-[85vh] flex items-center justify-center rounded-3xl overflow-hidden shadow-2xl border border-white/5 bg-slate-900"
                        >
                            <img 
                                src={getDirectDriveUrl(attachmentUrl)} 
                                alt="Expanded Attachment" 
                                className="max-w-full max-h-[85vh] object-contain select-none"
                                referrerPolicy="no-referrer"
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
export default AttachmentPreview;
