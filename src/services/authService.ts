import { supabase } from '../lib/supabase';
import { getAuthErrorMessage } from '../utils/authErrors';

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export const authService = {
  async signIn({ email, password }: { email: string; password: string }) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizeEmail(email),
      password,
    });
    if (error) throw new Error(getAuthErrorMessage(error));
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(getAuthErrorMessage(error));
  },

  async requestPasswordResetOtp(email: string) {
    const { error } = await supabase.auth.signInWithOtp({
      email: normalizeEmail(email),
      options: { shouldCreateUser: false },
    });
    if (error) throw new Error(getAuthErrorMessage(error));
  },

  async verifyRecoveryOtp(email: string, token: string) {
    const { data, error } = await supabase.auth.verifyOtp({
      email: normalizeEmail(email),
      token,
      type: 'email',
    });
    if (error) throw new Error(getAuthErrorMessage(error));
    return data;
  },

  async updatePassword(password: string) {
    const { data, error } = await supabase.auth.updateUser({ password });
    if (error) throw new Error(getAuthErrorMessage(error));
    return data;
  },
};
