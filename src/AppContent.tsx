import { useEffect } from "react";
import { useLocation, Route, Routes } from "react-router-dom";
import { analyticsService } from "./services/analyticsService";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import Overview from "@/pages/admin/Overview";
import Users from "@/pages/admin/Users";
import Posts from "@/pages/admin/Posts";
import Settings from "@/pages/admin/Settings";
import UserLinks from "@/pages/admin/UserLinks";
import Media from "@/pages/admin/MediaLibrary";
import Import from "@/pages/admin/Import";
import SmartLinks from "@/pages/admin/SmartLinks";
import Analytics from "@/pages/admin/Analytics";
import SmartLinkAnalytics from "@/pages/SmartLinkAnalytics";
import Index from "@/pages/Index";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import CreateSmartLink from "@/pages/CreateSmartLink";
import SmartLink from "@/pages/SmartLink";
import Dashboard from "@/pages/Dashboard";
import Contact from "@/pages/Contact";
import AccountSettings from "@/pages/AccountSettings";

function AppContent() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  useEffect(() => {
    analyticsService.trackPageView(location.pathname);
  }, [location]);

  return (
    <div className="flex flex-1">
      {isAdminRoute && <AdminSidebar />}
      <main className={`flex-1 ${isAdminRoute ? 'ml-64' : ''}`}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/create" element={<CreateSmartLink />} />
          <Route path="/smart-link/:id" element={<SmartLink />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/settings" element={<AccountSettings />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<Overview />} />
          <Route path="/admin/users" element={<Users />} />
          <Route path="/admin/posts" element={<Posts />} />
          <Route path="/admin/settings" element={<Settings />} />
          <Route path="/admin/user-links" element={<UserLinks />} />
          <Route path="/admin/media" element={<Media />} />
          <Route path="/admin/import" element={<Import />} />
          <Route path="/admin/smart-links" element={<SmartLinks />} />
          <Route path="/admin/analytics" element={<Analytics />} />
        </Routes>
      </main>
    </div>
  );
}

export default AppContent;