
import React, { useState, useMemo, Suspense, lazy } from 'react';
import { WikiArticle, User, MasterOption } from '../types';
import { useWiki } from '../hooks/useWiki';
import { useMasterData } from '../hooks/useMasterData';
import { FileText, Loader2, Sparkles, ChevronUp, ChevronDown, Book } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import InfoModal from './ui/InfoModal';
import WikiGuide from './wiki/WikiGuide';
import { useGlobalDialog } from '../context/GlobalDialogContext';
import { useToast } from '../context/ToastContext';
import { 
    DndContext, 
    DragOverlay, 
    PointerSensor, 
    useSensor, 
    useSensors, 
    DragEndEvent, 
    DragStartEvent,
    defaultDropAnimationSideEffects
} from '@dnd-kit/core';

// Import Sub-Components
import WikiSidebar from './wiki/WikiSidebar';
import WikiList from './wiki/WikiList';
import WikiReader from './wiki/WikiReader';
import WikiHandbook from './wiki/WikiHandbook';
import NexusHub from './nexus/NexusHub';

// Lazy Load Editor
const WikiEditor = lazy(() => import('./wiki/WikiEditor'));

interface WikiViewProps {
    currentUser: User;
}

export type WikiLayoutMode = 'STANDARD' | 'FOCUS' | 'ZEN';

