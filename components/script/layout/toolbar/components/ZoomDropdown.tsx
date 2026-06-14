import React from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { FloatingPortal } from './FloatingPortal';

const ZOOM_OPTIONS = [50, 75, 100, 125, 150, 200];

interface ZoomDropdownProps {
    zoomLevel: number;
    setZoomLevel: (zoom: number) => void;
    showZoomMenu: boolean;
    setShowZoomMenu: (isOpen: boolean) => void;
    zoomBtnRef: React.RefObject<HTMLDivElement>;
}

export const ZoomDropdown: React.FC<ZoomDropdownProps> = ({
    zoomLevel,
    setZoomLevel,
    showZoomMenu,
    setShowZoomMenu,
    zoomBtnRef,
}) => {
    return (
        <div className="relative shrink-0" ref={zoomBtnRef}>
             <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowZoomMenu(!showZoomMenu)}
                className="h-9 px-3 bg-gray-100 rounded-lg flex items-center gap-1 text-xs font-bold text-gray-600 hover:bg-gray-200 transition-colors border border-gray-200"
            >
                 {zoomLevel}% <ChevronDown className="w-3 h-3 opacity-50" />
            </motion.button>
            
            <FloatingPortal
                isOpen={showZoomMenu}
                onClose={() => setShowZoomMenu(false)}
                anchorRef={zoomBtnRef}
                className="w-24 bg-white rounded-xl shadow-xl border border-gray-100 p-1 animate-in fade-in zoom-in-95"
                align="right"
            >
                {ZOOM_OPTIONS.map(z => (
                    <button
                        key={z}
                        onClick={() => { setZoomLevel(z); setShowZoomMenu(false); }}
                        className={`w-full text-center px-2 py-1.5 rounded-lg text-xs font-bold transition-colors ${zoomLevel === z ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        {z}%
                    </button>
                ))}
            </FloatingPortal>
        </div>
    );
};
