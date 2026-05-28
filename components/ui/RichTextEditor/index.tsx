
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react'
import BubbleMenuExtension from '@tiptap/extension-bubble-menu'
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Link from '@tiptap/extension-link';
import FontFamily from '@tiptap/extension-font-family';
import { ResizableImage } from './ResizableImageExtension';
import { resizeImage, fileToBase64 } from '../../../utils/imageUtils';
import EditorLinkModal from '../EditorLinkModal';
import { FontSize } from './FontSizeExtension';
import { FontWeight } from './FontWeightExtension';
import { DrawingExtension } from './DrawingExtension';
import { SearchHighlightExtension } from './SearchHighlightExtension';
import { ParagraphFormatting } from './ParagraphFormattingExtension';
import RichTextToolbar from './RichTextToolbar';
import { FormattingSettings } from './FormattingPanel';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Image as ImageIcon, HardDrive, Sparkles, X, ChevronRight } from 'lucide-react';
import ImageWarningModal from './ImageWarningModal';

export interface RichTextEditorProps {
    content: string;
    onChange: (html: string) => void;
    placeholder?: string;
    readOnly?: boolean;
    className?: string;
    minHeight?: string;
    variant?: 'light' | 'dark';
    onEditorReady?: (editor: Editor) => void; 
    extensions?: any[]; 
    bubbleMenuContent?: (editor: Editor) => React.ReactNode; 
    onKeyDown?: (view: any, event: KeyboardEvent) => boolean | void;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ 
    content, 
    onChange, 
    placeholder = 'Start typing...', 
    readOnly = false,
    className = '',
    minHeight = '300px',
    variant = 'light',
    onEditorReady,
    extensions = [],
    bubbleMenuContent,
    onKeyDown
}) => {
    // Modal State
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [currentLinkUrl, setCurrentLinkUrl] = useState('');
    const [isFormattingOpen, setIsFormattingOpen] = useState(false);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);

    const [pendingImageInsert, setPendingImageInsert] = useState<{
        type: 'paste-file' | 'drop-file' | 'paste-text';
        file?: File;
        base64?: string;
        coordinates?: { left: number; top: number; pos: number };
        view?: any;
    } | null>(null);

    const bubbleMenuRef = useRef<HTMLDivElement | null>(null);
    const hasCollaboration = extensions?.some(ext => ext.name === 'collaboration');

    const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
                bulletList: {
                    keepMarks: true,
                    keepAttributes: false,
                },
                orderedList: {
                    keepMarks: true,
                    keepAttributes: false,
                },
                history: hasCollaboration ? false : {
                    depth: 100,
                    newGroupDelay: 500,
                }
            } as any),

            Placeholder.configure({
                placeholder: placeholder,
            }),
            TextStyle,
            Color,
            FontSize,
            FontWeight,
            FontFamily,
            ParagraphFormatting,
            DrawingExtension,
            SearchHighlightExtension,
            ResizableImage.configure({
                allowBase64: true,
            }),
            Link.configure({
                openOnClick: true,
                autolink: true,
                defaultProtocol: 'https',
                HTMLAttributes: {
                    target: '_blank',
                    rel: 'noopener noreferrer',
                    class: 'cursor-pointer text-indigo-600 underline',
                },
                linkOnPaste: true,
            }),
            BubbleMenuExtension,
            ...extensions, 
        ],
        content: content, 
        editable: !readOnly,
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            if (html !== content) {
                onChange(html);
            }
        },
        editorProps: {
            attributes: {
                class: `prose prose-sm sm:prose-base ${variant === 'dark' ? 'prose-invert text-white caret-white' : 'text-black caret-black'} focus:outline-none max-w-none ${className} whitespace-pre-wrap [&_.ProseMirror]:caret-current [&_ol]:list-decimal [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:pl-5 [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mb-4 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mb-3 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:mb-2 [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-4 [&_a]:text-indigo-600 [&_a]:underline [&_a]:cursor-pointer [&_p:empty]:min-h-[1em] [&_p:empty]:mb-4 [&_p>br:only-child]:min-h-[1em]`,
                style: `min-height: ${minHeight}; outline: none;`,
            },
            handleKeyDown: (view, event) => {
                if (onKeyDown) {
                    const result = onKeyDown(view, event);
                    if (result === true) return true;
                }
                
                if (event.key === 'Tab') {
                    event.preventDefault();
                    if (!editor) return true;

                    const isList = editor.isActive('bulletList') || editor.isActive('orderedList');
                    
                    if (isList) {
                        let handled = false;
                        if (event.shiftKey) {
                            handled = editor.chain().focus().liftListItem('listItem').run();
                        } else {
                            // Try normal sink first
                            handled = editor.chain().focus().sinkListItem('listItem').run();
                            
                            // If sink failed (likely first item), we force indent by wrapping in another list
                            if (!handled) {
                                handled = editor.chain().focus().wrapInList(editor.isActive('bulletList') ? 'bulletList' : 'orderedList').run();
                            }
                        }
                        
                        if (handled) return true;
                        
                        // Fallback to spaces only if structural indent is impossible
                        if (!event.shiftKey) {
                            editor.chain().focus().insertContent('    ').run();
                        }
                    } else {
                        // Normal text: Insert 4 spaces
                        editor.chain().focus().insertContent('    ').run();
                    }
                    return true;
                }

                if (event.key === 'Backspace') {
                    if (editor && !editor.isActive('bulletList') && !editor.isActive('orderedList')) {
                        const { selection } = view.state;
                        if (selection.empty) {
                            const { $from } = selection;
                            const pos = $from.pos;
                            // Smart Backspace: If there are 4 spaces before cursor, delete them all at once
                            if (pos >= 4) {
                                try {
                                    const textBefore = view.state.doc.textBetween(pos - 4, pos);
                                    if (textBefore === '    ') {
                                        event.preventDefault();
                                        editor.chain().focus().deleteRange({ from: pos - 4, to: pos }).run();
                                        return true;
                                    }
                                } catch (e) {
                                    // Fallback for safety
                                }
                            }
                        }
                    }
                }
                return false;
            },
            handlePaste: (view, event) => {
                const items = event.clipboardData?.items;
                if (!items) return false;

                // Check for pasted text with massive image Base64 or raw data URL
                const plainTextItem = Array.from(items).find(item => item.type === 'text/plain');
                if (plainTextItem) {
                    const text = event.clipboardData?.getData('text/plain') || '';
                    const isDataURL = text.trim().startsWith('data:image/');
                    const isMassiveBase64 = text.length > 5000 && /^[A-Za-z0-9+/=\s\n]+$/.test(text.substring(0, 500));
                    if (isDataURL || isMassiveBase64) {
                        setPendingImageInsert({
                            type: 'paste-text',
                            base64: text.trim(),
                            view: view
                        });
                        return true;
                    }
                }

                let handled = false;
                for (const item of Array.from(items)) {
                    if (item.type.startsWith('image/')) {
                        const file = item.getAsFile();
                        if (file) {
                            handled = true;
                            setPendingImageInsert({
                                type: 'paste-file',
                                file: file,
                                view: view
                            });
                        }
                    }
                }
                return handled;
            },
            handleDrop: (view, event, slice, moved) => {
                if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
                    const file = event.dataTransfer.files[0];
                    if (file.type.startsWith('image/')) {
                        const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
                        setPendingImageInsert({
                            type: 'drop-file',
                            file: file,
                            coordinates: coordinates ? { left: event.clientX, top: event.clientY, pos: coordinates.pos } : undefined,
                            view: view
                        });
                        return true;
                    }
                }
                return false;
            }
        },
    });

    useEffect(() => {
        const target = document.getElementById('rich-text-toolbar-portal-target');
        if (target) {
            setPortalTarget(target);
        } else {
            setPortalTarget(null);
        }
    }, [editor]);

    useEffect(() => {
        return () => {
            editor?.destroy();
        };
    }, [editor]);

    const lastPropContent = useRef(content);

    // Initial content sync
    useEffect(() => {
        if (editor && onEditorReady) {
            onEditorReady(editor);
        }
    }, [editor, onEditorReady]);

    // Handle external content updates
    useEffect(() => {
        if (!editor) return;

        // Only update if the prop 'content' actually changed to a new value from the parent
        // (meaning an external update happened, not just a re-render of the same stale data)
        if (content !== lastPropContent.current) {
            lastPropContent.current = content;
            
            // Only apply if the editor isn't focused to avoid interrupting the user
            if (!editor.isFocused && content !== editor.getHTML()) {
                editor.commands.setContent(content, false);
            }
        }
    }, [content, editor]);

    // --- Link Handling Logic ---
    const openLinkModal = useCallback(() => {
        if (!editor) return;
        const previousUrl = editor.getAttributes('link').href;
        setCurrentLinkUrl(previousUrl || '');
        setIsLinkModalOpen(true);
    }, [editor]);

    const handleSaveLink = (url: string) => {
        if (!editor) return;
        const chain = editor.chain().focus().extendMarkRange('link');
        if (url === '') {
            chain.unsetLink().run();
        } else {
            chain.setLink({ href: url }).run();
        }
        setIsLinkModalOpen(false);
    };

    const handleUnlink = () => {
        if (!editor) return;
        editor.chain().focus().unsetLink().run();
        setIsLinkModalOpen(false);
    }

    const handleProceedImageInsert = async () => {
        if (!pendingImageInsert || !editor) return;

        try {
            let base64 = pendingImageInsert.base64;
            if (pendingImageInsert.file) {
                const resizedBlob = await resizeImage(pendingImageInsert.file, 1200, 1200);
                base64 = await fileToBase64(resizedBlob);
            }

            if (base64) {
                if (pendingImageInsert.type === 'drop-file' && pendingImageInsert.coordinates) {
                    const transaction = editor.state.tr.insert(
                        pendingImageInsert.coordinates.pos, 
                        editor.state.schema.nodes.resizableImage.create({ src: base64 })
                    );
                    editor.view.dispatch(transaction);
                } else {
                    editor.commands.insertContent({
                        type: 'resizableImage',
                        attrs: { src: base64 }
                    });
                }
            }
        } catch (e) {
            console.error('Failed to insert pending image:', e);
        } finally {
            setPendingImageInsert(null);
        }
    };

    if (!editor) {
        return null;
    }

    return (
        <div className="flex flex-col w-full relative group">
            {/* Bubble Menu for Comments */}
            {editor && bubbleMenuContent && (
                <BubbleMenu 
                    editor={editor} 
                    tippyOptions={{ 
                        duration: 100,
                        zIndex: 10, // Lower than Toolbar (z-20) so it hides when text scrolls under
                        maxWidth: 'none',
                        moveTransition: 'transform 0.1s ease-out',
                    }}
                >
                    {bubbleMenuContent(editor)}
                </BubbleMenu>
            )}

            {/* Toolbar */}
            {!readOnly && (
                portalTarget ? (
                    createPortal(
                        <RichTextToolbar 
                            editor={editor} 
                            openLinkModal={openLinkModal} 
                            isFormattingOpen={isFormattingOpen}
                            setIsFormattingOpen={setIsFormattingOpen}
                            variant={variant}
                            isPortaled={true}
                            isImageModalOpen={isImageModalOpen}
                            setIsImageModalOpen={setIsImageModalOpen}
                        />,
                        portalTarget
                    )
                ) : (
                    <RichTextToolbar 
                        editor={editor} 
                        openLinkModal={openLinkModal} 
                        isFormattingOpen={isFormattingOpen}
                        setIsFormattingOpen={setIsFormattingOpen}
                        variant={variant}
                        isImageModalOpen={isImageModalOpen}
                        setIsImageModalOpen={setIsImageModalOpen}
                    />
                )
            )}

            {/* Editor Content Area */}
            <div 
                className={`cursor-text p-4 md:p-8 ${variant === 'dark' ? 'caret-white' : 'caret-black'}`} 
                onClick={() => editor.chain().focus().run()}
                style={variant === 'dark' ? { color: '#ffffff' } : {}}
            >
                <EditorContent editor={editor} />
            </div>

            {/* Custom Link Modal */}
            <EditorLinkModal 
                isOpen={isLinkModalOpen}
                onClose={() => setIsLinkModalOpen(false)}
                initialUrl={currentLinkUrl}
                onSave={handleSaveLink}
                onUnlink={handleUnlink}
            />

            {/* Base64 / Large Image Drop/Paste Warning Overlay Dialog */}
            <ImageWarningModal
                isOpen={!!pendingImageInsert}
                onClose={() => setPendingImageInsert(null)}
                onConfirm={handleProceedImageInsert}
                onUseDrive={() => {
                    setPendingImageInsert(null);
                    setIsImageModalOpen(true);
                }}
            />
        </div>
    );
};

export default RichTextEditor;
