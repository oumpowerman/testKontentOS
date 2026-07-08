import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ArrowRight, LogIn, UserPlus, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import SuccessModal from './SuccessModal';
import ImageCropper from './ImageCropper';
import heic2any from 'heic2any';

import { EMOJI_POOL, DEFAULT_EMOJI } from '../constants/emojis';

// Modular auth components
import { BrandSection } from './auth/BrandSection';
import { LoginForm } from './auth/LoginForm';
import { RegisterForm } from './auth/RegisterForm';
import { ForgotPasswordForm } from './auth/ForgotPasswordForm';
import { UpdatePasswordForm } from './auth/UpdatePasswordForm';
import { AuthDynamicBackground } from './auth/AuthDynamicBackground';

interface AuthPageProps {
  onLoginSuccess: () => void;
  onBack?: () => void;
  initialMode?: 'LOGIN' | 'REGISTER' | 'FORGOT' | 'UPDATE';
  onPasswordUpdateSuccess?: () => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ 
  onLoginSuccess, 
  onBack, 
  initialMode, 
  onPasswordUpdateSuccess 
}) => {
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER' | 'FORGOT' | 'UPDATE'>(initialMode || 'LOGIN');
  
  // Shared Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Registration dynamic state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [position, setPosition] = useState(''); 
  const [employmentType, setEmploymentType] = useState('');
  const [phone, setPhone] = useState('');
  const [reason, setReason] = useState('');
  
  // Master positions options
  const [positions, setPositions] = useState<{key: string, label: string}[]>([]);
  
  // Emoji states
  const [takenEmojis, setTakenEmojis] = useState<string[]>([]);
  const [selectedEmoji, setSelectedEmoji] = useState(DEFAULT_EMOJI);
  
  // Profile picture upload state
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isConvertingImg, setIsConvertingImg] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null); 
  
  // Loading & statuses
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const [showForgotConfirm, setShowForgotConfirm] = useState(false);
  
  // Display modals
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const isLogin = authMode === 'LOGIN';
  const isRegister = authMode === 'REGISTER';
  const isForgot = authMode === 'FORGOT';
  const isUpdate = authMode === 'UPDATE';

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync mode with parameters
  useEffect(() => {
    if (initialMode) {
        setAuthMode(initialMode);
    } else if (window.location.hash.includes('type=recovery')) {
        setAuthMode('UPDATE');
    }
  }, [initialMode]);

  // Load design positions
  useEffect(() => {
    const fetchPositions = async () => {
        const { data } = await supabase
            .from('master_options')
            .select('key, label')
            .eq('type', 'POSITION')
            .eq('is_active', true)
            .order('sort_order', { ascending: true });
        
        let loadedPositions: { key: string; label: string }[] = [];
        if (data && data.length > 0) {
            loadedPositions = data.filter(p => !['CEO', 'HR_MANAGER', 'SENIOR_HR'].includes(p.key));
        } else {
            loadedPositions = [
              { key: 'CREATIVE', label: 'Creative' },
              { key: 'EDITOR', label: 'Editor' },
              { key: 'PRODUCTION', label: 'Production' },
              { key: 'ADMIN', label: 'Admin / Co-ord' },
            ];
        }
        loadedPositions.push({ key: 'OTHER', label: 'อื่นๆ (ใส่ตำแหน่งทีหลัง)' });
        setPositions(loadedPositions);
    };
    fetchPositions();
  }, []);

  // Fetch already chosen emojis in profiles
  useEffect(() => {
    if (authMode === 'REGISTER') {
      const fetchTakenEmojis = async () => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('emoji');
          if (data) {
            const emojis = data.map(p => p.emoji).filter(Boolean);
            setTakenEmojis(emojis);
            // Default select the first available emoji in our predefined list
            const firstAvailable = EMOJI_POOL.find(e => !emojis.includes(e));
            if (firstAvailable) {
              setSelectedEmoji(firstAvailable);
            }
          }
        } catch (e) {
          console.error("Error fetching taken emojis:", e);
        }
      };
      fetchTakenEmojis();
    }
  }, [authMode]);

  const toggleMode = (mode: 'LOGIN' | 'REGISTER' | 'FORGOT' | 'UPDATE') => {
      if (authMode === mode) return;
      setAuthMode(mode);
      setErrorMsg(null);
      setResetSent(false);
      setShowForgotConfirm(false);
  };

  const handleCloseSuccessModal = () => {
      setShowSuccessModal(false);
      const wasUpdate = authMode === 'UPDATE';
      setAuthMode('LOGIN');
      setPassword(''); 
      setConfirmPassword('');
      setErrorMsg(null);
      setPosition('');
      setFirstName('');
      setLastName('');
      setPhone('');
      setReason('');
      setAvatarFile(null);
      setAvatarPreview(null);

      if (wasUpdate && onPasswordUpdateSuccess) {
          onPasswordUpdateSuccess();
      }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          let file = e.target.files[0];
          
          // Image format validation & conversion for HEIC files
          if (file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic')) {
              setIsConvertingImg(true);
              try {
                  const convertedBlob = await heic2any({
                      blob: file,
                      toType: 'image/jpeg',
                      quality: 0.8
                  });
                  
                  const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
                  file = new File([blob], file.name.replace(/\.heic$/i, '.jpg'), { type: 'image/jpeg' });
              } catch (err) {
                  console.error("HEIC Conversion error:", err);
                  setErrorMsg("ไม่สามารถแปลงไฟล์รูปภาพได้ กรุณาลองใช้รูปอื่น");
                  setIsConvertingImg(false);
                  return;
              } finally {
                  setIsConvertingImg(false);
              }
          }

          const reader = new FileReader();
          reader.onload = () => {
              setCropImageSrc(reader.result as string);
          };
          reader.readAsDataURL(file);
          
          if (fileInputRef.current) fileInputRef.current.value = '';
      }
  };

  const handleCropComplete = (croppedBlob: Blob) => {
      const file = new File([croppedBlob], "avatar.jpg", { type: "image/jpeg" });
      setAvatarFile(file);
      const objectUrl = URL.createObjectURL(croppedBlob);
      setAvatarPreview(objectUrl);
      setCropImageSrc(null);
  };

  // Google OAuth scaling integration
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setErrorMsg(err.message || 'ระบบเกิดข้อผิดพลาดในการกู้คืนผ่านระบบ Google');
    } finally {
      setIsLoading(false);
    }
  };

  // Standard submit routes
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      onLoginSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmitEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setShowForgotConfirm(true);
  };

  const handleSendResetEmail = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/`,
      });
      if (error) throw error;
      setResetSent(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'ไม่สามารถส่งลิงก์กู้คืนได้ ลองใหม่อีกครั้ง');
      setShowForgotConfirm(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    try {
      if (password !== confirmPassword) {
        throw new Error('รหัสผ่านไม่ตรงกัน');
      }
      if (password.length < 6) {
        throw new Error('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      }
      const { error } = await supabase.auth.updateUser({
        password: password
      });
      if (error) throw error;
      setShowSuccessModal(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'ไม่สามารถอัปเดตรหัสผ่านใหม่ได้');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    try {
      if (!firstName.trim() || !lastName.trim() || !name.trim() || !position.trim() || !phone.trim() || !employmentType) {
        throw new Error('กรุณากรอกข้อมูลให้ครบทุกช่องที่มีเครื่องหมาย * นะครับ');
      }
      if (!selectedEmoji) {
        throw new Error('กรุณาเลือกอิโมจิประจำตัวของคุณด้วยนะครับ 👾');
      }
      if (takenEmojis.includes(selectedEmoji)) {
        throw new Error('อิโมจินี้ถูกเพื่อนในทีมเลือกไปแล้วครับ โปรดเลือกอิโมจิอื่นนะ ✨');
      }

      const fullNameCombined = `${firstName.trim()} ${lastName.trim()}`.trim();

      // Create new user credentials
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullNameCombined || name,
            position: position,
            phone_number: phone,
          }
        }
      });
      
      if (authError) throw authError;
      if (!authData.user) throw new Error("สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");

      const userId = authData.user.id;
      let publicUrl = '';

      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${userId}-${Date.now()}.${fileExt}`;

        // Upload profile image safely to Storage bucket
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile);

        if (uploadError) throw new Error('อัปโหลดรูปไม่สำเร็จ: ' + uploadError.message);

        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);

        publicUrl = urlData.publicUrl;
      }

      // Upsert customized user levels and details to ensure profile creation even if database triggers are missing
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({ 
          id: userId,
          email: email,
          full_name: fullNameCombined || name,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          nickname: name.trim(),
          avatar_url: publicUrl || null,
          position: position, 
          employment_type: employmentType,
          start_date: new Date().toISOString(),
          phone_number: phone,
          bio: reason,
          role: 'MEMBER',
          work_days: [1, 2, 3, 4, 5],
          hp: 100,
          max_hp: 100,
          xp: 0,
          level: 1,
          available_points: 0,
          death_count: 0,
          emoji: selectedEmoji
        });

      if (profileError) throw profileError;

      if (authData.session) {
        onLoginSuccess();
      } else {
        setShowSuccessModal(true);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'มีข้อพิลึกบางอย่างโปรดลองใหม่อีกครั้งครับ');
    } finally {
      setIsLoading(false);
    }
  };

  // Mouse movement 3D tilt logic using performance-optimized Framer Motion
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  
  // Spring settings for buttery smooth reactive physics (perfectly 120Hz smooth)
  const rotateXSpring = useSpring(useTransform(tiltY, [-0.5, 0.5], [5, -5]), { stiffness: 85, damping: 22 });
  const rotateYSpring = useSpring(useTransform(tiltX, [-0.5, 0.5], [-5, 5]), { stiffness: 85, damping: 22 });
  
  // Dynamic scale and reflection light translation
  const containerScale = useSpring(1, { stiffness: 120, damping: 25 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only apply 3D tilt on desktop screens for comfortable ergonomics
    if (window.innerWidth < 768) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    tiltX.set(x);
    tiltY.set(y);
    containerScale.set(1.006);
  };

  const handleMouseLeave = () => {
    tiltX.set(0);
    tiltY.set(0);
    containerScale.set(1);
  };

  const dynamicShadow = 
    authMode === 'LOGIN' 
      ? 'shadow-[0_45px_100px_-25px_rgba(59,130,246,0.18),0_20px_45px_-15px_rgba(0,0,0,0.05),0_0_80px_rgba(59,130,246,0.06),inset_0_1px_1px_rgba(255,255,255,0.85)]'
      : authMode === 'REGISTER'
      ? 'shadow-[0_45px_100px_-25px_rgba(244,63,94,0.18),0_20px_45px_-15px_rgba(0,0,0,0.05),0_0_80px_rgba(244,63,94,0.06),inset_0_1px_1px_rgba(255,255,255,0.85)]'
      : 'shadow-[0_45px_100px_-25px_rgba(168,85,247,0.18),0_20px_45px_-15px_rgba(0,0,0,0.05),0_0_80px_rgba(168,85,247,0.06),inset_0_1px_1px_rgba(255,255,255,0.85)]';

  return (
    <div className="min-h-[100dvh] md:h-[100dvh] flex items-center justify-center p-4 md:p-6 font-sans relative overflow-y-auto md:overflow-hidden perspective-1000">
      
      {/* Dynamic Crop Overlay */}
      {cropImageSrc && (
          <ImageCropper 
              imageSrc={cropImageSrc}
              onCropComplete={handleCropComplete}
              onCancel={() => setCropImageSrc(null)}
          />
      )}

      {/* Premium Fluid Aura Background Component */}
      <AuthDynamicBackground authMode={authMode} />

      {/* Outer Glow Wrapper (First Border Layer) */}
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX: rotateXSpring,
          rotateY: rotateYSpring,
          scale: containerScale,
          transformStyle: "preserve-3d"
        }}
        className={`relative w-full max-w-5xl bg-white/40 backdrop-blur-3xl rounded-[2.6rem] p-[1px] border border-white/70 transition-all duration-700 h-full max-h-[92dvh] md:h-[min(780px,88dvh)] my-auto flex flex-col md:flex-row overflow-hidden ${dynamicShadow}`}
      >
        {/* Buttery dynamic glass refraction reflection effect */}
        <motion.div 
          className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-30 z-30"
          style={{
            background: useTransform(
              [tiltX, tiltY],
              ([tx, ty]) => `radial-gradient(circle 350px at ${(Number(tx) + 0.5) * 100}% ${(Number(ty) + 0.5) * 100}%, rgba(255,255,255,0.95) 0%, transparent 100%)`
            )
          }}
        />

        {onBack && (
            <button 
                onClick={onBack}
                className="absolute top-6 left-6 z-50 flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold text-sm bg-white/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/75 transition-all active:scale-95 shadow-sm"
            >
                <ArrowRight className="w-4 h-4 rotate-180" /> กลับหน้าหลัก
            </button>
        )}
        
        {/* Left branding animated panel */}
        <BrandSection authMode={authMode} />

        {/* Right input forms handler */}
        <div className="w-full md:w-7/12 p-6 md:p-12 flex flex-col flex-1 relative overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent z-10 bg-white/75 rounded-r-[2.5rem] rounded-l-[2.5rem] md:rounded-l-none">
            
            {(isLogin || isRegister) && (
                <div className="flex justify-center mb-8">
                     <div className="bg-slate-100/70 p-1.5 rounded-2xl flex items-center border border-slate-200/50 shadow-inner w-full max-w-[340px] relative">
                          <button 
                            type="button"
                            onClick={() => toggleMode('LOGIN')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black transition-all duration-300 relative z-10 ${isLogin ? 'bg-white text-indigo-600 shadow-md scale-[1.02]' : 'text-slate-400 hover:text-slate-600'}`}
                          >
                             <LogIn className="w-4 h-4" /> เข้าสู่ระบบ
                          </button>
                          <button 
                            type="button"
                            onClick={() => toggleMode('REGISTER')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black transition-all duration-300 relative z-10 ${isRegister ? 'bg-white text-pink-600 shadow-md scale-[1.02]' : 'text-slate-400 hover:text-slate-600'}`}
                          >
                             <UserPlus className="w-4 h-4" /> สมัครสมาชิก
                          </button>
                     </div>
                </div>
            )}

            <div className="max-w-md mx-auto w-full flex-1 flex flex-col justify-center">
                <AnimatePresence mode="wait">
                    <motion.div 
                        key={authMode}
                        initial={{ opacity: 0, x: isLogin || isForgot ? -10 : 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: isLogin || isForgot ? 10 : -10 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                    >
                        {/* Headers */}
                        {!showForgotConfirm && !resetSent && (
                          <div className="mb-6 text-center md:text-left">
                              <motion.h3 
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: 0.1 }}
                                  className="text-3xl font-black mb-2 text-slate-800"
                              >
                                  {isLogin ? 'ยินดีต้อนรับกลับ! 👋' : isRegister ? 'สร้างบัญชีใหม่ ✨' : isForgot ? 'กู้คืนรหัสผ่าน 🛡️' : 'ตั้งรหัสผ่านใหม่ 🔒'}
                              </motion.h3>
                              <motion.p 
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: 0.2 }}
                                  className="text-slate-500 font-medium font-bold text-sm"
                              >
                                  {isLogin ? 'กรอกข้อมูลเพื่อเข้าสู่ระบบจัดการงาน' : isRegister ? 'กรอกข้อมูลตำแหน่งงานเพื่อเข้าร่วมทีม' : isForgot ? 'กรอกอีเมลเพื่อรับลิงก์สำหรับเปลี่ยนรหัสผ่าน' : 'กรุณากรอกรหัสผ่านใหม่ที่ต้องการใช้งาน'}
                              </motion.p>
                          </div>
                        )}

                        {/* Error Notifications container */}
                        {errorMsg && (
                            <div className="mb-6 p-4 rounded-2xl bg-red-50 border-2 border-red-100 flex items-start gap-3 text-red-500 shadow-sm">
                                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                <span className="font-bold text-sm">{errorMsg}</span>
                            </div>
                        )}

                        {/* Rendering corresponding active sub-forms */}
                        {isLogin ? (
                          <LoginForm 
                            email={email}
                            setEmail={setEmail}
                            password={password}
                            setPassword={setPassword}
                            showPassword={showPassword}
                            setShowPassword={setShowPassword}
                            isLoading={isLoading}
                            onSubmit={handleLoginSubmit}
                            onForgotPasswordClick={() => toggleMode('FORGOT')}
                            onGoogleSignIn={handleGoogleSignIn}
                          />
                        ) : isRegister ? (
                          <RegisterForm 
                            email={email}
                            setEmail={setEmail}
                            password={password}
                            setPassword={setPassword}
                            showPassword={showPassword}
                            setShowPassword={setShowPassword}
                            name={name}
                            setName={setName}
                            firstName={firstName}
                            setFirstName={setFirstName}
                            lastName={lastName}
                            setLastName={setLastName}
                            position={position}
                            setPosition={setPosition}
                            employmentType={employmentType}
                            setEmploymentType={setEmploymentType}
                            phone={phone}
                            setPhone={setPhone}
                            reason={reason}
                            setReason={setReason}
                            positions={positions}
                            avatarPreview={avatarPreview}
                            isConvertingImg={isConvertingImg}
                            fileInputRef={fileInputRef}
                            handleFileChange={handleFileChange}
                            isLoading={isLoading}
                            onSubmit={handleRegisterSubmit}
                            selectedEmoji={selectedEmoji}
                            setSelectedEmoji={setSelectedEmoji}
                            takenEmojis={takenEmojis}
                          />
                        ) : isForgot ? (
                          <ForgotPasswordForm 
                            email={email}
                            setEmail={setEmail}
                            isLoading={isLoading}
                            resetSent={resetSent}
                            showForgotConfirm={showForgotConfirm}
                            setShowForgotConfirm={setShowForgotConfirm}
                            onSubmitEmail={handleForgotSubmitEmail}
                            onSendReset={handleSendResetEmail}
                            onBackToLogin={() => toggleMode('LOGIN')}
                          />
                        ) : (
                          <UpdatePasswordForm 
                            password={password}
                            setPassword={setPassword}
                            confirmPassword={confirmPassword}
                            setConfirmPassword={setConfirmPassword}
                            showPassword={showPassword}
                            setShowPassword={setShowPassword}
                            isLoading={isLoading}
                            onSubmit={handleUpdatePassword}
                          />
                        )}

                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
      </motion.div>

      {/* Shared success responses modal (Sign up submission | password update completion) */}
      <SuccessModal 
        isOpen={showSuccessModal}
        onClose={handleCloseSuccessModal}
        title={isUpdate ? "เปลี่ยนรหัสผ่านสำเร็จ! 🔐" : "ส่งใบสมัครแล้ว! 🎉"}
        description={
            isUpdate ? (
                <>
                    รหัสผ่านของคุณถูกเปลี่ยนเรียบร้อยแล้ว <br/>
                    <span className="text-gray-500 text-sm">คุณสามารถใช้รหัสผ่านใหม่เข้าสู่ระบบได้ทันที</span>
                </>
            ) : (
                <>
                    เย้! เราได้รับข้อมูลของคุณแล้ว <br/>
                    <span className="text-gray-500 text-sm">พี่ Admin จะรีบตรวจความถูกต้องและอนุมัติให้โดยไว</span><br/>
                    <span className="text-pink-500 font-bold text-lg mt-2 block">รอก่อนนะคร้าบ!</span> 
                </>
            )
        }
        buttonText={isUpdate ? "ไปหน้าล็อกอิน" : "กลับไปหน้าล็อกอิน"}
      />
    </div>
  );
};

export default AuthPage;
