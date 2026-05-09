
import React, { useState, useRef, useEffect } from 'react';
import { Editor } from '@tiptap/core';
import { 
    Bold, Italic, List, ListOrdered, Heading1, Heading2, Heading3, 
    Quote, Undo, Redo, Strikethrough, Type, ChevronDown, Check, Plus, 
    Link as LinkIcon, Image as ImageIcon, MousePointer2, Palette,
    Type as TypeIcon, Baseline, Settings2, AlignLeft
} from 'lucide-react';
import { PRESET_COLORS, PRESET_FONTS } from './constants';
import ImageInsertModal from './ImageInsertModal';
import ToolbarDropdown from './ToolbarDropdown';
import FormattingPanel, { FormattingSettings } from './FormattingPanel';
import { motion, AnimatePresence } from 'framer-motion';

interface RichTextToolbarProps {
    editor: Editor;
    openLinkModal: () => void;
    isFormattingOpen: boolean;
    setIsFormattingOpen: (isOpen: boolean) => void;
    variant?: 'light' | 'dark';
}

const MenuButton = ({ onClick, isActive, icon: Icon, title, label, disabled, variant }: any) => (
    <motion.button
        whileTap={!disabled ? { scale: 0.92 } : {}}
        onClick={onClick}
        disabled={disabled}
        className={`
            p-1.5 rounded-lg transition-all flex items-center justify-center relative
            ${disabled ? 'opacity-25 cursor-not-allowed' : 'cursor-pointer'}
            ${isActive 
                ? (variant === 'dark' ? 'bg-indigo-500/20 text-indigo-400 shadow-[inset_0_1px_3px_rgba(79,70,229,0.2)]' : 'bg-indigo-50 text-indigo-600 shadow-[inset_0_1px_3px_rgba(79,70,229,0.1)]') 
                : (variant === 'dark' ? 'text-white/40 hover:bg-white/5 hover:text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900')}
        `}
        title={title}
        type="button"
    >
        <Icon className={`w-4 h-4 ${isActive ? 'scale-110' : ''}`} />
        {label && <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wider">{label}</span>}
        {isActive && (
            <motion.div 
                layoutId="active-indicator"
                className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.6)]"
            />
        )}
    </motion.button>
);

const Divider = ({ variant }: { variant?: string }) => <div className={`w-px h-4 ${variant === 'dark' ? 'bg-white/10' : 'bg-gray-200/60'} mx-1 shrink-0`} />;

