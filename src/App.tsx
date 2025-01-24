import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import SmartLink from "./pages/SmartLink";
import CreateSmartLink from "./pages/CreateSmartLink";
import EditSmartLink from "./pages/EditSmartLink";
import Dashboard from "./pages/Dashboard";
import SmartLinkAnalytics from "./pages/SmartLinkAnalytics";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AccountSettings from "./pages/AccountSettings";
import Header from "./components/layout/Header";
import { AdminLayout } from "./components/admin/AdminLayout";
import { useEffect, useState } from "react";
import { supabase } from "./integrations/supabase/client";
import { Overview, Users, Posts, Settings, UserLinks, Media, Import, SmartLinks } from "./pages/admin";

const queryClient = new QueryClient();

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  if (isAuthenticated === null) {
    return null;
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAdminRole = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.log('No session found');
          setIsAdmin(false);
          return;
        }

        console.log('Checking admin role for user:', session.user.id);

        const { data: userRoles, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (error) {
          console.error('Error checking admin role:', error);
          setIsAdmin(false);
          return;
        }

        setIsAdmin(userRoles?.role === 'admin');
      } catch (error) {
        console.error('Error in admin check:', error);
        setIsAdmin(false);
      }
    };

    checkAdminRole();

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      checkAdminRole();
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  if (isAdmin === null) {
    return null;
  }

  return isAdmin ? <>{children}</> : <Navigate to="/dashboard" />;
};

const AppContent = () => {
  const location = useLocation();
  const showHeader = !location.pathname.startsWith('/link/') && !location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen flex flex-col">
      {showHeader && <Header />}
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/link/:slug" element={<SmartLink />} />
        
        {/* Protected Routes */}
        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <AccountSettings />
            </PrivateRoute>
          }
        />
        <Route
          path="/create"
          element={
            <PrivateRoute>
              <CreateSmartLink />
            </PrivateRoute>
          }
        />
        <Route
          path="/links/:id/edit"
          element={
            <PrivateRoute>
              <EditSmartLink />
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard/analytics/:id"
          element={
            <PrivateRoute>
              <SmartLinkAnalytics />
            </PrivateRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<Overview />} />
          <Route path="users" element={<Users />} />
          <Route path="users/:userId/links" element={<UserLinks />} />
          <Route path="smart-links" element={<SmartLinks />} />
          <Route path="posts" element={<Posts />} />
          <Route path="media" element={<Media />} />
          <Route path="import" element={<Import />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;