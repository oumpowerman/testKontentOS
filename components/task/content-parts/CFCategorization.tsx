import React, { useState } from 'react';
import { Layout, Layers, Tag, ChevronRight } from 'lucide-react';
import { MasterOption } from '../../../types';
import OptionSelectionModal from '../../ui/OptionSelectionModal';

interface CFCategorizationProps {
    contentFormats: string[];
    setContentFormats: (val: string[]) => void;
    pillar: string;
    setPillar: (val: string) => void;
    category: string;
    setCategory: (val: string) => void;
    formatOptions: MasterOption[];
    pillarOptions: MasterOption[];
    categoryOptions: MasterOption[];
}

const CFCategorization: React.FC<CFCategorizationProps> = ({ 
    contentFormats, setContentFormats, pillar, setPillar, category, setCategory,
    formatOptions, pillarOptions, categoryOptions
}) => {
    const [activeModal, setActiveModal] = useState<'FORMAT' | 'PILLAR' | 'CATEGORY' | null>(null);

    // Helpers to get display values
    const getLabel = (options: MasterOption[], key: string) => options.find(o => o.key === key)?.label || 'Select...';

    // Internal Component for the new Card Design
    const SelectionCard = ({ 
        label, 
        value, 
        placeholder, 
        icon: Icon, 
        theme, 
        onClick 
    }: { 
        label: string, 
        value: string, 
        placeholder: string,
        icon: any, 
        theme: 'pink' | 'blue' | 'emerald', 
        onClick: () => void 
    }) => {
        // Theme Configurations
        const styles = {
            pink: { 
                bg: 'bg-gradient-to-br from-white to-pink-50', 
                border: 'border-pink-200', 
                hoverBorder: 'hover:border-pink-300', 
                text: 'text-pink-600', 
                subText: 'text-pink-400',
                icon: 'text-pink-100',
                ring: 'focus:ring-pink-100',
                badge: 'bg-pink-100 text-pink-600'
            },
            blue: { 
                bg: 'bg-gradient-to-br from-white to-blue-50', 
                border: 'border-blue-200', 
                hoverBorder: 'hover:border-blue-300', 
                text: 'text-blue-600', 
                subText: 'text-blue-400',
                icon: 'text-blue-100',
                ring: 'focus:ring-blue-100',
                badge: 'bg-blue-100 text-blue-600'
            },
            emerald: { 
                bg: 'bg-gradient-to-br from-white to-emerald-50', 
                border: 'border-emerald-200', 
                hoverBorder: 'hover:border-emerald-300', 
                text: 'text-emerald-600', 
                subText: 'text-emerald-400',
                icon: 'text-emerald-100',
                ring: 'focus:ring-emerald-100',
                badge: 'bg-emerald-100 text-emerald-600'
            },
            empty: {
                bg: 'bg-white',
                border: 'border-dashed border-gray-200',
                hoverBorder: 'hover:border-gray-300 hover:bg-gray-50',
                text: 'text-gray-400',
                subText: 'text-gray-400',
                icon: 'text-gray-100',
                ring: 'focus:ring-gray-100',
                badge: 'hidden'
            }
        };

        const activeStyle = value ? styles[theme] : styles.empty;
        const hasValue = !!value;

        return (
            <button 
                type="button"
                onClick={onClick}
                className={`
                    relative w-full h-32 rounded-[1.5rem] border-2 transition-all duration-300 ease-out group overflow-hidden
                    flex flex-col items-start justify-between p-5 text-left shadow-sm hover:shadow-md
                    ${activeStyle.bg} ${activeStyle.border} ${activeStyle.hoverBorder}
                    active:scale-95 outline-none ${activeStyle.ring}
                `}
            >
                {/* Background Icon (Decorative) */}
                <div className={`
                    absolute -bottom-4 -right-4 transition-transform duration-500 ease-in-out
                    group-hover:scale-110 group-hover:rotate-12
                    ${activeStyle.icon}
                `}>
                    <Icon className="w-24 h-24 opacity-60" />
                </div>

                {/* Top Label */}
                <div className="flex justify-between items-center w-full z-10">
                    <span className={`
                        text-[12px] font-bold uppercase tracking-widest transition-colors duration-300
                        ${hasValue ? activeStyle.subText : 'text-gray-300'}
                    `}>
                        {label}
                    </span>
                    {hasValue ? (
                        <div className={`p-1.5 rounded-full ${activeStyle.badge} flex items-center justify-center`}>
                             <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></div>
                        </div>
                    ) : (
                         <ChevronRight className="w-4 h-4 text-gray-300 opacity-50 group-hover:translate-x-1 transition-transform" />
                    )}
                </div>

                {/* Main Value */}
                <span className={`
                    relative z-10 font-bold leading-tight transition-all duration-300 line-clamp-2 pr-8
                    ${hasValue ? `text-[16px] ${activeStyle.text}` : 'text-md text-gray-300 font-medium italic'}
                `}>
                    {value || placeholder}
                </span>
            </button>
        );
    };

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* 1. FORMAT */}
                <SelectionCard 
                    label="Format" 
                    value={contentFormats.length > 0 
                        ? (contentFormats.length === 1 
                            ? getLabel(formatOptions, contentFormats[0]) 
                            : `${getLabel(formatOptions, contentFormats[0])} +${contentFormats.length - 1}`)
                        : ''}
                    placeholder="เลือกรูปแบบ"
                    icon={Layout}
                    theme="pink"
                    onClick={() => setActiveModal('FORMAT')}
                />

                {/* 2. PILLAR */}
                <SelectionCard 
                    label="Content Pillar" 
                    value={pillar ? getLabel(pillarOptions, pillar) : ''}
                    placeholder="เลือกแกน"
                    icon={Layers}
                    theme="blue"
                    onClick={() => setActiveModal('PILLAR')}
                />

                {/* 3. CATEGORY */}
                <SelectionCard 
                    label="Category" 
                    value={category ? getLabel(categoryOptions, category) : ''}
                    placeholder="เลือกหมวด"
                    icon={Tag}
                    theme="emerald"
                    onClick={() => setActiveModal('CATEGORY')}
                />

            </div>

            {/* Modals (No changes to logic, just wiring up) */}
            <OptionSelectionModal 
                isOpen={activeModal === 'FORMAT'}
                onClose={() => setActiveModal(null)}
                title="เลือกรูปแบบงาน (Select Format)"
                options={formatOptions}
                selectedKeys={contentFormats}
                onSelectMulti={setContentFormats}
                colorTheme="pink"
                isMulti={true}
            />
            
            <OptionSelectionModal 
                isOpen={activeModal === 'PILLAR'}
                onClose={() => setActiveModal(null)}
                title="เลือกแกนเนื้อหา (Select Pillar)"
                options={pillarOptions}
                selectedKey={pillar}
                onSelect={setPillar}
                colorTheme="blue"
            />
            
            <OptionSelectionModal 
                isOpen={activeModal === 'CATEGORY'}
                onClose={() => setActiveModal(null)}
                title="เลือกหมวดหมู่ (Select Category)"
                options={categoryOptions}
                selectedKey={category}
                onSelect={setCategory}
                colorTheme="emerald"
            />
        </>
    );
};

export default CFCategorization;