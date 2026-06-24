import React, { useState, useEffect, useRef } from 'react';
import { Inbox } from 'lucide-react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { useWorkboxContext } from '../../context/WorkboxContext';

interface WorkboxTriggerProps {
    onClick: () => void;
    itemCount: number;
    onDrop?: (data: any) => void;
}

const WorkboxTrigger: React.FC<WorkboxTriggerProps> = ({ onClick, itemCount, onDrop }) => {
    const { isDragging, isDocked } = useWorkboxContext();
    const [isOver, setIsOver] = useState(false);
    const [dragged, setDragged] = useState(false);
    const constraintsRef = useRef<HTMLDivElement>(null);
    
    // Motion values for free movement
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    
    // Scale up when something is being dragged globally
    const globalDragScale = isDragging ? 1.2 : 1;
    
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsOver(true);
    };

    const handleDragLeave = () => {
        setIsOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsOver(false);
        try {
            const data = JSON.parse(e.dataTransfer.getData('application/json'));
            if (onDrop) {
                onDrop(data);
                // Visual feedback for success
                const btn = e.currentTarget as HTMLElement;
                btn.classList.add('animate-bounce');
                setTimeout(() => btn.classList.remove('animate-bounce'), 1000);
            }
        } catch (err) {
            console.error('Failed to parse drop data:', err);
        }
    };

    if (isDocked) return null;

    return (
        <>
            <div ref={constraintsRef} className="fixed inset-0 pointer-events-none z-50 overflow-hidden" />
            <motion.div
                drag
                dragConstraints={constraintsRef}
                dragElastic={0.1}
                dragMomentum={false}
                onDragStart={() => setDragged(true)}
                onDragEnd={() => setTimeout(() => setDragged(false), 100)}
                style={{ x, y }}
                className="fixed right-6 bottom-24 z-50"
                whileDrag={{ scale: 1.1, cursor: 'grabbing' }}
            >
            <motion.button
                animate={{ 
                    scale: isOver ? 1.3 : globalDragScale,
                    rotate: isDragging ? [0, -5, 5, 0] : 0
                }}
                transition={{ 
                    rotate: { repeat: Infinity, duration: 0.5 },
                    scale: { type: 'spring', stiffness: 300, damping: 15 }
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                    if (!dragged) onClick();
                }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className="group relative"
            >
                <div className={`
                    w-16 h-16 rounded-[24px] flex items-center justify-center shadow-2xl transition-all border-4 border-white
                    ${isOver 
                        ? 'bg-amber-500 shadow-amber-200 animate-pulse' 
                        : isDragging
                            ? 'bg-emerald-500 shadow-emerald-200'
                            : 'bg-indigo-600 shadow-indigo-200 group-hover:bg-indigo-700'
                    }
                `}>
                    <Inbox className={`w-7 h-7 text-white transition-transform ${isOver ? 'scale-125' : ''}`} />
                </div>
                
                {itemCount > 0 && !isOver && (
                    <motion.span 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-2 -right-2 bg-rose-500 text-white text-[11px] font-black min-w-[24px] h-6 px-1.5 rounded-full flex items-center justify-center border-2 border-white shadow-lg z-10"
                    >
                        {itemCount}
                    </motion.span>
                )}

                {/* Tooltip */}
                <div className={`
                    absolute right-full mr-4 top-1/2 -translate-y-1/2 px-4 py-2 bg-gray-900/90 backdrop-blur-md text-white text-[11px] font-bold rounded-xl transition-all pointer-events-none whitespace-nowrap shadow-xl border border-white/10
                    ${(isOver || isDragging) ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0'}
                `}>
                    {isOver ? 'วางเพื่อเก็บ! ✨' : isDragging ? 'ลากมาที่นี่! 📦' : 'WorkBox (ลากย้ายได้) 📦'}
                </div>
            </motion.button>
            </motion.div>
        </>
    );
};

export default WorkboxTrigger;
