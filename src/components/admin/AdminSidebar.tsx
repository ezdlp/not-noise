
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  BarChart3, 
  FileText, 
  Users, 
  ImageIcon, 
  Link2
} from 'lucide-react';

// Custom Spotify icon component that uses the SVG file
const SpotifyIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 48 48" 
    width="24" 
    height="24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5"  // Increased stroke width from 2 to 2.5
    strokeLinecap="round" 
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="24" cy="24" r="21.5" />
    <path d="m12.3332,30.6695c8.1899-1.8711,15.215-1.0655,20.8822,2.3979m-21.6486-8.7867c7.8081-2.3692,17.5151-1.2216,24.1517,2.8567m-25.3671-9.8174c7.5945-2.3055,20.2195-1.8601,28.1974,2.876" />
  </svg>
);

export const AdminSidebar: React.FC = () => {
  const location = useLocation();
  
  const menuItems = [
    { to: '/control-room/analytics', icon: <BarChart3 size={18} />, label: 'Analytics' },
    { to: '/control-room/content', icon: <FileText size={18} />, label: 'Blog Content' },
    { to: '/control-room/users', icon: <Users size={18} />, label: 'Users' },
    { to: '/control-room/smart-links', icon: <Link2 size={18} />, label: 'Smart Links' },
    { to: '/control-room/promotions', icon: <SpotifyIcon size={18} />, label: 'Playlist Promotions' },
    { to: '/control-room/media-library', icon: <ImageIcon size={18} />, label: 'Media Library' },
  ];

  return (
    <div className="w-64 h-screen bg-gray-50 border-r border-gray-200 pt-4 flex flex-col overflow-y-auto">
      {/* Admin Menu Header */}
      <div className="px-6 py-4 mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Control Room</h2>
        <p className="text-sm text-gray-500">Admin Dashboard</p>
      </div>
      
      {/* Menu Items */}
      <nav className="flex-1">
        <ul className="px-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={`flex items-center px-3 py-2 rounded-md text-sm group ${
                    isActive
                      ? 'bg-primary text-white font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className={`mr-3 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-600'}`}>
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      {/* Bottom Section */}
      <div className="px-6 py-4 border-t border-gray-200 mt-auto">
        <div className="flex items-center">
          <div className="ml-3">
            <p className="text-xs text-gray-500">Soundraiser Admin</p>
          </div>
        </div>
      </div>
    </div>
  );
};
