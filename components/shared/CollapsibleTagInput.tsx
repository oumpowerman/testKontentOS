import React, { useState, useImperativeHandle, forwardRef, useRef } from 'react';
import { Tag, ChevronDown, Hash, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TagInput, { TagInputRef } from './TagInput';

export interface CollapsibleTagInputRef {
    getUncommittedText: () => string;
    clearInput: () => void;
}

interface CollapsibleTagInputProps {
    tags: string[];
    onTagsChange: (tags: string[]) => void;
    placeholder?: string;
    variant?: 'indigo' | 'amber' | 'slate' | 'rose' | 'emerald';
}

const CollapsibleTagInput = forwardRef<CollapsibleTagInputRef, CollapsibleTagInputProps>(({
    tags,
    onTagsChange,
    placeholder,
    variant = 'indigo'
}, ref) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const tagInputRef = useRef<TagInputRef>(null);

    useImperativeHandle(ref, () => ({
        getUncommittedText: () => {
            return tagInputRef.current ? tagInputRef.current.getUncommittedText() : '';
        },
        clearInput: () => {
            if (tagInputRef.current) {
                tagInputRef.current.clearInput();
            }
        }
    }));

    const colors = {
        indigo: {
            theme: 'indigo',
            text: 'text-indigo-600',
            bg: 'bg-indigo-50/40',
            border: 'border-indigo-100/60',
            iconBg: 'bg-indigo-100/80 text-indigo-500',
            gradient: 'from-[#f8f9ff] to-[#f1f3fe]',
            activeRing: 'focus-within:ring-2 focus-within:ring-indigo-200/50',
            badgeBg: 'bg-indigo-100/50 text-indigo-600 border-indigo-200/20'
        },
        amber: {
            theme: 'amber',
            text: 'text-amber-600',
            bg: 'bg-amber-50/40',
            border: 'border-amber-100/60',
            iconBg: 'bg-amber-100/80 text-amber-500',
            gradient: 'from-[#fffbf5] to-[#fff6ea]',
            activeRing: 'focus-within:ring-2 focus-within:ring-amber-200/50',
            badgeBg: 'bg-amber-100/50 text-amber-600 border-amber-200/20'
        },
        rose: {
            theme: 'rose',
            text: 'text-rose-600',
            bg: 'bg-rose-50/40',
            border: 'border-rose-100/60',
            iconBg: 'bg-rose-100/80 text-rose-500',
            gradient: 'from-[#fff5f6] to-[#ffebee]',
            activeRing: 'focus-within:ring-2 focus-within:ring-rose-200/50',
            badgeBg: 'bg-rose-100/50 text-rose-600 border-rose-200/20'
        },
        emerald: {
            theme: 'emerald',
            text: 'text-emerald-600',
            bg: 'bg-emerald-50/40',
            border: 'border-emerald-100/60',
            iconBg: 'bg-emerald-100/80 text-emerald-500',
            gradient: 'from-[#f4fbf7] to-[#e8f7ee]',
            activeRing: 'focus-within:ring-2 focus-within:ring-emerald-200/50',
            badgeBg: 'bg-emerald-100/50 text-emerald-600 border-emerald-200/20'
        },
        slate: {
            theme: 'slate',
            text: 'text-slate-600',
            bg: 'bg-slate-100/40',
            border: 'border-slate-200/50',
            iconBg: 'bg-slate-200/70 text-slate-500',
            gradient: 'from-[#f8fafc] to-[#f1f5f9]',
            activeRing: 'focus-within:ring-2 focus-within:ring-slate-200/50',
            badgeBg: 'bg-slate-200/50 text-slate-600 border-slate-300/20'
        }
    };

    const activeColor = colors[variant] || colors.indigo;

    return (
        <motion.div 
            layout="position"
            className={`rounded-[2.2rem] border ${activeColor.border} shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex flex-col overflow-hidden transition-all duration-300 bg-gradient-to-br ${activeColor.gradient}`}
        >
            {/* Header Trigger */}
            <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-4 sm:p-5 outline-none hover:bg-bold/[0.01] transition-colors relative"
                id="tag-input-collapsible-trigger"
            >
                <div className="flex items-center gap-3 text-slate-700">
                    <motion.div 
                        animate={{ 
                            rotate: isExpanded ? [0, -10, 10, 0] : 0,
                            scale: isExpanded ? 1.05 : 1
                        }}
                        transition={{ duration: 0.4 }}
                        className={`p-2 rounded-2xl ${activeColor.iconBg} shadow-sm border border-white/50 flex items-center justify-center`}
                    >
                        <Tag className="w-4 h-4 stroke-[2.3]" />
                    </motion.div>
                    
                    <div className="flex flex-col items-start gap-0.5">
                        <span className="text-xs font-bold tracking-wider uppercase text-slate-600 flex items-center gap-1.5">
                            แท็ก / แฮชแท็ก
                            {tags.length > 0 && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeColor.badgeBg}`}>
                                    {tags.length}
                                </span>
                            )}
                        </span>
                        
                        {/* Summary / Preview of tags when collapsed */}
                        {!isExpanded && (
                            <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-amber-400 fill-amber-400" />
                                {tags.length > 0 
                                    ? `แท็กที่เพิ่มไว้แล้ว`
                                    : 'ช่วยจัดกลุ่มให้หาง่ายและแชร์สะดวกขึ้น'
                                }
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Collapsed Tag Badges Preview */}
                    {!isExpanded && tags.length > 0 && (
                        <div className="hidden sm:flex items-center gap-1.5 max-w-[200px] md:max-w-[300px] overflow-hidden">
                            {tags.slice(0, 3).map(tag => (
                                <span 
                                    key={tag} 
                                    className="px-2 py-0.5 bg-white/80 border border-slate-200/40 rounded-lg text-[10px] font-bold text-slate-500 flex items-center shrink-0 shadow-sm"
                                >
                                    <Hash className="w-2.5 h-2.5 mr-0.5 opacity-40 stroke-[2.5]" />
                                    {tag}
                                </span>
                            ))}
                            {tags.length > 3 && (
                                <span className="text-[10px] text-slate-400 font-bold bg-white/90 border border-slate-200/40 px-1.5 py-0.5 rounded-lg shadow-sm">
                                    +{tags.length - 3}
                                </span>
                            )}
                        </div>
                    )}
                    
                    {/* Rotate Chevron based on expanded status */}
                    <div className={`p-1.5 text-slate-400 hover:text-slate-600 bg-white/55 border border-white/80 rounded-xl transition-transform duration-300 shadow-sm ${isExpanded ? 'rotate-180' : 'rotate-0'}`}>
                        <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>
                </div>
            </button>

            {/* Collapsible Content Area */}
            <AnimatePresence initial={false}>
                {isExpanded && (
                    <motion.div
                        key="tag-input-panel"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ 
                            type: "spring",
                            stiffness: 300,
                            damping: 28,
                            mass: 0.9
                        }}
                        className="overflow-hidden"
                    >
                        <div className="px-5 pb-5 pt-1">
                            <div className={`bg-white/90 backdrop-blur-sm p-4 rounded-2xl border border-slate-100/60 shadow-[inset_0_1.5px_4px_rgba(0,0,0,0.015)] transition-shadow duration-200 ${activeColor.activeRing}`}>
                                <TagInput 
                                    ref={tagInputRef}
                                    tags={tags} 
                                    onTagsChange={onTagsChange} 
                                    placeholder={placeholder}
                                    variant={variant}
                                />
                            </div>
                            <div className="flex items-center gap-1 mt-2.5 ml-1 text-[10px] text-slate-400 font-bold">
                                <span>🚀 เคล็ดลับ:</span>
                                <span>พิมพ์แท็ก เช่น <span className="text-indigo-500 font-bold">#ความรู้</span>, <span className="text-rose-500 font-bold">#vlog</span> แล้วกดปุ่ม <kbd className="bg-slate-100/80 border border-slate-200 px-1.5 py-0.5 rounded-md text-slate-500 text-[9px]">Enter</kbd> ได้เลยนะ!</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
});

export default CollapsibleTagInput;
