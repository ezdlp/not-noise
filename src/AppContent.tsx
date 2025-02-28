
import { Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";

// Eagerly load critical components
import Index from "@/pages/Index";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminRoute } from "@/components/admin/AdminRoute";

// Lazy load non-critical routes
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const SmartLink = lazy(() => import("@/pages/SmartLink"));
const SmartLinkAnalytics = lazy(() => import("@/pages/SmartLinkAnalytics"));
const CreateSmartLink = lazy(() => import("@/pages/CreateSmartLink"));
const EditSmartLink = lazy(() => import("@/pages/EditSmartLink"));
const AccountSettings = lazy(() => import("@/pages/AccountSettings"));
const Contact = lazy(() => import("@/pages/Contact"));
const Pricing = lazy(() => import("@/pages/Pricing"));
const Blog = lazy(() => import("@/pages/Blog"));
const PublicBlogPost = lazy(() => import("@/pages/PublicBlogPost"));
const SpotifyPlaylistPromotion = lazy(() => import("@/pages/SpotifyPlaylistPromotion"));
const PricingSection = lazy(() => import("@/pages/SpotifyPlaylistPromotion/components/PricingSection"));
const SuccessPage = lazy(() => import("@/pages/SpotifyPlaylistPromotion/components/SuccessPage"));
const Help = lazy(() => import("@/pages/Help"));
const StreamingCalculator = lazy(() => import("@/pages/StreamingCalculator"));
const AdminOverview = lazy(() => import("@/pages/admin/Overview"));
const AdminAnalytics = lazy(() => import("@/pages/admin/Analytics"));
const AdminSmartLinks = lazy(() => import("@/pages/admin/SmartLinks"));
const AdminUserLinks = lazy(() => import("@/pages/admin/UserLinks"));
const AdminUsers = lazy(() => import("@/pages/admin/Users"));
const AdminContent = lazy(() => import("@/pages/admin/Content"));
const AdminMediaLibrary = lazy(() => import("@/pages/admin/MediaLibrary"));
const AdminImport = lazy(() => import("@/pages/admin/Import"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const UpdatePassword = lazy(() => import("@/pages/UpdatePassword"));

const LoadingSpinner = () => (
  <div className="h-screen w-full flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

export default function AppContent() {
  return (
    <Routes>
      <Route path="/link/:slug" element={
        <Suspense fallback={<LoadingSpinner />}>
          <SmartLink />
        </Suspense>
      } />
      
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      <Route path="/reset-password" element={
        <Suspense fallback={<LoadingSpinner />}>
          <ResetPassword />
        </Suspense>
      } />
      
      <Route path="/update-password" element={
        <Suspense fallback={<LoadingSpinner />}>
          <UpdatePassword />
        </Suspense>
      } />
      
      <Route path="/contact" element={
        <Suspense fallback={<LoadingSpinner />}>
          <Contact />
        </Suspense>
      } />
      
      <Route path="/pricing" element={
        <Suspense fallback={<LoadingSpinner />}>
          <Pricing />
        </Suspense>
      } />
      
      <Route path="/blog" element={
        <Suspense fallback={<LoadingSpinner />}>
          <Blog />
        </Suspense>
      } />
      
      <Route path="/blog/page/:page" element={
        <Suspense fallback={<LoadingSpinner />}>
          <Blog />
        </Suspense>
      } />
      
      {/* Help Center Routes - Updated to include category and article routes */}
      <Route path="/help" element={
        <Suspense fallback={<LoadingSpinner />}>
          <Help />
        </Suspense>
      } />
      <Route path="/help/category/:categoryId" element={
        <Suspense fallback={<LoadingSpinner />}>
          <Help />
        </Suspense>
      } />
      <Route path="/help/:slug" element={
        <Suspense fallback={<LoadingSpinner />}>
          <Help />
        </Suspense>
      } />
      
      <Route path="/spotify-royalty-calculator" element={
        <Suspense fallback={<LoadingSpinner />}>
          <StreamingCalculator />
        </Suspense>
      } />
      
      <Route path="/streaming-royalty-calculator" element={
        <Navigate to="/spotify-royalty-calculator" replace />
      } />
      
      <Route path="/links-creator" element={
        <Navigate to="/create" replace />
      } />
      
      <Route path="/my-links" element={
        <Navigate to="/dashboard" replace />
      } />
      
      <Route path="/spotify-playlist-promotion">
        <Route index element={
          <Suspense fallback={<LoadingSpinner />}>
            <SpotifyPlaylistPromotion />
          </Suspense>
        } />
        <Route path="pricing" element={
          <Suspense fallback={<LoadingSpinner />}>
            <PricingSection />
          </Suspense>
        } />
        <Route path="success" element={
          <Suspense fallback={<LoadingSpinner />}>
            <SuccessPage />
          </Suspense>
        } />
      </Route>
      
      <Route path="/dashboard" element={
        <Suspense fallback={<LoadingSpinner />}>
          <Dashboard />
        </Suspense>
      } />
      
      <Route path="/create" element={
        <Suspense fallback={<LoadingSpinner />}>
          <CreateSmartLink />
        </Suspense>
      } />
      
      <Route path="/links/:id/edit" element={
        <Suspense fallback={<LoadingSpinner />}>
          <EditSmartLink />
        </Suspense>
      } />
      
      <Route path="/links/:id/analytics" element={
        <Suspense fallback={<LoadingSpinner />}>
          <SmartLinkAnalytics />
        </Suspense>
      } />
      
      <Route path="/settings" element={
        <Suspense fallback={<LoadingSpinner />}>
          <AccountSettings />
        </Suspense>
      } />
      
      <Route path="/control-room" element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route index element={
          <Suspense fallback={<LoadingSpinner />}>
            <AdminOverview />
          </Suspense>
        } />
        <Route path="analytics" element={
          <Suspense fallback={<LoadingSpinner />}>
            <AdminAnalytics />
          </Suspense>
        } />
        <Route path="smart-links" element={
          <Suspense fallback={<LoadingSpinner />}>
            <AdminSmartLinks />
          </Suspense>
        } />
        <Route path="user-links" element={
          <Suspense fallback={<LoadingSpinner />}>
            <AdminUserLinks />
          </Suspense>
        } />
        <Route path="users" element={
          <Suspense fallback={<LoadingSpinner />}>
            <AdminUsers />
          </Suspense>
        } />
        <Route path="content" element={
          <Suspense fallback={<LoadingSpinner />}>
            <AdminContent />
          </Suspense>
        } />
        <Route path="media" element={
          <Suspense fallback={<LoadingSpinner />}>
            <AdminMediaLibrary />
          </Suspense>
        } />
        <Route path="import" element={
          <Suspense fallback={<LoadingSpinner />}>
            <AdminImport />
          </Suspense>
        } />
      </Route>
      
      {/* This catch-all route should come after all specific routes */}
      <Route path="/:slug" element={
        <Suspense fallback={<LoadingSpinner />}>
          <PublicBlogPost />
        </Suspense>
      } />
    </Routes>
  );
}
