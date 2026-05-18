
import React, { useState, useEffect, useRef } from 'react';
import { DollarSign, Briefcase, Info, Plus, CheckCircle2, XCircle, Search, ChevronDown, Link as LinkIcon } from 'lucide-react';
import { Client, SponsorshipDetail } from '../../../types/task';
import { useSponsorship } from '../../../hooks/useSponsorship';
import ClientModal from './ClientModal.tsx';

interface CFSponsorshipProps {
    taskId?: string;
    onChange: (data: Partial<SponsorshipDetail> | null) => void;
    initialData?: SponsorshipDetail | null;
}

const CFSponsorship: React.FC<CFSponsorshipProps> = ({ taskId, onChange, initialData }) => {
    const { clients, createClient, fetchClients } = useSponsorship();
    const [isSponsored, setIsSponsored] = useState(initialData?.isSponsored ?? false);
    const [clientId, setClientId] = useState(initialData?.clientId ?? '');
    const [dealValue, setDealValue] = useState(initialData?.dealValue ?? 0);
    const [requirements, setRequirements] = useState(initialData?.requirements ?? '');
    const [paymentStatus, setPaymentStatus] = useState(initialData?.paymentStatus ?? 'UNPAID');
    const [invoiceUrl, setInvoiceUrl] = useState(initialData?.invoiceUrl ?? '');

    // Lazy Fetch Clients: Only when sponsored is active
    useEffect(() => {
        if (isSponsored && clients.length === 0) {
            fetchClients();
        }
    }, [isSponsored, fetchClients, clients.length]);

    // UI States for Smart Search
    // ... rest of the state
    const [searchQuery, setSearchQuery] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedClient = React.useMemo(() => 
        clients.find(c => c.id === clientId),
        [clients, clientId]
    );

    useEffect(() => {
        if (selectedClient) {
            setSearchQuery(selectedClient.name);
        }
    }, [selectedClient]);

    useEffect(() => {
        if (isSponsored) {
            onChange({
                isSponsored,
                clientId: clientId || undefined,
                dealValue,
                requirements,
                paymentStatus,
                isPaid: paymentStatus === 'PAID',
                invoiceUrl,
                taskId: taskId || ''
            });
        } else {
            onChange(null);
        }
    }, [isSponsored, clientId, dealValue, requirements, paymentStatus, invoiceUrl, taskId]);

    // Handle outside click for dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredClients = React.useMemo(() => {
        if (!searchQuery) return clients.slice(0, 5); // Show latest 5 if no search
        return clients.filter(c => 
            c.name.toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 10); // Limit to 10 for UI performance
    }, [clients, searchQuery]);

    const handleSelectClient = (client: Client) => {
        setClientId(client.id);
        setSearchQuery(client.name);
        setIsDropdownOpen(false);
    };

    const handleToggle = () => {
        setIsSponsored(!isSponsored);
    };

    const handleSaveNewClient = async (clientData: Partial<Client>) => {
        const newClient = await createClient(clientData);
        if (newClient) {
            setClientId(newClient.id);
            setSearchQuery(newClient.name);
        }
    };

    return (
        <>
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden transition-all shadow-sm">
                <div 
                    className={`px-6 py-4 flex items-center justify-between cursor-pointer transition-colors ${isSponsored ? 'bg-indigo-50/50' : 'hover:bg-slate-50'}`}
                    onClick={handleToggle}
                >
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isSponsored ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-100 text-slate-400'}`}>
                            <DollarSign className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className={`text-sm font-bold ${isSponsored ? 'text-indigo-900' : 'text-slate-600'}`}>
                                ข้อมูล Sponsorship
                            </h3>
                            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                                {isSponsored ? 'รายการนี้มีสปอนเซอร์' : 'รายการนี้ไม่มีสปอนเซอร์'}
                            </p>
                        </div>
                    </div>
                    <div className={`w-12 h-6 rounded-full p-1 transition-colors relative ${isSponsored ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                        <div className={`w-4 h-4 rounded-full bg-white transition-all shadow-sm ${isSponsored ? 'translate-x-6' : 'translate-x-0'}`} />
                    </div>
                </div>

                {isSponsored && (
                    <div className="p-6 border-t border-indigo-100/50 space-y-6 animate-in slide-in-from-top-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {/* Smart Client Selector */}
                            <div className="space-y-2 relative" ref={dropdownRef}>
                                <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Briefcase className="w-3 h-3" /> ลูกค้า (Client)
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-300 group-focus-within:text-indigo-500 transition-colors">
                                        <Search className="w-4 h-4" />
                                    </div>
                                    <input 
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                            setIsDropdownOpen(true);
                                            if (clientId) setClientId(''); // Reset selection when typing
                                        }}
                                        onFocus={() => setIsDropdownOpen(true)}
                                        placeholder="ค้นหาหรือเพิ่มลูกค้าใหม่..."
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                    />
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                        <ChevronDown className={`w-4 h-4 text-slate-300 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                    </div>
                                </div>

                                {/* Custom Dropdown Overlay */}
                                {isDropdownOpen && (
                                    <div className="absolute z-50 left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50 max-h-60 overflow-hidden flex flex-col">
                                        <div className="overflow-y-auto min-h-0">
                                            {filteredClients.map(client => (
                                                <button
                                                    key={client.id}
                                                    type="button"
                                                    onClick={() => handleSelectClient(client)}
                                                    className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center gap-3 group transition-colors border-b border-slate-50 last:border-0"
                                                >
                                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                                                        <Briefcase className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-700">{client.name}</p>
                                                        {client.contactPerson && <p className="text-[10px] text-slate-400">{client.contactPerson}</p>}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>

                                        {/* Action Button for New Client */}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsDropdownOpen(false);
                                                setIsClientModalOpen(true);
                                            }}
                                            className="w-full px-4 py-4 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors flex items-center gap-3 shadow-inner"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-md">
                                                <Plus className="w-4 h-4" />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-xs font-bold uppercase tracking-tight">เพิ่มลูกค้าใหม่</p>
                                                <p className="text-[10px] opacity-70">บันทึก "{searchQuery || 'ลูกค้า'}" เข้าระบบ Master</p>
                                            </div>
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Deal Value */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <DollarSign className="w-3 h-3" /> ยอดเงินที่ตกลง (Deal Value)
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-1 flex items-center pointer-events-none">
                                        <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] font-bold ml-1.5 shadow-sm">฿</span>
                                    </div>
                                    <input 
                                        type="number"
                                        value={dealValue}
                                        onChange={(e) => setDealValue(Number(e.target.value))}
                                        placeholder="0.00"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-2.5 text-xs font-bold text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all border-none shadow-inner"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Requirements */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Info className="w-3 h-3" /> รายละเอียด/เงื่อนไข (Requirements)
                            </label>
                            <textarea 
                                value={requirements}
                                onChange={(e) => setRequirements(e.target.value)}
                                placeholder="ระบุเงื่อนไขพิเศษ เช่น พูดถึงแบรนด์ 30 วินาที, วางสินค้าในเฟรม..."
                                rows={3}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none border-none shadow-inner"
                            />
                        </div>

                        {/* Invoice URL */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <LinkIcon className="w-3 h-3" /> ลิงค์ใบแจ้งหนี้/หลักฐาน (Invoice URL)
                            </label>
                            <input 
                                type="url"
                                value={invoiceUrl}
                                onChange={(e) => setInvoiceUrl(e.target.value)}
                                placeholder="https://drive.google.com/... หรือ ลิงค์ไฟล์หลักฐาน"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all border-none shadow-inner"
                            />
                        </div>

                        {/* Payment Status */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                                สถานะการจ่ายเงิน
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {['UNPAID', 'PARTIAL', 'PAID'].map(status => (
                                    <button
                                        key={status}
                                        type="button"
                                        onClick={() => setPaymentStatus(status)}
                                        className={`px-4 py-2.5 rounded-xl text-[11px] font-medium transition-all flex items-center gap-2 ${
                                            paymentStatus === status 
                                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 ring-2 ring-indigo-500/10' 
                                                : 'bg-white text-slate-400 border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30'
                                        }`}
                                    >
                                        {status === 'PAID' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                                        {status === 'UNPAID' ? 'ยังไม่จ่าย' : status === 'PARTIAL' ? 'จ่ายบางส่วน' : 'จ่ายครบแล้ว'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <ClientModal 
                isOpen={isClientModalOpen}
                onClose={() => setIsClientModalOpen(false)}
                onSave={handleSaveNewClient}
                initialName={searchQuery}
            />
        </>
    );
};

export default CFSponsorship;

