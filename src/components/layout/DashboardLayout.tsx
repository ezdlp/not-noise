
import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { MobileDashboardHeader } from "@/components/dashboard/MobileDashboardHeader";
import { useIsMobile } from "@/hooks/use-mobile";

export function DashboardLayout() {
  const isMobile = useIsMobile();
  
  return (
    <SidebarProvider>
      <div className="relative flex h-screen w-full overflow-hidden bg-neutral-seasalt">
        {/* Mobile header - only shown on mobile */}
        <MobileDashboardHeader />
        
        {/* Sidebar - hidden on mobile */}
        {!isMobile && <DashboardSidebar />}
        
        {/* Main content - adjusted for mobile header */}
        <div className={`flex-1 overflow-auto ${isMobile ? 'pt-14' : ''}`}>
          <Outlet />
        </div>
      </div>
    </SidebarProvider>
  );
}
