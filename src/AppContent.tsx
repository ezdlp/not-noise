import { Routes, Route } from "react-router-dom";
import Dashboard from "@/pages/Dashboard";
import SmartLink from "@/pages/SmartLink";
import SmartLinkAnalytics from "@/pages/SmartLinkAnalytics";
import CreateSmartLink from "@/pages/CreateSmartLink";
import EditSmartLink from "@/pages/EditSmartLink";
import AccountSettings from "@/pages/AccountSettings";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Contact from "@/pages/Contact";
import Index from "@/pages/Index";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminOverview from "@/pages/admin/Overview";
import AdminAnalytics from "@/pages/admin/Analytics";
import AdminSmartLinks from "@/pages/admin/SmartLinks";
import AdminUserLinks from "@/pages/admin/UserLinks";
import AdminUsers from "@/pages/admin/Users";
import AdminPosts from "@/pages/admin/Posts";
import AdminMediaLibrary from "@/pages/admin/MediaLibrary";
import AdminSettings from "@/pages/admin/Settings";
import AdminImport from "@/pages/admin/Import";

const AppContent = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/contact" element={<Contact />} />
      
      {/* Smart Link public view */}
      <Route path="/link/:slug" element={<SmartLink />} />

      {/* Authenticated routes */}
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/create" element={<CreateSmartLink />} />
      <Route path="/links/:id/edit" element={<EditSmartLink />} />
      <Route path="/links/:id/analytics" element={<SmartLinkAnalytics />} />
      <Route path="/settings" element={<AccountSettings />} />

      {/* Admin routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminOverview />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="smart-links" element={<AdminSmartLinks />} />
        <Route path="user-links" element={<AdminUserLinks />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="posts" element={<AdminPosts />} />
        <Route path="media" element={<AdminMediaLibrary />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="import" element={<AdminImport />} />
      </Route>
    </Routes>
  );
};

export default AppContent;