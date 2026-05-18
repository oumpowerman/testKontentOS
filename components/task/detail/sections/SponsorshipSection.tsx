
import React from 'react';
import { DollarSign, Briefcase, Info, CheckCircle2, Clock, Link as LinkIcon, ExternalLink } from 'lucide-react';
import { SponsorshipDetail } from '../../../../types/task';
import { useSponsorship } from '../../../../hooks/useSponsorship';

interface SponsorshipSectionProps {
    taskId: string;
}

const SponsorshipSection: React.FC<SponsorshipSectionProps> = ({ taskId }) => {
    const { sponsorship, loading } = useSponsorship(taskId);

    if (loading) {
        return (
            <div className="bg-slate-50 animate-pulse h-24 rounded-2xl border border-slate-100" />
        );
    }

    if (!sponsorship || !sponsorship.isSponsored) return null;

    return (
        <div className="bg-white rounded-3xl border border-indigo-100/50 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-indigo-50/50 px-6 sm:px-8 py-4 flex items-center justify-between border-b border-indigo-100/30">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-100">
                        <DollarSign className="w-5 h-5 font-bold" />
                    </div>
                    <div>
                        <h3 className="text-xs sm:text-sm font-black text-indigo-900 uppercase tracking-tight">Sponsorship Information</h3>
                        <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Detail & Requirements</p>
                    </div>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-tighter flex items-center gap-2 ${sponsorship.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {sponsorship.paymentStatus === 'PAID' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                    {sponsorship.paymentStatus === 'PAID' ? 'PAID' : sponsorship.paymentStatus}
                </div>
            </div>

            <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    {/* Client */}
                    <div className="space-y-2">
                        <span className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.2em] flex items-center gap-2">
                            <Briefcase className="w-3 h-3" /> Sponsor Client
                        </span>
                        <div className="flex items-center gap-3">
                            {sponsorship.client?.logoUrl ? (
                                <img src={sponsorship.client.logoUrl} alt={sponsorship.client.name} className="w-10 h-10 rounded-xl object-contain border border-slate-100" />
                            ) : (
                                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                                    <Briefcase className="w-5 h-5" />
                                </div>
                            )}
                            <div>
                                <p className="text-sm font-bold text-slate-700">{sponsorship.client?.name || 'Unknown Client'}</p>
                                <p className="text-[10px] text-slate-400 font-medium">{sponsorship.client?.contactPerson || 'No contact person'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Value */}
                    <div className="space-y-2">
                        <span className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.2em] flex items-center gap-2">
                            <DollarSign className="w-3 h-3" /> Deal Value
                        </span>
                        <p className="text-2xl font-black text-indigo-600 tracking-tighter">
                            ฿{sponsorship.dealValue.toLocaleString()}
                        </p>
                    </div>

                    {/* Invoice Link */}
                    {sponsorship.invoiceUrl && (
                        <div className="space-y-2 pt-2">
                            <span className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.2em] flex items-center gap-2">
                                <LinkIcon className="w-3 h-3" /> Invoice/Link
                            </span>
                            <a 
                                href={sponsorship.invoiceUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors border border-indigo-100"
                            >
                                <ExternalLink className="w-3 h-3" />
                                View Document
                            </a>
                        </div>
                    )}
                </div>

                {/* Requirements */}
                <div className="space-y-3">
                    <span className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Info className="w-3 h-3" /> Sponsorship Requirements
                    </span>
                    <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 min-h-[100px]">
                        <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                            {sponsorship.requirements || 'No special requirements noted for this project.'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SponsorshipSection;
