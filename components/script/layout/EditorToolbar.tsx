import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    User as UserIcon, Users, MessageSquarePlus, Maximize2, Zap, ZapOff, 
    Minimize2, ChevronRight, MoreHorizontal, Globe, Share2, Loader2
} from 'lucide-react';
import { useScriptContext } from '../core/ScriptContext';
import CharacterManager from '../tools/config/CharacterManager';
import ScriptMetadataModal from '../tools/ScriptMetadataModal';
import { useToast } from '../../../context/ToastContext';
import { useGlobalDialog } from '../../../context/GlobalDialogContext';
import { handlePrintScript } from '../core/printUtils';

// Refactored Sub-components & Custom Hooks
import { GoogleDocsIcon } from './toolbar/components/GoogleDocsIcon';
import { StatusDropdown } from './toolbar/components/StatusDropdown';
import { ZoomDropdown } from './toolbar/components/ZoomDropdown';
import { useToolbarShortcuts } from './toolbar/useToolbarShortcuts';
import { ShareModal } from './toolbar/modals/ShareModal';
import { GoogleDocsModals } from './toolbar/modals/GoogleDocsModals';

// Newly extracted modules
import { DocumentMetaSection } from './toolbar/components/DocumentMetaSection';
import { CollapsibleToolsArea } from './toolbar/components/CollapsibleToolsArea';
import { useGoogleDocsIntegration } from './toolbar/hooks/useGoogleDocsIntegration';
import { useScriptTiming } from './toolbar/hooks/useScriptTiming';

