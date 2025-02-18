
import { BrowserRouter as Router, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useEffect } from "react";
import AppContent from "./AppContent";
import Header from "@/components/layout/Header";
import { CookieConsent } from "@/components/cookie-consent/CookieConsent";
import { analytics } from "@/services/analytics";

// Create a client
const queryClient = new QueryClient();

function AppLayout() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/control-room');
  const isSmartLinkRoute = location.pathname.startsWith('/link/');
  const isAuthRoute = location.pathname === '/login' || 
                     location.pathname === '/register' || 
                     location.pathname === '/reset-password' ||
                     location.pathname === '/update-password';

  useEffect(() => {
    // Initialize analytics with correct configuration
    analytics.initialize(isSmartLinkRoute);
    
    // Track page view
    analytics.trackPageView(location.pathname, isSmartLinkRoute);
  }, [location.pathname, isSmartLinkRoute]);

  return (
    <div className="min-h-screen flex flex-col w-full bg-neutral-seasalt">
      {!isAdminRoute && !isSmartLinkRoute && !isAuthRoute && <Header />}
      <AppContent />
      <CookieConsent />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <SidebarProvider>
          <AppLayout />
        </SidebarProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;

