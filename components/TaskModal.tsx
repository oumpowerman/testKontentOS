
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowLeft, Paperclip, MessageSquare, History, Film, CheckSquare, Book, Sparkles, Layout, Activity, Truck, FileText, ChevronRight, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task, Channel, TaskType, User, MasterOption, Script } from '../types';
import TaskComments from './TaskComments';
import TaskAssets from './TaskAssets';
import TaskHistory from './task/TaskHistory';
import TaskWiki from './task/TaskWiki';
import ContentForm from './task/ContentForm';
import TaskDetail from './task/TaskDetail';
import ContentDetail from './task/ContentDetail';
import GeneralTaskForm from './task/GeneralTaskForm';
import LogisticsTab from './task/LogisticsTab';
import ScriptEditor from './script/ScriptEditor'; // Import ScriptEditor
import { useScripts } from '../hooks/useScripts'; // Import Hook

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Task) => void;
  onUpdate?: (task: Task) => void; 
  onDelete?: (taskId: string) => void;
  initialData?: Task | null;
  selectedDate?: Date | null;
  channels: Channel[];
  users: User[];
  lockedType?: TaskType | null; 
  masterOptions?: MasterOption[];
  currentUser?: User; 
  projects?: Task[]; 
  onOpenTask?: (task: Task, currentViewMode?: string) => void;
  hasHistory?: boolean;
  initialViewMode?: string | null;
}

// --- 🎨 UI CONFIGURATION: Contextual Themes ---
const TAB_CONFIGS: Record<string, { color: string, icon: any, label: string }> = {
    DETAILS: { color: 'indigo', icon: Layout, label: 'รายละเอียด' },
    LOGISTICS: { color: 'cyan', icon: Truck, label: 'งานย่อย' },
    SCRIPT: { color: 'rose', icon: FileText, label: 'สคริปต์' },
    COMMENTS: { color: 'emerald', icon: MessageSquare, label: 'แชท' },
    ASSETS: { color: 'amber', icon: Paperclip, label: 'ไฟล์' },
    HISTORY: { color: 'slate', icon: History, label: 'ประวัติ' },
    WIKI: { color: 'sky', icon: Book, label: 'คู่มือ' },
};

