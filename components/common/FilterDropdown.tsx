
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FilterOption {
    key: string;
    label: string;
    icon?: string | React.ReactNode;
}

type FilterDropdownProps = {
    label: string;
    options: FilterOption[];
    icon?: React.ReactNode;
    activeColorClass?: string; // e.g., 'bg-pink-50 border-pink-200 text-pink-700'
    placeholder?: string;
    showAllOption?: boolean;
    clearable?: boolean;
    disabled?: boolean;
} & (
    | { multiSelect?: false; value: string; onChange: (value: string) => void }
    | { multiSelect: true; value: string[]; onChange: (value: string[]) => void }
);

const FilterDropdown: React.FC<FilterDropdownProps> = (props) => {
    const {
        label,
        options,
        icon,
        activeColorClass = 'bg-indigo-50 border-indigo-200 text-indigo-700',
        placeholder = 'ทั้งหมด',
        showAllOption = true,
        clearable = true,
        multiSelect = false,
        disabled = false
    } = props;

    const value = props.value;
    const onChange = props.onChange;

    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const isMulti = Array.isArray(value);
    const isActive = isMulti ? value.length > 0 : value !== 'ALL';

    const selectedOptions = isMulti 
        ? options.filter(opt => (value as string[]).includes(opt.key))
        : options.find(opt => opt.key === value);

    const filteredOptions = options.filter(opt => 
        opt.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSelect = (key: string) => {
        if (multiSelect && props.multiSelect) {
            const currentValues = Array.isArray(value) ? value : [];
            const newValues = currentValues.includes(key)
                ? currentValues.filter(v => v !== key)
                : [...currentValues, key];
            (onChange as (v: string[]) => void)(newValues);
        } else {
            (onChange as (v: string) => void)(key);
            setIsOpen(false);
        }
    };

    const handleSelectAll = () => {
        if (multiSelect && props.multiSelect) {
            (onChange as (v: string[]) => void)(options.map(opt => opt.key));
        }
    };

    const handleClearAll = () => {
        if (multiSelect && props.multiSelect) {
            (onChange as (v: string[]) => void)([]);
        } else {
            (onChange as (v: string) => void)('ALL');
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const getDisplayLabel = () => {
        if (!isActive) return label;
        if (multiSelect && Array.isArray(value)) {
            if (value.length === options.length) return `ทั้งหมด (${value.length})`;
            if (value.length > 1) return `${label} (${value.length})`;
            return options.find(opt => opt.key === value[0])?.label || label;
        }
        return (selectedOptions as FilterOption)?.label || label;
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                title={getDisplayLabel()}
                className={`
                    flex items-center justify-between px-5 py-3.5 border rounded-2xl text-sm font-bold transition-all active:scale-95 w-full
                    ${disabled ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed pointer-events-none' : 
                      isActive 
                        ? `${activeColorClass} shadow-[0_0_15px_rgba(79,70,229,0.15)] border-indigo-300 ring-2 ring-indigo-500/10` 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 shadow-sm'}
                `}
            >
                <div className="flex items-center gap-3 truncate">
                    {icon && (
                        <span className={`transition-colors ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>
                            {icon}
                        </span>
                    )}
                    <span className="truncate tracking-tight">
                        {getDisplayLabel()}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {isActive && clearable && (
                        <div 
                            onClick={(e) => { e.stopPropagation(); handleClearAll(); }}
                            className="p-1 hover:bg-black/5 rounded-full transition-colors"
                        >
                            <X className="w-3 h-3 text-slate-400" />
                        </div>
                    )}
                    <ChevronDown className={`w-4 h-4 transition-transform duration-500 ${isOpen ? 'rotate-180' : ''} ${isActive ? 'text-indigo-500' : 'text-slate-400'}`} />
                </div>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: 10, scale: 0.95, filter: 'blur(10px)' }}
                        className="absolute top-full left-0 right-0 sm:right-auto mt-3 w-auto sm:w-72 bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 z-50 p-3 overflow-hidden origin-top-left"
                    >
                        {/* Search Bar */}
                        <div className="relative mb-3 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                            <input 
                                ref={inputRef}
                                type="text"
                                placeholder="ค้นหา..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none ring-2 ring-transparent focus:ring-indigo-500/10 transition-all placeholder:text-slate-400"
                            />
                        </div>

                        <div className="text-[12px] font-medium text-slate-400 px-4 py-2 mb-1 uppercase tracking-widest bg-slate-50/50 rounded-xl flex justify-between items-center">
                            <span>เลือก {label}</span>
                            <span className="text-[10px] opacity-60">{filteredOptions.length} รายการ</span>
                        </div>

                        {multiSelect && (
                            <div className="flex gap-1 mb-2 px-1">
                                <button 
                                    onClick={handleSelectAll}
                                    className="flex-1 py-2 text-[10px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors uppercase tracking-widest"
                                >
                                    เลือกทั้งหมด
                                </button>
                                <button 
                                    onClick={handleClearAll}
                                    className="flex-1 py-2 text-[9px] font-bold text-slate-400 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors uppercase tracking-widest"
                                >
                                    ล้างทั้งหมด
                                </button>
                            </div>
                        )}
                        
                        <div className="max-h-[280px] overflow-y-auto custom-slim-scrollbar space-y-1 pr-1">
                            {!multiSelect && searchQuery === '' && showAllOption && (
                                <button
                                    type="button"
                                    onClick={() => { (onChange as (v: string) => void)('ALL'); setIsOpen(false); }}
                                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group ${value === 'ALL' ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-200' : 'hover:bg-slate-50 text-slate-500'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${value === 'ALL' ? 'bg-white' : 'bg-slate-300 group-hover:bg-indigo-400'} transition-colors`} />
                                        <span className="text-sm">ทั้งหมด</span>
                                    </div>
                                    {value === 'ALL' && <Check className="w-4 h-4" />}
                                </button>
                            )}

                            {filteredOptions.map((opt) => {
                                const isSelected = multiSelect 
                                    ? (Array.isArray(value) && value.includes(opt.key))
                                    : value === opt.key;

                                return (
                                    <button
                                        type="button"
                                        key={opt.key}
                                        onClick={() => handleSelect(opt.key)}
                                        className={`w-full flex items-start justify-between px-4 py-3 rounded-xl transition-all text-left group ${isSelected ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-200' : 'hover:bg-slate-50 text-slate-600'}`}
                                    >
                                        <div className="flex items-start gap-3">
                                            {opt.icon ? (
                                                <span className={`mt-0.5 ${isSelected ? 'text-white' : 'text-slate-400 group-hover:text-indigo-500'}`}>
                                                    {opt.icon}
                                                </span>
                                            ) : (
                                                <div className={`w-2 h-2 rounded-full mt-2 ${isSelected ? 'bg-white' : 'bg-slate-300 group-hover:bg-indigo-400'} transition-colors`} />
                                            )}
                                            <span className="text-sm leading-tight tracking-tight">{opt.label}</span>
                                        </div>
                                        {isSelected && <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                                    </button>
                                );
                            })}

                            {filteredOptions.length === 0 && (
                                <div className="py-8 text-center">
                                    <div className="text-slate-300 mb-2">
                                        <Search className="w-8 h-8 mx-auto opacity-20" />
                                    </div>
                                    <p className="text-xs text-slate-400 font-bold">ไม่พบข้อมูลที่ค้นหา</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default FilterDropdown;
