import { supabase } from '../lib/supabase';

export const authService = {
  async signUp({ email, password, fullName, role }: {
    email: string; password: string; fullName: string; role: string
  }) {
    const { data, error } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      password,
      options: {
        data: { full_name: fullName, role },
        emailRedirectTo: 'securegateapp://auth/callback',
      },
    });
    if (error) throw error;
    return data;
  },

  async signIn({ email, password }: { email: string; password: string }) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    });
    if (error) {
      if (error.message === 'Invalid login credentials') {
        throw new Error('Invalid email or password.');
      }
      throw error;
    }
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async resetPassword(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(
      email.toLowerCase().trim(),
      { redirectTo: 'securegateapp://auth/callback' },
    );
    if (error) throw error;
    return data;
  },

  async updatePassword(password: string) {
    const { data, error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
    return data;
  },
};
