import { Link, useLocation } from "react-router-dom";
import { 
  UsersIcon, 
  NewspaperIcon, 
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
    href: "/admin",
  },
  {
    title: "Analytics",
    icon: BarChart2Icon,
    href: "/admin/analytics",
  },
  {
    title: "Users",
    icon: UsersIcon,
    href: "/admin/users",
  },
  {
    title: "Smart Links",
    icon: Link2Icon,
    href: "/admin/smart-links",
  },
  {
    title: "Pages",
    icon: NewspaperIcon,
    href: "/admin/posts",
  },
  {
    title: "Media Library",
    icon: ImageIcon,
    href: "/admin/media",
  },
  {
    title: "Import",
    icon: DownloadIcon,
    href: "/admin/import",
  },
  {
    title: "Settings",
    icon: Settings,
    href: "/admin/settings",
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