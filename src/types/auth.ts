import { Database } from './database';

export type UserRole = Database['public']['Tables']['profiles']['Row']['role'];

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  societyId: string | null;
  flatId: string | null;
}

export interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  session: any | null;
}
