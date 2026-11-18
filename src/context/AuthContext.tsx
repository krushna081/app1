import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { AuthState } from '../types/auth';
import { supabase } from '../lib/supabase';
import { profileService } from '../services/profileService';

interface AuthContextType extends AuthState {
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  startPasswordRecovery: () => void;
  completePasswordRecovery: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const LOADING_TIMEOUT_MS = 12000;

const emptyState: AuthState = {
  user: null,
  isLoading: false,
  session: null,
  error: null,
  isPasswordRecovery: false,
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    ...emptyState,
    isLoading: true,
  });
  const requestId = useRef(0);

  const loadProfile = useCallback(async (session: Session) => {
    const currentRequest = ++requestId.current;
    setState((previous) => ({ ...previous, isLoading: true, error: null }));

    try {
      const profile = await profileService.getProfile(session.user.id);
      if (currentRequest !== requestId.current) return;

      setState((previous) => ({
        ...previous,
        user: profile,
        session,
        error: null,
        isLoading: false,
      }));
    } catch (error) {
      if (currentRequest !== requestId.current) return;

      const missingProfile = error instanceof Error && error.message === 'Profile not found';
      setState((previous) => ({
        ...previous,
        user: null,
        session,
        error: missingProfile
          ? 'Your account is not linked to a society yet. Contact your society administrator.'
          : 'Could not load your profile. Check your connection and try again.',
        isLoading: false,
      }));
    }
  }, []);

  useEffect(() => {
    let active = true;
    const initialRequest = requestId.current;

    const timeoutId = setTimeout(() => {
      if (!active) return;
      setState((previous) =>
        previous.isLoading
          ? {
              ...previous,
              isLoading: false,
              error:
                previous.error ?? 'Sign-in took too long. Check your connection and try again.',
            }
          : previous,
      );
    }, LOADING_TIMEOUT_MS);

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (!active || initialRequest !== requestId.current) return;
        if (session) {
          void loadProfile(session);
        } else {
          setState((previous) => (previous.user || previous.session ? previous : emptyState));
        }
      })
      .catch(() => {
        if (!active || initialRequest !== requestId.current) return;
        setState({
          ...emptyState,
          error: 'Could not restore your session. Check your connection and try again.',
        });
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;

      if (event === 'SIGNED_OUT') {
        requestId.current += 1;
        setState(emptyState);
        return;
      }

      if (event === 'PASSWORD_RECOVERY') {
        setState((previous) => ({ ...previous, isPasswordRecovery: true }));
      }

      if (!session) {
        setState((previous) => ({
          ...previous,
          user: null,
          session: null,
          isLoading: false,
        }));
        return;
      }

      if (event === 'TOKEN_REFRESHED') {
        setState((previous) => ({ ...previous, session }));
        return;
      }

      // Supabase auth callbacks hold an internal lock. Defer profile reads
      // instead of awaiting another Supabase call inside the callback.
      setTimeout(() => {
        if (!active) return;

        void supabase.auth
          .getSession()
          .then(({ data: { session: currentSession } }) => {
            if (!active || !currentSession || currentSession.user.id !== session.user.id) {
              return;
            }
            void loadProfile(currentSession);
          })
          .catch(() => undefined);
      }, 0);
    });

    return () => {
      active = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.warn('Sign out request failed; clearing local session', error);
    } finally {
      requestId.current += 1;
      setState(emptyState);
    }
  };

  const refreshProfile = async () => {
    setState((previous) => ({
      ...previous,
      isLoading: true,
      error: null,
    }));

    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) throw error;

      if (!session) {
        setState(emptyState);
        return;
      }

      await loadProfile(session);
    } catch {
      requestId.current += 1;
      setState((previous) => ({
        ...previous,
        user: null,
        session: null,
        isLoading: false,
        error: 'Could not restore your session. Check your connection and try again.',
      }));
    }
  };

  const startPasswordRecovery = () => {
    setState((previous) => ({ ...previous, isPasswordRecovery: true }));
  };

  const completePasswordRecovery = async () => {
    setState((previous) => ({ ...previous, isPasswordRecovery: false }));
    await refreshProfile();
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signOut,
        refreshProfile,
        startPasswordRecovery,
        completePasswordRecovery,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuthContext must be used within AuthProvider');
  return context;
};
