
import { Routes, Route, Navigate } from "react-router-dom";
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
import Pricing from "@/pages/Pricing";
import Blog from "@/pages/Blog";
import PublicBlogPost from "@/pages/PublicBlogPost";
import SpotifyPlaylistPromotion from "@/pages/SpotifyPlaylistPromotion";
import PricingSection from "@/pages/SpotifyPlaylistPromotion/components/PricingSection";
import SuccessPage from "@/pages/SpotifyPlaylistPromotion/components/SuccessPage";
import Help from "@/pages/Help";
import StreamingCalculator from "@/pages/StreamingCalculator";
import { AdminLayout } from "@/components/admin/AdminLayout";
import AdminOverview from "@/pages/admin/Overview";
import AdminAnalytics from "@/pages/admin/Analytics";
import AdminSmartLinks from "@/pages/admin/SmartLinks";
import AdminUserLinks from "@/pages/admin/UserLinks";
import AdminUsers from "@/pages/admin/Users";
import AdminContent from "@/pages/admin/Content";
import AdminMediaLibrary from "@/pages/admin/MediaLibrary";
import AdminImport from "@/pages/admin/Import";
import { AdminRoute } from "@/components/admin/AdminRoute";

const AppContent = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="/help" element={<Help />} />
      <Route path="/spotify-royalty-calculator" element={<StreamingCalculator />} />
      <Route path="/streaming-royalty-calculator" element={<Navigate to="/spotify-royalty-calculator" replace />} />
      
      {/* Spotify Playlist Promotion routes */}
      <Route path="/spotify-playlist-promotion">
        <Route index element={<SpotifyPlaylistPromotion />} />
        <Route path="pricing" element={<PricingSection />} />
        <Route path="success" element={<SuccessPage />} />
      </Route>
      
      <Route path="/:slug" element={<PublicBlogPost />} />
      
      {/* Smart Link public view */}
      <Route path="/link/:slug" element={<SmartLink />} />

      {/* Authenticated routes */}
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/create" element={<CreateSmartLink />} />
      <Route path="/links/:id/edit" element={<EditSmartLink />} />
      <Route path="/links/:id/analytics" element={<SmartLinkAnalytics />} />
      <Route path="/settings" element={<AccountSettings />} />

      {/* Admin routes - protected and with new path */}
      <Route path="/control-room" element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route index element={<AdminOverview />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="smart-links" element={<AdminSmartLinks />} />
        <Route path="user-links" element={<AdminUserLinks />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="content" element={<AdminContent />} />
        <Route path="media" element={<AdminMediaLibrary />} />
        <Route path="import" element={<AdminImport />} />
      </Route>
    </Routes>
  );
};

export default AppContent;
