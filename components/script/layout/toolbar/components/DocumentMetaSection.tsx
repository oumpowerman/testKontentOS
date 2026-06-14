import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ArrowLeft, Save, Check, Clock, FileText, Rocket, Tag, Hash, Loader2 
} from 'lucide-react';
import { format } from 'date-fns';

interface OwnerType {
    name: string;
    avatarUrl: string;
}

interface MasterOptionType {
    key: string;
    label: string;
}

interface DocumentMetaSectionProps {
    onClose: () => void;
    title: string;
    setTitle: (val: string) => void;
    owner?: OwnerType | null;
    isSaving: boolean;
    showSaveSuccess: boolean;
    handleManualSave: () => void;
    lastSaved: number | Date;
    formattedDuration: string;
    category?: string;
    masterOptions: MasterOptionType[];
    tags?: string[];
    setIsMetadataOpen: (val: boolean) => void;
    contentId?: string | null;
    isScriptOwner?: boolean;
    onPromote?: () => void;
}

export const DocumentMetaSection: React.FC<DocumentMetaSectionProps> = ({
    onClose,
    title,
    setTitle,
    owner,
    isSaving,
    showSaveSuccess,
    handleManualSave,
    lastSaved,
    formattedDuration,
    category,
    masterOptions,
    tags,
    setIsMetadataOpen,
    contentId,
    isScriptOwner,
    onPromote
}) => {
    return (
        <div className="flex items-center gap-3 w-full xl:w-auto overflow-hidden">
            <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose} 
                className="shrink-0 group p-2 bg-white border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 rounded-xl transition-all duration-300 hover:-rotate-12 shadow-sm"
            >
                <ArrowLeft className="w-5 h-5 text-gray-400 group-hover:text-indigo-600" />
            </motion.button>
            
            <div className="flex flex-col min-w-0 flex-1">
                <input 
                    type="text" 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    className="font-kanit font-bold tracking-tight text-gray-800 text-lg md:text-xl outline-none
                        bg-transparent 
                        placeholder:text-transparent
                        placeholder:bg-gradient-to-r
                        placeholder:from-gray-300
                        placeholder:via-gray-200
                        placeholder:to-gray-300
                        placeholder:bg-[length:200%_100%]
                        placeholder:bg-clip-text
                        placeholder:animate-shimmer
                        w-full truncate     
                        origin-left
                        transition-all duration-300
                        hover:drop-shadow-[0_2px_6px_rgba(0,0,0,0.15)]
                        focus:scale-[1.03]
                        focus:drop-shadow-[0_4px_12px_rgba(0,0,0,0.25)]
                    "
                    placeholder="Untitled Script ✨"
                />
                <div className="flex items-center gap-2 md:gap-3 text-[10px] text-gray-400 font-bold mt-0.5 overflow-x-auto scrollbar-hide whitespace-nowrap">
                    {owner && (
                        <div className="flex items-center gap-1.5 shrink-0 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                            <img src={owner.avatarUrl} className="w-3.5 h-3.5 rounded-full object-cover ring-1 ring-white" alt={owner.name} />
                            <span className="text-indigo-600">{owner.name.split(' ')[0]}</span>
                        </div>
                    )}
                    
                    {/* Manual Save Button */}
                    <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleManualSave}
                        disabled={isSaving}
                        className={`
                            flex items-center gap-1.5 px-3 py-0.5 rounded-full border transition-all shrink-0
                            ${showSaveSuccess 
                                ? 'bg-green-50 text-green-600 border-green-200' 
                                : isSaving 
                                    ? 'bg-indigo-50 text-indigo-400 border-indigo-200 cursor-wait'
                                    : 'bg-white text-gray-500 border-gray-200 hover:text-indigo-600 hover:border-indigo-200 hover:shadow-sm'
                            }
                        `}
                        title="คลิกเพื่อบันทึกทันที"
                    >
                        {isSaving ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                        ) : showSaveSuccess ? (
                            <Check className="w-3 h-3" />
                        ) : (
                            <Save className="w-3 h-3" />
                        )}
                        
                        {isSaving 
                            ? 'Saving...' 
                            : showSaveSuccess 
                                ? 'Saved!' 
                                : `Save (${format(lastSaved, 'HH:mm')})`
                        }
                    </motion.button>
                    
                    <span className="flex items-center shrink-0" title="Estimated Reading Time">
                        <Clock className="w-3 h-3 mr-1 text-orange-400" /> {formattedDuration}
                    </span>

                    {category && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center gap-1.5 shrink-0 bg-pink-50 px-2.5 py-0.5 rounded-full border border-pink-100 text-pink-600 shadow-sm"
                        >
                            <Tag className="w-3 h-3" />
                            <span className="font-black uppercase tracking-tighter">
                                {masterOptions.find(o => o.key === category)?.label || category}
                            </span>
                        </motion.div>
                    )}

                    {tags && tags.length > 0 && (
                        <div className="flex items-center gap-1.5 overflow-hidden">
                            <AnimatePresence>
                                {tags.map((tag, idx) => (
                                    <motion.div 
                                        key={tag} 
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="flex items-center gap-0.5 shrink-0 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200 text-slate-500 hover:bg-white hover:border-indigo-200 hover:text-indigo-600 transition-all cursor-default group/tag"
                                    >
                                        <Hash className="w-2.5 h-2.5 opacity-40 group-hover/tag:opacity-100 group-hover/tag:scale-110 transition-all" />
                                        <span className="font-bold">{tag}</span>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>

            {/* Metadata Button */}
            <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsMetadataOpen(true)}
                className="p-2 text-indigo-500 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-100 transition-all shrink-0"
                title="แก้ไขรายละเอียด (Metadata)"
            >
                <FileText className="w-5 h-5" />
            </motion.button>
            
            {/* Promote to Content Button */}
            {!contentId && isScriptOwner && onPromote && (
                 <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onPromote}
                    className="hidden md:flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all shrink-0 animate-pulse"
                    title="ส่งเข้ากระบวนการผลิต (Create Content)"
                 >
                     <Rocket className="w-4 h-4 text-white" /> ส่งเข้าผลิต
                 </motion.button>
            )}
        </div>
    );
};
