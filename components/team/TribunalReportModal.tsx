
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Send, AlertTriangle, User, FileText, CheckCircle2, Link2, Cloud, Clock, Gavel, MessageSquare, ChevronRight, Loader2, ShieldAlert, Search, Target } from 'lucide-react';
import { useTribunal } from '../../hooks/useTribunal';
import { useTeam } from '../../hooks/useTeam';
import { useGameConfig } from '../../context/GameConfigContext';
import { User as UserType, TribunalReport } from '../../types';
import { useGlobalDialog } from '../../context/GlobalDialogContext';
import { googleDriveService } from '../../services/googleDriveService';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

interface TribunalReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: UserType | null;
}

const TribunalReportModal: React.FC<TribunalReportModalProps> = ({ isOpen, onClose, currentUser }) => {
    const { submitReport, isLoading } = useTribunal(currentUser);
    const { allUsers } = useTeam();
    const { config } = useGameConfig();
    const { showAlert } = useGlobalDialog();
    
    const [category, setCategory] = useState('');
    const [targetId, setTargetId] = useState('');
    const [description, setDescription] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [activeTab, setActiveTab] = useState<'REPORT' | 'HISTORY'>('REPORT');
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const [isGDriveConnected, setIsGDriveConnected] = useState(false);
    const [isCheckingGDrive, setIsCheckingGDrive] = useState(true);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const tribunalCfg = config.TRIBUNAL_CONFIG;

    const checkGDriveStatus = useCallback(async () => {
        try {
            const connected = await googleDriveService.getStatus();
            setIsGDriveConnected(connected);
        } catch (error) {
            console.error('Error checking GDrive status:', error);
        } finally {
            setIsCheckingGDrive(false);
        }
    }, []);

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        checkGDriveStatus();

        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
                setIsGDriveConnected(true);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [checkGDriveStatus]);

    const handleConnectGDrive = async () => {
        try {
            const url = await googleDriveService.getAuthUrl();
            const width = 600;
            const height = 700;
            const left = window.screen.width / 2 - width / 2;
            const top = window.screen.height / 2 - height / 2;
            window.open(
                url,
                'GoogleDriveAuth',
                `width=${width},height=${height},left=${left},top=${top}`
            );
        } catch (error) {
            showAlert('ไม่สามารถเปิดหน้าต่างเชื่อมต่อ Google Drive ได้', 'ข้อผิดพลาด');
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(selectedFile);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!category || !description) return;

        try {
            await submitReport({
                category,
                target_id: targetId || undefined,
                description,
                is_anonymous: isAnonymous
            }, file || undefined);
            
            setIsSuccess(true);
            setTimeout(() => {
                onClose();
                // Reset state
                setCategory('');
                setTargetId('');
                setDescription('');
                setFile(null);
                setPreviewUrl(null);
                setIsSuccess(false);
            }, 2000);
        } catch (error) {
            showAlert('เกิดข้อผิดพลาดในการส่งคำฟ้อง กรุณาลองใหม่อีกครั้ง', 'ข้อผิดพลาด');
        }
    };

    if (!isOpen || !mounted) return null;

    const portalRoot = document.getElementById('portal-root');
    if (!portalRoot) return null;

    return createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="bg-red-600 text-white overflow-hidden">
                        <div className="p-6 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-xl">
                                    <AlertTriangle className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">ศาลเตี้ยออฟฟิศ</h2>
                                    <p className="text-xs opacity-80">แจ้งเหตุไม่พึงประสงค์เพื่อความสงบสุข</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex px-6 border-t border-white/10">
                            <button 
                                onClick={() => setActiveTab('REPORT')}
                                className={`py-3 px-4 text-sm font-bold transition-all relative ${activeTab === 'REPORT' ? 'text-white' : 'text-white/60 hover:text-white/80'}`}
                            >
                                ฟ้องร้องใหม่
                                {activeTab === 'REPORT' && <motion.div layoutId="tribunalActiveTab" className="absolute bottom-0 left-0 right-0 h-1 bg-white rounded-t-full" />}
                            </button>
                            <button 
                                onClick={() => setActiveTab('HISTORY')}
                                className={`py-3 px-4 text-sm font-bold transition-all relative ${activeTab === 'HISTORY' ? 'text-white' : 'text-white/60 hover:text-white/80'}`}
                            >
                                ประวัติของฉัน
                                {activeTab === 'HISTORY' && <motion.div layoutId="tribunalActiveTab" className="absolute bottom-0 left-0 right-0 h-1 bg-white rounded-t-full" />}
                            </button>
                        </div>
                    </div>

                    {isSuccess ? (
                        <div className="h-[600px] flex flex-col items-center justify-center text-center p-12 space-y-6">
                            <motion.div 
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                                className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center shadow-lg shadow-green-100"
                            >
                                <CheckCircle2 className="w-14 h-14" />
                            </motion.div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-gray-800">ส่งคำฟ้องสำเร็จ!</h3>
                                <p className="text-gray-500 font-medium">Admin จะทำการพิจารณาคดีในเร็วๆ นี้<br/>เตรียมตัวรับแรงกระแทกได้เลย!</p>
                            </div>
                        </div>
                    ) : (
                        <div className="h-[600px] overflow-hidden flex flex-col">
                            <AnimatePresence mode="wait">
                                {activeTab === 'REPORT' ? (
                                    <motion.form 
                                        key="report-form"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        onSubmit={handleSubmit} 
                                        className="flex-1 p-6 space-y-6 overflow-y-auto custom-scrollbar"
                                    >
                                        {/* Anonymity Toggle */}
                                        <motion.div 
                                            whileHover={{ scale: 1.02 }}
                                            className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between group cursor-pointer"
                                            onClick={() => setIsAnonymous(!isAnonymous)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2.5 rounded-xl transition-all duration-300 ${isAnonymous ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-200 rotate-12' : 'bg-gray-200 text-gray-500'}`}>
                                                    {isAnonymous ? <Cloud className="w-5 h-5" /> : <User className="w-5 h-5" />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-800">ฟ้องแบบไม่ระบุตัวตน</p>
                                                    <p className="text-[10px] text-gray-500 font-medium">Admin จะยังคงเห็นชื่อคุณเพื่อความโปร่งใส</p>
                                                </div>
                                            </div>
                                            <div className={`w-12 h-6 rounded-full transition-all relative p-1 ${isAnonymous ? 'bg-indigo-500' : 'bg-gray-300'}`}>
                                                <motion.div 
                                                    animate={{ x: isAnonymous ? 24 : 0 }}
                                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                                    className="w-4 h-4 bg-white rounded-full shadow-md"
                                                />
                                            </div>
                                        </motion.div>

                                        {/* Category Selection */}
                                        <div className="space-y-3">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-red-500" /> หมวดหมู่ปัญหา
                                            </label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {tribunalCfg?.categories?.map((cat: any, idx: number) => {
                                                    const isObject = typeof cat === 'object' && cat !== null;
                                                    const label = isObject ? cat.label : cat;
                                                    const id = isObject ? cat.id : `cat_${idx}`;
                                                    
                                                    return (
                                                        <motion.button
                                                            key={id}
                                                            type="button"
                                                            whileHover={{ scale: 1.03 }}
                                                            whileTap={{ scale: 0.97 }}
                                                            onClick={() => setCategory(label)}
                                                            className={`p-3 rounded-2xl text-xs font-bold transition-all border-2 text-left flex items-center justify-between ${
                                                                category === label 
                                                                ? 'border-red-500 bg-red-50 text-red-700 shadow-md shadow-red-100' 
                                                                : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200'
                                                            }`}
                                                        >
                                                            {label}
                                                            {category === label && <CheckCircle2 className="w-4 h-4" />}
                                                        </motion.button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Target Selection (Avatar Grid) */}
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[15px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                                    <Target className="w-4 h-4 text-red-500" /> ใครคือคนผิด? (ถ้ามี)
                                                </label>
                                                {targetId && (
                                                    <motion.button
                                                        initial={{ opacity: 0, x: 10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        type="button"
                                                        onClick={() => setTargetId('')}
                                                        className="text-[12px] font-medium text-red-500 hover:text-red-600 bg-red-50 px-2 py-1 rounded-lg transition-colors"
                                                    >
                                                        ล้างการเลือก
                                                    </motion.button>
                                                )}
                                            </div>

                                            {/* Search Bar */}
                                            <div className="relative group">
                                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-red-500 transition-colors" />
                                                <input 
                                                    type="text"
                                                    placeholder="ค้นหาชื่อจำเลย..."
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-red-500 focus:ring-0 transition-all outline-none font-medium text-md text-gray-700"
                                                />
                                            </div>

                                            {/* Avatar Grid */}
                                            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 max-h-[220px] overflow-y-auto p-2 custom-scrollbar bg-gray-50/50 rounded-3xl border border-gray-100/50">
                                                {/* Anonymous Option */}
                                                <motion.button
                                                    type="button"
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => setTargetId('')}
                                                    className={`flex flex-col items-center gap-2 p-2 rounded-2xl transition-all relative ${
                                                        !targetId 
                                                        ? 'bg-white shadow-xl shadow-red-100 border-2 border-red-500' 
                                                        : 'hover:bg-white/80 border-2 border-transparent'
                                                    }`}
                                                >
                                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${!targetId ? 'bg-red-100 text-red-600' : 'bg-gray-200 text-gray-400'}`}>
                                                        <User className="w-6 h-6" />
                                                    </div>
                                                    <span className={`text-[10px] font-bold text-center leading-tight ${!targetId ? 'text-red-600' : 'text-gray-500'}`}>
                                                        ไม่ระบุตัวตน
                                                    </span>
                                                    {!targetId && (
                                                        <motion.div layoutId="target-check" className="absolute -top-1 -right-1 bg-red-500 text-white p-1 rounded-full shadow-lg">
                                                            <CheckCircle2 className="w-3 h-3" />
                                                        </motion.div>
                                                    )}
                                                </motion.button>

                                                {/* User List */}
                                                {allUsers
                                                    ?.filter(u => u.isActive && u.id !== currentUser?.id)
                                                    ?.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()))
                                                    ?.map((user, idx) => (
                                                    <motion.button
                                                        key={user.id}
                                                        type="button"
                                                        initial={{ opacity: 0, scale: 0.8 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        transition={{ delay: idx * 0.02 }}
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => setTargetId(user.id)}
                                                        className={`flex flex-col items-center gap-2 p-2 rounded-2xl transition-all relative ${
                                                            targetId === user.id 
                                                            ? 'bg-white shadow-xl shadow-red-100 border-2 border-red-500' 
                                                            : 'hover:bg-white/80 border-2 border-transparent'
                                                        }`}
                                                    >
                                                        <div className="relative">
                                                            <img 
                                                                src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
                                                                alt={user.name}
                                                                className={`w-12 h-12 rounded-full object-cover border-2 transition-all ${targetId === user.id ? 'border-red-200' : 'border-transparent'}`}
                                                                referrerPolicy="no-referrer"
                                                            />
                                                            {targetId === user.id && (
                                                                <motion.div layoutId="target-check" className="absolute -top-1 -right-1 bg-red-500 text-white p-1 rounded-full shadow-lg z-10">
                                                                    <CheckCircle2 className="w-3 h-3" />
                                                                </motion.div>
                                                            )}
                                                        </div>
                                                        <span className={`text-[12px] font-medium text-center leading-tight truncate w-full ${targetId === user.id ? 'text-red-600' : 'text-gray-500'}`}>
                                                            {user.name.split(' ')[0]}
                                                        </span>
                                                    </motion.button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <div className="space-y-3">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">รายละเอียดเหตุการณ์</label>
                                            <textarea 
                                                required
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                placeholder="พิมพ์ฟ้องแบบฟรีสไตล์ที่นี่..."
                                                className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-red-500 focus:ring-0 transition-all outline-none min-h-[120px] resize-none font-medium text-sm"
                                            />
                                        </div>

                                        {/* Evidence Upload */}
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <label className="text-xs font-medium text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                                    <Camera className="w-4 h-4 text-red-500" /> หลักฐานรูปถ่าย (แนะนำ)
                                                </label>
                                                {isGDriveConnected ? (
                                                    <motion.span 
                                                        initial={{ scale: 0.8, opacity: 0 }}
                                                        animate={{ scale: 1, opacity: 1 }}
                                                        className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100"
                                                    >
                                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                                        CONNECTED
                                                    </motion.span>
                                                ) : (
                                                    <button 
                                                        type="button"
                                                        onClick={handleConnectGDrive}
                                                        className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors bg-indigo-50 px-2 py-1 rounded-full border border-indigo-100"
                                                    >
                                                        <Link2 className="w-3 h-3" /> เชื่อมต่อ Google Drive
                                                    </button>
                                                )}
                                            </div>
                                            
                                            <motion.div 
                                                whileHover={{ scale: 1.01 }}
                                                whileTap={{ scale: 0.99 }}
                                                onClick={() => {
                                                    if (!isGDriveConnected) {
                                                        handleConnectGDrive();
                                                    } else {
                                                        fileInputRef.current?.click();
                                                    }
                                                }}
                                                className={`relative w-full aspect-video bg-gray-50 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden group ${
                                                    !isGDriveConnected 
                                                    ? 'border-indigo-200 hover:bg-indigo-50/50' 
                                                    : 'border-gray-200 hover:bg-gray-100'
                                                }`}
                                            >
                                                {previewUrl ? (
                                                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                                ) : (
                                                    <>
                                                        {!isGDriveConnected ? (
                                                            <div className="text-center p-6">
                                                                <Cloud className="w-12 h-12 text-indigo-400 mb-2 mx-auto animate-bounce" />
                                                                <p className="text-sm text-indigo-600 font-bold">ต้องเชื่อมต่อ Google Drive ก่อนแนบรูป</p>
                                                                <p className="text-[10px] text-indigo-400 font-medium">คลิกเพื่อเชื่อมต่อบัญชีของคุณ</p>
                                                            </div>
                                                        ) : (
                                                            <div className="text-center p-6">
                                                                <Camera className="w-12 h-12 text-gray-400 mb-2 mx-auto group-hover:scale-110 transition-transform" />
                                                                <p className="text-sm text-gray-500 font-bold">กดเพื่อถ่ายรูปหรือเลือกไฟล์</p>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                                <input 
                                                    type="file" 
                                                    ref={fileInputRef}
                                                    onChange={handleFileChange}
                                                    accept="image/*"
                                                    className="hidden"
                                                />
                                            </motion.div>
                                            {file && !isGDriveConnected && (
                                                <p className="text-[10px] text-red-500 font-bold flex items-center gap-1 justify-center">
                                                    <AlertTriangle className="w-3 h-3" /> กรุณาเชื่อมต่อ Google Drive ก่อนส่งคำฟ้องที่มีรูปแนบ
                                                </p>
                                            )}
                                        </div>

                                        {/* Warning Footer */}
                                        <motion.div 
                                            initial={{ x: -10, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3 shadow-inner"
                                        >
                                            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 animate-pulse" />
                                            <p className="text-[11px] text-amber-700 leading-relaxed font-bold">
                                                <span className="text-amber-800 font-bold">คำเตือน:</span> หาก Admin ตรวจพบว่าเป็นการฟ้องเท็จหรือแกล้งกัน 
                                                คุณจะถูกหัก <span className="text-red-600 font-bold">-{tribunalCfg?.false_report_penalty_hp || 15} HP</span> ทันที!
                                            </p>
                                        </motion.div>

                                        {/* Submit Button */}
                                        <motion.button
                                            type="submit"
                                            whileHover={{ scale: 1.02, y: -2 }}
                                            whileTap={{ scale: 0.98 }}
                                            disabled={isLoading || !category || !description || (!!file && !isGDriveConnected)}
                                            className="w-full py-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 disabled:from-gray-300 disabled:to-gray-300 text-white font-medium rounded-2xl shadow-xl shadow-red-200 transition-all flex items-center justify-center gap-2 sticky bottom-0"
                                        >
                                            {isLoading ? (
                                                <Loader2 className="w-6 h-6 animate-spin" />
                                            ) : (
                                                <>
                                                    <Send className="w-5 h-5" /> ส่งคำฟ้องเข้าสู่ศาล
                                                </>
                                            )}
                                        </motion.button>
                                    </motion.form>
                                ) : (
                                    <motion.div 
                                        key="history-tab"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="flex-1 p-6 overflow-y-auto custom-scrollbar"
                                    >
                                        <TribunalHistory currentUser={currentUser} />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>,
        portalRoot
    );
};

export default TribunalReportModal;

const TribunalHistory: React.FC<{ currentUser: UserType | null }> = ({ currentUser }) => {
    const { getReports } = useTribunal(currentUser);
    const { allUsers } = useTeam();
    const [myReports, setMyReports] = useState<TribunalReport[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchHistory = async () => {
        setIsLoading(true);
        const data = await getReports('MY_REPORTS');
        setMyReports(data);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchHistory();
    }, [getReports]);

    const getTargetName = (id?: string) => {
        if (!id) return 'ไม่ระบุตัวตน';
        return allUsers.find(u => u.id === id)?.name || 'Unknown User';
    };

    if (isLoading) {
        return (
            <div className="h-full flex flex-col items-center justify-center space-y-4">
                <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full shadow-lg shadow-indigo-100"
                />
                <p className="text-md text-gray-500 font-bold animate-pulse">กำลังขุดคุ้ยประวัติ...</p>
            </div>
        );
    }

    if (myReports.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-6">
                <motion.div 
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="p-8 bg-gray-50 rounded-full text-gray-300 border-2 border-dashed border-gray-200 relative"
                >
                    <Gavel className="w-20 h-20 opacity-40" />
                    <motion.div 
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute -top-2 -right-2 p-3 bg-white rounded-2xl shadow-xl border border-gray-100"
                    >
                        <ShieldAlert className="w-6 h-6 text-indigo-400" />
                    </motion.div>
                </motion.div>
                <div className="space-y-2">
                    <h4 className="text-xl font-bold text-gray-800">ยังไม่มีประวัติการฟ้อง</h4>
                    <p className="text-sm text-gray-500 font-medium max-w-[200px] mx-auto">
                        ดูเหมือนคุณจะเป็นคนดีนะเนี่ย!<br/>ยังไม่เคยฟ้องใครเลย
                    </p>
                </div>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={fetchHistory}
                    className="px-6 py-2 bg-indigo-50 text-indigo-600 rounded-full text-xs font-medium hover:bg-indigo-100 transition-all flex items-center gap-2"
                >
                    <Loader2 className="w-3 h-3" /> รีเฟรชข้อมูล
                </motion.button>
            </div>
        );
    }

    return (
        <div className="space-y-4 pb-8">
            <div className="flex justify-between items-center mb-2">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">รายการคำฟ้องทั้งหมด</h4>
                <button onClick={fetchHistory} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400">
                    <Loader2 className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
            </div>
            <AnimatePresence mode="popLayout">
                {myReports.map((report, index) => (
                    <motion.div 
                        key={report.id}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: index * 0.05, type: "spring", stiffness: 300, damping: 25 }}
                        whileHover={{ scale: 1.02 }}
                        className="bg-white border-2 border-gray-100 rounded-3xl p-5 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all group relative overflow-hidden"
                    >
                        {/* Status Ribbon */}
                        <div className={`absolute top-0 right-0 w-24 h-24 -mr-12 -mt-12 rotate-45 transition-colors ${
                            report.status === 'PENDING' ? 'bg-amber-500/10' :
                            report.status === 'APPROVED' ? 'bg-emerald-500/10' :
                            'bg-red-500/10'
                        }`} />

                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase shadow-sm ${
                                    report.status === 'PENDING' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                                    report.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                                    'bg-red-100 text-red-700 border border-red-200'
                                }`}>
                                    {report.status}
                                </div>
                                <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {format(new Date(report.created_at), 'd MMM yyyy HH:mm', { locale: th })}
                                </span>
                            </div>
                            {report.is_anonymous && (
                                <motion.span 
                                    initial={{ x: 20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    className="flex items-center gap-1.5 text-[10px] font-black text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 shadow-sm"
                                >
                                    <Cloud className="w-3 h-3" /> ANONYMOUS
                                </motion.span>
                            )}
                        </div>

                        <div className="space-y-4 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-50 text-red-600 rounded-xl group-hover:rotate-12 transition-transform shadow-sm">
                                    <AlertTriangle className="w-4 h-4" />
                                </div>
                                <h5 className="text-sm font-black text-gray-800">{report.category}</h5>
                            </div>
                            
                            <p className="text-xs text-gray-600 leading-relaxed font-medium bg-gray-50/50 p-3 rounded-2xl border border-gray-100/50">
                                {report.description}
                            </p>

                            <div className="flex items-center gap-3 py-2.5 px-4 bg-gray-50 rounded-2xl border border-gray-100 group-hover:bg-white transition-colors">
                                <User className="w-4 h-4 text-gray-400" />
                                <p className="text-[11px] font-bold text-gray-500">
                                    คู่กรณี: <span className="text-gray-900 font-black">{getTargetName(report.target_id)}</span>
                                </p>
                            </div>

                            {report.admin_feedback && (
                                <motion.div 
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    className="mt-4 p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 space-y-2 shadow-inner"
                                >
                                    <div className="flex items-center gap-2 text-indigo-600">
                                        <MessageSquare className="w-4 h-4" />
                                        <p className="text-[10px] font-black uppercase tracking-wider">คำตัดสินจาก Admin</p>
                                    </div>
                                    <p className="text-xs text-indigo-900 italic font-medium leading-relaxed">
                                        "{report.admin_feedback}"
                                    </p>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};
