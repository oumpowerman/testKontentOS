
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { User, Script, MasterOption, ScriptSummary, Task, LabSequenceItem } from '../../types';
import { useScripts } from '../../hooks/useScripts';
import { useChannels } from '../../hooks/useChannels';
import { useMasterData } from '../../hooks/useMasterData';
import ScriptHubHeader from './hub/ScriptHubHeader';
import ScriptFilterBar from './hub/ScriptFilterBar';
import ScriptList from './hub/ScriptList';
import CreateScriptModal from './hub/CreateScriptModal';
import ScriptEditor from './ScriptEditor';
import InfoModal from '../ui/InfoModal'; // Import
import ScriptGuide from './hub/ScriptGuide'; // Import
import ScriptCategoryFilter from './hub/ScriptCategoryFilter';
import ScriptStatsGrid from './hub/ScriptStatsGrid';
import ScriptModeSwitcher, { ScriptHubMode } from './hub/ScriptModeSwitcher';
import AppBackground from '../common/AppBackground';
import ScriptLabView from './lab/ScriptLabView';
import { Clapperboard, FileText, Edit3, CheckCircle2, Layers, ChevronRight, Loader2, ChevronLeft, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGlobalDialog } from '../../context/GlobalDialogContext'; // NEW IMPORT
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom'; // NEW
import ContentForm from '../task/ContentForm'; // IMPORT
import { createPortal } from 'react-dom'; // IMPORT
import { useScriptHubFilters } from './hub/useScriptHubFilters'; // NEW IMPORT
import { useScriptHubActions } from './hub/useScriptHubActions'; // NEW IMPORT

// --- Main Component ---

interface ScriptHubViewProps {
    currentUser: User;
    users: User[]; 
    initialMode?: ScriptHubMode;
}

