
import { Outlet } from "react-router-dom";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { AdminSidebar } from "./AdminSidebar";

export function AdminLayout() {
  const [defaultSize, setDefaultSize] = useLocalStorage("admin-sidebar-size", 12);

  return (
    <div className="min-h-screen flex w-full">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel
          defaultSize={defaultSize}
          minSize={12}
          maxSize={20}
          onResize={setDefaultSize}
          className="min-w-[200px]"
        >
          <AdminSidebar />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel>
          <main className="flex-1 p-8">
            <Outlet />
          </main>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