const EditorToolbar: React.FC = () => {
    const { 
        title, setTitle, content, status, changeStatus,
        scriptType, setScriptType,
        isSaving, lastSaved, handleSave,
        onClose,
        setIsAIOpen, setIsTeleprompterOpen,
        isChatPreviewOpen, setIsChatPreviewOpen,
        isFindReplaceOpen, setIsFindReplaceOpen,
        setIsMetadataOpen,
        users, ideaOwnerId,
        isPublic, shareToken, handleToggleShare,
        zoomLevel, setZoomLevel,
        contentId, onPromote, 
        isScriptOwner, 
        isCommentsOpen, setIsCommentsOpen, comments,
        isFocusMode, setIsFocusMode,
        isAutoCharacter, setIsAutoCharacter,
        category, tags, masterOptions
    } = useScriptContext();
    
    const { showToast } = useToast();

    // Menu States
    const [showTemplates, setShowTemplates] = useState(false);
    const [showStatusMenu, setShowStatusMenu] = useState(false);
    const [showConfig, setShowConfig] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [showZoomMenu, setShowZoomMenu] = useState(false);
    const [showMoreTools, setShowMoreTools] = useState(false);
    
    // Save Feedback State
    const [showSaveSuccess, setShowSaveSuccess] = useState(false);
    
    // Custom Hooks for extracted logic
    const {
        isConnectedToDoc,
        isCheckingDoc,
        showExportConfirm,
        setShowExportConfirm,
        isExporting,
        exportResult,
        showSuccessModal,
        setShowSuccessModal,
        handleConnectGoogle,
        handleExport
    } = useGoogleDocsIntegration();

    const { formattedDuration } = useScriptTiming(content);
    
    // Refs for Portal positioning
    const statusBtnRef = useRef<HTMLDivElement>(null);
    const zoomBtnRef = useRef<HTMLDivElement>(null);
    const templatesBtnRef = useRef<HTMLDivElement>(null);
    const toolsContainerRef = useRef<HTMLDivElement>(null);

    // Auto scroll more tools into view on mobile when expanded
    useEffect(() => {
        if (showMoreTools && toolsContainerRef.current) {
            setTimeout(() => {
                if (toolsContainerRef.current) {
                    toolsContainerRef.current.scrollTo({
                        left: toolsContainerRef.current.scrollWidth,
                        behavior: 'smooth'
                    });
                }
            }, 150);
        }
    }, [showMoreTools]);

    // Find Owner info
    const owner = users.find(u => u.id === ideaOwnerId);

    const handleManualSave = useCallback(async () => {
        if (isSaving) return;
        
        await handleSave(false);
        
        setShowSaveSuccess(true);
        setTimeout(() => setShowSaveSuccess(false), 2000);
    }, [isSaving, handleSave]);

    const handlePrint = useCallback(() => {
        handlePrintScript({
            title,
            content,
            scriptType: scriptType as 'MONOLOGUE' | 'DIALOGUE',
            ownerName: owner?.name,
            formattedDuration
        });
    }, [title, content, scriptType, owner, formattedDuration]);

    // Keyboard Shortcuts Hook
    useToolbarShortcuts({
        handleManualSave,
        isFindReplaceOpen,
        setIsFindReplaceOpen,
        setIsAIOpen,
        setIsTeleprompterOpen,
        isChatPreviewOpen,
        setIsChatPreviewOpen,
        setShowConfig,
        setIsMetadataOpen,
        isFocusMode,
        setIsFocusMode,
        handlePrint,
        setShowShareModal,
        isCommentsOpen,
        setIsCommentsOpen,
    });

    const magicLink = shareToken ? `${window.location.origin}/s/${shareToken}` : '';
    const isAnyMenuOpen = showStatusMenu || showTemplates || showZoomMenu;
    const openCommentCount = comments.filter(c => c.status === 'OPEN').length;

    // Helper for export action to bind the current script state
    const handleExportBound = () => handleExport(title, content);

    return (
        <>
            {isAnyMenuOpen && (
                <div 
                    className="fixed inset-0 z-[40]" 
                    onClick={() => { 
                        setShowStatusMenu(false); 
                        setShowTemplates(false); 
                        setShowZoomMenu(false); 
                    }}
                />
            )}

            {/* Main Toolbar - Responsive Layout */}
            {!isFocusMode && (
                <div className={`bg-white/80 backdrop-blur-md border-b border-indigo-50 px-4 py-3 flex flex-col xl:flex-row xl:items-center justify-between shrink-0 shadow-sm gap-3 xl:gap-6 relative transition-all ${isAnyMenuOpen ? 'z-50' : 'z-20'}`}>
                    
                    {/* Top Line: Back & Title & Meta */}
                    <DocumentMetaSection
                        onClose={onClose}
                        title={title}
                        setTitle={setTitle}
                        owner={owner}
                        isSaving={isSaving}
                        showSaveSuccess={showSaveSuccess}
                        handleManualSave={handleManualSave}
                        lastSaved={lastSaved}
                        formattedDuration={formattedDuration}
                        category={category}
                        masterOptions={masterOptions}
                        tags={tags}
                        setIsMetadataOpen={setIsMetadataOpen}
                        contentId={contentId}
                        isScriptOwner={isScriptOwner}
                        onPromote={onPromote}
                    />

                    {/* Bottom Line (Mobile) / Right Side (Desktop): Tools */}
                    <div ref={toolsContainerRef} className="flex items-center gap-2 shrink-0 overflow-x-auto xl:overflow-visible pb-1 xl:pb-0 scrollbar-hide w-full xl:w-auto -mx-4 px-4 xl:mx-0 xl:px-0">
                        
                        {/* Focus Mode Toggle */}
                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsFocusMode(true)}
                            className="p-2 bg-white border border-gray-200 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all shadow-sm shrink-0"
                            title="Focus Mode (เต็มจอ)"
                        >
                            <Maximize2 className="w-4 h-4" />
                        </motion.button>

                        {/* Auto Character Toggle */}
                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsAutoCharacter(!isAutoCharacter)}
                            className={`p-2 rounded-xl transition-all border shadow-sm shrink-0 ${isAutoCharacter ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-white text-gray-500 border-gray-200 hover:text-orange-600'}`}
                            title={isAutoCharacter ? "ปิด Auto Character" : "เปิด Auto Character (Enter เพื่อสลับตัวละคร)"}
                        >
                            {isAutoCharacter ? <Zap className="w-4 h-4 animate-pulse" /> : <ZapOff className="w-4 h-4" />}
                        </motion.button>

                        <div className="h-6 w-px bg-gray-200 mx-1 shrink-0"></div>

                        {/* Comments Toggle */}
                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsCommentsOpen(!isCommentsOpen)}
                            className={`relative p-2 rounded-xl transition-all border shadow-sm shrink-0 ${isCommentsOpen ? 'bg-yellow-50 text-yellow-600 border-yellow-200' : 'bg-white text-gray-500 border-gray-200 hover:text-yellow-600'}`}
                            title="Comments"
                        >
                            <MessageSquarePlus className="w-4 h-4" />
                            {openCommentCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full font-bold border border-white">
                                    {openCommentCount}
                                </span>
                            )}
                        </motion.button>

                        {/* Google Docs Button */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={isConnectedToDoc ? () => setShowExportConfirm(true) : handleConnectGoogle}
                            className={`
                                h-9 px-3 rounded-lg text-xs font-bold flex items-center gap-2 transition-all border shadow-sm shrink-0
                                ${isConnectedToDoc 
                                    ? 'bg-blue-50 text-[#1a73e8] border-blue-200 hover:bg-blue-100/70' 
                                    : 'bg-white text-gray-500 border-gray-200 hover:text-[#1a73e8] hover:border-blue-200 hover:bg-blue-50/30'
                                }
                            `}
                            title={isConnectedToDoc ? 'ส่งออกไฟล์สคริปต์นี้ไปยัง Google Docs' : 'เชื่อมต่อบัญชี Google เพื่อใช้งานระบบส่งออกคลาวด์เอกสาร'}
                        >
                            {isCheckingDoc ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1a73e8]" />
                            ) : (
                                <GoogleDocsIcon className="w-3.5 h-3.5 shrink-0" />
                            )}
                            <span className="hidden md:inline">
                                {isCheckingDoc 
                                    ? 'Checking...' 
                                    : isConnectedToDoc 
                                        ? 'Export to Google Doc' 
                                        : 'Connect Google Docs'
                                }
                            </span>
                            <span className="md:hidden">
                                {isCheckingDoc 
                                    ? '...' 
                                    : isConnectedToDoc 
                                        ? 'Export' 
                                        : 'Connect'
                                }
                            </span>
                        </motion.button>

                        {/* Share Button */}
                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowShareModal(true)}
                            className={`
                                h-9 px-3 rounded-lg text-xs font-bold flex items-center gap-2 transition-all border shadow-sm shrink-0
                                ${isPublic ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-white text-gray-500 border-gray-200 hover:text-indigo-600'}
                            `}
                        >
                            {isPublic ? <Globe className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                            {isPublic ? 'Public' : 'Share'}
                        </motion.button>

                        {/* Status Pill */}
                        <StatusDropdown 
                            status={status}
                            changeStatus={changeStatus}
                            showStatusMenu={showStatusMenu}
                            setShowStatusMenu={setShowStatusMenu}
                            statusBtnRef={statusBtnRef}
                        />

                        <div className="h-6 w-px bg-gray-200 mx-1 shrink-0"></div>

                        {/* Zoom Dropdown */}
                        <ZoomDropdown 
                            zoomLevel={zoomLevel} 
                            setZoomLevel={setZoomLevel} 
                            showZoomMenu={showZoomMenu} 
                            setShowZoomMenu={setShowZoomMenu} 
                            zoomBtnRef={zoomBtnRef}
                        />

                        <div className="h-6 w-px bg-gray-200 mx-1 shrink-0"></div>

                        {/* Mode Toggle */}
                        <div className="bg-gray-100 p-1 rounded-lg flex border border-gray-200 shrink-0 h-9 items-center">
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setScriptType('MONOLOGUE')} className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 text-[10px] font-bold ${scriptType === 'MONOLOGUE' ? 'bg-white shadow text-indigo-600 scale-105' : 'text-gray-400 hover:text-gray-600'}`} title="Monologue"><UserIcon className="w-3 h-3" /> Mono</motion.button>
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setScriptType('DIALOGUE')} className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 text-[10px] font-bold ${scriptType === 'DIALOGUE' ? 'bg-white shadow text-indigo-600 scale-105' : 'text-gray-400 hover:text-gray-600'}`} title="Dialogue"><Users className="w-3 h-3" /> Dial</motion.button>
                        </div>

                        <div className="h-6 w-px bg-gray-200 mx-1 shrink-0"></div>
                        
                        {/* Collapsible Tools Container */}
                        <AnimatePresence initial={false}>
                            {showMoreTools && (
                                <CollapsibleToolsArea
                                    scriptType={scriptType}
                                    isChatPreviewOpen={isChatPreviewOpen}
                                    setIsChatPreviewOpen={setIsChatPreviewOpen}
                                    isFindReplaceOpen={isFindReplaceOpen}
                                    setIsFindReplaceOpen={setIsFindReplaceOpen}
                                    showConfig={showConfig}
                                    setShowConfig={setShowConfig}
                                    setIsTeleprompterOpen={setIsTeleprompterOpen}
                                    showTemplates={showTemplates}
                                    setShowTemplates={setShowTemplates}
                                    templatesBtnRef={templatesBtnRef}
                                    handlePrint={handlePrint}
                                    setIsAIOpen={setIsAIOpen}
                                />
                            )}
                        </AnimatePresence>

                        {/* More Tools Toggle Button */}
                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowMoreTools(!showMoreTools)}
                            className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all border shadow-sm shrink-0 ${
                                showMoreTools 
                                    ? 'bg-indigo-100 border-indigo-300 text-indigo-700' 
                                    : 'bg-white border-gray-200 text-gray-500 hover:text-indigo-600 hover:border-indigo-200'
                            }`}
                            title={showMoreTools ? "ซ่อนเครื่องมือเพิ่มเติม" : "แสดงเครื่องมือเพิ่มเติม (Templates, Print, Prompter, etc.)"}
                        >
                            {showMoreTools ? (
                                <ChevronRight className="w-4 h-4" />
                            ) : (
                                <MoreHorizontal className="w-4 h-4" />
                            )}
                        </motion.button>
                    </div>
                </div>
            )}

            {/* Focus Mode Exit Button */}
            {isFocusMode && (
                <div className="fixed top-4 right-4 z-[60] flex items-center gap-2">
                    <div className={`p-2 rounded-xl border shadow-lg flex items-center gap-2 bg-white/80 backdrop-blur-md ${isAutoCharacter ? 'border-orange-200' : 'border-gray-200'}`}>
                        <button 
                            onClick={() => setIsAutoCharacter(!isAutoCharacter)}
                            className={`p-1.5 rounded-lg transition-all ${isAutoCharacter ? 'bg-orange-100 text-orange-600' : 'text-gray-400 hover:bg-gray-100'}`}
                            title="Auto Character"
                        >
                            {isAutoCharacter ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
                        </button>
                        <div className="w-px h-4 bg-gray-200"></div>
                        <button 
                            onClick={() => setIsFocusMode(false)}
                            className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-md"
                            title="ออกจาก Focus Mode"
                        >
                            <Minimize2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Config Modals */}
            {showConfig && <CharacterManager onClose={() => setShowConfig(false)} />}
            
            <ScriptMetadataModal />
            
            {/* Share Modal */}
            <ShareModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                isPublic={isPublic}
                handleToggleShare={handleToggleShare}
                magicLink={magicLink}
                showToast={showToast}
                isConnectedToDoc={isConnectedToDoc}
                setShowExportConfirm={setShowExportConfirm}
                handleConnectGoogle={handleConnectGoogle}
            />

            {/* Google Docs Modals Flow */}
            <GoogleDocsModals
                showExportConfirm={showExportConfirm}
                setShowExportConfirm={setShowExportConfirm}
                isExporting={isExporting}
                showSuccessModal={showSuccessModal}
                setShowSuccessModal={setShowSuccessModal}
                exportResult={exportResult}
                title={title}
                handleExport={handleExportBound}
            />
        </>
    );
};

export default EditorToolbar;
