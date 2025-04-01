
import React, { useEffect } from 'react';
import { BrowserRouter as Router, useLocation, Navigate, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppContent from "./AppContent";
import Header from "@/components/layout/Header";
import { CookieConsent } from "@/components/cookie-consent/CookieConsent";
import { switchToSmartLinkTracking } from "@/services/ga4";
import { analyticsService } from "@/services/analyticsService";
import { HelmetProvider } from 'react-helmet-async';

// Create a client
const queryClient = new QueryClient();

function AppLayout() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/control-room');
  const isSmartLinkRoute = location.pathname.startsWith('/link/');
  const isDashboardRoute = location.pathname.startsWith('/dashboard');
  const isAuthRoute = location.pathname === '/login' || 
                     location.pathname === '/register' || 
                     location.pathname === '/reset-password' ||
                     location.pathname === '/update-password';

  // Check for hash-based routing for smart links
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#/link/')) {
      // Remove the hash and navigate to the SPA route
      const path = hash.substring(1);
      window.history.replaceState(null, '', path);
      window.location.reload();
    }
  }, []);

  // Track page views only on route change
  useEffect(() => {
    // Handle smart link tracking by switching to the appropriate GA4 property
    if (isSmartLinkRoute) {
      switchToSmartLinkTracking();
    }
    
    // Use analytics service for internal tracking
    analyticsService.trackPageView(location.pathname);
  }, [location.pathname, isSmartLinkRoute]);

  // Redirect from /control-room to /control-room/analytics
  if (location.pathname === '/control-room') {
    return <Navigate to="/control-room/analytics" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col w-full bg-neutral-seasalt">
      {!isAdminRoute && !isSmartLinkRoute && !isDashboardRoute && !isAuthRoute && <Header />}
      <AppContent />
      <CookieConsent />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <Router>
          <SidebarProvider>
            <AppLayout />
          </SidebarProvider>
        </Router>
      </HelmetProvider>
    </QueryClientProvider>
  );
}

export default App;
