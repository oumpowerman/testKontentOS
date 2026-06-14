import React from 'react';
import { motion } from 'framer-motion';
import { 
    Wand2, MessageSquare, Search, Settings, PlayCircle, Printer 
} from 'lucide-react';
import { TemplatesDropdown } from './TemplatesDropdown';

interface CollapsibleToolsAreaProps {
    scriptType: string;
    isChatPreviewOpen: boolean;
    setIsChatPreviewOpen: (val: boolean) => void;
    isFindReplaceOpen: boolean;
    setIsFindReplaceOpen: (val: boolean) => void;
    showConfig: boolean;
    setShowConfig: (val: boolean) => void;
    setIsTeleprompterOpen: (val: boolean) => void;
    showTemplates: boolean;
    setShowTemplates: (val: boolean) => void;
    templatesBtnRef: React.RefObject<HTMLDivElement>;
    handlePrint: () => void;
    setIsAIOpen: (val: boolean) => void;
}

export const CollapsibleToolsArea: React.FC<CollapsibleToolsAreaProps> = ({
    scriptType,
    isChatPreviewOpen,
    setIsChatPreviewOpen,
    isFindReplaceOpen,
    setIsFindReplaceOpen,
    showConfig,
    setShowConfig,
    setIsTeleprompterOpen,
    showTemplates,
    setShowTemplates,
    templatesBtnRef,
    handlePrint,
    setIsAIOpen
}) => {
    return (
        <motion.div 
            initial={{ opacity: 0, width: 0, marginRight: 0 }}
            animate={{ opacity: 1, width: "auto", marginRight: 8 }}
            exit={{ opacity: 0, width: 0, marginRight: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-2 overflow-hidden whitespace-nowrap pl-1 shrink-0"
        >
            {/* AI Assistant Magic Tool */}
            <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsAIOpen(true)} 
                className="w-9 h-9 flex items-center justify-center bg-gradient-to-br from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white rounded-lg shadow-lg shadow-purple-200 transition-all border border-white/20 shrink-0" 
                title="AI Magic"
            >
                <Wand2 className="w-4 h-4" />
            </motion.button>

            {scriptType === 'DIALOGUE' && (
                <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsChatPreviewOpen(!isChatPreviewOpen)}
                    className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all border shadow-sm shrink-0 ${isChatPreviewOpen ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-gray-200 text-gray-500 hover:text-indigo-600 hover:border-indigo-200'}`}
                    title="Chat Preview"
                >
                    <MessageSquare className="w-4 h-4" />
                </motion.button>
            )}

            <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsFindReplaceOpen(!isFindReplaceOpen)} 
                className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all border shadow-sm shrink-0 ${isFindReplaceOpen ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-gray-200 text-gray-500 hover:text-indigo-600 hover:border-indigo-200'}`}
                title="Find & Replace (Ctrl+F)"
            >
                <Search className="w-4 h-4" />
            </motion.button>

            <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowConfig(true)} 
                className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all border shadow-sm shrink-0 ${showConfig ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-gray-200 text-gray-500 hover:text-indigo-600 hover:border-indigo-200'}`}
                title="Character Manager"
            >
                <Settings className="w-4 h-4" />
            </motion.button>

            <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsTeleprompterOpen(true)} 
                className="w-9 h-9 flex items-center justify-center bg-white border border-gray-200 text-gray-500 hover:text-green-600 hover:border-green-200 hover:bg-green-50 rounded-lg shadow-sm transition-all shrink-0" 
                title="Teleprompter"
            >
                <PlayCircle className="w-4 h-4" />
            </motion.button>
            
            {/* Templates Dropdown */}
            <TemplatesDropdown 
                showTemplates={showTemplates} 
                setShowTemplates={setShowTemplates} 
                templatesBtnRef={templatesBtnRef}
            />

            <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePrint} 
                className="w-9 h-9 flex items-center justify-center bg-white border border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-lg shadow-sm transition-all shrink-0" 
                title="Print Script"
            >
                <Printer className="w-4 h-4" />
            </motion.button>
        </motion.div>
    );
};
