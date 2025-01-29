import { BrowserRouter as Router } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppContent from "./AppContent";

// Create a client
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <SidebarProvider>
          <div className="min-h-screen flex w-full">
            <AppContent />
          </div>
        </SidebarProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;