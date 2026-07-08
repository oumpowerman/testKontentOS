import React from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Sparkles, User, Briefcase, Mail, Phone, Lock, Eye, EyeOff, Quote, ArrowRight, Loader2, Camera, ShieldCheck, X } from 'lucide-react';
import FilterDropdown from '../common/FilterDropdown';
import { EMOJI_POOL } from '../../constants/emojis';
import { supabase } from '../../lib/supabase';

interface RegisterFormProps {
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  showPassword: boolean;
  setShowPassword: (val: boolean) => void;
  name: string;
  setName: (val: string) => void;
  firstName: string;
  setFirstName: (val: string) => void;
  lastName: string;
  setLastName: (val: string) => void;
  position: string;
  setPosition: (val: string) => void;
  employmentType: string;
  setEmploymentType: (val: string) => void;
  phone: string;
  setPhone: (val: string) => void;
  reason: string;
  setReason: (val: string) => void;
  
  positions: { key: string, label: string }[];
  avatarPreview: string | null;
  isConvertingImg: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  selectedEmoji: string;
  setSelectedEmoji: (val: string) => void;
  takenEmojis: string[];
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  email,
  setEmail,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  name,
  setName,
  firstName,
  setFirstName,
  lastName,
  setLastName,
  position,
  setPosition,
  employmentType,
  setEmploymentType,
  phone,
  setPhone,
  reason,
  setReason,
  positions,
  avatarPreview,
  isConvertingImg,
  fileInputRef,
  handleFileChange,
  isLoading,
  onSubmit,
  selectedEmoji,
  setSelectedEmoji,
  takenEmojis,
}) => {
  const [policyData, setPolicyData] = React.useState<{ title: string; content: string } | null>(null);
  const [isPolicyModalOpen, setIsPolicyModalOpen] = React.useState(false);
  const [acceptedTerms, setAcceptedTerms] = React.useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const FORM_FIELDS_ORDER = [
    'avatarPreview',
    'firstName',
    'lastName',
    'nickname',
    'position',
    'employmentType',
    'email',
    'phone',
    'password',
    'selectedEmoji',
    'acceptedTerms'
  ];

  React.useEffect(() => {
    const fetchPolicy = async () => {
      try {
        const { data, error } = await supabase
          .from('master_options')
          .select('*')
          .eq('type', 'SYSTEM_POLICY')
          .eq('key', 'TERMS_OF_SERVICE')
          .maybeSingle();
        if (data) {
          setPolicyData({
            title: data.label || 'ข้อตกลงและเงื่อนไขการปฏิบัติงาน',
            content: data.description || 'ไม่มีเนื้อหาข้อตกลงในระบบ',
          });
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchPolicy();
  }, []);

  // Dynamic Error Clearing via useEffect hooks
  React.useEffect(() => {
    if (avatarPreview && errors.avatarPreview) {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy.avatarPreview;
        return copy;
      });
    }
  }, [avatarPreview, errors.avatarPreview]);

  React.useEffect(() => {
    if (firstName && firstName.trim() && errors.firstName) {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy.firstName;
        return copy;
      });
    }
  }, [firstName, errors.firstName]);

  React.useEffect(() => {
    if (lastName && lastName.trim() && errors.lastName) {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy.lastName;
        return copy;
      });
    }
  }, [lastName, errors.lastName]);

  React.useEffect(() => {
    if (name && name.trim() && errors.nickname) {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy.nickname;
        return copy;
      });
    }
  }, [name, errors.nickname]);

  React.useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && emailRegex.test(email) && errors.email) {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy.email;
        return copy;
      });
    }
  }, [email, errors.email]);

  React.useEffect(() => {
    if (phone && phone.trim() && errors.phone) {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy.phone;
        return copy;
      });
    }
  }, [phone, errors.phone]);

  React.useEffect(() => {
    if (password && password.length >= 8 && errors.password) {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy.password;
        return copy;
      });
    }
  }, [password, errors.password]);

  React.useEffect(() => {
    if (position && position !== 'ALL' && errors.position) {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy.position;
        return copy;
      });
    }
  }, [position, errors.position]);

  React.useEffect(() => {
    if (employmentType && errors.employmentType) {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy.employmentType;
        return copy;
      });
    }
  }, [employmentType, errors.employmentType]);

  React.useEffect(() => {
    if (selectedEmoji && !takenEmojis.includes(selectedEmoji) && errors.selectedEmoji) {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy.selectedEmoji;
        return copy;
      });
    }
  }, [selectedEmoji, takenEmojis, errors.selectedEmoji]);

  React.useEffect(() => {
    if (acceptedTerms && errors.acceptedTerms) {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy.acceptedTerms;
        return copy;
      });
    }
  }, [acceptedTerms, errors.acceptedTerms]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const difference = target.scrollHeight - target.scrollTop - target.clientHeight;
    if (difference <= 15) {
      setHasScrolledToBottom(true);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!avatarPreview) {
      newErrors.avatarPreview = 'กรุณาอัปโหลดรูปภาพโปรไฟล์ของคุณนะครับ';
    }
    if (!firstName || !firstName.trim()) {
      newErrors.firstName = 'กรุณากรอกชื่อจริงนะครับ';
    }
    if (!lastName || !lastName.trim()) {
      newErrors.lastName = 'กรุณากรอกนามสกุลนะครับ';
    }
    if (!name || !name.trim()) {
      newErrors.nickname = 'กรุณากรอกชื่อเล่นนะครับ';
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      newErrors.email = 'กรุณากรอกอีเมลนะครับ';
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'กรุณากรอกอีเมลในรูปแบบที่ถูกต้องนะครับ';
    }

    if (!phone || !phone.trim()) {
      newErrors.phone = 'กรุณากรอกเบอร์โทรศัพท์นะครับ';
    }

    if (!password) {
      newErrors.password = 'กรุณากรอกรหัสผ่านนะครับ';
    } else if (password.length < 8) {
      newErrors.password = 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษรนะครับ';
    }

    if (!position || position === 'ALL') {
      newErrors.position = 'กรุณาเลือกตำแหน่งงานนะครับ';
    }

    if (!employmentType) {
      newErrors.employmentType = 'กรุณาเลือกประเภทพนักงานนะครับ';
    }

    if (!selectedEmoji) {
      newErrors.selectedEmoji = 'กรุณาเลือกอิโมจิประจำตัวนะครับ';
    } else if (takenEmojis.includes(selectedEmoji)) {
      newErrors.selectedEmoji = 'อิโมจินี้ถูกเพื่อนในทีมเลือกไปแล้ว โปรดเลือกอิโมจิอื่นนะครับ';
    }

    if (!acceptedTerms) {
      newErrors.acceptedTerms = 'กรุณายอมรับข้อตกลงและระเบียบปฏิบัติการทำงานนะครับ';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstInvalidKey = FORM_FIELDS_ORDER.find(key => newErrors[key]);
      if (firstInvalidKey) {
        const containerId = `register-${firstInvalidKey}-container`;
        const element = document.getElementById(containerId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          
          setTimeout(() => {
            const input = element.querySelector('input:not([type="file"]):not([type="checkbox"]), button, textarea, #terms-checkbox') as HTMLElement;
            if (input) {
              input.focus();
            }
          }, 350);
        }
      }
      return;
    }

    onSubmit(e);
  };

  const getInputClass = (hasError: boolean, extraClasses = '') => {
    const base = `w-full py-3 rounded-xl outline-none transition-all duration-300 font-bold text-sm ${extraClasses}`;
    
    if (hasError) {
      return `${base} bg-red-50/50 border-2 border-red-200 text-red-900 placeholder:text-red-350 focus:bg-white focus:border-red-400 focus:ring-2 focus:ring-red-100 shadow-[0_0_10px_rgba(239,68,68,0.05)]`;
    }
    return `${base} bg-slate-50 border-2 border-transparent focus:bg-white focus:border-pink-400 text-slate-700`;
  };

  // EMOJI_POOL is imported from central constants
  return (
    <>
      <form onSubmit={handleFormSubmit} className="space-y-4" noValidate>
      {/* Avatar Image Selection */}
      <div id="register-avatarPreview-container" className="flex flex-col items-center mb-6">
        <div 
          className="relative group cursor-pointer" 
          onClick={() => !isConvertingImg && fileInputRef.current?.click()}
        >
          <div className={`w-24 h-24 rounded-full border-4 ${errors.avatarPreview ? 'border-red-200 bg-red-50/30' : avatarPreview ? 'border-pink-300' : 'border-slate-100'} bg-slate-50 flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:border-pink-400 group-hover:scale-105 shadow-sm`}>
            {isConvertingImg ? (
              <div className="flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="text-[10px] mt-1">Processing..</span>
              </div>
            ) : avatarPreview ? (
              <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="flex flex-col items-center text-slate-400 select-none">
                <Camera className={`w-8 h-8 mb-1 transition-colors duration-300 ${errors.avatarPreview ? 'text-red-400' : 'text-slate-400'}`} />
                <span className={`text-[10px] font-bold transition-colors duration-300 ${errors.avatarPreview ? 'text-red-500' : 'text-red-400'}`}>รูปโปรไฟล์ *</span>
              </div>
            )}
          </div>
          <div className="absolute bottom-0 right-0 bg-pink-500 text-white p-2 rounded-full shadow-lg border-2 border-white">
            <Sparkles className="w-3 h-3" />
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/png, image/jpeg, image/jpg, image/heic" 
            onChange={handleFileChange} 
            disabled={isConvertingImg}
          />
        </div>
        {errors.avatarPreview && (
          <p className="text-xs font-bold text-red-500 mt-2 animate-in fade-in duration-300">
            {errors.avatarPreview}
          </p>
        )}
      </div>

      {/* First Name & Last Name Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* First Name */}
        <div id="register-firstName-container" className="space-y-1">
          <label className="text-xs font-bold text-slate-500 ml-1 uppercase">ชื่อจริง *</label>
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
              <User className={`w-5 h-5 transition-colors duration-300 ${errors.firstName ? 'text-red-400 group-focus-within:text-red-500' : 'text-slate-400 group-focus-within:text-pink-500'}`} />
            </div>
            <input 
              type="text" 
              value={firstName} 
              onChange={(e) => setFirstName(e.target.value)} 
              className={getInputClass(!!errors.firstName, "pl-11 pr-4")}
              placeholder="ชื่อจริง" 
            />
          </div>
          {errors.firstName && (
            <p className="text-xs font-bold text-red-500 mt-1 ml-1 animate-in fade-in duration-300">
              {errors.firstName}
            </p>
          )}
        </div>

        {/* Last Name */}
        <div id="register-lastName-container" className="space-y-1">
          <label className="text-xs font-bold text-slate-500 ml-1 uppercase">นามสกุล *</label>
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
              <User className={`w-5 h-5 transition-colors duration-300 ${errors.lastName ? 'text-red-400 group-focus-within:text-red-500' : 'text-slate-400 group-focus-within:text-pink-500'}`} />
            </div>
            <input 
              type="text" 
              value={lastName} 
              onChange={(e) => setLastName(e.target.value)} 
              className={getInputClass(!!errors.lastName, "pl-11 pr-4")}
              placeholder="นามสกุล" 
            />
          </div>
          {errors.lastName && (
            <p className="text-xs font-bold text-red-500 mt-1 ml-1 animate-in fade-in duration-300">
              {errors.lastName}
            </p>
          )}
        </div>
      </div>

      {/* Nickname and Rank Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Nickname */}
        <div id="register-nickname-container" className="space-y-1">
          <label className="text-xs font-bold text-slate-500 ml-1 uppercase">ชื่อเล่น *</label>
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <User className={`w-5 h-5 transition-colors duration-300 ${errors.nickname ? 'text-red-400 group-focus-within:text-red-500' : 'text-slate-400 group-focus-within:text-pink-500'}`} />
              </motion.div>
            </div>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              className={getInputClass(!!errors.nickname, "pl-11 pr-4")}
              placeholder="ชื่อเล่น" 
            />
          </div>
          {errors.nickname && (
            <p className="text-xs font-bold text-red-500 mt-1 ml-1 animate-in fade-in duration-300">
              {errors.nickname}
            </p>
          )}
        </div>

        {/* Position */}
        <div id="register-position-container" className="space-y-1">
          <label className="text-xs font-bold text-slate-500 ml-1 uppercase">ตำแหน่งงาน *</label>
          <FilterDropdown 
            label="ตำแหน่งงาน"
            options={positions.length > 0 ? positions.map(p => ({ key: p.label, label: p.label })) : [
              { key: 'Editor', label: 'Editor' },
              { key: 'Creative', label: 'Creative' },
            ]}
            value={position}
            onChange={(val) => setPosition(val)}
            showAllOption={false}
            clearable={false}
            icon={<Briefcase className="w-5 h-5" />}
            activeColorClass="bg-pink-50 border-pink-200 text-pink-700 font-bold"
            hasError={!!errors.position}
          />
          {errors.position && (
            <p className="text-xs font-bold text-red-500 mt-1 ml-1 animate-in fade-in duration-300">
              {errors.position}
            </p>
          )}
        </div>
      </div>

      {/* Employment Type */}
      <div id="register-employmentType-container" className="space-y-1">
        <label className="text-xs font-bold text-slate-500 ml-1 uppercase">ประเภทพนักงาน *</label>
        <FilterDropdown 
          label="ประเภทพนักงาน"
          options={[
            { key: 'FULL_TIME', label: 'พนักงานประจำ (Full-time)' },
            { key: 'INTERN', label: 'นักศึกษาฝึกงาน (Intern)' },
            { key: 'PROBATION', label: 'ทดลองงาน (Probation)' },
          ]}
          value={employmentType}
          onChange={(val) => setEmploymentType(val)}
          showAllOption={false}
          clearable={false}
          icon={<User className="w-5 h-5" />}
          activeColorClass="bg-pink-50 border-pink-200 text-pink-700 font-bold"
          hasError={!!errors.employmentType}
        />
        {errors.employmentType && (
          <p className="text-xs font-bold text-red-500 mt-1 ml-1 animate-in fade-in duration-300">
            {errors.employmentType}
          </p>
        )}
      </div>

      {/* Email Input */}
      <div id="register-email-container" className="space-y-1">
        <label className="text-xs font-bold text-slate-500 ml-1 uppercase">อีเมล *</label>
        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
            <motion.div
              animate={{ y: [0, -2, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Mail className={`w-5 h-5 transition-colors duration-300 ${errors.email ? 'text-red-400 group-focus-within:text-red-500' : 'text-slate-400 group-focus-within:text-pink-500'}`} />
            </motion.div>
          </div>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            className={getInputClass(!!errors.email, "pl-11 pr-4")}
            placeholder="email@example.com" 
          />
        </div>
        {errors.email && (
          <p className="text-xs font-bold text-red-500 mt-1 ml-1 animate-in fade-in duration-300">
            {errors.email}
          </p>
        )}
      </div>

      {/* Phone Number */}
      <div id="register-phone-container" className="space-y-1">
        <label className="text-xs font-bold text-slate-500 ml-1 uppercase">เบอร์โทรศัพท์ *</label>
        <div className="relative group">
          <Phone className={`w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${errors.phone ? 'text-red-400 group-focus-within:text-red-500' : 'text-slate-400 group-focus-within:text-pink-500'}`} />
          <input 
            type="tel" 
            value={phone} 
            onChange={(e) => setPhone(e.target.value)} 
            className={getInputClass(!!errors.phone, "pl-11 pr-4")}
            placeholder="08x-xxx-xxxx" 
          />
        </div>
        {errors.phone && (
          <p className="text-xs font-bold text-red-500 mt-1 ml-1 animate-in fade-in duration-300">
            {errors.phone}
          </p>
        )}
      </div>

      {/* Password Input */}
      <div id="register-password-container" className="space-y-1">
        <label className="text-xs font-bold text-slate-500 ml-1 uppercase">รหัสผ่าน *</label>
        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
            <motion.div
              animate={{ 
                rotate: [0, 8, 0, -8, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            >
              <Lock className={`w-5 h-5 transition-colors duration-300 ${errors.password ? 'text-red-400 group-focus-within:text-red-500' : 'text-slate-400 group-focus-within:text-pink-500'}`} />
            </motion.div>
          </div>
          <input 
            type={showPassword ? "text" : "password"} 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            className={getInputClass(!!errors.password, "pl-11 pr-12 [&::-ms-reveal]:hidden [&::-webkit-password-reveal-button]:hidden")}
            placeholder="••••••••" 
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors outline-none focus:ring-0 z-20"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs font-bold text-red-500 mt-1 ml-1 animate-in fade-in duration-300">
            {errors.password}
          </p>
        )}
      </div>

      {/* Bio / Quote Area */}
      <div className="space-y-1">
        <label className="text-xs font-bold text-slate-500 ml-1 uppercase">แนะนำตัว / ฝากถึงทีมงาน</label>
        <div className="relative group">
          <Quote className="w-5 h-5 text-slate-400 absolute left-4 top-4 group-focus-within:text-pink-500 transition-colors" />
          <textarea 
            value={reason} 
            onChange={(e) => setReason(e.target.value)} 
            rows={2} 
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-pink-400 rounded-xl outline-none transition-all font-medium text-slate-700 text-sm resize-none" 
            placeholder="บอกเราหน่อยว่าทำไมอยากร่วมทีม..." 
          />
        </div>
      </div>

      {/* 8-bit Emoji Picker Selection */}
      <div id="register-selectedEmoji-container" className={`space-y-2 p-4 shadow-inner rounded-2xl border-2 transition-all duration-300 ${errors.selectedEmoji ? 'bg-red-50/20 border-red-200/60' : 'bg-indigo-50/20 border-indigo-100/50'}`}>
        <div className="flex justify-between items-center">
          <label className="text-xs font-black text-indigo-950 flex items-center gap-1.5 uppercase">
            <span>✨ เลือกอิโมจิประจำตัว *</span>
            <span className="text-[10px] font-medium text-indigo-400 font-sans lowercase">(ใช้สำหรับวิ่งบนลู่วิ่งแข่ง และสะสมแต้ม)</span>
          </label>
          <span className="font-mono text-lg select-none px-3 py-1 bg-white rounded-xl border border-indigo-100 shadow-sm">
            {selectedEmoji || '👾'}
          </span>
        </div>
        
        <div className="grid grid-cols-10 gap-1.5 max-h-[115px] overflow-y-auto p-1.5 bg-white/70 rounded-xl border border-indigo-50/50 scrollbar-thin scrollbar-thumb-indigo-200">
          {EMOJI_POOL.map((emo) => {
            const isTaken = takenEmojis.includes(emo);
            const isSelected = selectedEmoji === emo;
            return (
              <button
                key={emo}
                type="button"
                disabled={isTaken}
                onClick={() => setSelectedEmoji(emo)}
                className={`text-xl p-1 rounded-lg transition-transform duration-100 ease-out flex items-center justify-center relative select-none
                  ${isSelected ? 'bg-indigo-500 scale-110 shadow-md border border-indigo-600 ring-2 ring-indigo-200 z-10 text-white' : 'hover:scale-105 active:scale-95'}
                  ${isTaken ? 'opacity-25 bg-slate-100 cursor-not-allowed filter grayscale line-through' : 'cursor-pointer hover:bg-indigo-50'}
                `}
                title={isTaken ? 'เพื่อนในทีมเลือกไปแล้วครับ' : 'คลิกเพื่อเลือกอิโมจินี้'}
              >
                <span className="leading-none">{emo}</span>
                {isTaken && (
                  <span className="absolute text-[8px] bottom-0 right-0">🔒</span>
                )}
              </button>
            );
          })}
        </div>
        {errors.selectedEmoji && (
          <p className="text-xs font-bold text-red-500 mt-1 ml-1 animate-in fade-in duration-300">
            {errors.selectedEmoji}
          </p>
        )}
      </div>

      {/* Terms & Conditions Checkbox */}
      <div id="register-acceptedTerms-container" className={`flex items-start gap-3 p-4 rounded-2xl border transition-all duration-300 ${errors.acceptedTerms ? 'bg-red-50/20 border-red-200/60' : 'bg-indigo-50/25 border-indigo-100/50'}`}>
        <input
          id="terms-checkbox"
          type="checkbox"
          checked={acceptedTerms}
          onChange={(e) => {
            if (!acceptedTerms) {
              setIsPolicyModalOpen(true);
              setHasScrolledToBottom(false);
            } else {
              setAcceptedTerms(false);
            }
          }}
          className="w-5 h-5 rounded border-gray-300 text-pink-600 focus:ring-pink-500 mt-0.5 cursor-pointer accent-pink-600"
        />
        <label 
          onClick={(e) => {
            e.preventDefault();
            if (!acceptedTerms) {
              setIsPolicyModalOpen(true);
              setHasScrolledToBottom(false);
            } else {
              setAcceptedTerms(false);
            }
          }}
          className="text-xs text-slate-500 leading-relaxed cursor-pointer select-none"
        >
          ฉันได้เปิดอ่านและเข้าใจ{' '}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsPolicyModalOpen(true);
              setHasScrolledToBottom(false);
            }}
            className="text-pink-600 font-bold hover:underline"
          >
            ข้อตกลงและระเบียบปฏิบัติการทำงาน
          </button>{' '}
          ขององค์กรครบถ้วน และตกลงที่จะปฏิบัติตามนโยบายนี้ทุกประการ *
        </label>
      </div>
      {errors.acceptedTerms && (
        <p className="text-xs font-bold text-red-500 mt-1 ml-3 animate-in fade-in duration-300">
          {errors.acceptedTerms}
        </p>
      )}

      {/* Submit Button */}
      <div className="pt-4">
        <button 
          type="submit" 
          disabled={isLoading || isConvertingImg}
          className={`w-full py-4 rounded-xl font-black text-white text-base shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${isLoading || isConvertingImg ? 'opacity-50 cursor-not-allowed' : ''} bg-gradient-to-r from-pink-500 to-rose-500 shadow-pink-200`}
        >
          {isLoading || isConvertingImg ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>กำลังส่งใบสมัคร...</span>
            </>
          ) : (
            <>
              <span>ส่งใบสมัครสมาชิก</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )} 
        </button>
      </div>
    </form>

    {/* Policy View Modal overlay */}
    {isPolicyModalOpen && createPortal(
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
        <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 text-slate-800">
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-slate-800 text-base">
                  {policyData?.title || 'ข้อตกลงและเงื่อนไขการปฏิบัติงาน'}
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  กรุณาเลื่อนลงไปด้านล่างสุดเพื่อเปิดใช้งานปุ่มยินยอม
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsPolicyModalOpen(false)}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content (Scrollable) */}
          <div
            onScroll={handleScroll}
            className="p-6 overflow-y-auto flex-1 text-sm text-slate-600 leading-relaxed font-sans space-y-4 text-left"
          >
            {policyData?.content ? (
              policyData.content.split('\n').map((line, idx) => {
                if (line.startsWith('###')) {
                  return <h4 key={idx} className="font-black text-slate-850 text-base pt-3">{line.replace('###', '').trim()}</h4>;
                }
                if (line.startsWith('#')) {
                  return <h3 key={idx} className="font-black text-slate-900 text-lg border-b pb-2">{line.replace('#', '').trim()}</h3>;
                }
                if (line.startsWith('-')) {
                  return <li key={idx} className="ml-4 list-disc text-slate-600">{line.replace('-', '').trim()}</li>;
                }
                return <p key={idx}>{line}</p>;
              })
            ) : (
              <div className="text-center py-12 text-slate-400 italic">
                กำลังโหลดข้อมูลข้อตกลง...
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center gap-3">
            <div className="text-xs text-slate-400 flex-1 text-center sm:text-left">
              {!hasScrolledToBottom ? (
                <span className="animate-pulse">⚠️ กรุณาเลื่อนลงเพื่ออ่านรายละเอียดให้ครบถ้วน</span>
              ) : (
                <span className="text-green-600 font-bold">✓ อ่านรายละเอียดครบถ้วนแล้ว</span>
              )}
            </div>
            <button
              type="button"
              disabled={!hasScrolledToBottom}
              onClick={() => {
                setAcceptedTerms(true);
                setIsPolicyModalOpen(false);
              }}
              className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-white text-sm transition-all shadow-md
                ${hasScrolledToBottom 
                  ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100 cursor-pointer' 
                  : 'bg-slate-300 shadow-none cursor-not-allowed'
                }
              `}
            >
              ฉันเข้าใจและยอมรับข้อตกลง
            </button>
          </div>
        </div>
      </div>,
      document.body
    )}
    </>
  );
};
