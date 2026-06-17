import React, { useMemo } from 'react';
import { X } from 'lucide-react';
import { Channel, MasterOption } from '../../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import th from 'date-fns/locale/th';

interface ActiveFilterChipsRowProps {
    filterChannel: string[];
    setFilterChannel: React.Dispatch<React.SetStateAction<string[]>>;
    filterFormat: string[];
    setFilterFormat: React.Dispatch<React.SetStateAction<string[]>>;
    filterPillar: string[];
    setFilterPillar: React.Dispatch<React.SetStateAction<string[]>>;
    filterCategory: string[];
    setFilterCategory: React.Dispatch<React.SetStateAction<string[]>>;
    filterStatuses: string[];
    setFilterStatuses: React.Dispatch<React.SetStateAction<string[]>>;
    filterHasShootDate: boolean;
    setFilterHasShootDate: (val: boolean) => void;
    filterShootDateStart: string;
    setFilterShootDateStart: (val: string) => void;
    filterShootDateEnd: string;
    setFilterShootDateEnd: (val: string) => void;
    channels: Channel[];
    masterOptions: MasterOption[];
}

export const ActiveFilterChipsRow: React.FC<ActiveFilterChipsRowProps> = React.memo(({
    filterChannel,
    setFilterChannel,
    filterFormat,
    setFilterFormat,
    filterPillar,
    setFilterPillar,
    filterCategory,
    setFilterCategory,
    filterStatuses,
    setFilterStatuses,
    filterHasShootDate,
    setFilterHasShootDate,
    filterShootDateStart,
    setFilterShootDateStart,
    filterShootDateEnd,
    setFilterShootDateEnd,
    channels,
    masterOptions
}) => {
    // Derived list of currently active filters as chips/badges with dynamic and responsive styling
    const activeChips = useMemo(() => {
        const chips: { type: 'channel' | 'format' | 'pillar' | 'category' | 'status' | 'date'; id: string; label: string; colorClass: string }[] = [];

        filterChannel.forEach(cId => {
            const ch = channels.find(c => c.id === cId);
            if (ch) {
                chips.push({
                    type: 'channel',
                    id: cId,
                    label: ch.name,
                    colorClass: 'bg-indigo-50 border-indigo-100 text-indigo-700 shadow-indigo-100/20'
                });
            }
        });

        filterFormat.forEach(fKey => {
            const opt = masterOptions.find(o => o.type === 'FORMAT' && o.key === fKey);
            if (opt) {
                chips.push({
                    type: 'format',
                    id: fKey,
                    label: opt.label,
                    colorClass: 'bg-pink-50 border-pink-100 text-pink-700 shadow-pink-100/20'
                });
            }
        });

        filterPillar.forEach(pKey => {
            const opt = masterOptions.find(o => o.type === 'PILLAR' && o.key === pKey);
            if (opt) {
                const ch = opt.parentKey ? channels.find(c => c.id === opt.parentKey) : null;
                const labelName = ch ? `${opt.label} (${ch.name})` : opt.label;
                chips.push({
                    type: 'pillar',
                    id: pKey,
                    label: labelName,
                    colorClass: 'bg-blue-50 border-blue-100 text-blue-700 shadow-blue-100/20'
                });
            }
        });

        filterCategory.forEach(cKey => {
            const opt = masterOptions.find(o => o.type === 'CATEGORY' && o.key === cKey);
            if (opt) {
                const ch = opt.parentKey ? channels.find(c => c.id === opt.parentKey) : null;
                const labelName = ch ? `${opt.label} (${ch.name})` : opt.label;
                chips.push({
                    type: 'category',
                    id: cKey,
                    label: labelName,
                    colorClass: 'bg-emerald-50 border-emerald-100 text-emerald-700 shadow-emerald-100/20'
                });
            }
        });

        filterStatuses.forEach(sKey => {
            const opt = masterOptions.find(o => o.type === 'STATUS' && o.key === sKey);
            if (opt) {
                chips.push({
                    type: 'status',
                    id: sKey,
                    label: opt.label,
                    colorClass: 'bg-amber-50 border-amber-100 text-amber-500 shadow-amber-100/20'
                });
            }
        });

        if (filterHasShootDate && filterShootDateStart) {
            const startFmt = format(parseISO(filterShootDateStart), 'd MMM', { locale: th });
            const endFmt = filterShootDateEnd ? format(parseISO(filterShootDateEnd), 'd MMM yy', { locale: th }) : '';
            chips.push({
                type: 'date',
                id: 'shoot-date',
                label: `Shoot: ${startFmt}${endFmt ? ` - ${endFmt}` : ''}`,
                colorClass: 'bg-purple-50 border-purple-100 text-purple-700 shadow-purple-100/20'
            });
        }

        return chips;
    }, [
        filterChannel, filterFormat, filterPillar, filterCategory, filterStatuses,
        filterHasShootDate, filterShootDateStart, filterShootDateEnd, channels, masterOptions
    ]);

    const handleRemoveChip = (chip: typeof activeChips[number]) => {
        switch (chip.type) {
            case 'channel':
                setFilterChannel(prev => prev.filter(id => id !== chip.id));
                break;
            case 'format':
                setFilterFormat(prev => prev.filter(key => key !== chip.id));
                break;
            case 'pillar':
                setFilterPillar(prev => prev.filter(key => key !== chip.id));
                break;
            case 'category':
                setFilterCategory(prev => prev.filter(key => key !== chip.id));
                break;
            case 'status':
                setFilterStatuses(prev => prev.filter(key => key !== chip.id));
                break;
            case 'date':
                setFilterHasShootDate(false);
                setFilterShootDateStart('');
                setFilterShootDateEnd('');
                break;
        }
    };

    return (
        <AnimatePresence mode="popLayout">
            {activeChips.length > 0 && (
                <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="flex flex-wrap gap-1.5 items-center pt-2.5 border-t border-gray-100 mt-1"
                >
                    <span className="text-[10px] font-black tracking-wider text-gray-400 uppercase mr-1.5">
                        ตัวกรองที่เลือกอยู่ ({activeChips.length})
                    </span>
                    <AnimatePresence mode="popLayout">
                        {activeChips.map((chip) => (
                            <motion.div
                                key={`${chip.type}-${chip.id}`}
                                layout
                                initial={{ opacity: 0, scale: 0.8, x: -10 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.8, x: 10, width: 0, paddingRight: 0, paddingLeft: 0, marginRight: 0 }}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-black leading-none whitespace-nowrap shadow-sm transition-colors ${chip.colorClass}`}
                            >
                                <span>{chip.label}</span>
                                <button 
                                    onClick={() => handleRemoveChip(chip)}
                                    className="p-0.5 hover:bg-black/5 rounded-full transition-colors cursor-pointer"
                                    aria-label={`Unfilter ${chip.label}`}
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}
        </AnimatePresence>
    );
});
