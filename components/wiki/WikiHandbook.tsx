
import React, { useState, useMemo } from 'react';
import { User, WikiNode, WikiNodeType } from '../../types';
import { useWikiNodes } from '../../hooks/useWikiNodes';
import { 
    Folder, 
    FileText, 
    ChevronRight, 
    Plus, 
    ArrowLeft, 
    Edit3, 
    Trash2, 
    Search,
    LayoutGrid,
    List,
    Briefcase,
    Users,
    Video,
    Camera,
    PenTool,
    Settings,
    Sparkles,
    Zap,
    BookOpen,
    Info,
    Trophy,
    Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGlobalDialog } from '../../context/GlobalDialogContext';
import WikiNodeEditor from './WikiNodeEditor';
import WikiNodeReader from './WikiNodeReader';

interface WikiHandbookProps {
    currentUser: User;
}

const WikiHandbook: React.FC<WikiHandbookProps> = ({ currentUser }) => {
    const { nodes, isLoading, addNode, updateNode, deleteNode, generateWikiContentWithAI } = useWikiNodes(currentUser);
    const { showConfirm } = useGlobalDialog();

    const [currentParentId, setCurrentParentId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [isReaderOpen, setIsReaderOpen] = useState(false);
    const [editingNode, setEditingNode] = useState<WikiNode | null>(null);
    const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');

    const isAdmin = currentUser.role === 'ADMIN';

    // --- Navigation Logic ---
    const currentNode = useMemo(() => nodes.find(n => n.id === currentParentId), [nodes, currentParentId]);
    
    const breadcrumbs = useMemo(() => {
        const path: WikiNode[] = [];
        let curr = currentNode;
        while (curr) {
            path.unshift(curr);
            curr = nodes.find(n => n.id === curr?.parentId);
        }
        return path;
    }, [nodes, currentNode]);

    const filteredNodes = useMemo(() => {
        return nodes.filter(n => {
            const matchParent = n.parentId === currentParentId;
            const matchSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                n.description?.toLowerCase().includes(searchQuery.toLowerCase());
            
            if (searchQuery) return matchSearch;
            return matchParent;
        }).sort((a, b) => a.sortOrder - b.sortOrder);
    }, [nodes, currentParentId, searchQuery]);

    // --- Smart Stats ---
    const stats = useMemo(() => {
        const totalNodes = nodes.length;
        const folders = nodes.filter(n => n.type === 'FOLDER').length;
        const pages = nodes.filter(n => n.type === 'PAGE').length;
        const recentlyUpdated = nodes.filter(n => {
            const updatedDate = new Date(n.updatedAt);
            const now = new Date();
            const diffDays = Math.ceil(Math.abs(now.getTime() - updatedDate.getTime()) / (1000 * 60 * 60 * 24));
            return diffDays <= 7;
        }).length;

        return { totalNodes, folders, pages, recentlyUpdated };
    }, [nodes]);

    // --- Handlers ---
    const handleNodeClick = (node: WikiNode) => {
        if (node.type === 'FOLDER') {
            setCurrentParentId(node.id);
            setSearchQuery('');
        } else {
            setEditingNode(node);
            setIsReaderOpen(true);
        }
    };

    const handleBack = () => {
        if (currentNode) {
            setCurrentParentId(currentNode.parentId);
        }
    };

    const handleCreate = (type: WikiNodeType) => {
        setEditingNode({
            parentId: currentParentId,
            type
        } as any);
        setIsEditorOpen(true);
    };

    const handleDelete = async (e: React.MouseEvent, node: WikiNode) => {
        e.stopPropagation();
        const confirmed = await showConfirm(
            `คุณต้องการลบ "${node.title}" ใช่หรือไม่? ${node.type === 'FOLDER' ? 'หัวข้อย่อยทั้งหมดจะถูกลบไปด้วย' : ''}`,
            'ยืนยันการลบ'
        );
        if (confirmed) {
            deleteNode(node.id);
        }
    };

    const handleEdit = (e: React.MouseEvent, node: WikiNode) => {
        e.stopPropagation();
        setEditingNode(node);
        setIsEditorOpen(true);
        setIsReaderOpen(false);
    };

    const handleEditFromReader = () => {
        setIsReaderOpen(false);
        setIsEditorOpen(true);
    };

    const getIcon = (iconName: string | undefined, type: WikiNodeType) => {
        if (!iconName) return type === 'FOLDER' ? <Folder className="w-6 h-6" /> : <FileText className="w-6 h-6" />;
        
        switch (iconName) {
            case 'Briefcase': return <Briefcase className="w-6 h-6" />;
            case 'Users': return <Users className="w-6 h-6" />;
            case 'Video': return <Video className="w-6 h-6" />;
            case 'Camera': return <Camera className="w-6 h-6" />;
            case 'PenTool': return <PenTool className="w-6 h-6" />;
            case 'Settings': return <Settings className="w-6 h-6" />;
            default: return <span className="text-xl">{iconName}</span>;
        }
    };

    const getNodeColor = (index: number, type: WikiNodeType) => {
        const folderColors = [
            'from-indigo-500 to-purple-600 shadow-indigo-100',
            'from-blue-500 to-cyan-600 shadow-blue-100',
            'from-violet-500 to-fuchsia-600 shadow-violet-100',
            'from-emerald-500 to-teal-600 shadow-emerald-100'
        ];
        const pageColors = [
            'from-pink-500 to-rose-600 shadow-pink-100',
            'from-amber-500 to-orange-600 shadow-amber-100',
            'from-sky-500 to-indigo-600 shadow-sky-100',
            'from-lime-500 to-emerald-600 shadow-lime-100'
        ];

        return type === 'FOLDER' 
            ? folderColors[index % folderColors.length] 
            : pageColors[index % pageColors.length];
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-transparent overflow-hidden relative isolate">
            <AnimatePresence mode="wait">
                {isLoading ? (
                    <motion.div 
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex-1 flex flex-col items-center justify-center bg-white/20 backdrop-blur-md"
                    >
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-indigo-500/10 border-t-indigo-400 rounded-full animate-spin shadow-[0_0_20px_rgba(99,102,241,0.2)]"></div>
                            <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-indigo-400 animate-pulse" />
                        </div>
                        <p className="mt-6 text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] opacity-70">Initializing Command Center...</p>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="content"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex-1 flex flex-col overflow-hidden"
                    >
                        {/* Background Glows */}
                        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-200/20 rounded-full blur-[100px] -z-10 animate-pulse"></div>
                        <div className="absolute top-1/2 -left-24 w-72 h-72 bg-purple-200/10 rounded-full blur-[80px] -z-10"></div>

                        {/* --- TOP COMMAND BAR --- */}
                        <div className="bg-white/40 backdrop-blur-xl border-b border-white/40 px-8 py-6 flex flex-col gap-6 shrink-0 z-20 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.05)]">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-5">
                                    <motion.div 
                                        whileHover={{ rotate: 15, scale: 1.1 }}
                                        className="w-14 h-14 bg-gradient-to-br from-indigo-400 to-purple-500 text-white rounded-[1.5rem] flex items-center justify-center shadow-[0_12px_24px_-8px_rgba(99,102,241,0.3)] border border-white/40 relative group"
                                    >
                                        <Sparkles className="w-7 h-7 group-hover:animate-spin-slow" />
                                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-300 rounded-full border-2 border-white animate-bounce shadow-sm"></div>
                                    </motion.div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                                            Wiki Handbook <span className="text-indigo-400 opacity-70">2.0</span>
                                        </h2>
                                        <div className="flex items-center gap-3 mt-1.5">
                                            <span className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider bg-white/60 px-2.5 py-1 rounded-full border border-white/60 shadow-sm">
                                                <Zap className="w-3 h-3 text-yellow-400 fill-yellow-400" /> Smart Command Center
                                            </span>
                                            <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                                            <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider">
                                                {currentNode ? currentNode.title : 'Main Directory'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    {/* Search Bar */}
                                    <div className="relative group hidden md:block">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-400 transition-colors" />
                                        <input 
                                            type="text"
                                            placeholder="Search everything..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-72 pl-11 pr-4 py-3 bg-white/40 backdrop-blur-md border border-white/60 focus:bg-white focus:border-indigo-100 rounded-2xl text-sm font-bold focus:outline-none transition-all shadow-inner placeholder:font-normal"
                                        />
                                    </div>

                                    {/* View Toggles */}
                                    <div className="flex bg-white/40 backdrop-blur-md p-1 rounded-2xl border border-white/60 shadow-inner">
                                        <button 
                                            onClick={() => setViewMode('GRID')}
                                            className={`p-2.5 rounded-xl transition-all duration-300 ${viewMode === 'GRID' ? 'bg-white shadow-[0_4px_12px_-2px_rgba(0,0,0,0.1)] text-indigo-500 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
                                        >
                                            <LayoutGrid className="w-5 h-5" />
                                        </button>
                                        <button 
                                            onClick={() => setViewMode('LIST')}
                                            className={`p-2.5 rounded-xl transition-all duration-300 ${viewMode === 'LIST' ? 'bg-white shadow-[0_4px_12px_-2px_rgba(0,0,0,0.1)] text-indigo-500 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
                                        >
                                            <List className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {isAdmin && (
                                        <div className="flex gap-3">
                                            <motion.button 
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => handleCreate('FOLDER')}
                                                className="flex items-center gap-2.5 px-5 py-3 bg-white/60 backdrop-blur-md border border-white/80 text-slate-600 font-bold text-xs rounded-2xl hover:bg-white hover:border-indigo-100 hover:text-indigo-500 transition-all shadow-sm"
                                            >
                                                <Folder className="w-4 h-4" /> Folder
                                            </motion.button>
                                            <motion.button 
                                                whileHover={{ scale: 1.05, y: -2 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => handleCreate('PAGE')}
                                                className="flex items-center gap-2.5 px-6 py-3 bg-gradient-to-r from-indigo-400 to-purple-500 text-white font-bold text-xs rounded-2xl hover:shadow-[0_16px_32px_-8px_rgba(99,102,241,0.4)] transition-all shadow-[0_12px_24px_-8px_rgba(99,102,241,0.3)] border border-white/20"
                                            >
                                                <Plus className="w-4 h-4 stroke-[3px]" /> Add Page
                                            </motion.button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Breadcrumbs & Quick Stats */}
                            <div className="flex items-center justify-between gap-6 border-t border-white/40 pt-4">
                                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                                    <button 
                                        onClick={() => setCurrentParentId(null)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${!currentParentId ? 'bg-indigo-50/80 text-indigo-500 border-indigo-100 shadow-sm' : 'bg-white/40 border-white/60 text-slate-400 hover:bg-white/60 hover:text-slate-600'}`}
                                    >
                                        <BookOpen className="w-3.5 h-3.5" /> Handbook
                                    </button>
                                    {breadcrumbs.map((node, idx) => (
                                        <React.Fragment key={node.id}>
                                            <ChevronRight className="w-3 h-3 text-slate-300 shrink-0 opacity-50" />
                                            <button 
                                                onClick={() => setCurrentParentId(node.id)}
                                                className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border whitespace-nowrap ${idx === breadcrumbs.length - 1 ? 'bg-indigo-50/80 text-indigo-500 border-indigo-100 shadow-sm' : 'bg-white/40 border-white/60 text-slate-400 hover:bg-white/60 hover:text-slate-600'}`}
                                            >
                                                {node.title}
                                            </button>
                                        </React.Fragment>
                                    ))}
                                </div>

                                <div className="flex items-center gap-8">
                                    <div className="flex items-center gap-6">
                                        <div className="flex flex-col items-end">
                                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-0.5 opacity-70">Total Guides</span>
                                            <span className="text-sm font-bold text-slate-700">{stats.pages}</span>
                                        </div>
                                        <div className="w-px h-6 bg-white/40"></div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-0.5 opacity-70">Updated Weekly</span>
                                            <span className="text-sm font-bold text-indigo-400">+{stats.recentlyUpdated}</span>
                                        </div>
                                    </div>
                                    <div className="hidden lg:flex items-center gap-2.5 bg-emerald-50/60 backdrop-blur-sm px-4 py-2 rounded-xl border border-emerald-100 shadow-sm">
                                        <Trophy className="w-4 h-4 text-emerald-400" />
                                        <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">Efficiency: 98%</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* --- MAIN CONTENT AREA --- */}
                        <div className="flex-1 overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-slate-200/50 [mask-image:linear-gradient(to_bottom,transparent,black_40px)]">
                            <div className="max-w-full mx-auto px-4">
                                {currentParentId && !searchQuery && (
                                    <button 
                                        onClick={handleBack}
                                        className="flex items-center gap-3 text-slate-400 hover:text-indigo-500 font-bold text-[10px] uppercase tracking-wider mb-10 transition-all group bg-white/60 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-white/60 shadow-sm w-fit active:scale-95"
                                    >
                                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
                                        <span>Back to {breadcrumbs[breadcrumbs.length - 2]?.title || 'Main Directory'}</span>
                                    </button>
                                )}

                                {filteredNodes.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-300 py-40">
                                        <motion.div 
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className="w-36 h-36 bg-white/60 backdrop-blur-md rounded-[3rem] shadow-xl flex items-center justify-center mb-8 border border-white/80 relative rotate-3"
                                        >
                                            <Folder className="w-16 h-16 opacity-10 text-indigo-500" />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <Search className="w-10 h-10 text-slate-200 animate-pulse" />
                                            </div>
                                            <div className="absolute -top-2 -right-2 w-10 h-10 bg-pink-300 rounded-full border-4 border-white shadow-md animate-bounce"></div>
                                        </motion.div>
                                        <h4 className="font-bold text-slate-800 text-xl tracking-tight">ไม่พบข้อมูลที่คุณต้องการ</h4>
                                        <p className="text-slate-400 font-bold text-xs mt-2 opacity-70">ลองเปลี่ยนคำค้นหา หรือสร้างหัวข้อใหม่ได้เลย ✨</p>
                                        {isAdmin && (
                                            <button 
                                                onClick={() => handleCreate('FOLDER')}
                                                className="mt-8 px-8 py-3.5 bg-indigo-50/80 text-indigo-600 font-bold text-xs rounded-2xl hover:bg-indigo-100 transition-all border border-indigo-100 shadow-sm active:scale-95"
                                            >
                                                + เริ่มต้นสร้างหัวข้อใหม่
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div className={viewMode === 'GRID' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-8" : "flex flex-col gap-4"}>
                                        <AnimatePresence mode="wait">
                                            {filteredNodes.map((node, index) => (
                                                <motion.div
                                                    key={node.id}
                                                    layout
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.9 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    onClick={() => handleNodeClick(node)}
                                                    className={`
                                                        group relative cursor-pointer transition-all duration-500 isolate
                                                        ${viewMode === 'GRID' 
                                                            ? 'bg-white/60 backdrop-blur-md p-8 rounded-[3rem] border border-white/60 shadow-sm hover:shadow-[0_32px_64px_-16px_rgba(99,102,241,0.15)] hover:bg-white hover:border-indigo-100 hover:-translate-y-3' 
                                                            : 'bg-white/60 backdrop-blur-md px-8 py-5 rounded-[2rem] border border-white/60 flex items-center gap-6 hover:bg-white hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.08)] hover:border-indigo-100 hover:translate-x-2'}
                                                    `}
                                                >
                                                    {/* Colorful Icon Container */}
                                                    <div className={`
                                                        shrink-0 flex items-center justify-center rounded-[2rem] transition-all duration-700 shadow-lg border border-white/40
                                                        ${viewMode === 'GRID' ? 'w-20 h-20 mb-8 group-hover:scale-110 group-hover:rotate-12' : 'w-14 h-14'}
                                                        bg-gradient-to-br ${getNodeColor(index, node.type)} text-white
                                                    `}>
                                                        {getIcon(node.icon, node.type)}
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <h4 className={`font-bold text-slate-800 truncate tracking-tight transition-colors group-hover:text-indigo-600 ${viewMode === 'GRID' ? 'text-xl' : 'text-lg'}`}>
                                                                {node.title}
                                                            </h4>
                                                            {node.type === 'FOLDER' && (
                                                                <span className="bg-white/80 backdrop-blur-sm text-slate-400 text-[8px] font-bold px-2 py-0.5 rounded-lg uppercase tracking-wider border border-white/60 shadow-sm">Folder</span>
                                                            )}
                                                        </div>
                                                        {node.description && (
                                                            <p className={`text-slate-400 font-bold leading-relaxed line-clamp-2 opacity-80 ${viewMode === 'GRID' ? 'text-xs' : 'text-[11px]'}`}>
                                                                {node.description}
                                                            </p>
                                                        )}
                                                    </div>

                                                    {isAdmin && (
                                                        <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                                                            <button 
                                                                onClick={(e) => handleEdit(e, node)}
                                                                className="p-2.5 bg-white/80 backdrop-blur-md border border-white/60 text-slate-400 hover:text-indigo-500 rounded-xl shadow-lg hover:scale-110 transition-all active:scale-90"
                                                            >
                                                                <Edit3 className="w-4 h-4" />
                                                            </button>
                                                            <button 
                                                                onClick={(e) => handleDelete(e, node)}
                                                                className="p-2.5 bg-white/80 backdrop-blur-md border border-white/60 text-slate-400 hover:text-red-500 rounded-xl shadow-lg hover:scale-110 transition-all active:scale-90"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    )}

                                                    {node.type === 'FOLDER' && viewMode === 'GRID' && (
                                                        <div className="absolute bottom-8 right-8 text-slate-200 group-hover:text-indigo-300 transition-all group-hover:translate-x-2">
                                                            <ChevronRight className="w-8 h-8" />
                                                        </div>
                                                    )}

                                                    {/* Hover Glow Effect */}
                                                    <div className="absolute inset-0 rounded-[3rem] bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none -z-10"></div>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Editor Modal */}
            <WikiNodeEditor 
                isOpen={isEditorOpen}
                onClose={() => setIsEditorOpen(false)}
                node={editingNode}
                onGenerateAI={generateWikiContentWithAI}
                onSave={async (data) => {
                    if (editingNode?.id) {
                        await updateNode(editingNode.id, data);
                    } else {
                        await addNode(data as any);
                    }
                    setIsEditorOpen(false);
                }}
            />

            {/* Reader Modal */}
            <WikiNodeReader 
                isOpen={isReaderOpen}
                onClose={() => setIsReaderOpen(false)}
                node={editingNode}
                isAdmin={isAdmin}
                onEdit={handleEditFromReader}
            />
        </div>
    );
};

export default WikiHandbook;
