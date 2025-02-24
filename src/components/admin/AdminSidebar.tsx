
import { Link, useLocation } from "react-router-dom";
import { 
  UsersIcon, 
  FolderIcon, 
  LayoutDashboardIcon,
  ImageIcon,
  DownloadIcon,
  Link2Icon,
  BarChart2Icon,
} from "lucide-react";

type MenuItem = {
  title: string;
  icon: React.ComponentType;
  href: string;
};

const menuItems: MenuItem[] = [
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
];

export function AdminSidebar() {
  const location = useLocation();

  return (
    <div className="h-full bg-background border-r">
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold">Admin Panel</h2>
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.href;
              
              return (
                <Link
                  key={item.title}
                  to={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent ${
                    isActive 
                      ? "bg-accent text-accent-foreground" 
                      : "text-muted-foreground hover:text-primary"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
