
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { WikiNode, WikiNodeType } from '../../types';
import { 
    X, 
    Save, 
    Folder, 
    FileText, 
    Type, 
    AlignLeft, 
    Layout, 
    Hash, 
    Sparkles, 
    Eye, 
    Edit3, 
    Maximize2, 
    Minimize2,
    Info,
    ChevronLeft,
    ChevronRight,
    Zap,
    BookOpen,
    Check,
    List
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import WikiAIDialog from './tools/WikiAIDialog';
import RichTextEditor from '../ui/RichTextEditor';

import { useGlobalDialog } from '../../context/GlobalDialogContext';
import { useToast } from '../../context/ToastContext';

interface WikiNodeEditorProps {
    isOpen: boolean;
    onClose: () => void;
    node: WikiNode | null;
    onSave: (data: Partial<WikiNode>) => Promise<void>;
    onGenerateAI?: (prompt: string, type: 'OUTLINE' | 'SOP' | 'FULL') => Promise<string | null>;
}

const WikiNodeEditor: React.FC<WikiNodeEditorProps> = (props) => {
    return (
        <AnimatePresence>
            {props.isOpen && <WikiNodeEditorContent {...props} />}
        </AnimatePresence>
    );
};

const WikiNodeEditorContent: React.FC<WikiNodeEditorProps> = ({ onClose, node, onSave, onGenerateAI }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [content, setContent] = useState('');
    const [icon, setIcon] = useState('');
    const [sortOrder, setSortOrder] = useState(0);
    const [activeTab, setActiveTab] = useState<'EDIT' | 'PREVIEW'>('EDIT');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showSaveSuccess, setShowSaveSuccess] = useState(false);
    const [isFocusMode, setIsFocusMode] = useState(false);
    const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isTOCSidebarOpen, setIsTOCSidebarOpen] = useState(true);

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Generate Table of Contents from content (HTML version)
    const toc = useMemo(() => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'text/html');
        const headings = Array.from(doc.querySelectorAll('h1, h2, h3'))
            .map(h => ({
                level: parseInt(h.tagName.substring(1)),
                text: h.textContent || ''
            }));
        return headings;
    }, [content]);

    useEffect(() => {
        if (node) {
            setTitle(node.title || '');
            setDescription(node.description || '');
            setContent(node.content || '');
            setIcon(node.icon || '');
            setSortOrder(node.sortOrder || 0);
        }
        setActiveTab('EDIT');
    }, [node]);

    const handleSave = async () => {
        if (!title.trim() || isSaving) return;
        
        setIsSaving(true);
        try {
            await onSave({
                title,
                description,
                content,
                icon,
                sortOrder,
                type: node?.type || 'FOLDER',
                parentId: node?.parentId || null
            });
            setShowSaveSuccess(true);
            setTimeout(() => setShowSaveSuccess(false), 2000);
        } finally {
            setIsSaving(false);
        }
    };

    const { showAlert } = useGlobalDialog();
    const { showToast } = useToast();

    const handleAIGenerate = async (prompt: string, type: 'OUTLINE' | 'SOP' | 'FULL') => {
        if (!onGenerateAI || isGenerating) return;
        setIsGenerating(true);
        try {
            const result = await onGenerateAI(prompt, type);
            if (result) {
                setContent(prev => prev ? `${prev}\n\n${result}` : result);
                setActiveTab('EDIT');
                showToast("AI เขียนเนื้อหาให้เรียบร้อยแล้ว ✨", "success");
                setIsAIDialogOpen(false);
            } else {
                showAlert("AI ไม่สามารถสร้างเนื้อหาได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง", "AI Error");
            }
        } catch (error: any) {
            console.error("Wiki AI Error:", error);
            showAlert(`เกิดข้อผิดพลาด: ${error.message || 'ไม่เลือก API หรือเกิดปัญหาการเชื่อมต่อ'}`, "AI Generation Failed");
        } finally {
            setIsGenerating(false);
        }
    };

    const isPage = node?.type === 'PAGE';

    return createPortal(
        <motion.div 
            initial={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 1.02, filter: 'blur(10px)' }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="fixed inset-0 z-[1000] bg-slate-50 flex flex-col h-[100dvh] font-sans overflow-hidden"
        >
            {/* --- TOP TOOLBAR --- */}
            {!isFocusMode && (
                <div className="bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 py-4 flex items-center justify-between shrink-0 z-50 shadow-sm">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                        <button 
                            onClick={onClose}
                            className="p-2.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-xl transition-all active:scale-90"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        
                        <div className="flex flex-col flex-1 min-w-0">
                            <input 
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Handbook Title..."
                                className="text-xl font-bold text-slate-800 bg-transparent outline-none placeholder:text-slate-300 w-full truncate"
                            />
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${isPage ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>
                                    {isPage ? <FileText className="w-2.5 h-2.5" /> : <Folder className="w-2.5 h-2.5" />}
                                    {isPage ? 'Page' : 'Folder'}
                                </span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest opacity-50">
                                    Last Edited {format(new Date(), 'HH:mm')}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* View Toggles */}
                        {isPage && (
                            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 mr-2">
                                <button 
                                    onClick={() => setActiveTab('EDIT')}
                                    className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${activeTab === 'EDIT' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    <Edit3 className="w-3.5 h-3.5" /> EDIT
                                </button>
                                <button 
                                    onClick={() => setActiveTab('PREVIEW')}
                                    className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${activeTab === 'PREVIEW' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    <Eye className="w-3.5 h-3.5" /> PREVIEW
                                </button>
                            </div>
                        )}

                        <button 
                            onClick={() => setIsFocusMode(true)}
                            className="p-2.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-xl transition-all active:scale-90"
                            title="Focus Mode"
                        >
                            <Maximize2 className="w-5 h-5" />
                        </button>

                        <button 
                            onClick={() => setIsTOCSidebarOpen(!isTOCSidebarOpen)}
                            className={`p-2.5 rounded-xl transition-all active:scale-90 ${isTOCSidebarOpen ? 'text-indigo-500 bg-indigo-50' : 'text-slate-400 hover:text-indigo-500 hover:bg-indigo-50'}`}
                            title="Table of Contents"
                        >
                            <List className="w-5 h-5" />
                        </button>

                        <div className="w-px h-8 bg-slate-100 mx-1"></div>

                        <button 
                            onClick={handleSave}
                            disabled={!title.trim() || isSaving}
                            className={`
                                flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 shadow-sm
                                ${showSaveSuccess 
                                    ? 'bg-emerald-500 text-white shadow-emerald-200' 
                                    : isSaving 
                                        ? 'bg-slate-100 text-slate-400 cursor-wait'
                                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
                                }
                            `}
                        >
                            {isSaving ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : showSaveSuccess ? (
                                <Check className="w-4 h-4" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            {showSaveSuccess ? 'Saved!' : isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            )}

            {/* --- MAIN WORKSPACE --- */}
            <div className="flex-1 flex overflow-hidden relative">
                {/* Sidebar (Metadata) */}
                <AnimatePresence initial={false}>
                    {isSidebarOpen && !isFocusMode && (
                        <motion.div 
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 320, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            className="bg-white border-r border-slate-100 flex flex-col shrink-0 overflow-hidden"
                        >
                            <div className="p-8 space-y-8 overflow-y-auto">
                                <div className="space-y-4">
                                    <label className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">
                                        <AlignLeft className="w-3.5 h-3.5" /> Description
                                    </label>
                                    <textarea 
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="What is this page about?"
                                        rows={4}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-200 transition-all resize-none leading-relaxed"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-4">
                                        <label className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">
                                            <Layout className="w-3.5 h-3.5" /> Icon
                                        </label>
                                        <input 
                                            type="text"
                                            value={icon}
                                            onChange={(e) => setIcon(e.target.value)}
                                            placeholder="Emoji or Name"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-200 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">
                                            <Hash className="w-3.5 h-3.5" /> Order
                                        </label>
                                        <input 
                                            type="number"
                                            value={sortOrder}
                                            onChange={(e) => setSortOrder(parseInt(e.target.value))}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-200 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Info className="w-3.5 h-3.5 text-indigo-400" />
                                        <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider">Quick Icons</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {['Briefcase', 'Users', 'Video', 'Camera', 'PenTool', 'Settings'].map(i => (
                                            <button 
                                                key={i} 
                                                onClick={() => setIcon(i)}
                                                className="px-2 py-1 bg-white border border-indigo-100 rounded-lg text-[9px] font-bold text-slate-500 hover:text-indigo-600 hover:border-indigo-300 transition-all shadow-sm"
                                            >
                                                {i}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-8 border-t border-slate-50">
                                    <div className="flex items-center gap-3 text-slate-400">
                                        <BookOpen className="w-4 h-4" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Handbook Guide</span>
                                    </div>
                                    <p className="mt-3 text-[11px] text-slate-400 leading-relaxed font-medium">
                                        Use Markdown to format your content. You can add headers, lists, and quotes to make it readable.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col relative bg-white">
                    {/* Sidebar Toggle Button */}
                    {!isFocusMode && (
                        <button 
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="absolute top-1/2 -left-3 -translate-y-1/2 w-6 h-12 bg-white border border-slate-100 rounded-full shadow-sm flex items-center justify-center text-slate-300 hover:text-indigo-500 transition-all z-40"
                        >
                            {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                    )}

                    {isPage ? (
                        <div className="flex-1 flex flex-col overflow-hidden">
                            {activeTab === 'EDIT' ? (
                                <div className="flex-1 overflow-y-auto bg-white">
                                    <RichTextEditor 
                                        content={content}
                                        onChange={setContent}
                                        placeholder="Start writing your handbook page..."
                                        minHeight="100%"
                                        className="pt-6 pb-12 px-12 md:pt-10 md:pb-20 md:px-20"
                                    />
                                </div>
                            ) : (
                                <div className="flex-1 overflow-y-auto p-12 md:p-20 scrollbar-thin scrollbar-thumb-slate-100">
                                    <div 
                                        className="max-w-3xl mx-auto prose prose-slate prose-lg"
                                        dangerouslySetInnerHTML={{ __html: content || '<p className="italic text-slate-400">No content yet. Start writing!</p>' }}
                                    />
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
                            <div className="w-32 h-32 bg-indigo-50 rounded-[3rem] flex items-center justify-center mb-8 border border-indigo-100 shadow-sm relative">
                                <Folder className="w-16 h-16 text-indigo-400 opacity-20" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Zap className="w-10 h-10 text-indigo-400 animate-pulse" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-slate-800 tracking-tight">Folder Configuration</h3>
                            <p className="mt-4 text-slate-400 font-medium max-w-sm leading-relaxed">
                                Folders are used to organize your handbook. You can set the title, description, and icon in the sidebar.
                            </p>
                        </div>
                    )}

                    {/* AI Assistant Floating Button */}
                    {isPage && !isFocusMode && (
                        <motion.button 
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsAIDialogOpen(true)}
                            className="absolute bottom-10 right-10 px-6 py-4 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-sm border border-white/20 group"
                        >
                            <Sparkles className="w-5 h-5 group-hover:animate-spin-slow" />
                            AI Assistant
                        </motion.button>
                    )}

                    {/* AI Dialog */}
                    <WikiAIDialog 
                        isOpen={isAIDialogOpen}
                        onClose={() => setIsAIDialogOpen(false)}
                        onGenerate={handleAIGenerate}
                        isGenerating={isGenerating}
                        initialTitle={title}
                    />
                </div>

                {/* Right Sidebar (TOC) */}
                <AnimatePresence initial={false}>
                    {isTOCSidebarOpen && isPage && !isFocusMode && (
                        <motion.div 
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 280, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            className="bg-slate-50/50 border-l border-slate-100 flex flex-col shrink-0 overflow-hidden"
                        >
                            <div className="p-8 overflow-y-auto h-full">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-6">
                                    <List className="w-3.5 h-3.5" /> Table of Contents
                                </div>
                                
                                {toc.length > 0 ? (
                                    <div className="space-y-4">
                                        {toc.map((item, idx) => (
                                            <div 
                                                key={idx}
                                                className={`
                                                    text-xs font-medium cursor-pointer hover:text-indigo-600 transition-colors
                                                    ${item.level === 1 ? 'text-slate-800 font-bold' : 'text-slate-500'}
                                                    ${item.level === 2 ? 'ml-3' : ''}
                                                    ${item.level >= 3 ? 'ml-6' : ''}
                                                `}
                                            >
                                                {item.text}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-10 text-center">
                                        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                            <Hash className="w-6 h-6 text-slate-300" />
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">No headings found</p>
                                    </div>
                                )}

                                <div className="mt-12 pt-8 border-t border-slate-100">
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">
                                        <Zap className="w-3.5 h-3.5" /> Pro Tips
                                    </div>
                                    <div className="space-y-3">
                                        <div className="p-3 bg-white border border-slate-100 rounded-xl text-[10px] text-slate-500 leading-relaxed">
                                            Use the <span className="font-bold text-indigo-500">Toolbar</span> for formatting
                                        </div>
                                        <div className="p-3 bg-white border border-slate-100 rounded-xl text-[10px] text-slate-500 leading-relaxed">
                                            AI can help you write <span className="font-bold text-indigo-500">SOPs</span> and <span className="font-bold text-indigo-500">Guides</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Focus Mode Exit */}
            <AnimatePresence>
                {isFocusMode && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed top-8 right-8 z-[1100]"
                    >
                        <button 
                            onClick={() => setIsFocusMode(false)}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl shadow-2xl font-bold text-xs hover:bg-slate-800 transition-all"
                        >
                            <Minimize2 className="w-4 h-4" /> Exit Focus
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>,
        document.body
    );
};

export default WikiNodeEditor;