const WikiView: React.FC<WikiViewProps> = ({ currentUser }) => {
    const { articles, addArticle, updateArticle, deleteArticle, toggleHelpful, fetchArticleDetail } = useWiki(currentUser);
    const { masterOptions } = useMasterData();
    const { showConfirm } = useGlobalDialog();
    const { showToast } = useToast();
    
    // UI State
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [viewingArticle, setViewingArticle] = useState<WikiArticle | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isInfoOpen, setIsInfoOpen] = useState(false);
    const [wikiMode, setWikiMode] = useState<'ARTICLES' | 'HANDBOOK' | 'NEXUS'>('ARTICLES');
    const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
    const [isFetchingDetail, setIsFetchingDetail] = useState(false);
    
    // DND State
    const [activeArticle, setActiveArticle] = useState<WikiArticle | null>(null);
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Require 8px movement to start dragging (prevents accidental drags on click)
            },
        })
    );

    // Responsive & Layout State
    const [layoutMode, setLayoutMode] = useState<WikiLayoutMode>('STANDARD');
    const [isMobileListVisible, setIsMobileListVisible] = useState(true);

    const isAdmin = currentUser.role === 'ADMIN';

    // --- Dynamic Categories ---
    const categories = useMemo(() => {
        const cats = masterOptions
            .filter(o => o.type === 'WIKI_CATEGORY' && o.isActive)
            .sort((a, b) => a.sortOrder - b.sortOrder);
            
        // Fallback if no master data
        if (cats.length === 0) {
            return [
                { id: 'gen', key: 'GENERAL', label: 'General', type: 'WIKI_CATEGORY', color: 'bg-gray-100 text-gray-600', sortOrder: 1, isActive: true },
                { id: 'rule', key: 'RULES', label: 'Rules & Policy', type: 'WIKI_CATEGORY', color: 'bg-red-50 text-red-600', sortOrder: 2, isActive: true },
                { id: 'tool', key: 'TOOLS', label: 'Tools', type: 'WIKI_CATEGORY', color: 'bg-blue-50 text-blue-600', sortOrder: 3, isActive: true },
            ] as MasterOption[];
        }
        return cats;
    }, [masterOptions]);

    // --- Filter Logic ---
    const filteredArticles = useMemo(() => {
        return articles.filter(a => {
            if (selectedCategory === 'ALL') return true;
            
            // Check if the article is in the selected category
            if (a.category === selectedCategory) return true;
            
            // Check if the selected category is a parent of the article's category
            const selectedCat = categories.find(c => c.key === selectedCategory);
            if (selectedCat) {
                // If the article's category has a parentKey that matches the selected category
                const articleCat = categories.find(c => c.key === a.category);
                if (articleCat && articleCat.parentKey === selectedCategory) {
                    return true;
                }
            }

            return false;
        }).filter(a => {
            const matchSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                a.content.toLowerCase().includes(searchQuery.toLowerCase());
            return matchSearch;
        }).sort((a, b) => (Number(b.isPinned) - Number(a.isPinned)));
    }, [articles, selectedCategory, searchQuery, categories]);

    // --- Actions ---
    const handleCreateStart = () => {
        setViewingArticle(null);
        setIsEditing(true);
        setIsMobileListVisible(false); 
    };

    const handleEditStart = async (article: WikiArticle) => {
        let fullArticle = article;
        if (article.isPartial) {
            setIsFetchingDetail(true);
            const fetched = await fetchArticleDetail(article.id);
            if (fetched) fullArticle = fetched;
            setIsFetchingDetail(false);
        }
        setViewingArticle(fullArticle);
        setIsEditing(true);
    };

    const handleOpenArticle = async (article: WikiArticle) => {
        let fullArticle = article;
        if (article.isPartial) {
            setIsFetchingDetail(true);
            const fetched = await fetchArticleDetail(article.id);
            if (fetched) fullArticle = fetched;
            setIsFetchingDetail(false);
        }
        setViewingArticle(fullArticle);
        setIsEditing(false);
        setIsMobileListVisible(false); 
        // Auto-collapse header when reading to maximize space
        setIsHeaderCollapsed(true);
        // Smart Auto-Focus: Collapse sidebar when reading
        setLayoutMode('FOCUS');
    };

    const handleBackToList = () => {
        // Only clear viewing article if we are not editing an existing one
        if (!isEditing) {
            setViewingArticle(null);
            // Expand header when going back to list
            setIsHeaderCollapsed(false);
            // Expand sidebar when going back to list
            setLayoutMode('STANDARD');
        }
        setIsEditing(false);
        setIsMobileListVisible(true);
    };

    const handleSave = async (formData: Partial<WikiArticle>) => {
        if (!formData.title?.trim()) {
            showToast('กรุณากรอกหัวข้อบทความครับ', 'error');
            return;
        }
        
        const payload: any = {
            ...formData,
            content: formData.content || '<p></p>',
            targetRoles: (formData.targetRoles && formData.targetRoles.length > 0) ? formData.targetRoles : ['ALL']
        };

        if (formData.id) {
            await updateArticle(formData.id, payload);
            // Update local view immediately for snappy feel
            if (viewingArticle && viewingArticle.id === formData.id) {
                setViewingArticle({ ...viewingArticle, ...payload } as WikiArticle);
            }
        } else {
            await addArticle({
                title: payload.title,
                content: payload.content,
                category: payload.category || (selectedCategory !== 'ALL' ? selectedCategory : categories[0]?.key || 'GENERAL'),
                targetRoles: payload.targetRoles,
                isPinned: payload.isPinned,
                coverImage: payload.coverImage
            });
            handleBackToList(); 
        }
        setIsEditing(false);
    };

    const handleDelete = async (id: string) => {
        const confirmed = await showConfirm('คุณต้องการลบบทความนี้ใช่หรือไม่?', 'ยืนยันการลบ');
        if (confirmed) {
            await deleteArticle(id);
            handleBackToList();
        }
    };

    const handleSetWikiMode = (mode: 'ARTICLES' | 'HANDBOOK' | 'NEXUS') => {
        setWikiMode(mode);
        if (mode === 'ARTICLES') {
            setIsMobileListVisible(true);
        } else {
            setIsMobileListVisible(false);
        }
    };

    // --- DND Handlers ---
    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const article = articles.find(a => a.id === active.id);
        if (article) {
            setActiveArticle(article);
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveArticle(null);

        if (over && active.id !== over.id) {
            const articleId = active.id as string;
            const newCategory = over.id as string;
            
            const article = articles.find(a => a.id === articleId);
            const category = categories.find(c => c.key === newCategory);

            if (article && category && article.category !== newCategory) {
                try {
                    await updateArticle(articleId, { category: newCategory });
                    showToast(`ย้าย "${article.title}" ไปยังหมวดหมู่ ${category.label} เรียบร้อยแล้ว`, 'success');
                } catch (error) {
                    showToast('เกิดข้อผิดพลาดในการย้ายหมวดหมู่', 'error');
                }
            }
        }
    };

    // --- Layout Controllers ---
    const cycleLayoutMode = () => {
        setLayoutMode(prev => {
            if (prev === 'STANDARD') return 'FOCUS';
            if (prev === 'FOCUS') return 'ZEN';
            return 'STANDARD';
        });
    };

    // Calculate visibility based on layout mode (Desktop only logic)
    const showSidebar = layoutMode === 'STANDARD';
    const showList = (layoutMode === 'STANDARD' || layoutMode === 'FOCUS') && wikiMode === 'ARTICLES';
    const showTabHeader = layoutMode !== 'ZEN' && !isHeaderCollapsed;

    return (
        // Main Container: Fixed height relative to viewport to enable independent scrolling
        <DndContext 
            sensors={sensors} 
            onDragStart={handleDragStart} 
            onDragEnd={handleDragEnd}
        >
            <div className="flex h-[calc(100vh-80px)] overflow-hidden bg-white/40 backdrop-blur-2xl rounded-[3rem] border border-white/60 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] relative ring-1 ring-white/50 font-sans isolate transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]">
                
                {/* Background Decoration - More 3D & Pastel */}
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-300 z-50 opacity-80"></div>
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-200/20 rounded-full blur-[100px] pointer-events-none animate-pulse"></div>
                <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-pink-200/20 rounded-full blur-[100px] pointer-events-none animate-pulse" style={{ animationDelay: '2s' }}></div>
                
                {/* 1. LEFT SIDEBAR (Categories Tree) */}
                <div className={`
                    ${showSidebar ? 'lg:w-72 opacity-100' : 'lg:w-0 opacity-0'} 
                    hidden lg:flex flex-col border-r border-white/40 bg-white/30 backdrop-blur-md transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] overflow-hidden
                `}>
                    <WikiSidebar 
                        categories={categories}
                        selectedCategory={selectedCategory}
                        onSelectCategory={setSelectedCategory}
                        isOpen={true} // Controlled by parent width
                        onClose={() => setLayoutMode('FOCUS')}
                        onOpenGuide={() => setIsInfoOpen(true)}
                    />
                </div>

                {/* 2. MIDDLE LIST (Articles) */}
                <div className={`
                    ${showList ? 'lg:w-96 opacity-100' : 'lg:w-0 opacity-0'}
                    border-r border-white/40 min-w-0 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]
                    ${isMobileListVisible ? 'flex w-full absolute inset-0 z-20 lg:static' : 'hidden lg:flex'}
                    flex-col bg-white/40 backdrop-blur-sm overflow-hidden
                `}>
                    <WikiList 
                        articles={filteredArticles}
                        categories={categories}
                        selectedCategory={selectedCategory}
                        onSelectCategory={setSelectedCategory}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        viewingArticleId={viewingArticle?.id}
                        onSelectArticle={handleOpenArticle}
                        onCreate={handleCreateStart}
                        isSidebarOpen={showSidebar}
                        onOpenSidebar={() => setLayoutMode('STANDARD')}
                        isMobileListVisible={isMobileListVisible}
                    />
                </div>

                {/* 3. RIGHT CONTENT (Reader / Editor / Handbook / NexusHub) */}
                <div className={`
                    flex-1 bg-white/60 backdrop-blur-md flex flex-col relative transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] z-10 overflow-hidden
                    ${!isMobileListVisible ? 'absolute inset-0 z-30' : 'hidden lg:flex'}
                `}>
                    {/* Tab Switch Header - Glassy & 3D */}
                    <AnimatePresence initial={false}>
                        {showTabHeader && (
                            <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className={`${wikiMode === 'NEXUS' ? 'p-2 pb-0' : 'p-4'} border-b border-white/40 bg-white/20 backdrop-blur-sm flex justify-center shrink-0 overflow-hidden relative group transition-all duration-500`}
                            >
                                <div className="flex bg-white/40 backdrop-blur-md p-1.5 rounded-[2rem] w-full max-w-md shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),0_8px_16px_-4px_rgba(0,0,0,0.05)] border border-white/60">
                                    <button 
                                        onClick={() => handleSetWikiMode('ARTICLES')}
                                        className={`flex-1 py-2.5 rounded-[1.5rem] text-xs font-bold transition-all duration-300 ${wikiMode === 'ARTICLES' ? 'bg-white shadow-[0_8px_32px_-8px_rgba(0,0,0,0.1)] text-indigo-600 scale-105' : 'text-slate-400 hover:text-slate-600 hover:bg-white/20'}`}
                                    >
                                        Articles
                                    </button>
                                    <button 
                                        onClick={() => handleSetWikiMode('HANDBOOK')}
                                        className={`flex-1 py-2.5 rounded-[1.5rem] text-xs font-bold transition-all duration-300 ${wikiMode === 'HANDBOOK' ? 'bg-white shadow-[0_8px_32px_-8px_rgba(0,0,0,0.1)] text-indigo-600 scale-105' : 'text-slate-400 hover:text-slate-600 hover:bg-white/20'}`}
                                    >
                                        Handbook
                                    </button>
                                    <button 
                                        onClick={() => handleSetWikiMode('NEXUS')}
                                        className={`flex-1 py-2.5 rounded-[1.5rem] text-xs font-bold transition-all duration-300 ${wikiMode === 'NEXUS' ? 'bg-white shadow-[0_8px_32px_-8px_rgba(0,0,0,0.1)] text-indigo-600 scale-105' : 'text-slate-400 hover:text-slate-600 hover:bg-white/20'}`}
                                    >
                                        Nexus Hub
                                    </button>
                                </div>

                                {/* Collapse Toggle Button */}
                                <button 
                                    onClick={() => setIsHeaderCollapsed(true)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-indigo-400 hover:bg-white/40 rounded-full transition-all opacity-0 group-hover:opacity-100"
                                    title="Collapse Menu"
                                >
                                    <ChevronUp className="w-4 h-4" />
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Expand Handle (Visible when collapsed) */}
                    {isHeaderCollapsed && layoutMode !== 'ZEN' && (
                        <div className="h-1.5 w-full bg-white/10 hover:bg-indigo-400/30 cursor-pointer transition-all flex justify-center group z-50" onClick={() => setIsHeaderCollapsed(false)}>
                            <div className="w-12 h-1 bg-slate-200 rounded-full mt-0.5 group-hover:bg-indigo-400 transition-colors"></div>
                            <div className="absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <ChevronDown className="w-3 h-3 text-indigo-500 -mt-1" />
                            </div>
                        </div>
                    )}
                    {wikiMode === 'NEXUS' ? (
                        <div className="flex-1 overflow-y-auto scrollbar-hide [mask-image:linear-gradient(to_bottom,transparent,black_40px)]">
                            <NexusHub currentUser={currentUser} onNavigateMode={handleSetWikiMode} />
                        </div>
                    ) : wikiMode === 'HANDBOOK' ? (
                        <WikiHandbook currentUser={currentUser} />
                    ) : isFetchingDetail ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-indigo-300">
                             <Loader2 className="w-12 h-12 animate-spin mb-4" />
                             <p className="font-bold text-sm animate-pulse">กำลังโหลดเนื้อหา...</p>
                        </div>
                    ) : isEditing ? (
                        <Suspense fallback={
                            <div className="flex-1 flex flex-col items-center justify-center text-indigo-300">
                                <Loader2 className="w-12 h-12 animate-spin mb-4" />
                                <p className="font-bold text-sm animate-pulse">กำลังโหลดเครื่องมือเขียน...</p>
                            </div>
                        }>
                            <WikiEditor 
                                initialData={viewingArticle || { category: selectedCategory === 'ALL' ? (categories[0]?.key || 'GENERAL') : selectedCategory }}
                                categories={categories}
                                onSave={handleSave}
                                onCancel={() => {
                                    setIsEditing(false);
                                    if (!viewingArticle) handleBackToList();
                                }}
                            />
                        </Suspense>
                    ) : viewingArticle ? (
                        <WikiReader 
                            article={viewingArticle}
                            category={categories.find(c => c.key === viewingArticle.category)}
                            isAdmin={isAdmin}
                            onBack={handleBackToList}
                            onEdit={handleEditStart}
                            onDelete={handleDelete}
                            onToggleHelpful={toggleHelpful}
                            layoutMode={layoutMode}
                            onCycleLayout={cycleLayoutMode}
                            setLayoutMode={setLayoutMode}
                        />
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-300 bg-slate-50/30 relative overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_40px)]">
                             {/* Playful Empty State Decor */}
                             <div className="absolute w-[500px] h-[500px] bg-indigo-50/50 rounded-full blur-3xl -top-20 -right-20 pointer-events-none animate-pulse"></div>
                             <div className="absolute w-[400px] h-[400px] bg-pink-50/50 rounded-full blur-3xl bottom-0 left-0 pointer-events-none animate-pulse" style={{ animationDelay: '1s' }}></div>

                            <div className="relative z-10 text-center animate-in zoom-in-95 duration-500 hover:scale-105 transition-transform px-6">
                                <div className="w-32 h-32 bg-white/80 backdrop-blur-md rounded-[2.5rem] shadow-[0_20px_40px_-12px_rgba(0,0,0,0.1)] flex items-center justify-center mb-6 mx-auto transform -rotate-6 ring-8 ring-white/50 border border-white/60">
                                    <span className="text-6xl">📖</span>
                                </div>
                                <h3 className="text-3xl font-bold text-slate-700 mb-2 tracking-tight">Wiki Knowledge Base</h3>
                                <p className="text-slate-500 font-medium max-w-sm mx-auto mb-8 leading-relaxed">
                                    คลังความรู้ประจำทีม เลือกหัวข้อจากด้านซ้าย <br/> เพื่อเริ่มอ่านหรือค้นหาข้อมูล
                                </p>
                                
                                <button 
                                    onClick={handleCreateStart}
                                    className="px-8 py-4 bg-gradient-to-r from-indigo-400 to-purple-400 text-white font-bold rounded-2xl shadow-[0_20px_40px_-12px_rgba(99,102,241,0.4)] hover:shadow-[0_25px_50px_-12px_rgba(99,102,241,0.5)] hover:-translate-y-1.5 transition-all active:scale-95 flex items-center mx-auto gap-3 group"
                                >
                                    <Sparkles className="w-5 h-5 text-yellow-200 fill-yellow-200 group-hover:rotate-12 transition-transform" /> 
                                    เขียนบทความใหม่
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* INFO MODAL */}
                <InfoModal 
                    isOpen={isInfoOpen}
                    onClose={() => setIsInfoOpen(false)}
                    title="คู่มือ Wiki Library"
                >
                    <WikiGuide />
                </InfoModal>

                {/* Drag Overlay */}
                <DragOverlay dropAnimation={{
                    sideEffects: defaultDropAnimationSideEffects({
                        styles: {
                            active: {
                                opacity: '0.5',
                            },
                        },
                    }),
                }}>
                    {activeArticle ? (
                        <div className="p-4 bg-white rounded-2xl border-2 border-indigo-500 shadow-2xl w-72 rotate-3 opacity-90 pointer-events-none">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
                                    <Book className="w-5 h-5" />
                                </div>
                                <span className="text-sm font-bold text-slate-800 truncate">{activeArticle.title}</span>
                            </div>
                        </div>
                    ) : null}
                </DragOverlay>
            </div>
        </DndContext>
    );
};

export default WikiView;
