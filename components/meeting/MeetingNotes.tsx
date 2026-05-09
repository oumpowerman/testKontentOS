
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import RichTextEditor from '../ui/RichTextEditor';
import { PenTool, Coffee, Sparkles, CheckCircle2, Maximize2, Minimize2, Plus, X, Edit2 } from 'lucide-react';
import { MeetingNoteSheet } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';

interface MeetingNotesProps {
    initialContent: string;
    onUpdate: (content: string) => void;
    onBlur: () => void;
    sheets: MeetingNoteSheet[];
    onUpdateSheets: (sheets: MeetingNoteSheet[]) => void;
    isFocused?: boolean;
    onToggleFocus?: () => void;
}

const MeetingNotes: React.FC<MeetingNotesProps> = ({ 
    initialContent, onUpdate, onBlur, sheets, onUpdateSheets, isFocused, onToggleFocus 
}) => {
    // Local state for the current active sheet ID
    const [activeSheetId, setActiveSheetId] = useState<string>('main');
    const [isTyping, setIsTyping] = useState(false);
    const [editingSheetId, setEditingSheetId] = useState<string | null>(null);
    const [sheetTitleInput, setSheetTitleInput] = useState('');
    
    // --- SAFETY REFS for Unmount Saving ---
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const sheetsRef = useRef(sheets);
    const contentRef = useRef(initialContent);
    const lastEditorHtmlRef = useRef(initialContent);

    // Sync refs
    useEffect(() => {
        sheetsRef.current = sheets;
    }, [sheets]);

    useEffect(() => {
        contentRef.current = initialContent;
        lastEditorHtmlRef.current = initialContent;
    }, [initialContent]);

    // Flush changes immediately
    const flushChanges = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
            
            const html = lastEditorHtmlRef.current;
            if (activeSheetId === 'main') {
                onUpdate(html);
            } else {
                const newSheets = sheetsRef.current.map(s => s.id === activeSheetId ? { ...s, content: html } : s);
                onUpdateSheets(newSheets);
            }
            setIsTyping(false);
        }
    }, [activeSheetId, onUpdate, onUpdateSheets]);

    // Handle focus toggle with immediate save
    const handleToggleFocus = useCallback(() => {
        flushChanges();
        onToggleFocus?.();
    }, [flushChanges, onToggleFocus]);

    // Handle unmount saving
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                const html = lastEditorHtmlRef.current;
                if (activeSheetId === 'main') {
                    onUpdate(html);
                } else {
                    // Note: This might be tricky on unmount due to state closure
                    // but onUpdate (parent state) is usually safer
                    onUpdate(html);
                }
                clearTimeout(timeoutRef.current);
            }
        };
    }, [activeSheetId, onUpdate]);

    // Get current content based on active tab - Memoized for performance
    const currentContent = useMemo(() => {
        if (activeSheetId === 'main') return initialContent;
        return sheets.find(s => s.id === activeSheetId)?.content || '';
    }, [activeSheetId, initialContent, sheets]);

    const handleEditorChange = useCallback((html: string) => {
        setIsTyping(true);
        lastEditorHtmlRef.current = html;
        
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        
        timeoutRef.current = setTimeout(() => {
            if (activeSheetId === 'main') {
                onUpdate(html);
            } else {
                const newSheets = sheetsRef.current.map(s => s.id === activeSheetId ? { ...s, content: html } : s);
                onUpdateSheets(newSheets);
            }
            setIsTyping(false);
            timeoutRef.current = null;
        }, 1000); 
    }, [activeSheetId, onUpdate, onUpdateSheets]);

    const handleAddSheet = () => {
        const newSheet: MeetingNoteSheet = {
            id: crypto.randomUUID(),
            title: `Sheet ${sheets.length + 1}`,
            content: ''
        };
        const newSheets = [...sheets, newSheet];
        onUpdateSheets(newSheets);
        setActiveSheetId(newSheet.id);
    };

    const handleDeleteSheet = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const newSheets = sheets.filter(s => s.id !== id);
        onUpdateSheets(newSheets);
        if (activeSheetId === id) {
            setActiveSheetId('main');
        }
    };

    const startEditingSheet = (e: React.MouseEvent, sheet: MeetingNoteSheet | 'main') => {
        e.stopPropagation();
        if (sheet === 'main') return; // Main sheet title is fixed or handled elsewhere
        setEditingSheetId(sheet.id);
        setSheetTitleInput(sheet.title);
    };

    const saveSheetTitle = () => {
        if (!editingSheetId) return;
        const newSheets = sheets.map(s => s.id === editingSheetId ? { ...s, title: sheetTitleInput || s.title } : s);
        onUpdateSheets(newSheets);
        setEditingSheetId(null);
    };

    // Dynamic Classes for Focus Mode (Fullscreen Overlay) vs Normal Mode
    const containerClasses = isFocused 
        ? "fixed inset-0 z-[200] bg-slate-50/95 backdrop-blur-xl p-0 md:p-12 flex flex-col transition-all duration-500 ease-in-out" 
        : "flex-1 min-h-[350px] md:min-h-[400px] relative flex flex-col group isolate transition-all duration-500 ease-in-out";

    return (
        <div className={containerClasses}>
            
            {/* --- DECORATIONS --- */}
            {!isFocused && (
                <>
                    <div className="absolute inset-0 bg-indigo-100/40 rounded-[1.5rem] md:rounded-[2.5rem] transform translate-y-1 translate-x-1 md:translate-y-2 md:translate-x-2 -z-10 transition-transform duration-300 group-focus-within:translate-y-2 group-focus-within:translate-x-2 md:group-focus-within:translate-y-3 md:group-focus-within:translate-x-3"></div>
                </>
            )}

            {/* --- MAIN CONTAINER --- */}
            <div 
                className={`
                    flex-1 bg-white overflow-hidden flex flex-col transition-all duration-300 relative group-focus-within:ring-indigo-200
                    ${isFocused 
                        ? 'rounded-none md:rounded-[3rem] shadow-2xl border-b-0 md:border-b-8 border-r-0 md:border-r-4 border-slate-300 ring-0 md:ring-1 ring-slate-200 max-w-6xl mx-auto w-full' 
                        : 'rounded-[1.5rem] md:rounded-[2.5rem] border-2 md:border-4 border-white ring-1 ring-slate-100 shadow-sm'}
                `}
            >
                {/* Header Strip */}
                <div className={`h-12 md:h-14 bg-gradient-to-r from-slate-50 to-white border-b border-dashed border-slate-200 flex items-center justify-between px-4 md:px-6 shrink-0 relative z-30 ${isFocused ? 'rounded-none md:rounded-t-[3rem]' : 'rounded-t-[1.5rem] md:rounded-t-[2.5rem]'}`}>
                    <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                            <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-rose-400 shadow-sm"></div>
                            <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-amber-400 shadow-sm"></div>
                            <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-emerald-400 shadow-sm"></div>
                        </div>
                        <div className="h-4 w-px bg-slate-200 mx-1 md:mx-2"></div>
                        <span className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-[0.1em] md:tracking-[0.2em] flex items-center">
                            {isTyping ? (
                                <span className="text-indigo-500 flex items-center animate-pulse">
                                    <Sparkles className="w-2.5 h-2.5 md:w-3 md:h-3 mr-1" /> Saving...
                                </span>
                            ) : (
                                <span className="flex items-center text-emerald-600 transition-colors duration-500">
                                    <CheckCircle2 className="w-2.5 h-2.5 md:w-3 md:h-3 mr-1" /> <span className="hidden xs:inline">All Changes Saved</span><span className="xs:hidden">Saved</span>
                                </span>
                            )}
                        </span>
                    </div>

                    <div className="flex items-center gap-2 md:gap-3 relative z-50">
                        <span className="text-[8px] md:text-[9px] font-bold text-slate-300 hidden sm:inline uppercase tracking-widest">Multi-Sheet Notes</span>
                        {onToggleFocus && (
                            <button 
                                onClick={handleToggleFocus}
                                className={`
                                    p-1.5 md:p-2 rounded-lg md:rounded-xl transition-all font-bold text-[9px] md:text-[10px] flex items-center gap-1 md:gap-2 shadow-sm uppercase tracking-widest
                                    ${isFocused 
                                        ? 'bg-rose-500 text-white hover:bg-rose-600 shadow-rose-200 border-b-2 md:border-b-4 border-rose-700' 
                                        : 'bg-white text-slate-400 hover:text-indigo-600 hover:bg-slate-50 border border-slate-200'}
                                `}
                            >
                                {isFocused ? <Minimize2 className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <Maximize2 className="w-3.5 h-3.5 md:w-4 md:h-4" />}
                            </button>
                        )}
                    </div>
                </div>

                {/* Editor Area */}
                <div className={`relative bg-white flex flex-col flex-1 font-normal ${isFocused ? 'overflow-hidden' : ''}`}>
                    <div 
                        className="absolute inset-0 pointer-events-none opacity-[0.3] md:opacity-[0.4]" 
                        style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '20px 20px' }}
                    ></div>

                    <div className={isFocused ? "flex-1 overflow-y-auto" : ""}>
                        <RichTextEditor 
                            key={activeSheetId} // Force remount on sheet switch
                            content={currentContent}
                            onChange={handleEditorChange}
                            placeholder="เริ่มจดบันทึกในแผ่นนี้..."
                            className={`prose-slate relative z-10 ${isFocused ? 'max-w-4xl mx-auto py-4 md:py-8 px-4 md:px-0' : 'p-4 md:p-10'}`}
                            minHeight={isFocused ? "100%" : "350px"}
                        />
                    </div>
                </div>

                {/* --- TAB BAR (Google Sheets Style) --- */}
                <div className="h-10 bg-slate-50 border-t border-slate-200 flex items-center px-2 gap-1 overflow-x-auto no-scrollbar shrink-0">
                    {/* Main Sheet Tab */}
                    <button 
                        onClick={() => setActiveSheetId('main')}
                        className={`
                            h-8 px-4 rounded-t-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all
                            ${activeSheetId === 'main' 
                                ? 'bg-white text-indigo-600 shadow-sm border-t-2 border-indigo-500' 
                                : 'text-slate-400 hover:bg-slate-100'}
                        `}
                    >
                        <PenTool className="w-3 h-3" /> General
                    </button>

                    {/* Dynamic Sheets Tabs */}
                    {sheets.map(sheet => (
                        <div 
                            key={sheet.id}
                            onClick={() => setActiveSheetId(sheet.id)}
                            className={`
                                h-8 px-3 rounded-t-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all cursor-pointer group/tab
                                ${activeSheetId === sheet.id 
                                    ? 'bg-white text-indigo-600 shadow-sm border-t-2 border-indigo-500' 
                                    : 'text-slate-400 hover:bg-slate-100'}
                            `}
                        >
                            {editingSheetId === sheet.id ? (
                                <input 
                                    autoFocus
                                    className="bg-transparent outline-none border-b border-indigo-300 w-20"
                                    value={sheetTitleInput}
                                    onChange={e => setSheetTitleInput(e.target.value)}
                                    onBlur={saveSheetTitle}
                                    onKeyDown={e => e.key === 'Enter' && saveSheetTitle()}
                                    onClick={e => e.stopPropagation()}
                                />
                            ) : (
                                <>
                                    <span onDoubleClick={(e) => startEditingSheet(e, sheet)}>{sheet.title}</span>
                                    <button 
                                        onClick={(e) => handleDeleteSheet(e, sheet.id)}
                                        className="opacity-0 group-hover/tab:opacity-100 hover:text-rose-500 transition-all"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </>
                            )}
                        </div>
                    ))}

                    {/* Add Button */}
                    <button 
                        onClick={handleAddSheet}
                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-all"
                        title="เพิ่มแผ่นจดใหม่"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MeetingNotes;