const RichTextToolbar: React.FC<RichTextToolbarProps> = ({ 
    editor, 
    openLinkModal,
    isFormattingOpen,
    setIsFormattingOpen,
    variant = 'light'
}) => {
    const [isColorOpen, setIsColorOpen] = useState(false);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const colorMenuRef = useRef<HTMLDivElement>(null);
    const colorBtnRef = useRef<HTMLButtonElement>(null);

    // Handle scroll for sticky shadow
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Click outside handler for Color Menu
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (colorMenuRef.current && !colorMenuRef.current.contains(event.target as Node) && 
                colorBtnRef.current && !colorBtnRef.current.contains(event.target as Node)) {
                setIsColorOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const currentColor = editor.getAttributes('textStyle').color || '#000000';
    const currentFontFamily = editor.getAttributes('textStyle').fontFamily || '';
    const currentFontSize = editor.getAttributes('textStyle').fontSize || '';
    const currentFontWeight = editor.getAttributes('textStyle').fontWeight || '400';

    const canUndo = editor.can().undo();
    const canRedo = editor.can().redo();

    const FONT_SIZE_OPTIONS = [
        { label: 'Auto', value: '' },
        { label: '12 px', value: '12' },
        { label: '14 px', value: '14' },
        { label: '16 px', value: '16' },
        { label: '18 px', value: '18' },
        { label: '20 px', value: '20' },
        { label: '24 px', value: '24' },
        { label: '30 px', value: '30' },
        { label: '36 px', value: '36' },
        { label: '48 px', value: '48' },
    ];

    const TYPOGRAPHY_OPTIONS = [
        { label: 'Thin (300)', value: '300' },
        { label: 'Regular (400)', value: '400' },
        { label: 'Medium (500)', value: '500' },
        { label: 'Semi Bold (600)', value: '600' },
        { label: 'Bold (700)', value: '700' },
        { label: 'Extra Bold (800)', value: '800' },
        { label: 'Black (900)', value: '900' },
    ];

    const handleImageUrlInsert = (url: string) => {
        // Use a small delay to ensure the modal is closing and focus can be returned to editor
        setTimeout(() => {
            if (editor) {
                editor.chain().focus().insertContent({
                    type: 'resizableImage',
                    attrs: { src: url }
                }).run();
            }
        }, 50);
    };

    return (
        <div className={`
            flex items-center gap-1 p-2 border-b ${variant === 'dark' ? 'border-white/10 bg-[#1a1a1a]' : 'border-gray-100 bg-white/80'} backdrop-blur-md sticky top-0 z-20 flex-wrap rounded-t-[2rem] transition-shadow duration-300
            ${isScrolled ? 'shadow-[0_4px_20px_rgba(0,0,0,0.03)]' : ''}
        `}>
            
            {/* Image Insert Modal */}
            <ImageInsertModal 
                isOpen={isImageModalOpen}
                onClose={() => setIsImageModalOpen(false)}
                onUrlInsert={handleImageUrlInsert}
            />

            {/* 1. History */}
            <MenuButton 
                onClick={() => (editor.chain().focus() as any).undo().run()} 
                isActive={false} 
                disabled={!canUndo}
                icon={Undo} 
                title="Undo" 
                variant={variant}
            />
            <MenuButton 
                onClick={() => (editor.chain().focus() as any).redo().run()} 
                isActive={false} 
                disabled={!canRedo}
                icon={Redo} 
                title="Redo" 
                variant={variant}
            />
            
            <Divider variant={variant} />

            {/* 2. Headings */}
            <MenuButton 
                onClick={() => (editor.chain().focus() as any).toggleHeading({ level: 1 }).run()} 
                isActive={editor.isActive('heading', { level: 1 })} 
                icon={Heading1} 
                title="Heading 1" 
                variant={variant}
            />
            <MenuButton 
                onClick={() => (editor.chain().focus() as any).toggleHeading({ level: 2 }).run()} 
                isActive={editor.isActive('heading', { level: 2 })} 
                icon={Heading2} 
                title="Heading 2" 
                variant={variant}
            />
            <MenuButton 
                onClick={() => (editor.chain().focus() as any).toggleHeading({ level: 3 }).run()} 
                isActive={editor.isActive('heading', { level: 3 })} 
                icon={Heading3} 
                title="Heading 3" 
                variant={variant}
            />

            <Divider variant={variant} />
            
            {/* 3. Font Family, Size & Color */}
            <div className="flex items-center gap-1">
                <ToolbarDropdown 
                    value={currentFontFamily}
                    onChange={(val) => (editor.chain().focus() as any).setFontFamily(val).run()}
                    options={PRESET_FONTS.map(f => ({ label: f.label, value: f.value, preview: f.value }))}
                    icon={TypeIcon}
                    title="Font Family"
                    width="w-28"
                    placeholder="Font"
                    variant={variant}
                />

                <ToolbarDropdown 
                    value={currentFontSize}
                    onChange={(val) => (editor.chain().focus() as any).setFontSize(val).run()}
                    options={FONT_SIZE_OPTIONS}
                    icon={Baseline}
                    title="Font Size"
                    width="w-20"
                    placeholder="Size"
                    variant={variant}
                />

                <ToolbarDropdown 
                    value={currentFontWeight}
                    onChange={(val) => (editor.chain().focus() as any).setFontWeight(val).run()}
                    options={TYPOGRAPHY_OPTIONS}
                    icon={Settings2}
                    title="Font Weight"
                    width="w-24"
                    placeholder="Weight"
                    variant={variant}
                />
            </div>

            <div className="relative">
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    ref={colorBtnRef}
                    onClick={() => setIsColorOpen(!isColorOpen)}
                    className={`flex items-center gap-1.5 h-8 px-2.5 ${variant === 'dark' ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-gray-200 hover:bg-gray-50'} border rounded-lg shadow-sm transition-all active:scale-95`}
                    title="Text Color"
                    type="button"
                >
                    <div className="w-3.5 h-3.5 rounded-full border border-gray-200 shadow-sm" style={{ backgroundColor: currentColor }}></div>
                    <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform duration-300 ${isColorOpen ? 'rotate-180' : ''}`} />
                </motion.button>

                <AnimatePresence>
                    {isColorOpen && (
                        <motion.div 
                            ref={colorMenuRef}
                            initial={{ opacity: 0, y: 4, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 4, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className={`absolute top-full left-0 mt-2 p-3 ${variant === 'dark' ? 'bg-[#2a2a2a] border-white/10' : 'bg-white border-gray-100'} rounded-2xl shadow-2xl border grid grid-cols-5 gap-2 z-50 w-48 origin-top-left`}
                        >
                            {PRESET_COLORS.map(color => (
                                <button
                                    key={color}
                                    onClick={() => {
                                        (editor.chain().focus() as any).setColor(color).run();
                                        setIsColorOpen(false);
                                    }}
                                    className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center ${currentColor === color ? 'border-indigo-500 shadow-md scale-110' : 'border-transparent'}`}
                                    style={{ backgroundColor: color }}
                                    title={color}
                                    type="button"
                                >
                                    {currentColor === color && <Check className="w-3 h-3 text-white drop-shadow-md" />}
                                </button>
                            ))}
                            {/* Custom Color Picker Trigger */}
                            <div className="relative w-7 h-7 rounded-full overflow-hidden border-2 border-gray-200 hover:border-gray-400 cursor-pointer transition-colors">
                                <input
                                    type="color"
                                    onInput={(e) => (editor.chain().focus() as any).setColor((e.target as HTMLInputElement).value).run()}
                                    value={currentColor}
                                    className="absolute inset-0 w-[150%] h-[150%] -top-1 -left-1 cursor-pointer p-0 border-0"
                                    title="Custom Color"
                                />
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-gradient-to-br from-transparent to-black/10">
                                    <Plus className="w-3 h-3 text-gray-500 mix-blend-difference" />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <Divider variant={variant} />

            {/* 4. Formatting */}
            <MenuButton 
                onClick={() => (editor.chain().focus() as any).toggleBold().run()} 
                isActive={editor.isActive('bold')} 
                icon={Bold} 
                title="Bold" 
                variant={variant}
            />
            <MenuButton 
                onClick={() => (editor.chain().focus() as any).toggleItalic().run()} 
                isActive={editor.isActive('italic')} 
                icon={Italic} 
                title="Italic" 
                variant={variant}
            />
             <MenuButton 
                onClick={() => (editor.chain().focus() as any).toggleStrike().run()} 
                isActive={editor.isActive('strike')} 
                icon={Strikethrough} 
                title="Strikethrough" 
                variant={variant}
            />
            <MenuButton 
                onClick={openLinkModal} 
                isActive={editor.isActive('link')} 
                icon={LinkIcon} 
                title="Link" 
                variant={variant}
            />
            
            <MenuButton 
                onClick={() => setIsImageModalOpen(true)}
                isActive={false}
                icon={ImageIcon}
                title="Insert Image"
                variant={variant}
            />

            <MenuButton 
                onClick={() => (editor.chain().focus() as any).setDrawing().run()}
                isActive={editor.isActive('drawing')}
                icon={Palette}
                title="Add Drawing"
                variant={variant}
            />
            
            <Divider variant={variant} />
            
            {/* 5. Lists */}
            <MenuButton 
                onClick={() => (editor.chain().focus() as any).toggleBulletList().run()} 
                isActive={editor.isActive('bulletList')} 
                icon={List} 
                title="Bullet List" 
                variant={variant}
            />
            <MenuButton 
                onClick={() => (editor.chain().focus() as any).toggleOrderedList().run()} 
                isActive={editor.isActive('orderedList')} 
                icon={ListOrdered} 
                title="Ordered List" 
                variant={variant}
            />
            <MenuButton 
                onClick={() => (editor.chain().focus() as any).toggleBlockquote().run()} 
                isActive={editor.isActive('blockquote')} 
                icon={Quote} 
                title="Quote" 
                variant={variant}
            />

            <Divider variant={variant} />

            {/* 6. Advanced Formatting */}
            <div className="relative">
                <MenuButton 
                    onClick={() => setIsFormattingOpen(!isFormattingOpen)}
                    isActive={isFormattingOpen}
                    icon={AlignLeft}
                    title="Paragraph Formatting"
                    label="Format"
                    variant={variant}
                />
                <AnimatePresence>
                    {isFormattingOpen && (
                        <FormattingPanel 
                            editor={editor}
                            onClose={() => setIsFormattingOpen(false)}
                            variant={variant}
                        />
                    )}
                </AnimatePresence>
            </div>
            
        </div>
    );
};

export default RichTextToolbar;
