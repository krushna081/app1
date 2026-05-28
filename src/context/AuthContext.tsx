import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AuthState } from '../types/auth';
import { supabase } from '../lib/supabase';
import { profileService } from '../services/profileService';

interface AuthContextType extends AuthState {
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const LOADING_TIMEOUT = 10000;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    session: null,
  });
  const hasResolved = useRef(false);

  const resolveLoading = (newState: Partial<AuthState>) => {
    if (hasResolved.current) return;
    hasResolved.current = true;
    setState(prev => ({ ...prev, ...newState, isLoading: false }));
  };

  const fetchProfile = async (userId: string, session: any) => {
    try {
      const profile = await profileService.getProfile(userId);
      resolveLoading({ user: profile, session });
    } catch (error) {
      console.error('Profile fetch failed:', error);
      resolveLoading({ user: null, session: null });
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!hasResolved.current) {
        resolveLoading({ user: null, session: null });
      }
    }, LOADING_TIMEOUT);

    // Handle the redirect from email confirmation link
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user.id, session);
      } else {
        resolveLoading({});
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // SIGNED_IN fires automatically after email confirmation link is clicked
      if (event === 'SIGNED_IN' && session?.user) {
        await fetchProfile(session.user.id, session);
      } else if (event === 'SIGNED_OUT') {
        hasResolved.current = false;
        setState({ user: null, session: null, isLoading: false });
      }
    });

    return () => {
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ ...state, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuthContext must be used within AuthProvider');
  return context;
};
