
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useScriptContext } from '../core/ScriptContext';
import RichTextEditor from '../../ui/RichTextEditor';
import CharacterBar from './CharacterBar';
import SheetBar from './SheetBar';
import FindReplaceBar from '../tools/FindReplaceBar';
import { MessageSquarePlus, Eye, Radio, FileText } from 'lucide-react';
import { CommentMark } from './CommentExtension';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import { motion } from 'framer-motion';

const ScriptTextArea: React.FC = () => {
    const { 
        content, setContent, scriptType, isChatPreviewOpen, isReadOnly, setEditorInstance, zoomLevel,
        addComment, scrollToComment, editorInstance, 
        isAutoCharacter, characters, isFocusMode,
        isFindReplaceOpen, setIsFindReplaceOpen, replaceAllAcrossSheets,
        pendingHighlight, setPendingHighlight,
        ydoc, isYjsSynced, activeSheetId, lockerUser, currentUser
    } = useScriptContext();

    const [isActivated, setIsActivated] = useState(activeSheetId === 'main');

    useEffect(() => {
        setIsActivated(activeSheetId === 'main');
    }, [activeSheetId]);

    const [matchCount, setMatchCount] = useState({ current: 0, total: 0 });
    const [lastSearch, setLastSearch] = useState('');
    const [searchIndices, setSearchIndices] = useState<number[]>([]);

    const handleFind = useCallback((query: string, direction: 'next' | 'prev' = 'next') => {
        if (!editorInstance) return;

        // Trigger visual highlighting in the editor
        // @ts-ignore
        editorInstance.commands.setSearchTerm(query);

        if (!query) {
            setMatchCount({ current: 0, total: 0 });
            setSearchIndices([]);
            return;
        }

        const doc = editorInstance.state.doc;
        const text = doc.textBetween(0, doc.content.size, '\n');
        const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        const indices: number[] = [];
        let match;

        while ((match = regex.exec(text)) !== null) {
            indices.push(match.index);
        }

        setSearchIndices(indices);
        setMatchCount(prev => ({ ...prev, total: indices.length }));

        if (indices.length === 0) {
            setMatchCount({ current: 0, total: 0 });
            return;
        }

        const { from } = editorInstance.state.selection;
        
        let occurrences: { from: number, to: number }[] = [];
        doc.descendants((node, pos) => {
            if (node.isText && node.text) {
                const m = node.text.matchAll(regex);
                for (const match of m) {
                    if (match.index !== undefined) {
                        occurrences.push({
                            from: pos + match.index,
                            to: pos + match.index + match[0].length
                        });
                    }
                }
            }
        });

        if (occurrences.length > 0) {
            setMatchCount(prev => ({ ...prev, total: occurrences.length }));
            
            let nextIdx = 0;
            if (query === lastSearch) {
                if (direction === 'next') {
                    nextIdx = occurrences.findIndex(o => o.from > from);
                    if (nextIdx === -1) nextIdx = 0;
                } else {
                    for (let i = occurrences.length - 1; i >= 0; i--) {
                        if (occurrences[i].from < from) {
                            nextIdx = i;
                            break;
                        }
                        if (i === 0) nextIdx = occurrences.length - 1;
                    }
                }
            } else {
                nextIdx = occurrences.findIndex(o => o.from >= from);
                if (nextIdx === -1) nextIdx = 0;
            }

            const target = occurrences[nextIdx];
            editorInstance.chain()
                .focus()
                .setTextSelection({ from: target.from, to: target.to })
                .scrollIntoView()
                .run();
                
            setMatchCount({ current: nextIdx + 1, total: occurrences.length });
            setLastSearch(query);
        } else {
            setMatchCount({ current: 0, total: 0 });
        }
    }, [editorInstance, lastSearch, matchCount.current]);

    // Auto-highlight and scroll when opening from search
    useEffect(() => {
        if (editorInstance && pendingHighlight) {
            console.log("[ScriptTextArea] Auto-highlighting:", pendingHighlight);
            // Small delay to ensure content is fully rendered
            const timer = setTimeout(() => {
                handleFind(pendingHighlight, 'next');
                // Clear the highlight so it doesn't re-trigger on every sheet switch
                setPendingHighlight(null);
            }, 800); // Increased delay slightly
            return () => clearTimeout(timer);
        }
    }, [editorInstance, pendingHighlight, handleFind, setPendingHighlight]);

    const handleReplace = (find: string, replace: string) => {
        if (!editorInstance || !find) return;
        
        const { from, to } = editorInstance.state.selection;
        const selectedText = editorInstance.state.doc.textBetween(from, to);
        
        if (selectedText.toLowerCase() === find.toLowerCase()) {
            editorInstance.chain().focus().insertContentAt({ from, to }, replace).run();
            handleFind(find, 'next'); // Move to next
        } else {
            handleFind(find, 'next'); // Just find if not selected
        }
    };

    const handleReplaceAll = (find: string, replace: string) => {
        replaceAllAcrossSheets(find, replace);
        setMatchCount({ current: 0, total: 0 });
    };

    const lastCharIndexRef = useRef<number>(-1);

    const handleKeyDown = (view: any, event: KeyboardEvent) => {
        if (isReadOnly || !editorInstance) return false;

        // Handle Tab key
        if (event.key === 'Tab') {
            event.preventDefault();
            // Insert 4 spaces for indentation
            editorInstance.chain().focus().insertContent('    ').run();
            return true;
        }

        if (!isAutoCharacter) return false;

        if (event.key === 'Enter') {
            // Shift + Enter = Normal Newline
            if (event.shiftKey) return false;

            // Alt + Enter = Repeat Current Character
            if (event.altKey) {
                event.preventDefault();
                const currentChar = lastCharIndexRef.current >= 0 ? characters[lastCharIndexRef.current] : characters[0];
                editorInstance.chain().focus().insertContent(`<p><strong>${currentChar}:</strong> </p>`).run();
                return true;
            }

            // Normal Enter = Next Character
            event.preventDefault();
            const nextIndex = (lastCharIndexRef.current + 1) % characters.length;
            const nextChar = characters[nextIndex];
            lastCharIndexRef.current = nextIndex;
            
            editorInstance.chain().focus().insertContent(`<p><strong>${nextChar}:</strong> </p>`).run();
            return true;
        }

        return false;
    };

    const [isCommentInputOpen, setIsCommentInputOpen] = useState(false);
    const [commentText, setCommentText] = useState('');

    // Listener for clicking on comment marks
    useEffect(() => {
        if (!editorInstance) return;

        const handleSelectionUpdate = () => {
            const { selection } = editorInstance.state;
            const { $from } = selection;
            
            // Check if cursor is within a comment mark
            let commentId = null;
            if (editorInstance.isActive('comment')) {
                 const attrs = editorInstance.getAttributes('comment');
                 if (attrs && attrs.id) {
                     commentId = attrs.id;
                 }
            }

            if (commentId) {
                scrollToComment(commentId);
            }
        };

        editorInstance.on('selectionUpdate', handleSelectionUpdate);

        return () => {
            editorInstance.off('selectionUpdate', handleSelectionUpdate);
        };
    }, [editorInstance, scrollToComment]);

    const handleAddComment = async (editor: any) => {
        if (!commentText.trim()) return;
        
        const { from, to } = editor.state.selection;
        const selectedText = editor.state.doc.textBetween(from, to, ' ');
        const highlightId = crypto.randomUUID();

        // 1. Add mark in editor immediately (Optimistic)
        editor.chain().focus().setComment({ id: highlightId }).run();
        
        // 2. Save to DB
        await addComment(commentText, highlightId, selectedText);
        
        // Reset
        setCommentText('');
        setIsCommentInputOpen(false);
    };

    return (
        <div 
            className={`
                flex-1 flex flex-col bg-[#f8fafc] overflow-hidden relative min-w-0 transition-all duration-300
                ${isChatPreviewOpen && scriptType === 'DIALOGUE' ? 'hidden md:flex md:w-1/2' : ''}
            `} 
        >
            {/* Unified Sticky Header for CharacterBar & RichTextToolbar Portal */}
            <div className="sticky top-0 z-20 w-full bg-[#f8fafc] border-b border-gray-200/50 shadow-sm flex flex-col shrink-0">
                {!isFocusMode && (
                    <div className="w-full flex justify-between items-center pr-4">
                        <CharacterBar />
                        
                        {/* Real-time Indicator Badge */}
                        {isYjsSynced && (
                            <div className={`
                                flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold border shadow-sm shrink-0
                                ${isReadOnly 
                                    ? 'bg-red-50 text-red-600 border-red-100 animate-pulse' 
                                    : 'bg-green-50 text-green-600 border-green-100'}
                            `}>
                                {isReadOnly ? (
                                    <>
                                        <Eye className="w-3 h-3" />
                                        <span>LIVE Watching</span>
                                    </>
                                ) : (
                                    <>
                                        <Radio className="w-3 h-3" />
                                        <span>Broadcasting</span>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                )}
                
                {/* Rich Text Editor Toolbar Portal Target */}
                <div id="rich-text-toolbar-portal-target" className="w-full bg-[#f8fafc] min-h-[45px] empty:hidden"></div>
            </div>

            {/* Find & Replace Bar */}
            <FindReplaceBar 
                isOpen={isFindReplaceOpen}
                onClose={() => {
                    setIsFindReplaceOpen(false);
                    if (editorInstance) {
                        // @ts-ignore
                        editorInstance.commands.setSearchTerm('');
                    }
                }}
                onFind={handleFind}
                onReplace={handleReplace}
                onReplaceAll={handleReplaceAll}
                matchCount={matchCount}
            />

            {/* Dot Grid Pattern Background (Fixed behind) */}
            <div className="absolute inset-0 opacity-[0.3] pointer-events-none z-0" 
                 style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
            </div>

            {/* Main Scrollable Area */}
            <div className="flex-1 overflow-y-auto cursor-text relative z-0 scrollbar-thin scrollbar-thumb-indigo-100 bg-[#f8fafc]">
                <div className="flex justify-center p-4 md:p-8 min-h-full pb-64">
                    
                    {/* Paper Container - Scaled based on Zoom Level */}
                    <div 
                        className="w-full max-w-4xl bg-white shadow-xl shadow-indigo-100/50 rounded-[2rem] border border-gray-100 relative flex flex-col transition-[shadow,border-color,background-color] duration-200 ease-out overflow-hidden"
                        style={{ 
                            // @ts-ignore
                            zoom: zoomLevel / 100
                        }}
                    >
                        
                        {/* Top Accent Line */}
                        <div className="h-1.5 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 rounded-t-[2rem]"></div>
                        
                        {/* Content Area */}
                        <div className="p-6 md:p-10 lg:p-12 flex-1 cursor-text caret-black relative">
                            {!isYjsSynced ? (
                                <div className="flex justify-center items-center h-full min-h-[500px]">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                </div>
                            ) : !isActivated ? (
                                <div className="relative min-h-[500px]">
                                    {/* HTML Static Preview */}
                                    <div 
                                        onClick={() => setIsActivated(true)}
                                        className="prose max-w-none text-slate-700 select-none pb-32 cursor-pointer focus:outline-none"
                                        dangerouslySetInnerHTML={{ 
                                            __html: content && content !== '<p></p>' 
                                                ? content 
                                                : `<p class="text-slate-400 italic font-normal tracking-wide">ไม่มีข้อความในแผ่นงานนี้... คลิกที่นี่เพื่อเริ่มเขียนบท</p>` 
                                        }}
                                    />
                                    
                                    {/* Glass Overlay Card with perfect visual and shadow */}
                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-white via-white/95 to-transparent pt-32 pb-6 flex justify-center items-center z-10 pointer-events-none">
                                        <motion.div 
                                            initial={{ opacity: 0, y: 15 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-white/70 backdrop-blur-md border border-slate-200/60 p-5 rounded-2xl shadow-xl flex flex-col sm:flex-row items-center gap-4 pointer-events-auto max-w-xl text-center sm:text-left mx-6 relative"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/10 to-purple-50/10 rounded-2xl -z-10" />
                                            
                                            <div className="flex-1">
                                                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2 justify-center sm:justify-start">
                                                    <FileText className="w-4 h-4 text-indigo-500 animate-pulse" />
                                                    <span>📄 โหมดพรีวิวด่วน (Partial View)</span>
                                                </h4>
                                                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                                    แผ่นงานนี้ถูกย่อพรีวิวไว้เพื่อความรวดเร็วในการเปิด คลิกเพื่อโหลดตัวแก้ไขเต็มรูปแบบและเริ่มแก้ไขร่วมกับทีม
                                                </p>
                                            </div>
                                            
                                            <button 
                                                onClick={() => setIsActivated(true)}
                                                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-500/10 hover:shadow-indigo-500/20 transition-all shrink-0 cursor-pointer"
                                            >
                                                ✍️ โหลดแผ่นงานนี้
                                            </button>
                                        </motion.div>
                                    </div>
                                </div>
                            ) : (
                                <RichTextEditor 
                                    key={`editor-${activeSheetId}`} // Force re-mount when sheet changes
                                    content={content} // Tiptap will ignore this if Collaboration is used, but we keep it for fallback
                                    onChange={(html) => {
                                        // 1. Update local state
                                        setContent(html);
                                        // 2. Broadcast if Writer (Fallback, Yjs handles this now)
                                        // if (!isReadOnly) {
                                        //     sendLiveUpdate(html);
                                        // }
                                    }}
                                    readOnly={isReadOnly}
                                    onEditorReady={(editor) => {
                                        setEditorInstance(editor);
                                        // Fallback: If Yjs document was empty (e.g., migrating old script),
                                        // initialize it with the local content.
                                        if (editor.isEmpty && content && content !== '<p></p>') {
                                            editor.commands.setContent(content, false);
                                        }
                                    }}
                                    onKeyDown={handleKeyDown}
                                    extensions={[
                                        CommentMark,
                                        ...(ydoc ? [
                                            Collaboration.configure({
                                                document: ydoc,
                                                field: activeSheetId, // Use activeSheetId as the field name
                                            })
                                        ] : [])
                                    ]}
                                    placeholder={scriptType === 'DIALOGUE' ? "คลิกเลือกตัวละครด้านบน หรือพิมพ์เอง..." : "เริ่มเขียนบทของคุณที่นี่..."}
                                    className="prose max-w-none text-black focus:outline-none caret-black [&_.ProseMirror]:caret-black"
                                    minHeight="500px"
                                    bubbleMenuContent={(editor) => (
                                        <>
                                            {!isCommentInputOpen ? (
                                                <button 
                                                    onClick={() => setIsCommentInputOpen(true)}
                                                    className="flex items-center gap-1 bg-white border border-gray-200 shadow-lg rounded-lg px-2 py-1 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-transform active:scale-95"
                                                >
                                                    <MessageSquarePlus className="w-4 h-4 text-indigo-500" /> Comment
                                                </button>
                                            ) : (
                                                <div className="bg-white border border-gray-200 shadow-xl rounded-xl p-2 flex gap-2 items-center min-w-[250px] animate-in zoom-in-95">
                                                    <input 
                                                        autoFocus
                                                        type="text" 
                                                        className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                                                        placeholder="พิมพ์คอมเมนต์..."
                                                        value={commentText}
                                                        onChange={e => setCommentText(e.target.value)}
                                                        onKeyDown={e => {
                                                            if(e.key === 'Enter') handleAddComment(editor);
                                                            if(e.key === 'Escape') setIsCommentInputOpen(false);
                                                        }}
                                                    />
                                                    <button onClick={() => handleAddComment(editor)} className="bg-indigo-600 text-white p-1.5 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">
                                                        <MessageSquarePlus className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                />
                            )}
                        </div>
                        
                        <SheetBar />
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ScriptTextArea;
