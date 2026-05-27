import { useAuthContext } from '../context/AuthContext';

export const useAuth = () => {
  const context = useAuthContext();
  return {
    user: context.user,
    isLoading: context.isLoading,
    isAuthenticated: !!context.user,
    signOut: context.signOut,
  };
};
