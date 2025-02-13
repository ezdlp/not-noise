
import { Link, useLocation } from "react-router-dom";
import { 
  UsersIcon, 
  FolderIcon, 
  LayoutDashboardIcon,
  ImageIcon,
  DownloadIcon,
  Link2Icon,
  BarChart2Icon,
  RefreshCwIcon,
} from "lucide-react";

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
    subItems: [
      {
        title: "User Migration",
        icon: RefreshCwIcon,
        href: "/control-room/users/migration",
      }
    ]
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
              const hasSubItems = item.subItems && item.subItems.length > 0;
              
              return (
                <div key={item.title}>
                  <Link
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
                  
                  {hasSubItems && (
                    <div className="ml-6 mt-1 space-y-1">
                      {item.subItems.map((subItem) => {
                        const isSubItemActive = location.pathname === subItem.href;
                        
                        return (
                          <Link
                            key={subItem.title}
                            to={subItem.href}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent ${
                              isSubItemActive 
                                ? "bg-accent text-accent-foreground" 
                                : "text-muted-foreground hover:text-primary"
                            }`}
                          >
                            <subItem.icon className="h-4 w-4" />
                            <span>{subItem.title}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
