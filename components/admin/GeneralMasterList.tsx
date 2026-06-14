
import React, { useEffect } from 'react';
import { MasterOption } from '../../types';
import { Edit2, Trash2, Database, Plus, Loader2 } from 'lucide-react';
import { useGlobalDialog } from '../../context/GlobalDialogContext';
import { useChannels } from '../../hooks/useChannels';

interface GeneralMasterListProps {
    typeLabel: string;
    options: MasterOption[];
    loading: boolean;
    onAdd: () => void;
    onEdit: (option: MasterOption) => void;
    onDelete: (id: string) => void;
}

const GeneralMasterList: React.FC<GeneralMasterListProps> = ({ typeLabel, options, loading, onAdd, onEdit, onDelete }) => {
    const { showConfirm } = useGlobalDialog();
    const { channels, fetchChannels } = useChannels();

    useEffect(() => {
        if (channels.length === 0) {
            fetchChannels();
        }
    }, [fetchChannels, channels.length]);

    return (
        <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden animate-in slide-in-from-bottom-2">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="font-bold text-gray-700 flex items-center"><Database className="w-4 h-4 mr-2" /> รายการ {typeLabel}</h3>
                <button onClick={onAdd} className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors font-bold flex items-center"><Plus className="w-3 h-3 mr-1" /> เพิ่มใหม่</button>
            </div>
            {loading ? (
                <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>
            ) : (
                <div className="divide-y divide-gray-100">
                    {options.length === 0 && <div className="p-8 text-center text-gray-400">ยังไม่มีข้อมูล</div>}
                    {options.map(option => {
                        const relatedChannel = option.parentKey ? channels.find(c => c.id === option.parentKey) : null;
                        const isPillarOrCategory = option.type === 'PILLAR' || option.type === 'CATEGORY' || option.type === 'SCRIPT_CATEGORY';

                        return (
                            <div key={option.id} className="p-4 flex items-center justify-between hover:bg-gray-50 group">
                                <div className="flex items-center gap-4">
                                    <div className={`w-2 h-2 rounded-full ${option.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                                    <div className="flex items-center gap-2">
                                        <div className={`px-3 py-1 rounded-md text-sm font-bold border border-transparent ${option.color}`}>{option.label}</div>
                                        {isPillarOrCategory && (
                                            relatedChannel ? (
                                                <span className="text-[10px] px-2 py-0.5 font-bold rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center gap-1">
                                                    📺 {relatedChannel.name}
                                                </span>
                                            ) : (
                                                <span className="text-[10px] px-2 py-0.5 font-bold rounded-full bg-slate-50 text-slate-500 border border-slate-100 flex items-center gap-1">
                                                    🌐 Global
                                                </span>
                                            )
                                        )}
                                    </div>
                                    {option.type === 'STATUS' && option.progressValue !== undefined && (
                                        <div className="flex items-center gap-2">
                                            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                                                <div className="h-full bg-indigo-500" style={{ width: `${option.progressValue}%` }} />
                                            </div>
                                            <span className="text-[10px] font-black text-indigo-600">{option.progressValue}%</span>
                                        </div>
                                    )}
                                    <span className="text-xs text-gray-400 font-mono hidden md:block">{option.key}</span>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => onEdit(option)} className="p-1.5 text-gray-400 hover:text-indigo-600 bg-gray-50 hover:bg-white rounded-lg"><Edit2 className="w-4 h-4" /></button>
                                    <button onClick={async () => { 
                                        if(await showConfirm('ลบข้อมูลนี้?')) onDelete(option.id); 
                                    }} className="p-1.5 text-gray-400 hover:text-red-600 bg-gray-50 hover:bg-white rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default GeneralMasterList;
