
import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronDown, ChevronUp, Replace, ReplaceAll, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FindReplaceBarProps {
    isOpen: boolean;
    onClose: () => void;
    onFind: (query: string, direction: 'next' | 'prev', shouldFocusEditor?: boolean) => void;
    onReplace: (find: string, replace: string) => void;
    onReplaceAll: (find: string, replace: string) => void;
    matchCount: { current: number; total: number };
}

const FindReplaceBar: React.FC<FindReplaceBarProps> = ({ 
    isOpen, onClose, onFind, onReplace, onReplaceAll, matchCount 
}) => {
    const [findText, setFindText] = useState('');
    const [replaceText, setReplaceText] = useState('');
    const findInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen && findInputRef.current) {
            findInputRef.current.focus();
            findInputRef.current.select();
        }
    }, [isOpen]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            onFind(findText, e.shiftKey ? 'prev' : 'next', false);
        }
        if (e.key === 'Escape') {
            onClose();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    className="absolute top-4 right-4 z-50 bg-white shadow-2xl rounded-2xl border border-indigo-100 p-3 w-80 flex flex-col gap-3"
                >
                    {/* Find Row */}
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1">
                                <Search className="w-3 h-3" /> Find
                            </span>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="relative">
                            <input 
                                ref={findInputRef}
                                type="text"
                                value={findText}
                                onChange={(e) => {
                                    setFindText(e.target.value);
                                    onFind(e.target.value, 'next', false);
                                }}
                                onKeyDown={handleKeyDown}
                                placeholder="ค้นหาคำ..."
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-100 transition-all pr-20"
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                <span className="text-[10px] font-bold text-gray-400 mr-1">
                                    {matchCount.total > 0 ? `${matchCount.current}/${matchCount.total}` : '0/0'}
                                </span>
                                <button 
                                    onClick={() => onFind(findText, 'prev', false)}
                                    className="p-1 hover:bg-gray-200 rounded transition-colors text-gray-500"
                                    title="Previous"
                                >
                                    <ChevronUp className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => onFind(findText, 'next', false)}
                                    className="p-1 hover:bg-gray-200 rounded transition-colors text-gray-500"
                                    title="Next"
                                >
                                    <ChevronDown className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Replace Row */}
                    <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-black text-pink-400 uppercase tracking-widest flex items-center gap-1">
                            <Replace className="w-3 h-3" /> Replace with
                        </span>
                        <input 
                            type="text"
                            value={replaceText}
                            onChange={(e) => setReplaceText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="แทนที่ด้วย..."
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-100 transition-all"
                        />
                    </div>

                    {/* Actions Row */}
                    <div className="flex gap-2">
                        <button 
                            onClick={() => onReplace(findText, replaceText)}
                            disabled={!findText || matchCount.total === 0}
                            className="flex-1 bg-white border border-gray-200 hover:border-indigo-200 hover:bg-indigo-50 text-indigo-600 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Replace className="w-3.5 h-3.5" /> Replace
                        </button>
                        <button 
                            onClick={() => onReplaceAll(findText, replaceText)}
                            disabled={!findText || matchCount.total === 0}
                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ReplaceAll className="w-3.5 h-3.5" /> Replace All
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default FindReplaceBar;
