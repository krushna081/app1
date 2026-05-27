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
      console.error('AuthContext: Profile fetch failed:', error);
      resolveLoading({ user: null, session: null });
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!hasResolved.current) {
        console.warn('AuthContext: Loading timeout reached, forcing auth screen');
        resolveLoading({ user: null, session: null });
      }
    }, LOADING_TIMEOUT);

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user.id, session);
      } else {
        resolveLoading({});
      }
    }).catch((err) => {
      console.error('AuthContext: getSession error:', err);
      resolveLoading({ user: null, session: null });
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth Event:', event);

      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
        await fetchProfile(session.user.id, session);
      } else if (event === 'SIGNED_OUT') {
        hasResolved.current = false;
        setState({ user: null, session: null, isLoading: false });
      }
    });

    return () => {
      clearTimeout(timeoutId);
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('AuthContext: signOut error:', err);
    }
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
