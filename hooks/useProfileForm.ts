import { useState, useEffect, useRef } from 'react';
import { User, WorkStatus } from '../types';
import { format } from 'date-fns';
import heic2any from 'heic2any';
import { supabase } from '../lib/supabase';
import { useMasterData } from './useMasterData';
import { DEFAULT_EMOJI } from '../constants/emojis';

interface UseProfileFormProps {
  user: User;
  onSave: (updates: Partial<User>, file?: File) => Promise<boolean>;
  onClose: () => void;
}

export const useProfileForm = ({ user, onSave, onClose }: UseProfileFormProps) => {
  // Form State
  const [name, setName] = useState(user.name);
  const [position, setPosition] = useState(user.position);
  const [phone, setPhone] = useState(user.phoneNumber || '');
  const [bio, setBio] = useState(user.bio || ''); 
  const [feeling, setFeeling] = useState(user.feeling || ''); 
  
  // Status & Leave State
  const [workStatus, setWorkStatus] = useState<WorkStatus>(user.workStatus || 'ONLINE');
  const [leaveStart, setLeaveStart] = useState(user.leaveStartDate ? format(new Date(user.leaveStartDate), 'yyyy-MM-dd') : '');
  const [leaveEnd, setLeaveEnd] = useState(user.leaveEndDate ? format(new Date(user.leaveEndDate), 'yyyy-MM-dd') : '');

  // Line User ID
  const [lineUserId, setLineUserId] = useState(user.lineUserId || '');

  // Emoji State
  const [emoji, setEmoji] = useState(user.emoji || DEFAULT_EMOJI);
  const [takenEmojis, setTakenEmojis] = useState<string[]>([]);

  useEffect(() => {
    const fetchTakenEmojis = async () => {
      try {
        const { data } = await supabase.from('profiles').select('emoji');
        if (data) {
          // Exclude current user's own emoji
          const emojis = data
            .map(p => p.emoji)
            .filter(Boolean)
            .filter(e => e !== user.emoji);
          setTakenEmojis(emojis);
        }
      } catch (err) {
        console.error("Error fetching taken emojis:", err);
      }
    };
    fetchTakenEmojis();
  }, [user.emoji]);

  // Image State
  const [previewUrl, setPreviewUrl] = useState(user.avatarUrl || '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Crop State
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  
  // Master Data State
  const { masterOptions } = useMasterData();
  const positions = masterOptions
      .filter(o => o.type === 'POSITION' && o.isActive)
      .map(o => ({ key: o.key, label: o.label }));

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConvertingImg, setIsConvertingImg] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, onError: (title: string, msg: string) => void) => {
      if (e.target.files && e.target.files[0]) {
          let file = e.target.files[0];
          
          if (file.size > 5 * 1024 * 1024) {
              onError("ไฟล์ใหญ่เกินไป", "ไฟล์ใหญ่เกินไป (จำกัด 5MB)");
              return;
          }

          // HEIC Conversion Logic
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
                  onError("ข้อผิดพลาดในการแปลงไฟล์", "ไม่สามารถแปลงไฟล์ HEIC ได้ กรุณาลองใช้รูปอื่น");
                  setIsConvertingImg(false);
                  return;
              } finally {
                  setIsConvertingImg(false);
              }
          }

          // Read file as Data URL for Cropper
          const reader = new FileReader();
          reader.onload = () => {
              setCropImageSrc(reader.result as string);
          };
          reader.readAsDataURL(file);
          
          // Reset input to allow re-selection
          if (fileInputRef.current) fileInputRef.current.value = '';
      }
  };

  const handleCropComplete = (croppedBlob: Blob) => {
      const file = new File([croppedBlob], "avatar.jpg", { type: "image/jpeg" });
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(croppedBlob));
      setCropImageSrc(null); // Close cropper
  };

  const handleStatusChange = (status: WorkStatus) => {
      setWorkStatus(status);
      if (status === 'ONLINE') {
          // Clear leave dates if setting to Online
          setLeaveStart('');
          setLeaveEnd('');
      } else if ((status === 'SICK' || status === 'VACATION') && !leaveStart) {
          // Auto-fill today if setting to Sick/Vacation
          setLeaveStart(format(new Date(), 'yyyy-MM-dd'));
          setLeaveEnd(format(new Date(), 'yyyy-MM-dd'));
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Prepare Leave Dates (Nullable)
    const startDate = leaveStart ? new Date(leaveStart) : null;
    const endDate = leaveEnd ? new Date(leaveEnd) : null;

    // Send data
    const success = await onSave({
        name: name.trim(),
        position: position.trim(),
        phoneNumber: phone.trim(),
        bio: bio,
        feeling: feeling,
        workStatus: workStatus,
        leaveStartDate: startDate,
        leaveEndDate: endDate,
        lineUserId: lineUserId.trim(),
        emoji: emoji
    }, selectedFile || undefined);

    setIsSubmitting(false);
    if (success) onClose();
  };

  return {
    formState: {
      name, setName,
      position, setPosition,
      phone, setPhone,
      bio, setBio,
      feeling, setFeeling,
      workStatus, setWorkStatus,
      leaveStart, setLeaveStart,
      leaveEnd, setLeaveEnd,
      lineUserId, setLineUserId,
      previewUrl,
      selectedFile,
      cropImageSrc, setCropImageSrc,
      positions,
      isSubmitting,
      isConvertingImg,
      emoji, setEmoji,
      takenEmojis
    },
    fileInputRef,
    handleFileSelect,
    handleCropComplete,
    handleStatusChange,
    handleSubmit
  };
};
