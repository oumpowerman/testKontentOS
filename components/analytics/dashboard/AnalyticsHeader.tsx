
import React, { useEffect, useState } from 'react';
import { Search, TrendingUp, Download, Filter, Hash, Star } from 'lucide-react';
import FilterDropdown from '../../common/FilterDropdown';

interface AnalyticsHeaderProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    platformFilter: string;
    setPlatformFilter: (filter: string) => void;
    channelFilter: string;
    setChannelFilter: (filter: string) => void;
    timeRange: string;
    setTimeRange: (range: string) => void;
    channels: any[];
}

const AnalyticsHeader: React.FC<AnalyticsHeaderProps> = ({ 
    searchTerm, 
    setSearchTerm, 
    platformFilter, 
    setPlatformFilter,
    channelFilter,
    setChannelFilter,
    timeRange,
    setTimeRange,
    channels
}) => {
    const [defaultChannelId, setDefaultChannelId] = useState<string>('ALL');

    useEffect(() => {
        const stored = localStorage.getItem('defaultAnalyticsChannel');
        if (stored) {
            setDefaultChannelId(stored);
        }
    }, []);

    const handleSetDefaultChannel = () => {
        localStorage.setItem('defaultAnalyticsChannel', channelFilter);
        setDefaultChannelId(channelFilter);
    };

    const channelOptions = channels.map(ch => ({
        key: ch.id,
        label: ch.name
    }));

    const platformOptions = [
        { key: 'TIKTOK', label: 'TikTok' },
        { key: 'FACEBOOK', label: 'Facebook' },
        { key: 'INSTAGRAM', label: 'Instagram' },
        { key: 'YOUTUBE', label: 'YouTube' }
    ];

    const timeOptions = [
        { key: 'CURRENT_MONTH', label: 'เดือนปัจจุบัน' },
        { key: '7', label: '7 วันล่าสุด' },
        { key: '30', label: '30 วันล่าสุด' },
        { key: '90', label: '90 วันล่าสุด' },
        { key: '365', label: '1 ปีล่าสุด' },
        { key: 'ALL', label: 'ทั้งหมด' }
    ];

    return (
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 pb-6 border-b border-slate-100 flex-wrap relative z-40">
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <div className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-md uppercase tracking-wider">
                        Enterprise Analytics
                    </div>
                    <div className="h-1 w-1 rounded-full bg-slate-300"></div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-widest">REAL-TIME INTELLIGENCE</span>
                </div>
                <h1 className="text-4xl font-semibold text-slate-900 tracking-tight flex items-center gap-3">
                    <TrendingUp className="w-9 h-9 text-indigo-600" />
                    วิเคราะห์ข้อมูลคอนเทนต์
                </h1>
                <p className="text-slate-500 font-medium mt-2 max-w-md">เจาะลึกประสิทธิภาพรายช่องทางและแพลตฟอร์ม เพื่อยกระดับกลยุทธ์การผลิต</p>
            </div>

            <div className="flex flex-wrap items-center gap-4 relative">
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                    <input 
                        type="text" 
                        placeholder="กรองรายการคอนเทนต์..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl w-full sm:w-60 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm outline-none text-sm font-semibold text-slate-700"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <FilterDropdown 
                        label="Channel"
                        options={channelOptions}
                        value={channelFilter}
                        onChange={setChannelFilter}
                        icon={<Hash className="w-4 h-4" />}
                        placeholder="เลือกทุกช่อง"
                    />
                    
                    <button 
                        onClick={handleSetDefaultChannel}
                        title={channelFilter === defaultChannelId ? "ตั้งเป็นค่าเริ่มต้นแล้ว" : "ตั้งช่องนี้เป็นค่าเริ่มต้น"}
                        className={`h-12 w-12 flex items-center justify-center rounded-2xl transition-all shadow-sm border ${
                            channelFilter === defaultChannelId 
                            ? 'bg-amber-100 border-amber-200 text-amber-600' 
                            : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'
                        }`}
                    >
                        <Star className={`w-5 h-5 ${channelFilter === defaultChannelId ? 'fill-amber-500' : ''}`} />
                    </button>
                </div>
                
                <FilterDropdown 
                    label="Platform"
                    options={platformOptions}
                    value={platformFilter}
                    onChange={setPlatformFilter}
                    icon={<Filter className="w-4 h-4" />}
                    placeholder="ทุกช่องทาง"
                />

                <FilterDropdown 
                    label="Period"
                    options={timeOptions}
                    value={timeRange}
                    onChange={setTimeRange}
                    icon={<TrendingUp className="w-4 h-4" />}
                    placeholder="ทั้งหมด"
                    activeColorClass="bg-slate-900 border-slate-800 text-white"
                />

                <button className="h-12 w-12 flex items-center justify-center bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 active:scale-95 group">
                    <Download className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
            </div>
        </div>
    );
};

export default AnalyticsHeader;

