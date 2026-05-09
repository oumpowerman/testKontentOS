
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Script, ScriptStatus, ScriptType, User, Channel, MasterOption, ScriptComment, ScriptSheet } from '../../../types';
import { supabase } from '../../../lib/supabase';
import { useToast } from '../../../context/ToastContext';
import { useGlobalDialog } from '../../../context/GlobalDialogContext';
import { Editor } from '@tiptap/core';
import { useScriptComments } from '../../../hooks/useScriptComments';
import { useScriptSearchNavigator } from '../../../hooks/useScriptSearchNavigator';
import { cleanContentForTiming, estimateDurationSeconds } from './scriptUtils';
import { useScriptLocking } from './useScriptLocking';
import { useScriptSheets } from './useScriptSheets';
import { useScriptPersistence } from './useScriptPersistence';
import { useScriptUI } from './useScriptUI';
import { ScriptContextType, ScriptProviderProps } from './ScriptContext.types';
import { useYjsSync } from '../../../hooks/useYjsSync';

const ScriptContext = createContext<ScriptContextType | undefined>(undefined);

export const useScriptContext = () => {
    const context = useContext(ScriptContext);
    if (!context) throw new Error('useScriptContext must be used within a ScriptProvider');
    return context;
};

export const ScriptProvider: React.FC<ScriptProviderProps> = ({ 
    children, script, users, channels, masterOptions, currentUser, onClose, onSave, onGenerateAI, onPromote, initialSearchQuery 
}) => {
    const { showToast } = useToast();
    const { showConfirm, showAlert } = useGlobalDialog();
    
    const { comments, addComment: addCommentHook, resolveComment: resolveCommentHook, deleteComment: deleteCommentHook } = useScriptComments(script.id);

    const [editorInstance, setEditorInstance] = useState<Editor | null>(null);

    const {
        mainContent, setMainContent,
        sheets, setSheets,
        activeSheetId, setActiveSheetId,
        content, setContent,
        addSheet, deleteSheet, renameSheet
    } = useScriptSheets({
        initialContent: script.content || '',
        initialSheets: script.sheets || [],
        editorInstance,
        showConfirm
    });

    const [title, setTitle] = useState(script.title);
    const [status, setStatus] = useState<ScriptStatus>(script.status);
    const [scriptType, setScriptType] = useState<ScriptType>(script.scriptType || 'MONOLOGUE');
    const [characters, setCharacters] = useState<string[]>(script.characters || ['ตัวละคร A', 'ตัวละคร B']);
    const [ideaOwnerId, setIdeaOwnerId] = useState<string | undefined>(script.ideaOwnerId);
    const [authorId, setAuthorId] = useState<string | undefined>(script.authorId);
    
    const [contentId, setContentId] = useState<string | undefined>(script.contentId);
    const [channelId, setChannelId] = useState<string | undefined>(script.channelId);
    const [category, setCategory] = useState<string | undefined>(script.category);
    const [tags, setTags] = useState<string[]>(script.tags || []);
    const [objective, setObjective] = useState<string>(script.objective || '');

    const [zoomLevel, setZoomLevel] = useState(100);

    const [isPublic, setIsPublic] = useState(script.isPublic || false);
    const [shareToken, setShareToken] = useState<string | undefined>(script.shareToken);

    const { lockStatus, lockerUser, acquireLock, releaseLock, forceTakeover } = useScriptLocking({
        scriptId: script.id,
        currentUser,
        users,
        showConfirm,
        showToast
    });

    const isReadOnly = lockStatus === 'LOCKED_BY_OTHER';

    // Initialize Yjs Sync
    const { ydoc, isSynced: isYjsSynced } = useYjsSync(script.id, lockStatus === 'LOCKED_BY_ME', script.content);

    const { 
        pendingHighlight, 
        setPendingHighlight, 
        findFirstMatch 
    } = useScriptSearchNavigator();

    // Handle initial search highlight when script is loaded
    useEffect(() => {
        if (script && initialSearchQuery) {
            const match = findFirstMatch(initialSearchQuery, script.content, script.sheets || []);
            if (match) {
                console.log("[ScriptContext] Match found in sheet:", match.sheetId);
                // If match is in a different sheet, switch to it
                if (match.sheetId !== activeSheetId) {
                    if (match.sheetId === 'main') {
                        setActiveSheetId('main');
                    } else {
                        setActiveSheetId(match.sheetId);
                    }
                }
                // Set the actual search query as pending highlight (more reliable than snippet)
                setPendingHighlight(initialSearchQuery);
            } else {
                console.log("[ScriptContext] No match found for:", initialSearchQuery);
            }
        }
    }, [script, initialSearchQuery, findFirstMatch]);
    
    const {
        isTeleprompterOpen, setIsTeleprompterOpen,
        isChatPreviewOpen, setIsChatPreviewOpen,
        isAIOpen, setIsAIOpen,
        isFindReplaceOpen, setIsFindReplaceOpen,
        isMetadataOpen, setIsMetadataOpen,
        isCommentsOpen, setIsCommentsOpen,
        activeCommentId, setActiveCommentId,
        isFocusMode, setIsFocusMode,
        isAutoCharacter, setIsAutoCharacter,
        isGenerating, setIsGenerating
    } = useScriptUI();

    const estimatedSeconds = estimateDurationSeconds(content); 
    const isScriptOwner = currentUser.id === script.authorId || currentUser.id === ideaOwnerId;

    const { isSaving, setIsSaving, lastSaved, setLastSaved, isDirtyRef, handleSave } = useScriptPersistence({
        script, title, content, mainContent, status, scriptType, characters,
        ideaOwnerId, authorId, channelId, category, tags, objective,
        sheets, activeSheetId, isReadOnly, lockStatus, estimatedSeconds, onSave, ydoc
    });
    
    const addComment = async (text: string, highlightId?: string, selectedText?: string) => {
        const success = await addCommentHook(currentUser.id, text, highlightId, selectedText);
        if (success) {
             setIsCommentsOpen(true); 
        }
        return success;
    };
    
    const scrollToComment = (highlightId: string) => {
         setIsCommentsOpen(true);
         setActiveCommentId(highlightId);
         
         setTimeout(() => {
             const element = document.getElementById(`comment-item-${highlightId}`);
             if (element) {
                 element.scrollIntoView({ behavior: 'smooth', block: 'center' });
             }
         }, 100);
    };

    // --- NEW LOGIC: Character Sync ---
    const saveCharacters = async (newChars: string[]) => {
        setCharacters(newChars); // Optimistic update
        try {
            const { error } = await supabase
                .from('scripts')
                .update({ characters: newChars })
                .eq('id', script.id);
            if (error) throw error;
        } catch (err: any) {
            console.error("Failed to save characters", err);
            showToast('บันทึกตัวละครไม่สำเร็จ: ' + err.message, 'error');
        }
    };

    const renameCharacter = async (oldName: string, newName: string) => {
        if (!oldName || !newName || oldName === newName) return;

        // 1. Update characters list
        const newChars = characters.map(c => c === oldName ? newName : c);
        setCharacters(newChars);

        // 2. Update content
        // Look for <strong>Name:</strong> or <strong>Name: </strong>
        const escapedOldName = oldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Match <strong>Name:</strong> with optional space after colon
        const regex = new RegExp(`<strong>${escapedOldName}:\\s*</strong>`, 'g');
        const newContent = content.replace(regex, `<strong>${newName}: </strong>`);

        if (newContent !== content) {
            setContent(newContent);
            if (editorInstance) {
                // Get current scroll/selection if possible, but setContent usually resets it.
                // Since this is triggered from a popup, it's acceptable.
                editorInstance.commands.setContent(newContent, true);
            }
            isDirtyRef.current = true;
        }

        // 3. Save to DB
        try {
            const { error } = await supabase
                .from('scripts')
                .update({ 
                    characters: newChars,
                    content: newContent
                })
                .eq('id', script.id);
            if (error) throw error;
        } catch (err: any) {
            console.error("Failed to rename character", err);
            showToast('เปลี่ยนชื่อตัวละครในบทไม่สำเร็จ', 'error');
        }
    };

    const removeMarkById = (highlightId: string) => {
        if (!editorInstance) return;
        editorInstance.chain().command(({ tr }) => {
            tr.doc.descendants((node, pos) => {
                node.marks.forEach(mark => {
                    if (mark.type.name === 'comment' && mark.attrs.id === highlightId) {
                        tr.removeMark(pos, pos + node.nodeSize, mark.type);
                    }
                });
            });
            return true;
        }).run();
    };

    const resolveComment = async (id: string) => {
        const comment = comments.find(c => c.id === id);
        if (comment?.highlightId) {
            removeMarkById(comment.highlightId);
        }
        await resolveCommentHook(id);
    };

    const deleteComment = async (id: string) => {
        const comment = comments.find(c => c.id === id);
        if (comment?.highlightId) {
            removeMarkById(comment.highlightId);
        }
        await deleteCommentHook(id);
    };

    const replaceAllAcrossSheets = (find: string, replace: string) => {
        if (!find) return;
        const regex = new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        
        // Update all states
        setMainContent(prev => prev.replace(regex, replace));
        setSheets(prev => prev.map(s => ({
            ...s,
            content: s.content.replace(regex, replace)
        })));
        setContent(prev => prev.replace(regex, replace));

        // Update editor if active
        if (editorInstance) {
            const currentHTML = editorInstance.getHTML();
            const newHTML = currentHTML.replace(regex, replace);
            if (currentHTML !== newHTML) {
                editorInstance.commands.setContent(newHTML, false);
            }
        }
        
        isDirtyRef.current = true;
        showToast(`แทนที่คำว่า "${find}" ทั้งหมดเรียบร้อยแล้ว`, 'success');
    };

    const changeStatus = async (newStatus: ScriptStatus) => {
        if (isReadOnly) return;
        setStatus(newStatus);
        setIsSaving(true);
        try {
            await onSave(script.id, { title, content, status: newStatus });
            setLastSaved(new Date());
        } catch (error) { console.error("Failed to save status", error); } finally { setIsSaving(false); }
    };
    
    const handleToggleShare = async () => {
        const newStatus = !isPublic;
        let newToken = shareToken;
        if (newStatus && !shareToken) {
            newToken = crypto.randomUUID();
            setShareToken(newToken);
        }
        setIsPublic(newStatus);
        await onSave(script.id, { isPublic: newStatus, shareToken: newToken });
        showToast(newStatus ? 'เปิดใช้งาน Magic Link แล้ว 🔗' : 'ปิดการแชร์แล้ว 🔒', newStatus ? 'success' : 'info');
    };

    const handleGenerateAIWrapper = async (prompt: string, type: 'HOOK' | 'OUTLINE' | 'FULL') => {
        if (isReadOnly) {
            showAlert("ไม่สามารถใช้งาน AI ได้ขณะที่อยู่ในโหมดอ่านอย่างเดียว (Locked by other)", "แจ้งเตือน");
            return;
        }

        setIsGenerating(true);
        try {
            const result = await onGenerateAI(prompt || title, type);
            if (result) {
                setContent(prev => prev + "<br/><br/>" + result);
                setIsAIOpen(false);
                isDirtyRef.current = true;
                showToast("AI ทำงานสำเร็จแล้ว! ✨", "success");
            } else {
                // If result is null, onGenerateAI might have already shown a toast, 
                // but let's make it more obvious with a Global Alert if needed or just handle the flow.
                showAlert("AI ไม่สามารถประมวลผลได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง หรือตรวจสอบ API Key", "AI Generation Failed");
            }
        } catch (error: any) {
            console.error("AI Generation Context Error:", error);
            showAlert(`เกิดข้อผิดพลาดในการเรียกใช้งาน AI: ${error.message || 'Unknown error'}`, "Error");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleInsertCharacter = (charName: string) => {
        if (editorInstance && !isReadOnly) {
            editorInstance.chain().focus().insertContent(`<p><strong>${charName}:</strong> </p>`).run();
        } else {
             setContent(prev => prev + `<p><strong>${charName}:</strong> </p>`);
        }
        isDirtyRef.current = true;
    };

    const handleCloseWrapper = async () => {
        if (isDirtyRef.current) await handleSave(true);
        await releaseLock();
        onClose();
    };

    return (
        <ScriptContext.Provider value={{
            content, setContent,
            title, setTitle,
            status, setStatus,
            changeStatus, 
            scriptType, setScriptType,
            characters, setCharacters, saveCharacters, renameCharacter, // EXPORTED
            ideaOwnerId, setIdeaOwnerId,
            authorId, setAuthorId,
            contentId, channelId, setChannelId,
            category, setCategory,
            tags, setTags,
            objective, setObjective,
            isSaving, lastSaved,
            setEditorInstance, editorInstance,
            zoomLevel, setZoomLevel,
            isPublic, shareToken, handleToggleShare,
            lockStatus, lockerUser, isReadOnly, forceTakeover,
            isFocusMode, setIsFocusMode,
            isAutoCharacter, setIsAutoCharacter,
            isTeleprompterOpen, setIsTeleprompterOpen,
            isChatPreviewOpen, setIsChatPreviewOpen,
            isAIOpen, setIsAIOpen,
            isFindReplaceOpen, setIsFindReplaceOpen,
            isGenerating, setIsGenerating,
            isMetadataOpen, setIsMetadataOpen,
            isCommentsOpen, setIsCommentsOpen,
            comments, addComment, resolveComment, deleteComment, scrollToComment,
            activeCommentId, setActiveCommentId,
            handleSave,
            replaceAllAcrossSheets,
            handleGenerateAI: handleGenerateAIWrapper,
            handleInsertCharacter,
            onPromote, 
            isScriptOwner,
            currentUser,
            users, channels, masterOptions,
            onClose: handleCloseWrapper,
            sheets, activeSheetId, setActiveSheetId, addSheet, deleteSheet, renameSheet,
            pendingHighlight, setPendingHighlight,
            ydoc, isYjsSynced
        }}>
            {children}
        </ScriptContext.Provider>
    );
};
