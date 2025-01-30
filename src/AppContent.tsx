import { Routes, Route } from "react-router-dom";
import Dashboard from "@/pages/Dashboard";
import CreateSmartLink from "@/pages/CreateSmartLink";
import EditSmartLink from "@/pages/EditSmartLink";
import SmartLink from "@/pages/SmartLink";
import SmartLinkAnalytics from "@/pages/SmartLinkAnalytics";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Contact from "@/pages/Contact";
import Index from "@/pages/Index";
import Pricing from "@/pages/Pricing";
import Blog from "@/pages/Blog";
import PublicBlogPost from "@/pages/PublicBlogPost";
import { AdminLayout } from "@/components/admin/AdminLayout";

const AppContent = () => {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/create-smart-link" element={<CreateSmartLink />} />
      <Route path="/edit-smart-link/:id" element={<EditSmartLink />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="/blog/:slug" element={<PublicBlogPost />} />
      
      {/* Smart Link public view */}
      <Route path="/link/:slug" element={<SmartLink />} />
      <Route path="/link/:slug/analytics" element={<SmartLinkAnalytics />} />

      {/* Admin routes */}
      <Route path="/admin/*" element={<AdminLayout />} />
    </Routes>
  );
};

export default AppContent;