const TaskModal: React.FC<TaskModalProps> = ({ 
    isOpen, onClose, onSave, onUpdate, onDelete, initialData, selectedDate, channels, users, lockedType, masterOptions = [], currentUser, projects = [], onOpenTask, hasHistory, initialViewMode 
}) => {
  // Main View State
  const [viewMode, setViewMode] = useState<'DETAILS' | 'COMMENTS' | 'ASSETS' | 'HISTORY' | 'WIKI' | 'LOGISTICS' | 'SCRIPT'>((initialViewMode as any) || 'DETAILS');
  const [mode, setMode] = useState<'VIEW' | 'EDIT'>('VIEW');
  const [isMobile, setIsMobile] = useState(false);
  const [isNavExpanded, setIsNavExpanded] = useState(false);
  
  // Mobile Detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Tab State (Content vs Task) - Synced with props
  const [activeTab, setActiveTab] = useState<TaskType>('CONTENT');

  // Script Data for General Task
  const { getScriptById, updateScript } = useScripts(currentUser || { id: '', name: '', role: 'MEMBER' } as User);
  const [taskScript, setTaskScript] = useState<Script | null>(null);

  // Sync state when modal opens or props change
  useEffect(() => {
      if (isOpen) {
          setViewMode((initialViewMode as any) || 'DETAILS');
          setIsNavExpanded(false); // Default to collapsed as requested
          if (initialData) {
              setActiveTab(initialData.type || 'CONTENT');
              setMode('VIEW');
          } else {
              setMode('EDIT');
              if (lockedType) {
                  setActiveTab(lockedType);
              } else {
                  setActiveTab('CONTENT');
              }
          }
      }
  }, [isOpen, initialData, lockedType, initialViewMode]);

  // Load Script if viewing script tab
  useEffect(() => {
      if (viewMode === 'SCRIPT' && initialData?.scriptId) {
          const loadScript = async () => {
              const script = await getScriptById(initialData.scriptId!);
              setTaskScript(script);
          };
          loadScript();
      }
  }, [viewMode, initialData?.scriptId]);

  const assetCount = initialData?.assets?.length || 0;
  const isContent = initialData?.type === 'CONTENT' || activeTab === 'CONTENT';
  const hasLinkedScript = initialData?.type === 'TASK' && !!initialData.scriptId;

  // --- Theme Logic ---
  const currentTheme = TAB_CONFIGS[viewMode] || TAB_CONFIGS.DETAILS;
  const themeColor = currentTheme.color;

  if (!isOpen) return null;
  
  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-indigo-950/60 backdrop-blur-md p-0 sm:p-4 md:p-6 lg:p-8 animate-in fade-in duration-300 font-kanit">
      
      {/* Dynamic Border Container */}
      <div className={`
          bg-white text-slate-900 w-full sm:max-w-5xl h-full sm:h-[92vh] sm:rounded-[2.5rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col 
          ${!isMobile ? 'border-[6px]' : 'border-t-4'} transition-colors duration-500
          border-${themeColor}-100 ring-1 ring-${themeColor}-200
      `}>
        
        {/* --- DYNAMIC HEADER --- */}
        <div className={`
            px-4 sm:px-8 py-2.5 sm:py-5 border-b flex justify-between items-center shrink-0 transition-colors duration-500
            bg-${themeColor}-50/50 border-${themeColor}-100
        `}>
            <div className="flex items-center gap-3 sm:gap-5">
                {(viewMode !== 'DETAILS' || hasHistory) && (
                    <button 
                        onClick={() => {
                            if (viewMode !== 'DETAILS') {
                                setViewMode('DETAILS');
                            } else if (hasHistory) {
                                onClose();
                            }
                        }} 
                        className={`p-1.5 sm:p-2 rounded-xl transition-all active:scale-90 border bg-white border-${themeColor}-200 text-${themeColor}-400 hover:text-${themeColor}-600 hover:bg-${themeColor}-50`}
                        title={viewMode !== 'DETAILS' ? "Back to Details" : "Back to Parent Task"}
                    >
                        <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                )}
                <div className="min-w-0">
                    <h2 className={`text-lg sm:text-2xl font-bold tracking-tight flex items-center gap-2 text-slate-800 transition-colors truncate`}>
                        {viewMode === 'DETAILS' ? (
                             initialData ? (initialData.title || 'แก้ไขงาน') : (activeTab === 'CONTENT' ? '🎬 สร้างคอนเทนต์ใหม่' : '⚡ สร้างภารกิจใหม่')
                        ) : (
                            <span className={`flex items-center gap-2 text-${themeColor}-600 truncate`}>
                                {React.createElement(currentTheme.icon, { className: "w-5 h-5 sm:w-6 sm:h-6 shrink-0" })}
                                {currentTheme.label}
                            </span>
                        )}
                    </h2>
                    
                    {/* Meta Badge */}
                    {viewMode === 'DETAILS' && (
                        <div className="flex items-center gap-2 mt-0.5 sm:mt-1">
                            <span className={`px-2 py-0.5 rounded-md text-[8px] sm:text-[9px] font-black tracking-widest border uppercase shrink-0 ${activeTab === 'CONTENT' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                {activeTab}
                            </span>
                            {initialData && <span className="text-[9px] sm:text-[10px] text-gray-400 font-mono truncate">ID: {initialData.id.slice(0,8)}</span>}
                        </div>
                    )}
                </div>
            </div>
            
            <button 
                onClick={onClose} 
                className={`p-1.5 sm:p-2 rounded-full transition-all border border-transparent hover:rotate-90 bg-white/50 text-slate-400 hover:text-${themeColor}-500 hover:bg-white shrink-0`}
            >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
        </div>

        {/* --- COMPRESSIBLE NAVIGATION (Floating Capsule) --- */}
        {initialData && (
            <motion.div 
                layout
                animate={{ 
                    height: isNavExpanded ? 'auto' : 46,
                }}
                transition={{
                    height: { type: 'spring', damping: 25, stiffness: 120 }
                }}
                className="shrink-0 bg-white border-b border-slate-50 relative overflow-hidden"
            >
                {/* INFINITE ENERGY RAIL */}
                <div className="absolute top-0 left-0 right-0 h-[4px] overflow-hidden z-50 pointer-events-none">
                    
                    {/* Soft Ambient Glow */}
                    <div className="absolute inset-0 opacity-40 blur-md">
                        <div
                            className="w-full h-full"
                            style={{
                                background: `
                                    linear-gradient(
                                        90deg,
                                        #818cf8 0%,
                                        #e879f9 25%,
                                        #fde68a 50%,
                                        #6ee7b7 75%,
                                        #67e8f9 100%
                                    )
                                `,
                            }}
                        />
                    </div>

                    {/* Infinite Rail */}
                    <motion.div
                        animate={{
                            x: ['0%', '-50%'],
                        }}
                        transition={{
                            repeat: Infinity,
                            duration: 10,
                            ease: 'linear',
                        }}
                        className="absolute top-0 left-0 h-full w-[200%]"
                        style={{
                            willChange: 'transform',
                        }}
                    >
                        <div
                            className="absolute top-0 left-0 h-full w-full"
                            style={{
                                backgroundImage: `
                                    linear-gradient(
                                        90deg,
                                        rgba(129,140,248,0.95) 0%,
                                        rgba(232,121,249,0.95) 20%,
                                        rgba(253,230,138,0.95) 40%,
                                        rgba(110,231,183,0.95) 60%,
                                        rgba(103,232,249,0.95) 80%,
                                        rgba(129,140,248,0.95) 100%
                                    )
                                `,
                                backgroundSize: '50% 100%',
                                backgroundRepeat: 'repeat-x',
                                filter: 'blur(0.4px)',
                            }}
                        />
                    </motion.div>

                    {/* Moving Shine */}
                    <motion.div
                        animate={{
                            x: ['-20%', '120%'],
                        }}
                        transition={{
                            repeat: Infinity,
                            duration: 3,
                            ease: 'easeInOut',
                        }}
                        className="absolute top-0 h-full w-32"
                        style={{
                            background: `
                                linear-gradient(
                                    90deg,
                                    transparent 0%,
                                    rgba(255,255,255,0.55) 50%,
                                    transparent 100%
                                )
                            `,
                            filter: 'blur(3px)',
                            mixBlendMode: 'screen',
                        }}
                    />
                </div>

                <AnimatePresence initial={false}>
                    {!isNavExpanded ? (
                        /* COLLAPSED NAV (With Rainbow Line) */
                        <motion.div 
                            key="collapsed"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            onClick={() => setIsNavExpanded(true)}
                            className="h-[46px] flex items-center justify-between px-6 cursor-pointer hover:bg-slate-50/50 transition-colors group absolute inset-0 z-10"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-1 bg-${themeColor}-50 rounded-lg group-hover:scale-110 transition-transform`}>
                                    {React.createElement(currentTheme.icon, { className: `w-4 h-4 text-${themeColor}-500` })}
                                </div>
                                <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                                    MENU: <span className={`text-${themeColor}-600 ml-1`}>{currentTheme.label}</span>
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-400 group-hover:text-indigo-600 transition-colors tracking-widest">TAP FOR TOOLS</span>
                                <ChevronRight className="w-4 h-4 text-slate-200 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </motion.div>
                    ) : (
                        /* EXPANDED NAV */
                        <motion.div
                            key="expanded"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.4 }}
                            className="bg-white overflow-hidden"
                        >
                            <motion.div 
                                initial={{ y: -10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ duration: 0.5, delay: 0.1 }}
                                className="px-2 sm:px-6 pt-2 sm:pt-4 pb-1.5 sm:pb-4"
                            >
                                <div className="flex items-center justify-between mb-3 px-2">
                                    <span className="text-[12px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Activity className="w-3 h-3" /> Navigation Hub
                                    </span>
                                    <button 
                                        onClick={() => setIsNavExpanded(false)}
                                        className="text-[12px] font-medium  text-indigo-400 hover:text-indigo-600 transition-colors flex items-center gap-1"
                                    >
                                        HIDE MENU <ChevronDown className="w-3 h-3" />
                                    </button>
                                </div>
                                <div className="flex bg-gray-100/80 p-1 rounded-xl sm:rounded-2xl overflow-x-auto scrollbar-none relative gap-1 snap-x snap-mandatory">
                                    {[
                                        { id: 'DETAILS', label: 'ดีเทล', icon: Layout },
                                        ...(isContent ? [{ id: 'LOGISTICS', label: 'งานย่อย', icon: Truck }] : []),
                                        ...(hasLinkedScript ? [{ id: 'SCRIPT', label: 'สคริปต์', icon: FileText }] : []),
                                        { id: 'COMMENTS', label: 'แชท', icon: MessageSquare },
                                        { id: 'ASSETS', label: 'ไฟล์', icon: Paperclip, count: assetCount },
                                        { id: 'HISTORY', label: 'ประวัติ', icon: History },
                                        { id: 'WIKI', label: 'คู่มือ', icon: Book }
                                    ].map((tab) => {
                                        const isActive = viewMode === tab.id;
                                        const config = TAB_CONFIGS[tab.id];

                                        return (
                                            <button 
                                                key={tab.id}
                                                onClick={() => {
                                                    setViewMode(tab.id as any);
                                                    if (isMobile) setIsNavExpanded(false);
                                                }}
                                                className={`
                                                    flex-1 py-1.5 sm:py-2.5 px-3 sm:px-4 rounded-lg sm:rounded-xl text-[10px] sm:text-sm font-bold transition-all duration-300 ease-out flex items-center justify-center gap-2 whitespace-nowrap relative snap-start z-10
                                                    ${isActive ? `text-${config.color}-600` : `text-slate-500 hover:text-slate-700`}
                                                `}
                                            >
                                                <tab.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isActive ? 'stroke-[2.5px]' : ''}`} />
                                                <span>{tab.label}</span>
                                                
                                                {!!tab.count && tab.count > 0 && (
                                                    <span className={`
                                                        absolute top-1 right-1 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full border border-white
                                                        ${isActive ? `bg-${config.color}-500` : 'bg-slate-400'}
                                                    `}></span>
                                                )}

                                                {isActive && (
                                                    <>
                                                        <motion.div 
                                                            layoutId="activeTabBackground"
                                                            className="absolute inset-0 bg-white shadow-sm ring-1 ring-black/5 rounded-lg sm:rounded-xl -z-10"
                                                            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                                        />
                                                        <motion.div 
                                                            layoutId="activeTabUnderline"
                                                            className={`absolute -bottom-1 left-2 right-2 h-0.5 sm:h-1 bg-${config.color}-400/40 rounded-full blur-[1px]`}
                                                            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                                        >
                                                            <motion.div 
                                                                animate={{ 
                                                                    x: ['-100%', '100%'],
                                                                    opacity: [0, 1, 0]
                                                                }}
                                                                transition={{ 
                                                                    repeat: Infinity, 
                                                                    duration: 1.5,
                                                                    ease: "linear"
                                                                }}
                                                                className={`absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-50`}
                                                            />
                                                        </motion.div>
                                                    </>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        )}

        {/* --- BODY CONTENT SWITCHER --- */}
        <div className="flex-1 overflow-hidden relative bg-white flex flex-col">
            
            {/* Animated Wrapper */}
            <div 
                key={viewMode} 
                className="flex-1 overflow-hidden flex flex-col h-full animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out"
            >
                {viewMode === 'HISTORY' && initialData ? (
                    <TaskHistory task={initialData} currentUser={currentUser} onSaveTask={onSave} />
                ) : viewMode === 'COMMENTS' && initialData && currentUser ? (
                    <div className="flex-1 overflow-hidden p-0 bg-gray-50">
                        <TaskComments taskId={initialData.id} taskType={initialData.type} currentUser={currentUser} />
                    </div>
                ) : viewMode === 'ASSETS' && initialData ? (
                    <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                        <TaskAssets 
                            assets={initialData.assets || []} 
                            onAdd={(newAsset) => {
                                const updatedAssets = [...(initialData.assets || []), newAsset];
                                onSave({ ...initialData, assets: updatedAssets });
                            }} 
                            onDelete={(id) => {
                                const updatedAssets = (initialData.assets || []).filter(a => a.id !== id);
                                onSave({ ...initialData, assets: updatedAssets });
                            }} 
                        />
                    </div>
                ) : viewMode === 'LOGISTICS' && initialData && currentUser ? (
                    <LogisticsTab 
                        parentTask={initialData}
                        users={users}
                        currentUser={currentUser}
                        masterOptions={masterOptions}
                        onUpdate={onUpdate}
                        onOpenTask={(t) => onOpenTask && onOpenTask(t, viewMode)}
                     />
                ) : viewMode === 'WIKI' ? (
                    <TaskWiki className="flex-1" />
                ) : viewMode === 'SCRIPT' && taskScript && currentUser ? (
                    // --- SCRIPT EDITOR EMBED ---
                    <div className="flex-1 relative overflow-hidden flex flex-col">
                        <ScriptEditor 
                            script={taskScript}
                            users={users}
                            channels={channels}
                            masterOptions={masterOptions}
                            currentUser={currentUser}
                            onClose={() => setViewMode('DETAILS')} // Back to details
                            onSave={updateScript}
                            onGenerateAI={async () => null} 
                            onPromote={() => {}} 
                        />
                    </div>
                ) : (
                    // Form Selection Logic (DETAILS)
                    mode === 'VIEW' && initialData ? (
                        initialData.type === 'CONTENT' ? (
                            <ContentDetail 
                                task={initialData}
                                users={users}
                                channels={channels}
                                onEdit={() => setMode('EDIT')}
                                onDelete={onDelete ? () => onDelete(initialData.id) : undefined}
                                onClose={onClose}
                            />
                        ) : (
                            <TaskDetail 
                                task={initialData}
                                users={users}
                                masterOptions={masterOptions}
                                onEdit={() => setMode('EDIT')}
                                onDelete={onDelete ? () => onDelete(initialData.id) : undefined}
                                onClose={onClose}
                                onOpenTask={(t) => onOpenTask && onOpenTask(t, viewMode)}
                            />
                        )
                    ) : activeTab === 'CONTENT' ? (
                        <ContentForm 
                            key={initialData ? `content-${initialData.id}` : 'new-content'}
                            initialData={initialData}
                            selectedDate={selectedDate}
                            channels={channels}
                            users={users}
                            masterOptions={masterOptions}
                            currentUser={currentUser} 
                            onSave={(task) => { onSave(task); if (initialData) setMode('VIEW'); else onClose(); }}
                            onDelete={onDelete}
                            onClose={initialData ? () => setMode('VIEW') : onClose}
                        />
                    ) : (
                        <GeneralTaskForm 
                            key={initialData ? `task-${initialData.id}` : 'new-task'}
                            initialData={initialData}
                            selectedDate={selectedDate}
                            users={users}
                            masterOptions={masterOptions}
                            currentUser={currentUser} 
                            projects={projects}
                            channels={channels}
                            onSave={(task) => { onSave(task); if (initialData) setMode('VIEW'); else onClose(); }}
                            onDelete={onDelete}
                            onClose={initialData ? () => setMode('VIEW') : onClose}
                            onOpenTask={(t) => onOpenTask && onOpenTask(t, viewMode)}
                        />
                    )
                )}
            </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default TaskModal;
