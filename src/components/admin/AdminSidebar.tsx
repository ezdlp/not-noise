
import { Link, useLocation } from "react-router-dom";
import { 
  UsersIcon, 
  FolderIcon, 
  LayoutDashboardIcon,
  Settings,
  ImageIcon,
  DownloadIcon,
  Link2Icon,
  BarChart2Icon
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const menuItems = [
  {
    title: "Overview",
    icon: LayoutDashboardIcon,
    href: "/control-room",
  },
  {
    title: "Analytics",
    icon: BarChart2Icon,
    href: "/control-room/analytics",
  },
  {
    title: "Users",
    icon: UsersIcon,
    href: "/control-room/users",
  },
  {
    title: "Smart Links",
    icon: Link2Icon,
    href: "/control-room/smart-links",
  },
  {
    title: "Content",
    icon: FolderIcon,
    href: "/control-room/content",
  },
  {
    title: "Media Library",
    icon: ImageIcon,
    href: "/control-room/media",
  },
  {
    title: "Import",
    icon: DownloadIcon,
    href: "/control-room/import",
  },
  {
    title: "Settings",
    icon: Settings,
    href: "/control-room/settings",
  },
];

export function AdminSidebar() {
  const location = useLocation();

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Admin Panel</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.href}
                  >
                    <Link to={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
