
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Loader2, Send, CheckCircle, Trash2, AlertTriangle } from 'lucide-react';
import { User as UserType } from '../types';
import ImageCropper from './ImageCropper';
import { useGlobalDialog } from '../context/GlobalDialogContext';
import { useProfileForm } from '../hooks/useProfileForm';
import { EMOJI_POOL } from '../constants/emojis';
import ProfileAvatarUploader from './profile/ProfileAvatarUploader';
import ProfileStatusSection from './profile/ProfileStatusSection';
import ProfileBasicInfo from './profile/ProfileBasicInfo';
import ProfileBioSection from './profile/ProfileBioSection';
import ProfileSocialSection from './profile/ProfileSocialSection';
import ProfileLineNotificationGuide from './profile/ProfileLineNotificationGuide';
import { supabase } from '../lib/supabase';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserType;
  onSave: (updates: Partial<UserType>, file?: File) => Promise<boolean>;
}

const ProfileEditModal: React.FC<ProfileEditModalProps> = ({ isOpen, onClose, user, onSave }) => {
  const { showAlert } = useGlobalDialog();
  const [showFullImage, setShowFullImage] = useState(false);

  // LINE Connection Test States
  const [testState, setTestState] = useState<'IDLE' | 'TESTING' | 'SENT' | 'ERROR'>('IDLE');
  const [testError, setTestError] = useState<string | null>(null);
  const [createdNotifId, setCreatedNotifId] = useState<string | null>(null);

  const {
    formState,
    fileInputRef,
    handleFileSelect,
    handleCropComplete,
    handleStatusChange,
    handleSubmit
  } = useProfileForm({ user, onSave, onClose });

  const {
    name, setName,
    position, setPosition,
    phone, setPhone,
    bio, setBio,
    feeling, setFeeling,
    workStatus,
    leaveStart, setLeaveStart,
    leaveEnd, setLeaveEnd,
    lineUserId, setLineUserId,
    previewUrl,
    cropImageSrc, setCropImageSrc,
    positions,
    isSubmitting,
    isConvertingImg,
    emoji, setEmoji,
    takenEmojis
  } = formState;

  const handleTestLineConnection = async () => {
    if (!lineUserId.trim()) {
      showAlert('กรุณากรอก LINE User ID', 'กรุณากรอก LINE User ID ก่อนทดสอบเชื่อมต่อครับ');
      return;
    }
    
    setTestState('TESTING');
    setTestError(null);
    
    try {
      // 1. Temporarily save LINE ID in profile so edge function reads it correctly
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ line_user_id: lineUserId.trim() })
        .eq('id', user.id);
        
      if (updateErr) throw updateErr;
      
      // 2. Insert test notification
      const { data: notifData, error: notifErr } = await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          type: 'INFO',
          title: '🔔 ทดสอบเชื่อมต่อ LINE สำเร็จ!',
          message: 'นี่คือข้อความทดสอบจากระบบ Juijui App เพื่อยืนยันว่า LINE User ID ของคุณใช้งานได้ถูกต้องเป็นปกติ',
          is_read: false,
          link_path: 'ATTENDANCE'
        })
        .select('*')
        .single();
        
      if (notifErr) throw notifErr;
      
      if (notifData) {
        setCreatedNotifId(notifData.id);
      }
      
      setTestState('SENT');
      
      // Auto-delete the test notification after 15 seconds to keep the database and user's notifications list clean
      setTimeout(async () => {
        if (notifData?.id) {
          await supabase.from('notifications').delete().eq('id', notifData.id);
        }
      }, 15000);
      
    } catch (err: any) {
      console.error('Test LINE error:', err);
      setTestState('ERROR');
      setTestError(err.message || 'เกิดข้อผิดพลาดในการส่งข้อความทดสอบ');
    }
  };

  const handleManualDeleteTest = async () => {
    if (!createdNotifId) return;
    try {
      await supabase.from('notifications').delete().eq('id', createdNotifId);
      setCreatedNotifId(null);
      setTestState('IDLE');
    } catch (err) {
      console.error('Failed to delete test notification:', err);
    }
  };

  return (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 font-sans overflow-hidden">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-indigo-950/40 backdrop-blur-md"
          />

          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20, filter: 'blur(8px)' }}
            className="bg-white/95 backdrop-blur-3xl w-full max-w-2xl rounded-[2.5rem] shadow-2xl shadow-indigo-500/20 overflow-hidden border border-white/60 max-h-[90vh] flex flex-col ring-1 ring-white/50 relative"
            onClick={(e) => e.stopPropagation()}
          >
      
      {/* Image Cropper Modal */}
      {cropImageSrc && (
          <ImageCropper 
              imageSrc={cropImageSrc}
              onCropComplete={handleCropComplete}
              onCancel={() => setCropImageSrc(null)}
          />
      )}

      {/* Lightbox ดูรูปใหญ่ */}
      {showFullImage && previewUrl && !cropImageSrc && (
          <div className="fixed inset-0 z-[3100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4" onClick={() => setShowFullImage(false)}>
              <img src={previewUrl} className="max-w-full max-h-full rounded-2xl shadow-2xl animate-in zoom-in-95 duration-300" />
              <button className="absolute top-6 right-6 text-white p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full transition-all">
                  <X className="w-6 h-6" />
              </button>
          </div>
      )}

        {/* Pastel Background Decor */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-indigo-50/80 to-transparent pointer-events-none"></div>
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-100/50 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-blue-100/50 rounded-full blur-3xl pointer-events-none"></div>

        <div className="px-8 py-5 border-b border-indigo-50/50 flex justify-between items-center bg-white/40 backdrop-blur-md sticky top-0 z-10">
          <h3 className="text-xl font-bold text-gray-800 tracking-tight flex items-center gap-2">
            <span className="bg-gradient-to-r from-indigo-500 to-violet-500 text-transparent bg-clip-text">Edit Profile</span> 
            <span className="text-lg">✨</span>
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-white/80 rounded-full text-indigo-300 hover:text-indigo-500 transition-all active:scale-90 hover:shadow-sm">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-8 space-y-8 scrollbar-thin scrollbar-thumb-indigo-100 scrollbar-track-transparent relative z-0">
            <form id="profile-form" onSubmit={handleSubmit} className="space-y-8">
                
                <div className="flex flex-col sm:flex-row gap-8 items-center sm:items-start">
                    {/* Avatar Uploader */}
                    <ProfileAvatarUploader 
                        user={user}
                        previewUrl={previewUrl}
                        isConvertingImg={isConvertingImg}
                        onFileSelect={(e) => handleFileSelect(e, showAlert)}
                        fileInputRef={fileInputRef}
                    />

                    {/* Status & Feeling Section */}
                    <ProfileStatusSection 
                        workStatus={workStatus}
                        leaveStart={leaveStart}
                        leaveEnd={leaveEnd}
                        feeling={feeling}
                        onStatusChange={handleStatusChange}
                        onLeaveStartChange={setLeaveStart}
                        onLeaveEndChange={setLeaveEnd}
                        onFeelingChange={setFeeling}
                    />
                </div>

                {/* General Info */}
                <ProfileBasicInfo 
                    name={name}
                    position={position}
                    phone={phone}
                    positions={positions}
                    user={user}
                    onNameChange={setName}
                    onPositionChange={setPosition}
                    onPhoneChange={setPhone}
                />

                {/* 8-bit Emoji Picker Selection */}
                <div className="space-y-4 bg-indigo-50/20 border-2 border-indigo-100/30 p-5 rounded-3xl">
                    <div className="flex justify-between items-center">
                        <label className="text-sm font-black text-indigo-950 flex items-center gap-1.5 uppercase">
                            <span>👾 Personal Emoji / อิโมจิประจำตัว</span>
                            <span className="text-[11px] font-medium text-indigo-400 font-sans lowercase hidden sm:inline">(ใช้สำหรับแสดงบนสนามวิ่ง ห้ามซ้ำกัน)</span>
                        </label>
                        <span className="font-mono text-xl select-none px-3.5 py-1.5 bg-white rounded-2xl border border-indigo-100 shadow-sm">
                            {emoji || '👾'}
                        </span>
                    </div>
                    
                    <div className="grid grid-cols-10 gap-1.5 max-h-[115px] overflow-y-auto p-1.5 bg-white/70 rounded-2xl border border-indigo-50/50 scrollbar-thin scrollbar-thumb-indigo-150">
                        {EMOJI_POOL.map((emo) => {
                            const isTaken = takenEmojis.includes(emo);
                            const isSelected = emoji === emo;
                            return (
                                <button
                                    key={emo}
                                    type="button"
                                    disabled={isTaken}
                                    onClick={() => setEmoji(emo)}
                                    className={`text-xl p-1 rounded-xl transition-transform duration-100 ease-out flex items-center justify-center relative select-none
                                        ${isSelected ? 'bg-indigo-500 scale-110 shadow-md border border-indigo-600 ring-2 ring-indigo-200 z-10 text-white' : 'hover:scale-105 active:scale-95'}
                                        ${isTaken ? 'opacity-25 bg-slate-100 cursor-not-allowed filter grayscale line-through' : 'cursor-pointer hover:bg-slate-50'}
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
                </div>

                {/* Bio Input */}
                <ProfileBioSection 
                    bio={bio}
                    onBioChange={setBio}
                />
                
                {/* LINE User ID */}
                <div className="space-y-4">
                    <ProfileSocialSection 
                        lineUserId={lineUserId}
                        onLineUserIdChange={setLineUserId}
                    />
                    
                    {/* Test LINE Connection Section */}
                    {lineUserId && (
                      <div className="px-1 mt-1">
                        {testState === 'IDLE' && (
                          <button
                            type="button"
                            onClick={handleTestLineConnection}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold rounded-xl transition-all active:scale-95 shadow-sm"
                          >
                            <Send className="w-3.5 h-3.5" />
                            ทดสอบส่งแจ้งเตือน (Test Line Connection)
                          </button>
                        )}

                        {testState === 'TESTING' && (
                          <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100/50">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>กำลังสร้างรายการแจ้งเตือนและเตรียมส่งไปยัง LINE บอทของคุณ...</span>
                          </div>
                        )}

                        {testState === 'SENT' && (
                          <div className="space-y-2">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                                <CheckCircle className="w-4 h-4 text-emerald-600 fill-white" />
                                <span>สร้างข้อความทดสอบลงตารางเรียบร้อย! ระบบจะประมวลผลภายใน 6-10 วินาที</span>
                              </div>
                              <button
                                type="button"
                                onClick={handleManualDeleteTest}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold rounded-lg border border-rose-100 transition-all"
                              >
                                <Trash2 className="w-3 h-3" />
                                ลบประวัติออกทันที
                              </button>
                            </div>
                            <p className="text-[9px] text-slate-400 ml-1">
                              * ระบบจะลบประวัติแจ้งเตือนนี้ออกจากฐานข้อมูลโดยอัตโนมัติภายใน 15 วินาทีเพื่อไม่ให้รกหน้าจอประวัติของคุณ
                            </p>
                          </div>
                        )}

                        {testState === 'ERROR' && (
                          <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl space-y-2">
                            <div className="flex items-start gap-2 text-xs font-bold text-rose-800">
                              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <p>ไม่สามารถสร้างข้อความทดสอบได้</p>
                                <p className="text-[10px] font-medium text-rose-600 mt-1">{testError}</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setTestState('IDLE')}
                              className="px-3 py-1.5 bg-white hover:bg-rose-100 text-rose-800 text-[10px] font-bold rounded-lg border border-rose-200 transition-all"
                            >
                              ลองใหม่อีกครั้ง
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Notification Guide */}
                    <ProfileLineNotificationGuide />
                </div>

            </form>
        </div>

        <div className="p-6 border-t border-indigo-50/50 bg-white/80 backdrop-blur-md sticky bottom-0 z-20">
            <button 
                type="submit" 
                form="profile-form"
                disabled={isSubmitting || isConvertingImg}
                className="w-full py-4 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 hover:shadow-xl hover:shadow-indigo-300/40 text-white font-black rounded-2xl transition-all active:scale-95 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed group relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none"></div>
                {isSubmitting || isConvertingImg ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        {isConvertingImg ? 'Converting...' : 'Saving...'}
                    </>
                ) : (
                    <>
                        <Save className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" /> 
                        Save Changes
                    </>
                )}
            </button>
        </div>
    </motion.div>
  </div>
  );
};

export default ProfileEditModal;
