
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Loader2 } from 'lucide-react';
import { User as UserType } from '../types';
import ImageCropper from './ImageCropper';
import { useGlobalDialog } from '../context/GlobalDialogContext';
import { useProfileForm } from '../hooks/useProfileForm';
import ProfileAvatarUploader from './profile/ProfileAvatarUploader';
import ProfileStatusSection from './profile/ProfileStatusSection';
import ProfileBasicInfo from './profile/ProfileBasicInfo';
import ProfileBioSection from './profile/ProfileBioSection';
import ProfileSocialSection from './profile/ProfileSocialSection';
import ProfileLineNotificationGuide from './profile/ProfileLineNotificationGuide';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserType;
  onSave: (updates: Partial<UserType>, file?: File) => Promise<boolean>;
}

const ProfileEditModal: React.FC<ProfileEditModalProps> = ({ isOpen, onClose, user, onSave }) => {
  const { showAlert } = useGlobalDialog();
  const [showFullImage, setShowFullImage] = useState(false);

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
    isConvertingImg
  } = formState;

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
