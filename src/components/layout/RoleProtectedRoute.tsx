import { useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import type { UserRole } from '@/types';
import { Logo } from '@/components/Logo';

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export function RoleProtectedRoute({ children, allowedRoles }: RoleProtectedRouteProps) {
  const { user, authLoading, navigate } = useApp();

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate('login');
      return;
    }

    if (!user.role || !allowedRoles.includes(user.role)) {
      // Strict role-based redirect
      if (user.role === 'STATION_OWNER') {
        navigate('station-owner-dashboard');
      } else if (user.role === 'USER') {
        navigate('dashboard');
      } else {
        navigate('dashboard');
      }
    }
  }, [user, authLoading, allowedRoles, navigate]);

  // Loading screen while authentication/session is resolving
  if (authLoading) {
    return (
      <div className="min-h-screen bg-ink-950 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-acid/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center gap-4 text-center">
          <Logo size="lg" />
          <div className="flex items-center gap-3 mt-4">
            <div className="w-5 h-5 border-2 border-acid border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-semibold tracking-wide text-ink-200">Loading ChargeNix...</span>
          </div>
          <p className="text-xs text-ink-500">Securing your session with role-based access</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return null;
  }

  // Role mismatch
  if (!user.role || !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}
