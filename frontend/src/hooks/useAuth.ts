import { useAuthStore } from '@/store/authStore';

export function useAuth() {
  const { user, accessToken, setAuth, logout, isAuthenticated } = useAuthStore();

  const hasRole = (...roles: string[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const isAdmin = () => hasRole('ADMIN');
  const isManagerOrAdmin = () => hasRole('ADMIN', 'MANAGER');
  const canViewFinancials = () => hasRole('ADMIN', 'MANAGER', 'ACCOUNTANT');

  return {
    user,
    accessToken,
    setAuth,
    logout,
    isAuthenticated: isAuthenticated(),
    hasRole,
    isAdmin,
    isManagerOrAdmin,
    canViewFinancials,
  };
}
