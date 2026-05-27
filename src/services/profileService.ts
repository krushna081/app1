import { supabase } from '../lib/supabase';
import { UserProfile } from '../types/auth';

export const profileService = {
  async getProfile(userId: string): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }

    if (!data) throw new Error('Profile not found');

    return {
      id: data.id,
      email: data.email,
      fullName: data.full_name,
      role: data.role,
      societyId: data.society_id,
      flatId: data.flat_id,
    };
  },
};
