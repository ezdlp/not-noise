
import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";

export function DashboardLayout() {
  return (
    <SidebarProvider>
      <div className="relative flex h-screen w-full overflow-hidden bg-neutral-seasalt">
        <DashboardSidebar />
        <div className="flex-1 overflow-auto ml-64"> {/* Added ml-64 to offset the sidebar width */}
          <Outlet />
        </div>
      </div>
    </SidebarProvider>
  );
} 
