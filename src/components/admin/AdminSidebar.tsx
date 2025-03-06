
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "react-router-dom";
import {
  BarChart3,
  FileText,
  Home,
  ListIcon,
  LogOut,
  Settings,
  Users,
  Database,
  FileCode2
} from "lucide-react";

const sidebarItems = [
  {
    title: "Dashboard",
    icon: Home,
    path: "/control-room",
  },
  {
    title: "Analytics",
    icon: BarChart3,
    path: "/control-room/analytics",
  },
  {
    title: "Analytics Logs",
    icon: FileCode2,
    path: "/control-room/analytics/logs",
  },
  {
    title: "Blog",
    icon: FileText,
    path: "/control-room/blog",
  },
  {
    title: "Playlists",
    icon: ListIcon,
    path: "/control-room/playlists",
  },
  {
    title: "Users",
    icon: Users,
    path: "/control-room/users",
  },
  {
    title: "Data Import",
    icon: Database,
    path: "/control-room/import",
  },
  {
    title: "Settings",
    icon: Settings,
    path: "/control-room/settings",
  },
];

export function AdminSidebar() {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/control-room" && location.pathname === "/control-room") {
      return true;
    }
    
    return location.pathname.startsWith(path) && path !== "/control-room";
  };

  return (
    <div className="h-full flex flex-col bg-white border-r border-[#E6E6E6]">
      <div className="p-6">
        <h2 className="text-lg font-semibold">Admin Dashboard</h2>
      </div>
      <ScrollArea className="flex-1 px-4">
        <nav className="space-y-2">
          {sidebarItems.map((item, index) => (
            <Button
              key={index}
              variant="ghost"
              asChild
              className={cn(
                "w-full justify-start",
                isActive(item.path) && "bg-primary/10 text-primary hover:bg-primary/20"
              )}
            >
              <Link to={item.path} className="flex items-center">
                <item.icon className="h-5 w-5 mr-3" />
                {item.title}
              </Link>
            </Button>
          ))}
        </nav>
      </ScrollArea>
      <div className="p-6 border-t border-[#E6E6E6]">
        <Button variant="outline" className="w-full justify-start" asChild>
          <Link to="/logout">
            <LogOut className="h-5 w-5 mr-3" />
            Log Out
          </Link>
        </Button>
      </div>
    </div>
  );
}
