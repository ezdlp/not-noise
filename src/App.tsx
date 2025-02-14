
import { BrowserRouter as Router, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppContent from "./AppContent";
import Header from "@/components/layout/Header";
import { CookieConsent } from "@/components/cookie-consent/CookieConsent";

// Create a client
const queryClient = new QueryClient();

function AppLayout() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/control-room');
  const isSmartLinkRoute = location.pathname.startsWith('/link/');

  return (
    <div className="min-h-screen flex flex-col w-full bg-neutral-seasalt">
      {!isAdminRoute && !isSmartLinkRoute && <Header />}
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
