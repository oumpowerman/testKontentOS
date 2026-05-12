
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ShootTrip, Task, MasterOption } from '../../../types';
import { 
    X, Receipt, Film, Plus, Trash2, Calculator, 
    ArrowRight, Target, Layout, Check, Info, DollarSign,
    TrendingUp, BarChart3, Calendar, MapPin, ExternalLink,
    Sparkles, Video, Link as LinkIcon, Edit2, Save
} from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../../../lib/supabase';
import { useToast } from '../../../context/ToastContext';
import { useGlobalDialog } from '../../../context/GlobalDialogContext';
import TransactionModal from '../TransactionModal';
import ContentPickerModal from './ContentPickerModal'; // Import New Component

interface Props {
    trip: ShootTrip;
    onClose: () => void;
    onRefresh: () => void;
    onUpdate: (id: string, updates: Partial<ShootTrip>) => Promise<boolean>;
    onDelete: (id: string) => Promise<boolean>;
    masterOptions: MasterOption[];
    tasks: Task[];
}

const TripDetailPanel: React.FC<Props> = ({ trip, onClose, onRefresh, onUpdate, onDelete, masterOptions, tasks }) => {
    const { showToast } = useToast();
    const { showConfirm } = useGlobalDialog();
    
    // UI State
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [isQuickCreateMode, setIsQuickCreateMode] = useState(false);
    const [isPickerOpen, setIsPickerOpen] = useState(false); // Picker State
    const [newClipTitle, setNewClipTitle] = useState('');
    
    // Editing State
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(trip.title);
    const [editLocation, setEditLocation] = useState(trip.locationName);
    const [editDate, setEditDate] = useState(format(trip.date, 'yyyy-MM-dd'));
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    // Sync state when trip prop changes
    useEffect(() => {
        setEditTitle(trip.title);
        setEditLocation(trip.locationName);
        setEditDate(format(trip.date, 'yyyy-MM-dd'));
    }, [trip]);

    // Updated Logic to support Bulk Linking
    const handleBulkLinkContent = async (contentIds: string[]) => {
        if (contentIds.length === 0) return;
        
        try {
            const dateStr = format(new Date(trip.date), 'yyyy-MM-dd');
            // Update BOTH trip reference AND metadata for consistency
            const { error } = await supabase.from('contents').update({ 
                shoot_trip_id: trip.id,
                shoot_location: trip.locationName,
                shoot_date: dateStr
            }).in('id', contentIds); // Use .in for bulk update
            
            if (error) throw error;

            onRefresh();
            showToast(`เชื่อมโยง ${contentIds.length} คอนเทนต์เรียบร้อย 🎬`, 'success');
        } catch (err) { 
            console.error(err); 
            showToast('เกิดข้อผิดพลาดในการเชื่อมโยง', 'error');
        }
    };

    const handleUnlinkContent = async (contentId: string) => {
        try {
            await supabase.from('contents').update({ shoot_trip_id: null }).eq('id', contentId);
            onRefresh();
        } catch (err) { console.error(err); }
    };

    // Path 2: Create New Directly inside Trip
    const handleQuickCreateContent = async () => {
        if (!newClipTitle.trim()) return;
        try {
            const dateStr = format(new Date(trip.date), 'yyyy-MM-dd');
            const { data, error } = await supabase.from('contents').insert({
                title: newClipTitle,
                status: 'TODO',
                shoot_trip_id: trip.id,
                shoot_location: trip.locationName,
                shoot_date: dateStr,
                start_date: dateStr,
                end_date: dateStr
            }).select().single();

            if (error) throw error;
            
            setNewClipTitle('');
            setIsQuickCreateMode(false);
            onRefresh();
            showToast(`สร้างคลิปใหม่ในกอง ${trip.locationName} แล้ว ✨`, 'success');
        } catch (err) { console.error(err); }
    };

    const handleAddExpense = async (data: any) => {
        try {
            const payload = {
                type: 'EXPENSE',
                category_key: data.categoryKey,
                amount: data.amount,
                date: data.date,
                name: data.name,
                description: data.description,
                shoot_trip_id: trip.id,
                vat_rate: data.vatRate,
                vat_amount: data.vatAmount,
                wht_rate: data.whtRate,
                wht_amount: data.whtAmount,
                net_amount: data.netAmount,
                tax_invoice_no: data.taxInvoiceNo,
                created_by: data.createdBy
            };
            
            await supabase.from('finance_transactions').insert(payload);
            onRefresh();
            return true;
        } catch (err) { return false; }
    };

    const handleSaveChanges = async () => {
        setIsSavingEdit(true);
        const success = await onUpdate(trip.id, {
            title: editTitle,
            locationName: editLocation,
            date: new Date(editDate)
        });
        setIsSavingEdit(false);
        if (success) setIsEditing(false);
    };

    const handleDeleteTrip = async () => {
        const confirmed = await showConfirm(
            `ต้องการลบกองถ่าย "${trip.title}" ใช่หรือไม่? \nข้อมูลการเงินที่ผูกไว้จะถูกลบไปด้วย`,
            'ยืนยันการลบ'
        );
        if (confirmed) {
            const success = await onDelete(trip.id);
            if (success) onClose();
        }
    };

    // Available contents to link (Filter out items already assigned to this or any other trip)
    const availableContents = tasks.filter(t => t.type === 'CONTENT' && !(t as any).shoot_trip_id);

    return createPortal(
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 md:p-8 animate-in fade-in duration-300">
            <div className="bg-[#fcfdfe] w-full max-w-6xl h-full max-h-[90vh] rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col border-[8px] border-white ring-1 ring-sky-100 animate-in zoom-in-95 duration-500">
                
                {/* --- HERO HEADER SECTION --- */}
                <div className="p-10 bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600 text-white shrink-0 relative overflow-hidden">
                    {/* Ambient Blobs */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/20 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-300/30 rounded-full blur-[80px] -ml-20 -mb-20 pointer-events-none"></div>
                    
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-8">
                            <div className="flex items-center gap-4 w-full">
                                <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl border border-white/20 shadow-inner shrink-0">
                                    <Target className="w-8 h-8 text-white" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    {isEditing ? (
                                        <div className="space-y-3 animate-in fade-in slide-in-from-left-2">
                                            <input 
                                                type="text" 
                                                value={editTitle}
                                                onChange={e => setEditTitle(e.target.value)}
                                                className="w-full bg-white/20 border border-white/30 rounded-xl px-4 py-2 text-2xl font-bold text-white placeholder:text-white/50 outline-none focus:bg-white/30"
                                                placeholder="Trip Title"
                                            />
                                            <div className="flex gap-3">
                                                <input 
                                                    type="text" 
                                                    value={editLocation}
                                                    onChange={e => setEditLocation(e.target.value)}
                                                    className="flex-1 bg-white/20 border border-white/30 rounded-xl px-3 py-1.5 text-sm font-bold text-white placeholder:text-white/50 outline-none focus:bg-white/30"
                                                    placeholder="Location"
                                                />
                                                <input 
                                                    type="date" 
                                                    value={editDate}
                                                    onChange={e => setEditDate(e.target.value)}
                                                    className="w-40 bg-white/20 border border-white/30 rounded-xl px-3 py-1.5 text-sm font-bold text-white outline-none focus:bg-white/30 cursor-pointer"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <h3 className="text-3xl font-bold tracking-tight truncate pr-4">{trip.title}</h3>
                                            <div className="flex items-center gap-4 mt-2 text-sky-50 font-medium">
                                                <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {trip.locationName}</span>
                                                <span className="opacity-40">|</span>
                                                <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {format(trip.date, 'd MMMM yyyy')}</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-2 shrink-0 ml-4">
                                {isEditing ? (
                                    <>
                                        <button 
                                            onClick={handleDeleteTrip}
                                            className="p-3 bg-red-500/80 hover:bg-red-600 rounded-full transition-all text-white border border-white/20 shadow-lg"
                                            title="ลบกองถ่าย"
                                        >
                                            <Trash2 className="w-6 h-6" />
                                        </button>
                                        <button 
                                            onClick={handleSaveChanges}
                                            disabled={isSavingEdit}
                                            className="p-3 bg-green-500 hover:bg-green-600 rounded-full transition-all text-white border border-white/20 shadow-lg"
                                            title="บันทึก"
                                        >
                                            <Check className="w-6 h-6 stroke-[3px]" />
                                        </button>
                                        <button 
                                            onClick={() => { setIsEditing(false); setEditTitle(trip.title); }} // Cancel
                                            className="p-3 bg-white/20 hover:bg-white/30 rounded-full transition-all text-white border border-white/10"
                                            title="ยกเลิก"
                                        >
                                            <X className="w-6 h-6" />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button 
                                            onClick={() => setIsEditing(true)} 
                                            className="p-3 bg-white/20 hover:bg-white/30 rounded-full transition-all text-white border border-white/10"
                                            title="แก้ไขข้อมูล"
                                        >
                                            <Edit2 className="w-6 h-6" />
                                        </button>
                                        <button 
                                            onClick={onClose} 
                                            className="p-3 bg-white/10 hover:bg-white/30 rounded-full transition-all hover:rotate-90 active:scale-90 border border-white/10"
                                        >
                                            <X className="w-6 h-6" />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                        
                        {/* Stats Dashboard */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/10 flex items-center justify-between shadow-sm">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-100 mb-1">Session Cost</p>
                                    <p className="text-4xl font-bold">฿ {trip.totalCost.toLocaleString()}</p>
                                </div>
                                <div className="p-3 bg-white/10 rounded-2xl"><DollarSign className="w-6 h-6" /></div>
                            </div>
                            
                            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/10 flex items-center justify-between shadow-sm">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-100 mb-1">Clips Produced</p>
                                    <p className="text-4xl font-bold">{trip.clipCount} <span className="text-sm font-medium opacity-60">Videos</span></p>
                                </div>
                                <div className="p-3 bg-white/10 rounded-2xl"><Film className="w-6 h-6" /></div>
                            </div>

                            <div className="bg-emerald-400/90 backdrop-blur-md rounded-3xl p-6 border border-white/20 flex items-center justify-between shadow-lg shadow-emerald-900/10">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-50 mb-1">Cost Per Video</p>
                                    <p className="text-4xl font-bold">฿ {trip.avgCostPerClip.toFixed(0)}</p>
                                </div>
                                <div className="p-3 bg-white/20 rounded-2xl"><TrendingUp className="w-6 h-6" /></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- BODY CONTENT: TWO COLUMNS --- */}
                <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                    
                    {/* LEFT: Expenses & Finance */}
                    <div className="lg:w-1/2 border-r border-slate-100 flex flex-col h-full bg-[#fbfcfd]">
                        <div className="p-8 pb-4 flex justify-between items-center">
                            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Receipt className="w-5 h-5 text-sky-500" /> Expense Items (รายจ่ายหน้างาน)
                            </h4>
                            <button 
                                onClick={() => setIsExpenseModalOpen(true)}
                                className="px-4 py-2 bg-sky-100 text-sky-600 rounded-xl hover:bg-sky-600 hover:text-white transition-all font-bold text-xs flex items-center gap-1.5 shadow-sm"
                            >
                                <Plus className="w-4 h-4 stroke-[3px]" /> เพิ่มรายการจ่าย
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 pt-2 space-y-3 scrollbar-thin scrollbar-thumb-sky-100">
                            {trip.expenses?.map((ex: any) => (
                                <div key={ex.id} className="flex justify-between items-center p-5 bg-white rounded-[2rem] border border-slate-100 group hover:border-sky-300 hover:shadow-md transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-slate-50 rounded-2xl text-slate-400 group-hover:bg-sky-50 group-hover:text-sky-500 transition-colors">
                                            <DollarSign className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 text-base">{ex.name}</p>
                                            <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 uppercase tracking-tighter">{ex.category_key}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-black text-red-500 text-lg">- ฿{Number(ex.amount).toLocaleString()}</span>
                                        {ex.receipt_url && <p className="text-[9px] text-sky-500 font-bold underline mt-1">View Receipt</p>}
                                    </div>
                                </div>
                            ))}
                            {trip.expenses?.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center text-slate-300 py-20 bg-white/50 rounded-[2.5rem] border-2 border-dashed border-slate-100">
                                    <Receipt className="w-12 h-12 opacity-20 mb-3" />
                                    <p className="font-medium">ยังไม่มีรายการค่าใช้จ่ายในกองนี้</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT: Production Pipeline */}
                    <div className="lg:w-1/2 flex flex-col h-full bg-white">
                        <div className="p-8 pb-4 flex justify-between items-center">
                            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Film className="w-5 h-5 text-teal-500" /> Production Pipeline (คลิปในเซสชัน)
                            </h4>
                            <button 
                                onClick={() => setIsQuickCreateMode(!isQuickCreateMode)}
                                className={`px-4 py-2 rounded-xl transition-all font-bold text-xs flex items-center gap-1.5 shadow-sm border ${isQuickCreateMode ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100'}`}
                            >
                                {isQuickCreateMode ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4 stroke-[3px]" />}
                                {isQuickCreateMode ? 'ปิด' : 'สร้างคลิปใหม่'}
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 pt-2 space-y-4 scrollbar-thin scrollbar-thumb-teal-100">
                            {/* Quick Create Form */}
                            {isQuickCreateMode && (
                                <div className="p-5 bg-indigo-50 border-2 border-indigo-200 rounded-[2.5rem] animate-in slide-in-from-top-4 duration-300">
                                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-1">
                                        <Sparkles className="w-3 h-3"/> Fast creation for this session
                                    </p>
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            className="flex-1 px-4 py-3 bg-white border border-indigo-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                                            placeholder="ชื่อคอนเทนต์ที่จะถ่ายวันนี้..."
                                            value={newClipTitle}
                                            onChange={e => setNewClipTitle(e.target.value)}
                                            autoFocus
                                            onKeyDown={e => e.key === 'Enter' && handleQuickCreateContent()}
                                        />
                                        <button 
                                            onClick={handleQuickCreateContent}
                                            className="p-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 shadow-md active:scale-95 transition-all"
                                        >
                                            <Video className="w-6 h-6" />
                                        </button>
                                    </div>
                                    <p className="text-[9px] text-indigo-400 mt-2 ml-1">* จะระบุ Location: {trip.locationName} และวันที่อัตโนมัติ</p>
                                </div>
                            )}

                            {trip.contents?.map((content: any) => (
                                <div key={content.id} className="flex items-center justify-between p-5 bg-teal-50/30 rounded-[2.5rem] border border-teal-100 group hover:bg-teal-50 hover:shadow-sm transition-all">
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-teal-400 shrink-0 shadow-sm border border-teal-50">
                                            <Film className="w-6 h-6" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-slate-800 text-base truncate">{content.title}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] text-teal-600 bg-white px-2 py-0.5 rounded-lg border border-teal-100 font-bold">{content.content_formats && content.content_formats.length > 0 ? content.content_formats[0] : 'General'}</span>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${content.status === 'DONE' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>{content.status}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleUnlinkContent(content.id)} 
                                        className="p-3 text-teal-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded-full hover:bg-white shadow-sm"
                                        title="นำออกจากเซสชัน"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}

                            {/* REPLACED: NEW BUTTON LINK */}
                            <div className="mt-6 pt-6 border-t border-slate-100">
                                <button 
                                    onClick={() => setIsPickerOpen(true)}
                                    className="w-full py-4 bg-white border-2 border-dashed border-slate-200 rounded-[2rem] text-slate-400 font-bold hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/30 transition-all flex flex-col items-center justify-center gap-2 group/btn"
                                >
                                    <div className="p-3 bg-slate-50 rounded-full group-hover/btn:bg-indigo-100 group-hover/btn:text-indigo-600 transition-colors">
                                        <LinkIcon className="w-6 h-6" />
                                    </div>
                                    <span className="text-sm">เชื่อมโยงคลิปจากคลัง (Link Existing)</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Insight bar */}
                <div className="bg-slate-50 p-6 border-t border-slate-100 flex items-center justify-center shrink-0">
                    <p className="text-xs font-bold text-slate-400 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-yellow-400" />
                        ระบบจะทำการซิงค์พิกัด {trip.locationName} และวันที่ให้คอนเทนต์ที่ถูกเชื่อมโยงโดยอัตโนมัติ
                    </p>
                </div>
            </div>
            
            {/* Modal for Expense Insertion */}
            <TransactionModal 
                isOpen={isExpenseModalOpen}
                onClose={() => setIsExpenseModalOpen(false)}
                onSave={handleAddExpense}
                masterOptions={masterOptions}
                projects={[]} 
                users={[]}
                defaultTrip={trip} // Pass current trip to auto-fill
            />

            {/* NEW: Content Picker Modal */}
            <ContentPickerModal 
                isOpen={isPickerOpen}
                onClose={() => setIsPickerOpen(false)}
                availableTasks={availableContents}
                masterOptions={masterOptions}
                onConfirm={handleBulkLinkContent}
            />

        </div>,
        document.body
    );
};

export default TripDetailPanel;