const ScriptHubView: React.FC<ScriptHubViewProps> = ({ currentUser, users, initialMode = 'HUB' }) => {
    const navigate = useNavigate();

    // Hooks
    const mainScripts = useScripts(currentUser);
    const labScripts = useScripts(currentUser);
    
    // Destructure mainScripts for easier use in HUB/STUDIO
    const { 
        scripts, totalCount, isLoading, 
        fetchScripts, getScriptById,
        createScript, updateScript, deleteScript, toggleShootQueue, generateScriptWithAI,
        promoteToContent
    } = mainScripts;
    
    const { channels, fetchChannels } = useChannels();

    // Initial fetch for channels if empty
    useEffect(() => {
        if (channels.length === 0) {
            fetchChannels();
        }
    }, [fetchChannels, channels.length]);
    const { masterOptions } = useMasterData();
    const { showConfirm, showAlert } = useGlobalDialog(); // USE DIALOG

    // UI State / switcher
    const [mode, setMode] = useState<ScriptHubMode>(initialMode); 

    // Lab Mode State (Lifted to persist across mode switches)
    const [labSequence, setLabSequence] = useState<LabSequenceItem[]>([]);
    const [labTitle, setLabTitle] = useState(`Lab Mix - ${new Date().toLocaleDateString()}`);

    // Guard: Prevent LAB mode on mobile
    useEffect(() => {
        const isMobile = window.innerWidth < 768;
        if (isMobile && mode === 'LAB') {
            setMode('HUB');
        }
    }, [mode]);

    const pageSize = 20;

    // Use Custom Hook for Managing Filters, Pagination & Query Syncing
    const {
        searchParams,
        setSearchParams,
        originRef,
        viewTab,
        setViewTab,
        layoutMode,
        setLayoutMode,
        page,
        setPage,
        searchQuery,
        isDeepSearch,
        urlScriptId,
        filterOwner,
        setFilterOwner,
        filterStatus,
        setFilterStatus,
        filterChannel,
        setFilterChannel,
        filterCategory,
        setFilterCategory,
        filterTags,
        setFilterTags,
        sortOrder,
        setSortOrder,
        handleSetSearchQuery,
        handleSetDeepSearch
    } = useScriptHubFilters({
        fetchScripts,
        initialMode,
        mode,
        setMode,
        pageSize
    });

    // Use Custom Hook for managing all actions, modals, database status syncs
    const {
        activeScript,
        setActiveScript,
        isCreateModalOpen,
        setIsCreateModalOpen,
        isFetchingDetail,
        setIsFetchingDetail,
        isInfoOpen,
        setIsInfoOpen,
        refreshStatsKey,
        setRefreshStatsKey,
        isPromoteModalOpen,
        setIsPromoteModalOpen,
        promoteScriptData,
        handleCreateSubmit,
        handleOpenScript,
        handleToggleQueue,
        handleDeleteScript,
        handleDoneScript,
        handleRestoreScript,
        handleTogglePersonal,
        handlePromoteClick,
        handlePromoteSubmit
    } = useScriptHubActions({
        currentUser,
        scripts,
        mode,
        page,
        pageSize,
        searchQuery,
        viewTab,
        setViewTab,
        filterOwner,
        filterChannel,
        filterCategory,
        filterTags,
        filterStatus,
        sortOrder,
        isDeepSearch,
        createScript,
        updateScript,
        deleteScript,
        toggleShootQueue,
        promoteToContent,
        getScriptById,
        fetchScripts,
        showConfirm,
        showAlert
    });

    const totalPages = Math.ceil(totalCount / pageSize);

    // Effect: Handle scriptId from URL
    useEffect(() => {
        if (urlScriptId) {
            const loadScriptFromUrl = async () => {
                setIsFetchingDetail(true);
                const fullScript = await getScriptById(urlScriptId);
                setIsFetchingDetail(false);
                if (fullScript) {
                    setActiveScript(fullScript);
                    // Clear the scriptId and origin from URL to avoid re-opening on refresh
                    setSearchParams(prev => {
                        const newParams = new URLSearchParams(prev);
                        newParams.delete('scriptId');
                        newParams.delete('origin');
                        return newParams;
                    }, { replace: true });
                }
            };
            loadScriptFromUrl();
        }
    }, [urlScriptId, getScriptById, setSearchParams, setActiveScript, setIsFetchingDetail]);

    const scriptCategories = masterOptions.filter(o => o.type === 'SCRIPT_CATEGORY' && o.isActive).sort((a,b) => a.sortOrder - b.sortOrder);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
        }
    };

    // --- RENDER LOGIC WITH ANIMATIONS ---
    return (
        <AppBackground 
            theme={mode === 'STUDIO' ? 'pastel-indigo' : 'script'} 
            pattern="dots" 
        >
            <AnimatePresence mode="wait">
                {mode === 'LAB' ? (
                    <motion.div
                        key="lab-view"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100]"
                    >
                        <ScriptLabView 
                            currentUser={currentUser}
                            users={users}
                            channels={channels}
                            masterOptions={masterOptions}
                            onClose={() => setMode('HUB')}
                            scriptsApi={labScripts}
                            sequence={labSequence}
                            setSequence={setLabSequence}
                            labTitle={labTitle}
                            setLabTitle={setLabTitle}
                        />
                    </motion.div>
                ) : activeScript ? (
                    <>
                        <ScriptEditor 
                            key={activeScript.id} 
                            script={activeScript} 
                            users={users}
                            channels={channels}
                            masterOptions={masterOptions}
                            currentUser={currentUser}
                            initialSearchQuery={isDeepSearch ? searchQuery : undefined}
                            onClose={() => { 
                                if (originRef.current === 'SHOOT_QUEUE') {
                                    setActiveScript(null); 
                                    navigate('?view=ContentStock&stockMode=QUEUE', { replace: true });
                                    return;
                                }
                                setActiveScript(null); 
                                fetchScripts({ 
                                    page, pageSize, searchQuery, viewTab, filterOwner, filterChannel, 
                                    filterCategory, filterTags, filterStatus, sortOrder, isDeepSearch,
                                    isPersonal: mode === 'STUDIO'
                                }); 
                                setRefreshStatsKey(prev => prev + 1);
                            }} 
                            onSave={updateScript} 
                            onGenerateAI={generateScriptWithAI}
                            onPromote={handlePromoteClick}
                        />

                        {isPromoteModalOpen && promoteScriptData && createPortal(
                            <div className="fixed inset-0 z-[11000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                                <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 border-4 border-white ring-1 ring-gray-100">
                                    <div className="px-8 py-5 border-b border-gray-100 bg-gradient-to-r from-orange-500 to-amber-500 text-white flex justify-between items-center">
                                        <div>
                                            <h3 className="text-xl font-bold flex items-center gap-2">🚀 ส่งเข้าผลิต (Promote to Content)</h3>
                                            <p className="text-sm text-orange-100">แปลงสคริปต์เป็นงานจริงในระบบ</p>
                                        </div>
                                        <button onClick={() => setIsPromoteModalOpen(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors"><X className="w-6 h-6" /></button>
                                    </div>
                                    
                                    <div className="flex-1 overflow-hidden flex flex-col bg-slate-50">
                                        <ContentForm 
                                            initialData={null}
                                            sourceScript={promoteScriptData}
                                            channels={channels}
                                            users={users}
                                            masterOptions={masterOptions}
                                            currentUser={currentUser}
                                            onSave={handlePromoteSubmit}
                                            onClose={() => setIsPromoteModalOpen(false)}
                                        />
                                    </div>
                                </div>
                            </div>,
                            document.body
                        )}
                    </>
                ) : (
                    <motion.div
                        key="hub-view"
                        initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
                        transition={{ 
                            duration: 0.5, 
                            ease: [0.23, 1, 0.32, 1] 
                        }}
                    >
                        {isFetchingDetail && createPortal(
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 z-[10000] bg-white flex items-center justify-center"
                            >
                                <div className="flex flex-col items-center gap-6 p-8">
                                    <div className="relative">
                                        <motion.div 
                                            animate={{ 
                                                rotate: 360,
                                            }}
                                            transition={{ 
                                                duration: 2, 
                                                repeat: Infinity,
                                                ease: "linear"
                                            }}
                                            className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center border-2 border-indigo-100"
                                        >
                                            <Loader2 className="w-8 h-8 text-indigo-500" />
                                        </motion.div>
                                        <motion.div 
                                            animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
                                            transition={{ duration: 1.5, repeat: Infinity }}
                                            className="absolute -top-2 -right-2 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center shadow-lg"
                                        >
                                            <FileText className="w-3.5 h-3.5 text-white" />
                                        </motion.div>
                                    </div>
                                    <div className="text-center">
                                        <h3 className="text-lg font-black text-slate-800 mb-1">กำลังเตรียมเนื้อหาสคริปต์</h3>
                                        <p className="text-sm font-bold text-slate-400">กรุณารอสักครู่...</p>
                                    </div>
                                </div>
                            </motion.div>,
                            document.body
                        )}

                        <div className="max-w-[1600px] mx-auto p-6 md:p-8 pb-32 md:pb-16 space-y-8 animate-in fade-in duration-500">
                            
                            {/* 1. Header with Info Button */}
                            <ScriptHubHeader 
                                onCreateClick={() => setIsCreateModalOpen(true)} 
                                onInfoClick={() => setIsInfoOpen(true)} 
                                mode={mode}
                                onModeChange={setMode}
                            />

                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={mode}
                                    initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                    exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
                                    transition={{ 
                                        duration: 0.4, 
                                        ease: [0.23, 1, 0.32, 1] 
                                    }}
                                    className="space-y-8"
                                >
                                    {/* 2. Dashboard Stats Grid */}
                                    <ScriptStatsGrid 
                                        refreshTrigger={refreshStatsKey}
                                        filterOwner={filterOwner}
                                        filterChannel={filterChannel}
                                        filterCategory={filterCategory}
                                        filterTags={filterTags}
                                        searchQuery={searchQuery}
                                        viewTab={viewTab}
                                        filterStatus={filterStatus}
                                        isDeepSearch={isDeepSearch}
                                        isPersonal={mode === 'STUDIO'}
                                        currentUser={currentUser}
                                        onTabChange={(tab, status) => {
                                            setViewTab(tab);
                                            if (status) setFilterStatus([status]);
                                        }}
                                    />

                                    {/* 4. Filter Bar & List */}
                                    <div className="space-y-4">
                                        <ScriptFilterBar 
                                            layoutMode={layoutMode} setLayoutMode={setLayoutMode}
                                            searchQuery={searchQuery} 
                                            setSearchQuery={handleSetSearchQuery}
                                            filterOwner={filterOwner} setFilterOwner={setFilterOwner}
                                            filterChannel={filterChannel} setFilterChannel={setFilterChannel}
                                            filterCategory={filterCategory} setFilterCategory={setFilterCategory}
                                            filterTags={filterTags} setFilterTags={setFilterTags}
                                            filterStatus={filterStatus} setFilterStatus={setFilterStatus}
                                            sortOrder={sortOrder} setSortOrder={setSortOrder}
                                            isDeepSearch={isDeepSearch} 
                                            setIsDeepSearch={handleSetDeepSearch}
                                            users={users} channels={channels} masterOptions={masterOptions}
                                            mode={mode}
                                        />

                                        <ScriptList 
                                            scripts={scripts}
                                            layoutMode={layoutMode}
                                            viewTab={viewTab}
                                            isLoading={isLoading}
                                            channels={channels}
                                            masterOptions={masterOptions}
                                            mode={mode}
                                            currentUser={currentUser}
                                            onOpen={handleOpenScript}
                                            onToggleQueue={handleToggleQueue}
                                            onDelete={handleDeleteScript}
                                            onRestore={handleRestoreScript}
                                            onDone={handleDoneScript}
                                            onTogglePersonal={handleTogglePersonal}
                                        />

                                        {/* Pagination Controls */}
                                        {totalCount > 0 && (
                                            <div className="
                                            flex items-center justify-between pt-4
                                            p-4 rounded-3xl
                                            bg-white/70
                                            backdrop-blur-xl
                                            border border-white/40
                                            shadow-[0_20px_60px_rgba(0,0,0,0.18)]
                                            animate-breathe
                                            relative overflow-hidden
                                            ">
                                                <div className="absolute inset-0 pointer-events-none">
                                                    <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/40 to-transparent"/>
                                                    <div className="absolute -top-10 -left-10 w-[200%] h-[200%] opacity-30 blur-3xl animate-pastel"/>
                                                </div>

                                                <div className="text-xs text-gray-500 font-medium">
                                                    แสดง {((page - 1) * pageSize) + 1} ถึง {Math.min(page * pageSize, totalCount)} จาก {totalCount} รายการ
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button 
                                                        onClick={() => handlePageChange(page - 1)} 
                                                        disabled={page === 1}
                                                        className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                    >
                                                        <ChevronLeft className="w-4 h-4 text-gray-600" />
                                                    </button>
                                                    <span className="text-sm font-bold text-gray-700 px-2">
                                                        หน้า {page} / {totalPages}
                                                    </span>
                                                    <button 
                                                        onClick={() => handlePageChange(page + 1)} 
                                                        disabled={page === totalPages}
                                                        className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                    >
                                                        <ChevronRight className="w-4 h-4 text-gray-600" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        <CreateScriptModal 
                            isOpen={isCreateModalOpen}
                            onClose={() => setIsCreateModalOpen(false)}
                            onSubmit={handleCreateSubmit}
                            channels={channels}
                            masterOptions={masterOptions}
                            users={users}
                            currentUser={currentUser}
                            mode={mode}
                        />

                        {/* INFO MODAL */}
                        <InfoModal 
                            isOpen={isInfoOpen}
                            onClose={() => setIsInfoOpen(false)}
                            title="คู่มือ Script Hub"
                        >
                            <ScriptGuide />
                        </InfoModal>
                    </motion.div>
                )}
            </AnimatePresence>
        </AppBackground>
    );
};

export default ScriptHubView;
