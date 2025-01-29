import { BrowserRouter as Router, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppContent from "./AppContent";
import Header from "@/components/layout/Header";

// Create a client
const queryClient = new QueryClient();

function AppLayout() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen flex flex-col w-full bg-neutral-seasalt">
      {!isAdminRoute && <Header />}
      <AppContent />
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