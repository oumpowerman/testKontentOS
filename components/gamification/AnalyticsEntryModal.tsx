import React, { useState, useRef, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Brain, Save, Loader2, BarChart3, TrendingUp, Users, MessageSquare, Share2, Bookmark, Heart, Clock, Target } from 'lucide-react';
import { Task, ContentAnalytics } from '../../types';
import { extractContentAnalyticsFromImage } from '../../services/geminiService';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';

interface AnalyticsEntryModalProps {
    content: Task;
    onClose: () => void;
    onSave: (analytics: ContentAnalytics) => void;
}

const AnalyticsEntryModal: React.FC<AnalyticsEntryModalProps> = ({ content, onClose, onSave }) => {
    const { showToast } = useToast();
    const [isAILoading, setIsAILoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        saves: 0,
        retentionRate: 0,
        avgWatchTime: 0,
        reach: 0,
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: parseFloat(value) || 0
        }));
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsAILoading(true);
        try {
            const reader = new FileReader();
            reader.onload = async (event) => {
                const base64 = event.target?.result as string;
                const extractedData = await extractContentAnalyticsFromImage(base64);
                
                if (extractedData) {
                    setFormData({
                        views: extractedData.views || 0,
                        likes: extractedData.likes || 0,
                        comments: extractedData.comments || 0,
                        shares: extractedData.shares || 0,
                        saves: extractedData.saves || 0,
                        retentionRate: extractedData.retention_rate || 0,
                        avgWatchTime: extractedData.avg_watch_time || 0,
                        reach: extractedData.reach || 0,
                    });
                    showToast('AI ดึงข้อมูลเรียบร้อยแล้ว กรุณาตรวจสอบความถูกต้องครับ ✨', 'success');
                }
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error(error);
            showToast('AI ไม่สามารถอ่านข้อมูลได้ กรุณาลองใช้อีกรูปหรือกรอกด้วยตนเองครับ', 'error');
        } finally {
            setIsAILoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const platform = (content as any).platform || (content.targetPlatforms && content.targetPlatforms.length > 0 ? content.targetPlatforms[0] : 'OTHER');
            const analyticsData: Partial<ContentAnalytics> = {
                contentId: content.id,
                platform: platform,
                capturedAt: new Date(),
                views: formData.views,
                likes: formData.likes,
                comments: formData.comments,
                shares: formData.shares,
                saves: formData.saves,
                retentionRate: formData.retentionRate,
                avgWatchTime: formData.avgWatchTime,
                reach: formData.reach,
                isAiExtracted: false, // Could be true if they didn't edit, but default simplified
            };

            const { data, error } = await supabase
                .from('content_analytics')
                .upsert([{
                    content_id: analyticsData.contentId,
                    platform: analyticsData.platform,
                    views: analyticsData.views,
                    likes: analyticsData.likes,
                    comments: analyticsData.comments,
                    shares: analyticsData.shares,
                    saves: analyticsData.saves,
                    retention_rate: analyticsData.retentionRate,
                    avg_watch_time: analyticsData.avgWatchTime,
                    reach: analyticsData.reach,
                    captured_at: new Date().toISOString()
                }], { 
                    onConflict: 'content_id' 
                })
                .select()
                .single();

            if (error) throw error;

            showToast('บันทึกสถิติเรียบร้อยแล้ว 🎉', 'success');
            onSave(data as any);
            onClose();
        } catch (error) {
            console.error(error);
            showToast('บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้งครับ', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const engagementRate = useMemo(() => {
        const interaction = formData.likes + formData.comments + formData.shares + formData.saves;
        return formData.views > 0 ? (interaction / formData.views) * 100 : 0;
    }, [formData]);

    return createPortal(
        <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" 
                onClick={onClose}
            />
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] relative z-10"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-white relative">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-indigo-50 rounded-[1.2rem] flex items-center justify-center border border-indigo-100/50">
                            <BarChart3 className="w-7 h-7 text-indigo-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">บันทึกผลประสิทธิภาพ</h2>
                            <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mt-0.5 line-clamp-1">{content.title}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 bg-slate-50 hover:bg-slate-100 rounded-full flex items-center justify-center transition-colors">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                    {/* Performance Preview Chip */}
                    <div className="absolute bottom-0 right-10 translate-y-1/2 bg-white border border-slate-100 shadow-sm px-4 py-2 rounded-xl flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">อัตราการมีส่วนร่วมโดยประมาณ</span>
                        <span className={`text-sm font-bold ${engagementRate > 5 ? 'text-emerald-500' : 'text-indigo-600'}`}>
                            {engagementRate.toFixed(2)}%
                        </span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-10 py-10 space-y-10">
                    {/* Ghost AI Section */}
                    <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/20 to-purple-600/20 rounded-[1.8rem] blur opacity-75"></div>
                        <div className="relative bg-white border border-slate-200/60 rounded-[1.5rem] p-6 flex flex-col sm:flex-row items-center gap-6 shadow-sm">
                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center shrink-0 border border-slate-100 relative overflow-hidden">
                                {isAILoading ? (
                                    <div className="absolute inset-0 bg-indigo-600/5 flex items-center justify-center">
                                        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                                    </div>
                                ) : (
                                    <Brain className="w-8 h-8 text-indigo-500" />
                                )}
                            </div>
                            <div className="text-center sm:text-left flex-1">
                                <h3 className="font-semibold text-slate-900 tracking-tight">บันทึกด้วย AI Vision</h3>
                                <p className="text-xs text-slate-400 font-medium mt-1 uppercase tracking-wider">อัปโหลดภาพ Insight (Screenshot) เพื่อสกัดข้อมูลทันที</p>
                            </div>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handleFileUpload} 
                                className="hidden" 
                                accept="image/*" 
                            />
                            <button 
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isAILoading}
                                className="w-full sm:w-auto px-6 py-3.5 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 shadow-lg"
                            >
                                <Upload className="w-4 h-4" />
                                {isAILoading ? 'กำลังประมวลผล...' : 'อัปโหลดภาพ'}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-10">
                        {/* Views */}
                        <div className="space-y-3">
                            <label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <TrendingUp className="w-3.5 h-3.5" /> ยอดการเข้าชมรวม (Views)
                            </label>
                            <input 
                                type="number" 
                                name="views" 
                                value={formData.views} 
                                onChange={handleInputChange}
                                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-semibold text-slate-900 placeholder-slate-300"
                                placeholder="0"
                            />
                        </div>

                        {/* Reach */}
                        <div className="space-y-3">
                            <label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Target className="w-3.5 h-3.5" /> การเข้าถึง (Reach)
                            </label>
                            <input 
                                type="number" 
                                name="reach" 
                                value={formData.reach} 
                                onChange={handleInputChange}
                                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-semibold text-slate-900 placeholder-slate-300"
                                placeholder="0"
                            />
                        </div>

                        {/* Likes */}
                        <div className="space-y-3">
                            <label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Heart className="w-3.5 h-3.5 text-red-400" /> ยอดถูกใจ (Likes)
                            </label>
                            <input 
                                type="number" 
                                name="likes" 
                                value={formData.likes} 
                                onChange={handleInputChange}
                                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-semibold text-slate-900 placeholder-slate-300"
                                placeholder="0"
                            />
                        </div>

                        {/* Comments */}
                        <div className="space-y-3">
                            <label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <MessageSquare className="w-3.5 h-3.5 text-blue-400" /> คอมเมนต์ (Comments)
                            </label>
                            <input 
                                type="number" 
                                name="comments" 
                                value={formData.comments} 
                                onChange={handleInputChange}
                                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-semibold text-slate-900 placeholder-slate-300"
                                placeholder="0"
                            />
                        </div>

                        {/* Shares */}
                        <div className="space-y-3">
                            <label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Share2 className="w-3.5 h-3.5 text-emerald-400" /> ยอดแชร์ (Shares)
                            </label>
                            <input 
                                type="number" 
                                name="shares" 
                                value={formData.shares} 
                                onChange={handleInputChange}
                                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-semibold text-slate-900 placeholder-slate-300"
                                placeholder="0"
                            />
                        </div>

                        {/* Saves */}
                        <div className="space-y-3">
                            <label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Bookmark className="w-3.5 h-3.5 text-amber-500" /> การบันทึก (Saves)
                            </label>
                            <input 
                                type="number" 
                                name="saves" 
                                value={formData.saves} 
                                onChange={handleInputChange}
                                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-semibold text-slate-900 placeholder-slate-300"
                                placeholder="0"
                            />
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="px-10 py-8 border-t border-slate-100 bg-slate-50/50 flex items-center gap-5">
                    <button 
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-4 text-slate-500 text-xs font-medium uppercase tracking-widest hover:text-slate-700 transition-colors"
                    >
                        ยกเลิก
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={isSaving}
                        className="flex-[2] py-4 bg-indigo-600 text-white text-sm font-medium uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-900 transition-all shadow-xl shadow-indigo-200 active:scale-95 disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        ยืนยันการบันทึกสถิติ
                    </button>
                </div>
            </motion.div>
        </div>,
        document.body
    );
};

export default AnalyticsEntryModal;
