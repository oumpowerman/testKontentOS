
    import React, { useState, useEffect, useMemo } from 'react';
    import { createPortal } from 'react-dom';
    import { motion, AnimatePresence } from 'framer-motion';
    import { X, Save, User, Mail, Phone, GraduationCap, Briefcase, Calendar, Link as LinkIcon, MessageSquare, BarChart3, Loader2, Cloud, CloudOff, AlertCircle } from 'lucide-react';
    import { InternCandidate, InternStatus, Gender } from '../../../../types';
    import { format } from 'date-fns';
    import GenderSelector from './form-components/GenderSelector';
    import PositionSelector from './form-components/PositionSelector';
    import UniversityAutocomplete from './form-components/UniversityAutocomplete';
    import DriveImageUpload from './form-components/DriveImageUpload';
    import FormSection from './form-components/FormSection';
    import FilterDropdown from '../../../common/FilterDropdown';
    import { Sparkles } from 'lucide-react';
    import { useGoogleDriveContext } from '../../../../context/GoogleDriveContext';
    import { useGlobalDialog } from '../../../../context/GlobalDialogContext';

    interface InternCandidateModalProps {
        isOpen: boolean;
        onClose: () => void;
        onSave: (data: Partial<InternCandidate>) => Promise<void>;
        intern?: InternCandidate;
        allInterns?: InternCandidate[];
    }

    const InternCandidateModal: React.FC<InternCandidateModalProps> = ({ isOpen, onClose, onSave, intern, allInterns = [] }) => {
        const { isAuthenticated, openDrivePicker, login } = useGoogleDriveContext();
        const { showAlert } = useGlobalDialog();
        const [formData, setFormData] = useState<Partial<InternCandidate>>({
            fullName: '',
            nickname: '',
            email: '',
            phoneNumber: '',
            university: '',
            faculty: '',
            academicYear: '',
            portfolioUrl: '',
            resumeUrl: '',
            otherUrl: '',
            avatarUrl: '',
            gender: 'OTHER',
            position: '',
            source: '',
            startDate: new Date(),
            endDate: new Date(),
            status: 'APPLIED',
            interviewDate: null,
            notes: ''
        });

        const [uploadStatus, setUploadStatus] = useState<'IDLE' | 'CROPPING' | 'UPLOADING' | 'SUCCESS' | 'ERROR' | 'TIMEOUT'>('IDLE');
        const [errors, setErrors] = useState<Record<string, string>>({});
        const [isSubmitting, setIsSubmitting] = useState(false);

        const uniqueUniversities = useMemo(() => {
            const unis = allInterns.map(i => i.university).filter(u => u && u.trim() !== '');
            return Array.from(new Set(unis));
        }, [allInterns]);

        useEffect(() => {
            if (intern) {
                setFormData({
                    ...intern,
                    startDate: new Date(intern.startDate),
                    endDate: new Date(intern.endDate),
                    interviewDate: intern.interviewDate ? new Date(intern.interviewDate) : null
                });
            } else {
                setFormData({
                    fullName: '',
                    email: '',
                    phoneNumber: '',
                    university: '',
                    portfolioUrl: '',
                    resumeUrl: '',
                    otherUrl: '',
                    avatarUrl: '',
                    gender: 'OTHER',
                    position: '',
                    startDate: new Date(),
                    endDate: new Date(),
                    status: 'APPLIED',
                    interviewDate: null,
                    notes: ''
                });
            }
        }, [intern, isOpen]);

        const validateForm = (): boolean => {
            const newErrors: Record<string, string> = {};
            
            if (!formData.fullName?.trim()) {
                newErrors.fullName = 'กรุณากรอกชื่อ-นามสกุล';
            }
            
            if (!formData.email?.trim()) {
                newErrors.email = 'กรุณากรอกอีเมล';
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
                newErrors.email = 'รูปแบบอีเมลไม่ถูกต้อง';
            }
            
            if (!formData.phoneNumber?.trim()) {
                newErrors.phoneNumber = 'กรุณากรอกเบอร์โทรศัพท์';
            }
            
            if (!formData.position?.trim()) {
                newErrors.position = 'กรุณาเลือกตำแหน่งที่สมัคร';
            }

            if (!formData.university?.trim()) {
                newErrors.university = 'กรุณาระบุมหาวิทยาลัย';
            }

            setErrors(newErrors);
            return Object.keys(newErrors).length === 0;
        };

        const handleSubmit = async (e: React.FormEvent) => {
            e.preventDefault();
            if (uploadStatus === 'UPLOADING' || uploadStatus === 'CROPPING' || isSubmitting) return;

            if (!validateForm()) {
                showAlert('กรุณาตรวจสอบข้อมูลให้ครบถ้วนและถูกต้องก่อนบันทึก', 'ข้อมูลไม่ครบถ้วน');
                return;
            }

            try {
                setIsSubmitting(true);
                await onSave(formData);
                setErrors({});
            } catch (err: any) {
                // If it still fails (e.g. database error), show a nice alert
                let errorMsg = 'เกิดข้อผิดพลาดในการบันทึกข้อมูล';
                if (err.message?.includes('email_format')) {
                    errorMsg = 'รูปแบบอีเมลไม่ถูกต้องตามที่ระบบกำหนด';
                    setErrors(prev => ({ ...prev, email: errorMsg }));
                } else if (err.message?.includes('unique_email')) {
                    errorMsg = 'อีเมลนี้มีอยู่ในระบบแล้ว';
                    setErrors(prev => ({ ...prev, email: errorMsg }));
                }
                
                showAlert(errorMsg, 'บันทึกไม่สำเร็จ');
            } finally {
                setIsSubmitting(false);
            }
        };

        const isSavingDisabled = uploadStatus === 'UPLOADING' || uploadStatus === 'CROPPING';

        const modalContent = (
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 overflow-hidden">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
                            className="absolute inset-0 bg-black/70 backdrop-blur-md"
                        />
                        
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-2xl bg-gray-50 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-white"
                        >
                            {/* Header - Clean & Professional */}
                            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
                                        <GraduationCap className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900 tracking-tight">
                                            {intern ? 'แก้ไขข้อมูลผู้สมัคร' : 'เพิ่มผู้สมัครฝึกงาน'}
                                        </h2>
                                        <div className="flex items-center gap-1.5">
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Internship Application Form</p>
                                            <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                            <button 
                                                type="button"
                                                onClick={() => !isAuthenticated && login()}
                                                className={`flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest ${isAuthenticated ? 'text-emerald-500' : 'text-amber-500 hover:text-amber-600'}`}
                                            >
                                                {isAuthenticated ? (
                                                    <><Cloud className="w-2.5 h-2.5" /> Drive Connected</>
                                                ) : (
                                                    <><CloudOff className="w-2.5 h-2.5" /> Drive Disconnected</>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    type="button"
                                    onClick={onClose} 
                                    className="p-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-400 transition-all"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Form Content - Compact Stacked Blocks */}
                            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                                
                                {/* Block 1: Profile & Identity */}
                                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                                    <div className="flex flex-col sm:flex-row gap-8 items-start">
                                        <div className="shrink-0 mx-auto sm:mx-0">
                                            <DriveImageUpload 
                                                value={formData.avatarUrl || ''} 
                                                onChange={url => setFormData(prev => ({ ...prev, avatarUrl: url }))} 
                                                onStatusChange={setUploadStatus}
                                            />
                                        </div>
                                        <div className="flex-1 w-full space-y-5">
                                            <div className="flex items-center gap-3 border-l-4 border-indigo-500 pl-4">
                                                <div className="p-2 bg-indigo-50 rounded-lg">
                                                    <User className="w-4 h-4 text-indigo-600" />
                                                </div>
                                                <h3 className="text-base font-bold text-gray-800">ข้อมูลส่วนตัว</h3>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                                <div className="space-y-1.5">
                                                    <label className="text-sm font-kanit font-bold text-gray-600 ml-1 flex items-center gap-1">
                                                        ชื่อ-นามสกุล
                                                        {errors.fullName && <span className="text-[10px] text-rose-500 font-normal">({errors.fullName})</span>}
                                                    </label>
                                                    <input 
                                                        required
                                                        type="text"
                                                        className={`w-full px-4 py-2.5 bg-gray-50 border ${errors.fullName ? 'border-rose-300 bg-rose-50/30' : 'border-gray-100'} focus:bg-white focus:border-indigo-200 rounded-lg text-sm font-kanit font-medium outline-none transition-all`}
                                                        value={formData.fullName}
                                                        onChange={e => {
                                                            setFormData(prev => ({ ...prev, fullName: e.target.value }));
                                                            if (errors.fullName) setErrors(prev => {
                                                                const { fullName, ...rest } = prev;
                                                                return rest;
                                                            });
                                                        }}
                                                        placeholder="ชื่อจริง - นามสกุล"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-sm font-kanit font-bold text-gray-600 ml-1">ชื่อเล่น</label>
                                                    <input 
                                                        type="text"
                                                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 focus:bg-white focus:border-indigo-200 rounded-lg text-sm font-kanit font-medium outline-none transition-all"
                                                        value={formData.nickname}
                                                        onChange={e => setFormData(prev => ({ ...prev, nickname: e.target.value }))}
                                                        placeholder="ชื่อเล่น"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-sm font-kanit font-bold text-gray-600 ml-1">เพศ</label>
                                                <GenderSelector 
                                                    value={formData.gender || 'OTHER'} 
                                                    onChange={val => setFormData(prev => ({ ...prev, gender: val }))} 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Block 2: Contact Info - Sky Blue Tint */}
                                <div className="bg-blue-50/30 rounded-2xl p-6 border border-blue-100 shadow-sm">
                                    <div className="flex items-center gap-3 mb-5 border-l-4 border-blue-500 pl-4">
                                        <div className="p-2 bg-blue-100 rounded-lg">
                                            <Mail className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <h3 className="text-base font-bold text-gray-800">ข้อมูลติดต่อ</h3>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-kanit font-bold text-gray-600 ml-1 flex items-center gap-1">
                                                อีเมล
                                                {errors.email && <span className="text-[10px] text-rose-500 font-normal">({errors.email})</span>}
                                            </label>
                                            <div className="relative">
                                                <Mail className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${errors.email ? 'text-rose-400' : 'text-gray-400'}`} />
                                                <input 
                                                    required
                                                    type="email"
                                                    className={`w-full pl-10 pr-4 py-2.5 bg-white border ${errors.email ? 'border-rose-300 ring-4 ring-rose-50' : 'border-blue-100'} focus:border-blue-300 rounded-xl text-sm  font-medium outline-none transition-all`}
                                                    value={formData.email}
                                                    onChange={e => {
                                                        setFormData(prev => ({ ...prev, email: e.target.value }));
                                                        if (errors.email) setErrors(prev => {
                                                            const { email, ...rest } = prev;
                                                            return rest;
                                                        });
                                                    }}
                                                    placeholder="example@email.com"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-kanit font-bold text-gray-600 ml-1 flex items-center gap-1">
                                                เบอร์โทรศัพท์
                                                {errors.phoneNumber && <span className="text-[10px] text-rose-500 font-normal">({errors.phoneNumber})</span>}
                                            </label>
                                            <div className="relative">
                                                <Phone className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${errors.phoneNumber ? 'text-rose-400' : 'text-gray-400'}`} />
                                                <input 
                                                    required
                                                    type="tel"
                                                    className={`w-full pl-10 pr-4 py-2.5 bg-white border ${errors.phoneNumber ? 'border-rose-300 ring-4 ring-rose-50' : 'border-blue-100'} focus:border-blue-300 rounded-xl text-sm font-medium outline-none transition-all`}
                                                    value={formData.phoneNumber}
                                                    onChange={e => {
                                                        setFormData(prev => ({ ...prev, phoneNumber: e.target.value }));
                                                        if (errors.phoneNumber) setErrors(prev => {
                                                            const { phoneNumber, ...rest } = prev;
                                                            return rest;
                                                        });
                                                    }}
                                                    placeholder="08x-xxx-xxxx"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Block 3: Education & Application - Violet Tint */}
                                <div className="bg-purple-50/30 rounded-2xl p-6 border border-purple-100 shadow-sm">
                                    <div className="flex items-center gap-3 mb-5 border-l-4 border-purple-500 pl-4">
                                        <div className="p-2 bg-purple-100 rounded-lg">
                                            <GraduationCap className="w-4 h-4 text-purple-600" />
                                        </div>
                                        <h3 className="text-base font-bold text-gray-800">การศึกษาและตำแหน่ง</h3>
                                    </div>
                                    <div className="space-y-5">
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-kanit font-bold text-gray-600 ml-1">มหาวิทยาลัย / สถาบัน</label>
                                            <UniversityAutocomplete 
                                                value={formData.university || ''} 
                                                onChange={val => setFormData(prev => ({ ...prev, university: val }))} 
                                                suggestions={uniqueUniversities}
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                            <div className="space-y-1.5">
                                                <label className="text-sm font-kanit font-bold text-gray-600 ml-1">คณะ</label>
                                                <input 
                                                    type="text"
                                                    className="w-full px-4 py-2.5 bg-white border border-purple-100 focus:border-purple-300 rounded-xl text-sm font-kanit font-medium outline-none transition-all"
                                                    value={formData.faculty || ''}
                                                    onChange={e => setFormData(prev => ({ ...prev, faculty: e.target.value }))}
                                                    placeholder="คณะ..."
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-sm font-kanit font-bold text-gray-600 ml-1">ชั้นปี</label>
                                                <input 
                                                    type="text"
                                                    className="w-full px-4 py-2.5 bg-white border border-purple-100 focus:border-purple-300 rounded-xl text-sm font-kanit font-medium outline-none transition-all"
                                                    value={formData.academicYear || ''}
                                                    onChange={e => setFormData(prev => ({ ...prev, academicYear: e.target.value }))}
                                                    placeholder="ปี 3, ปี 4..."
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-[1.4fr_0.6fr] gap-5">
                                            <div className="space-y-1.5">
                                                <label className="text-sm font-kanit font-bold text-gray-600 ml-1">ตำแหน่งที่สมัคร</label>
                                                <PositionSelector 
                                                    value={formData.position || ''} 
                                                    onChange={val => setFormData(prev => ({ ...prev, position: val }))} 
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-sm font-kanit font-bold text-gray-600 ml-1">แหล่งที่มา</label>
                                                <input 
                                                    type="text"
                                                    className="w-full px-4 py-2.5 bg-white border border-purple-100 focus:border-purple-300 rounded-xl text-sm font-kanit font-medium outline-none transition-all"
                                                    value={formData.source || ''}
                                                    onChange={e => setFormData(prev => ({ ...prev, source: e.target.value }))}
                                                    placeholder="Facebook..."
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                                            <div className="space-y-1.5">
                                                <label className="text-sm font-kanit font-bold text-gray-600 ml-1">Link Portfolio</label>
                                                <div className="relative">
                                                    <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                    <input 
                                                        type="url"
                                                        className="w-full pl-10 pr-12 py-2.5 bg-white border border-purple-100 focus:border-purple-300 rounded-xl text-sm font-medium outline-none transition-all"
                                                        value={formData.portfolioUrl}
                                                        onChange={e => setFormData(prev => ({ ...prev, portfolioUrl: e.target.value }))}
                                                        placeholder="Portfolio URL"
                                                    />
                                                    <button 
                                                        type="button"
                                                        onClick={() => openDrivePicker((file) => setFormData(prev => ({ ...prev, portfolioUrl: file.url })))}
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                        title="Pick from Google Drive"
                                                    >
                                                        <Cloud className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-sm font-kanit font-bold text-gray-600 ml-1">Link Resume</label>
                                                <div className="relative">
                                                    <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                    <input 
                                                        type="url"
                                                        className="w-full pl-10 pr-12 py-2.5 bg-white border border-purple-100 focus:border-purple-300 rounded-xl text-sm font-medium outline-none transition-all"
                                                        value={formData.resumeUrl || ''}
                                                        onChange={e => setFormData(prev => ({ ...prev, resumeUrl: e.target.value }))}
                                                        placeholder="Resume URL"
                                                    />
                                                    <button 
                                                        type="button"
                                                        onClick={() => openDrivePicker((file) => setFormData(prev => ({ ...prev, resumeUrl: file.url })))}
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                        title="Pick from Google Drive"
                                                    >
                                                        <Cloud className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-sm font-kanit font-bold text-gray-600 ml-1">Link เพิ่มเติม (Optional)</label>
                                                <div className="relative">
                                                    <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                    <input 
                                                        type="url"
                                                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-purple-100 focus:border-purple-300 rounded-xl text-sm font-medium outline-none transition-all"
                                                        value={formData.otherUrl || ''}
                                                        onChange={e => setFormData(prev => ({ ...prev, otherUrl: e.target.value }))}
                                                        placeholder="Other URL"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Block 4: Timeline & Status - Emerald Tint */}
                                <div className="bg-emerald-50/30 rounded-2xl p-6 border border-emerald-100 shadow-sm">
                                    <div className="flex items-center gap-3 mb-5 border-l-4 border-emerald-500 pl-4">
                                        <div className="p-2 bg-emerald-100 rounded-lg">
                                            <Calendar className="w-4 h-4 text-emerald-600" />
                                        </div>
                                        <h3 className="text-base font-bold text-gray-800">ระยะเวลาและสถานะ</h3>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-kanit font-bold text-gray-600 ml-1">วันที่เริ่มฝึกงาน</label>
                                            <input 
                                                required
                                                type="date"
                                                className="w-full px-4 py-2.5 bg-white border border-emerald-100 focus:border-emerald-300 rounded-xl text-sm font-medium outline-none transition-all"
                                                value={formData.startDate ? format(formData.startDate, 'yyyy-MM-dd') : ''}
                                                onChange={e => setFormData(prev => ({ ...prev, startDate: new Date(e.target.value) }))}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-kanit font-bold text-gray-600 ml-1">วันที่จบการฝึกงาน</label>
                                            <input 
                                                required
                                                type="date"
                                                className="w-full px-4 py-2.5 bg-white border border-emerald-100 focus:border-emerald-300 rounded-xl text-sm font-medium outline-none transition-all"
                                                value={formData.endDate ? format(formData.endDate, 'yyyy-MM-dd') : ''}
                                                onChange={e => setFormData(prev => ({ ...prev, endDate: new Date(e.target.value) }))}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-kanit font-bold text-gray-600 ml-1">สถานะปัจจุบัน</label>
                                            <FilterDropdown 
                                                label="สถานะ"
                                                value={formData.status || 'APPLIED'}
                                                options={[
                                                    { key: 'APPLIED', label: 'สมัครเข้ามา (Applied)' },
                                                    { key: 'INTERVIEW_SCHEDULED', label: 'นัดสัมภาษณ์แล้ว (Scheduled)' },
                                                    { key: 'INTERVIEWED', label: 'สัมภาษณ์แล้ว (Interviewed)' },
                                                    { key: 'ACCEPTED', label: 'รับเข้าฝึกงาน (Accepted)' },
                                                    { key: 'REJECTED', label: 'ไม่ผ่านการคัดเลือก (Rejected)' },
                                                    { key: 'ARCHIVED', label: 'ย้ายไปที่เก็บถาวร (Archived)' },
                                                ]}
                                                onChange={val => setFormData(prev => ({ ...prev, status: val as InternStatus }))}
                                                icon={<BarChart3 className="w-4 h-4" />}
                                                showAllOption={false}
                                                clearable={false}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-kanit font-bold text-gray-600 ml-1">วันนัดสัมภาษณ์ (ถ้ามี)</label>
                                            <input 
                                                type="datetime-local"
                                                className="w-full px-4 py-2.5 bg-white border border-emerald-100 focus:border-emerald-300 rounded-xl text-sm font-kanit font-medium outline-none transition-all"
                                                value={formData.interviewDate ? format(formData.interviewDate, "yyyy-MM-dd'T'HH:mm") : ''}
                                                onChange={e => setFormData(prev => ({ ...prev, interviewDate: e.target.value ? new Date(e.target.value) : null }))}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Block 5: Notes - Amber Tint */}
                                <div className="bg-amber-50/30 rounded-2xl p-6 border border-amber-100 shadow-sm">
                                    <div className="flex items-center gap-3 mb-4 border-l-4 border-amber-500 pl-4">
                                        <div className="p-2 bg-amber-100 rounded-lg">
                                            <MessageSquare className="w-4 h-4 text-amber-600" />
                                        </div>
                                        <h3 className="text-base font-bold text-gray-800">บันทึกเพิ่มเติม</h3>
                                    </div>
                                    <textarea 
                                        className="w-full px-4 py-3 bg-white border border-amber-100 focus:border-amber-300 rounded-xl text-sm font-kanit font-medium outline-none transition-all min-h-[100px]"
                                        value={formData.notes}
                                        onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                        placeholder="รายละเอียดเพิ่มเติม..."
                                    />
                                </div>
                            </form>

                            {/* Footer - Sticky */}
                            <div className="px-6 py-4 border-t border-gray-100 bg-white flex justify-end items-center gap-3">
                                <button 
                                    type="button"
                                    onClick={onClose}
                                    className="px-5 py-2.5 rounded-lg text-sm font-kanit font-medium text-gray-400 hover:bg-gray-50 transition-all"
                                >
                                    ยกเลิก
                                </button>
                                <button 
                                    onClick={handleSubmit}
                                    disabled={isSavingDisabled || isSubmitting}
                                    className={`flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-kanit font-medium shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    {isSavingDisabled || isSubmitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>กำลังบันทึก...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            บันทึกข้อมูล
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        );

        return createPortal(modalContent, document.body);
    };

    export default InternCandidateModal;
