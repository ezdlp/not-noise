
import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useSessionContext } from '@supabase/auth-helpers-react';

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { session, isLoading } = useSessionContext();

  // If auth is still loading, show nothing
  if (isLoading) {
    return null;
  }

  // Store the current path to redirect back after login
  if (!session) {
    sessionStorage.setItem('redirectAfterAuth', window.location.pathname);
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
