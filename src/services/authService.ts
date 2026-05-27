import { supabase } from '../lib/supabase';

export const authService = {
  async login({ email, password }: { email: string; password: string }) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    });

    if (error) {
      console.error('AuthService login error:', error.name, error.message, error.status);
      if (error.message === 'Invalid login credentials') {
        throw new Error('Invalid email or password. Please check your credentials or create an account.');
      }
      throw error;
    }
    return data;
  },

  async register({ email, password, fullName, role }: any) {
    const { data, error } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
        },
      },
    });

    if (error) throw error;
    return data;
  },

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  async sendOtp(email: string) {
    const { data, error } = await supabase.auth.signInWithOtp({
      email: email.toLowerCase().trim(),
      options: {
        emailRedirectTo: 'securegateapp://auth/callback',
      },
    });
    if (error) {
      console.error('sendOtp error:', error);
      throw error;
    }
    return data;
  },

  async verifyOtp(email: string, token: string) {
    const { data, error } = await supabase.auth.verifyOtp({
      email: email.toLowerCase().trim(),
      token,
      type: 'email',
    });
    if (error) throw error;
    return data;
  },

  async resetPasswordForEmail(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(
      email.toLowerCase().trim(),
    );
    if (error) throw error;
    return data;
  },

  async updatePassword(newPassword: string) {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
    return data;
  },

  async adminCreateUser({ email, password, fullName, role }: any) {
    const { data, error } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
        },
        emailRedirectTo: 'securegateapp://auth/callback',
      },
    });
    if (error) throw error;
    return data;
  },
};
