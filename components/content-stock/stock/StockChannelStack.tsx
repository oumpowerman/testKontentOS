import React, { useState, useMemo } from 'react';
import { Channel } from '../../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderHeart, Sparkles, FolderOpen, Layers, Check, Database, Activity } from 'lucide-react';

interface StockChannelStackProps {
  channels: Channel[];
  selectedChannelIds: string[];
  onSelectChannels: React.Dispatch<React.SetStateAction<string[]>>;
}

export const StockChannelStack: React.FC<StockChannelStackProps> = ({
  channels,
  selectedChannelIds,
  onSelectChannels,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [displayMode, setDisplayMode] = useState<'classic' | 'logo'>('classic');

  // Parse color classes safely
  const getColorClasses = (chColor?: string) => {
    const rawColor = chColor || 'bg-slate-400';
    const bgClass = rawColor.split(' ')[0];
    const textClass = bgClass.replace('bg-', 'text-');
    const borderClass = bgClass.replace('bg-', 'border-');
    return { bgClass, textClass, borderClass };
  };

  // Build a single unified array of interactive tabs (ALL + channel list)
  const items = useMemo(() => {
    return [
      { id: 'ALL', name: 'รวมทุกช่องทาง', isAll: true, color: 'bg-indigo-500', serial: 'DRW-ALL', logoUrl: undefined },
      ...channels.map((ch, idx) => {
        // Dynamic mix of mechanical labels: DRW, CAB, RACK, IDX
        const prefixes = ['CAB', 'DRW', 'RACK', 'IDX'];
        const pfx = prefixes[idx % prefixes.length];
        const num = String(idx + 1).padStart(2, '0');
        return {
          id: ch.id,
          name: ch.name,
          isAll: false,
          color: ch.color || 'bg-slate-400',
          serial: `${pfx}-${num}`,
          logoUrl: ch.logoUrl
        };
      }),
    ];
  }, [channels]);

  // Total channels active count
  const activeCount = selectedChannelIds.length;

  const handleToggleChannel = (id: string) => {
    if (id === 'ALL') {
      // Clear all to represent ALL
      onSelectChannels([]);
    } else {
      // Toggle channels
      onSelectChannels(prev => {
        if (prev.includes(id)) {
          return prev.filter(item => item !== id);
        } else {
          return [...prev, id];
        }
      });
    }
  };

  return (
    <div className="w-full select-none">
      <div className="flex flex-col xl:flex-row xl:items-center gap-5 bg-white/60 px-6 py-4 rounded-[2.25rem] border border-white/80 shadow-2xl shadow-indigo-500/5 backdrop-blur-2xl">
        
        {/* Left Side Icon and Badge with high-quality animations */}
        <div className="flex items-center gap-3.5 shrink-0 group">
          <motion.div 
            whileHover={{ 
              rotate: [0, -10, 15, -5, 0],
              scale: 1.1,
              transition: { duration: 0.5 }
            }}
            className="relative w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-300/50 text-white overflow-hidden"
          >
            {/* Ambient sliding light stripe */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:animate-shimmer" />
            <FolderHeart className="w-5 h-5 relative z-10" />
            
            {/* Micro Activity Pulse on filter active */}
            {activeCount > 0 && (
              <span className="absolute top-1 right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            )}
          </motion.div>
          
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <motion.span 
                animate={{ 
                  scale: activeCount > 0 ? [1, 1.05, 1] : 1,
                }}
                transition={{ repeat: activeCount > 0 ? Infinity : 0, duration: 2, ease: "easeInOut" }}
                className={`w-2 h-2 rounded-full ${activeCount > 0 ? 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.7)]' : 'bg-indigo-400/60'}`} 
              />
              <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-500/80 leading-none">
                {activeCount > 0 ? 'MULTI FILTER ACTIVE' : 'ALL RACKS OFFLINE'}
              </span>
            </div>
            
            <h4 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2 mt-1">
              <span>แฟ้มแยกช่อง</span>
              
              <AnimatePresence mode="wait">
                <motion.span 
                  key={activeCount}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="inline-flex items-center justify-center bg-indigo-50 px-2.5 py-0.5 rounded-full text-[10px] text-indigo-600 font-semibold border border-indigo-100/60 shadow-sm"
                >
                  {activeCount > 0 ? `เลือกอยู่ ${activeCount} ช่อง` : `ทั้งหมด (${channels.length})`}
                </motion.span>
              </AnimatePresence>
            </h4>

            {/* Display Mode Switcher */}
            <div className="flex items-center gap-1 mt-1.5 bg-slate-100/80 p-0.5 rounded-md w-fit border border-slate-200/30">
              <button
                type="button"
                onClick={() => setDisplayMode('classic')}
                className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all cursor-pointer ${
                  displayMode === 'classic'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                แบบแฟ้ม
              </button>
              <button
                type="button"
                onClick={() => setDisplayMode('logo')}
                className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all cursor-pointer ${
                  displayMode === 'logo'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                แสดงโลโก้
              </button>
            </div>
          </div>
        </div>

        {/* Separator Line */}
        <div className="hidden xl:block w-px h-8 bg-slate-200/80 mx-1" />

        {/* Filing Tab Track Wrapper */}
        <div className="relative flex-1 min-h-[76px] flex items-center overflow-x-auto scrollbar-hide pt-5 pb-3 px-1">
          <motion.div 
            layout
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="flex items-center gap-0 w-full"
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          >
            {items.map((item, index) => {
              const isFirst = index === 0;
              
              // Correct selected calculation depending on 'ALL' representation
              const isSelected = item.isAll 
                ? selectedChannelIds.length === 0 
                : selectedChannelIds.includes(item.id);

              const { bgClass } = getColorClasses(item.color);

              // Calculate ordering sequence index for multi-select
              const selectIndex = !item.isAll ? selectedChannelIds.indexOf(item.id) : -1;
              const hasRank = selectIndex !== -1;

              return (
                <motion.button
                  key={item.id}
                  layout="position"
                  onClick={() => handleToggleChannel(item.id)}
                  animate={{
                    marginLeft: (isHovered || isSelected || isFirst) ? 8 : (displayMode === 'logo' ? -20 : -32), // Tactile fanning/deck stack effect
                    y: isSelected ? -6 : 0,
                    scale: isSelected ? 1.04 : 1,
                    zIndex: isSelected ? 50 : items.length - index,
                  }}
                  whileHover={{ 
                    scale: isSelected ? 1.06 : 1.03, 
                    y: -10, 
                    rotate: isSelected ? 0 : index % 2 === 0 ? 1 : -1,
                    zIndex: 60,
                    transition: { type: 'spring', stiffness: 450, damping: 20 }
                  }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ 
                    type: 'spring', 
                    stiffness: 300, 
                    damping: 26,
                    layout: { type: 'spring', stiffness: 300, damping: 26 }
                  }}
                  className={`
                    relative h-11 transition-colors border flex items-center gap-2.5 shrink-0 outline-none select-none cursor-pointer
                    ${displayMode === 'logo'
                      ? 'rounded-full pr-4 pl-3 text-xs'
                      : 'rounded-t-2xl rounded-b-xl pr-5 pl-4 text-xs'
                    }
                    ${isSelected
                      ? 'bg-white/95 border-violet-300 text-violet-700 backdrop-blur-xl shadow-lg shadow-violet-200/50'
                      : 'bg-white text-slate-500 border-slate-200/80 shadow-[0_4px_12px_rgba(0,0,0,0.02)] hover:border-slate-300 hover:text-slate-700'
                    }
                  `}
                  style={{
                    borderRadius: displayMode === 'logo' ? '24px' : '16px 16px 12px 12px',
                    transformOrigin: 'bottom center',
                  }}
                >
                  {/* Miniature Physical Filing Tab protruding from the folder */}
                  {displayMode === 'classic' && (
                    <div 
                      className={`absolute -top-1.5 left-4 px-2 py-0.25 rounded-t-md text-[7px] font-bold uppercase tracking-wider text-white shadow-sm flex items-center justify-center h-3 bg-gradient-to-r from-indigo-500 to-indigo-600 ${bgClass}`}
                      style={{ fontSize: '7px', zIndex: 10 }}
                    >
                      {/* Show checking label if selected, otherwise print dynamic serials */}
                      {item.isAll ? 'ALL' : hasRank ? `SEL #${selectIndex + 1}` : item.serial}
                    </div>
                  )}

                  {/* Tactile Inner Folder Document Line Mockup */}
                  {displayMode === 'classic' && (
                    <>
                      <div className={`absolute top-1 left-4 right-6 h-[1.5px] rounded-full ${isSelected ? 'bg-violet-200' : 'bg-slate-100'}`} />
                      <div className={`absolute top-[7px] left-4 w-10 h-[1px] rounded-full ${isSelected ? 'bg-violet-100' : 'bg-slate-50'}`} />
                    </>
                  )}

                  {/* Indicator or Logo Image */}
                  {displayMode === 'logo' ? (
                    <div className="relative w-6 h-6 rounded-full overflow-hidden border border-slate-100/80 bg-slate-50 flex items-center justify-center shrink-0 shadow-sm">
                      {item.isAll ? (
                        <div className="w-full h-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[9px] font-bold">
                          ALL
                        </div>
                      ) : item.logoUrl ? (
                        <img 
                          src={item.logoUrl} 
                          alt={item.name} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className={`w-full h-full ${bgClass} flex items-center justify-center text-white text-[9px] font-bold`}>
                          {item.name.charAt(0)}
                        </div>
                      )}
                      
                      {isSelected && (
                        <span className="absolute bottom-0 right-0 block h-2 w-2 rounded-full bg-emerald-500 ring-1 ring-white" />
                      )}
                    </div>
                  ) : (
                    /* Physical Indicator circle node */
                    <span className={`w-2.5 h-2.5 rounded-full ${bgClass} shadow-[inset_0_1px_2.5px_rgba(255,255,255,0.45)] border border-black/5 shrink-0 relative flex items-center justify-center`}>
                      {isSelected && (
                        <motion.span 
                          layoutId="activeSubTabNode"
                          className="absolute w-1 h-1 rounded-full bg-white" 
                        />
                      )}
                    </span>
                  )}

                  {/* Dynamic clean width expansion of label */}
                  <motion.span
                    layout="position"
                    animate={{
                      width: (isHovered || isSelected || item.isAll) ? 'auto' : '52px',
                    }}
                    transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                    className="overflow-hidden whitespace-nowrap block text-[11px] font-bold truncate text-left"
                  >
                    {item.name}
                  </motion.span>
                  
                  {/* Visual Multi-Selection Index badge or Checkmark inside the button */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.span 
                        initial={{ opacity: 0, scale: 0.5, x: 5 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.5, x: 5 }}
                        className="text-violet-500 flex items-center gap-1 text-[10px]"
                      >
                        {item.isAll ? (
                          <Sparkles className="w-3.5 h-3.5 fill-violet-200 text-violet-500" />
                        ) : (
                          <div className="flex items-center justify-center bg-violet-100 text-violet-700 w-4 h-4 rounded-full font-semibold text-[9px] border border-violet-200">
                            {selectIndex !== -1 ? selectIndex + 1 : <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                        )}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              );
            })}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default StockChannelStack;
