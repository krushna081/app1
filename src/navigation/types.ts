import { UserRole } from '../types/auth';

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  VerifyOtp: { email: string; mode: 'email_verification' | 'password_reset' };
  ChangePassword: { email: string };
};

export type GuardStackParamList = {
  GuardHome: undefined;
};

export type ResidentStackParamList = {
  ResidentHome: undefined;
};

export type AdminStackParamList = {
  AdminHome: undefined;
  CreateAccount: { role?: 'guard' | 'resident' } | undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  Guard: undefined;
  Resident: undefined;
  Admin: undefined;
};
