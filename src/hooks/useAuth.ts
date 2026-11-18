import { useAuthContext } from '../context/AuthContext';

export const useAuth = () => {
  const context = useAuthContext();
  return {
    user: context.user,
    session: context.session,
    isLoading: context.isLoading,
    error: context.error,
    isAuthenticated: !!context.user,
    isPasswordRecovery: context.isPasswordRecovery,
    signOut: context.signOut,
    refreshProfile: context.refreshProfile,
    startPasswordRecovery: context.startPasswordRecovery,
    completePasswordRecovery: context.completePasswordRecovery,
  };
};
