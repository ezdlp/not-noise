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

function AppContent() {
  const location = useLocation();

  useEffect(() => {
    analyticsService.trackPageView(location.pathname);
  }, [location]);

  return (
    <>
      <AdminSidebar />
      <Routes>
        <Route path="/admin" element={<Overview />} />
        <Route path="/admin/users" element={<Users />} />
        <Route path="/admin/posts" element={<Posts />} />
        <Route path="/admin/settings" element={<Settings />} />
        <Route path="/admin/user-links" element={<UserLinks />} />
        <Route path="/admin/media" element={<Media />} />
        <Route path="/admin/import" element={<Import />} />
        <Route path="/admin/smart-links" element={<SmartLinks />} />
        <Route path="/admin/analytics" element={<Analytics />} />
        <Route path="/smart-link/:id" element={<SmartLinkAnalytics />} />
      </Routes>
    </>
  );
}

export default AppContent;