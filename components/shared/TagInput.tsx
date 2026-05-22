import React, { useState, KeyboardEvent, useImperativeHandle, forwardRef } from 'react';
import { Hash, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface TagInputRef {
    getUncommittedText: () => string;
    clearInput: () => void;
}

interface TagInputProps {
    tags: string[];
    onTagsChange: (tags: string[]) => void;
    placeholder?: string;
    variant?: 'indigo' | 'amber' | 'slate' | 'rose' | 'emerald';
}

const TagInput = forwardRef<TagInputRef, TagInputProps>(({ 
    tags, 
    onTagsChange, 
    placeholder,
    variant = 'indigo'
}, ref) => {
    const [inputValue, setInputValue] = useState('');

    useImperativeHandle(ref, () => ({
        getUncommittedText: () => inputValue.trim().replace(/^#/, ''),
        clearInput: () => setInputValue('')
    }));

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const newTag = inputValue.trim().replace(/^#/, ''); // Remove leading hash if typed
            if (newTag && !tags.includes(newTag)) {
                onTagsChange([...tags, newTag]);
                setInputValue('');
            }
        }
    };

    const removeTag = (tagToRemove: string) => {
        onTagsChange(tags.filter(t => t !== tagToRemove));
    };

    const colors = {
        indigo: {
            wrapper: 'bg-indigo-50/80 text-indigo-600 border-indigo-100/70 hover:bg-indigo-100/40 hover:text-indigo-700 shadow-sm',
            button: 'hover:bg-indigo-200/80 hover:text-indigo-800 text-indigo-400 bg-indigo-100/30'
        },
        amber: {
            wrapper: 'bg-amber-50/80 text-amber-600 border-amber-100/70 hover:bg-amber-100/40 hover:text-amber-700 shadow-sm',
            button: 'hover:bg-amber-200/80 hover:text-amber-800 text-amber-400 bg-amber-100/30'
        },
        rose: {
            wrapper: 'bg-rose-50/80 text-rose-600 border-rose-100/70 hover:bg-rose-100/40 hover:text-rose-700 shadow-sm',
            button: 'hover:bg-rose-200/80 hover:text-rose-800 text-rose-400 bg-rose-100/30'
        },
        emerald: {
            wrapper: 'bg-emerald-50/80 text-emerald-600 border-emerald-100/70 hover:bg-emerald-100/40 hover:text-emerald-700 shadow-sm',
            button: 'hover:bg-emerald-200/80 hover:text-emerald-800 text-emerald-400 bg-emerald-100/30'
        },
        slate: {
            wrapper: 'bg-slate-100/80 text-slate-600 border-slate-200/60 hover:bg-slate-200/40 hover:text-slate-700 shadow-sm',
            button: 'hover:bg-slate-300/80 hover:text-slate-800 text-slate-400 bg-slate-200/40'
        }
    };

    const selectedColor = colors[variant] || colors.indigo;

    return (
        <div className="flex flex-wrap gap-2 items-center min-h-[36px] w-full">
            <AnimatePresence>
                {tags.map(tag => (
                    <motion.span 
                        key={tag}
                        initial={{ scale: 0.8, opacity: 0, y: 5 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.8, opacity: 0, y: -5 }}
                        whileHover={{ scale: 1.04, y: -1 }}
                        whileTap={{ scale: 0.96 }}
                        transition={{ 
                            type: "spring", 
                            stiffness: 500, 
                            damping: 30,
                            mass: 0.8
                        }}
                        className={`${selectedColor.wrapper} px-3 py-1 rounded-xl text-xs font-bold flex items-center border transition-colors duration-150 cursor-default select-none`}
                    >
                        <Hash className="w-3 h-3 mr-1 opacity-50 stroke-[2.5]" />
                        {tag}
                        <button 
                            type="button" 
                            onClick={(e) => {
                                e.stopPropagation();
                                removeTag(tag);
                            }} 
                            className={`ml-1.5 rounded-full p-0.5 transition-all outline-none duration-150 ${selectedColor.button}`}
                        >
                            <X className="w-2.5 h-2.5 stroke-[2.5]" />
                        </button>
                    </motion.span>
                ))}
            </AnimatePresence>
            <input 
                type="text" 
                className="bg-transparent text-xs font-medium text-slate-700 outline-none flex-1 min-w-[120px] placeholder:text-slate-300 py-1.5 transition-colors focus:placeholder:text-slate-400"
                placeholder={tags.length === 0 ? placeholder || "พิมพ์แท็กแล้วกด Enter..." : "พิมพ์เพิ่ม..."}
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
            />
        </div>
    );
});

export default TagInput;
