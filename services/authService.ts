
import { supabase } from '../lib/supabase';
import { User, WorkStatus } from '../types';

export const authService = {
  // Map DB profile to App User type
  mapProfileToUser: (data: any): User => ({
    id: data.id,
    email: data.email,
    name: data.full_name || 'No Name',
    role: data.role,
    avatarUrl: data.avatar_url,
    position: data.position || 'Member',
    phoneNumber: data.phone_number,
    bio: data.bio || '',
    feeling: data.feeling || '',
    isApproved: data.is_approved,
    isActive: data.is_active !== false,
    status: data.status || (data.is_active === false ? 'INACTIVE' : 'ACTIVE'),
    xp: data.xp || 0,
    level: data.level || 1,
    availablePoints: data.available_points || 0,
    hp: data.hp || 100,
    maxHp: data.max_hp || 100,
    deathCount: data.death_count || 0,
    workStatus: (data.work_status as WorkStatus) || 'ONLINE',
    leaveStartDate: data.leave_start_date ? new Date(data.leave_start_date) : null,
    leaveEndDate: data.leave_end_date ? new Date(data.leave_end_date) : null,
    waveBgEnabled: data.wave_bg_enabled !== false,
    ultimateWorkroomEnabled: data.ultimate_workroom_enabled !== false,
  }),

  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return this.mapProfileToUser(data);
  },

  async getAllProfiles() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name', { ascending: true });
      
    if (error) throw error;
    return data.map(this.mapProfileToUser);
  },

  async updateProfile(userId: string, updates: Partial<any>) {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);
      
    if (error) throw error;
    return true;
  },

  async updateAvatar(userId: string, file: File) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

    return data.publicUrl;
  }
};
