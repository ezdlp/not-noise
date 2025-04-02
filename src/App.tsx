import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SmartLinkRedirect } from './components/smart-links/SmartLinkRedirect';
import { SmartLinkSEO } from './components/smart-links/SmartLinkSEO';
import PricingPage from './pages/PricingPage';
import Account from './pages/Account';
import AdminRoute from './components/auth/AdminRoute';
import AdminLayout from './layouts/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import Users from './pages/admin/Users';
import BioLink from './pages/BioLink';
import NotFound from './pages/NotFound';
import RequireAuth from './components/auth/RequireAuth';
import PublicProfile from './pages/PublicProfile';
import SmartLinks from './pages/SmartLinks';
import Promotion from './pages/Promotion';
import CreateSmartLink from './pages/CreateSmartLink';
import EditSmartLink from './pages/EditSmartLink';
import CreateBioLink from './pages/CreateBioLink';
import EditBioLink from './pages/EditBioLink';
import Legal from './pages/Legal';
import PasswordReset from './pages/PasswordReset';
import EmailVerification from './pages/EmailVerification';
import Contact from './pages/Contact';
import Features from './pages/Features';
import FixSubscriptions from './pages/admin/FixSubscriptions';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<BioLink />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/features" element={<Features />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/legal/:page" element={<Legal />} />
        <Route path="/password-reset" element={<PasswordReset />} />
        <Route path="/email-verification" element={<EmailVerification />} />
        
        {/* Smart Link routes */}
        <Route path="/link/:slug" element={<SmartLinkRedirect />} />
        <Route path="/seo-test/:slug" element={<SmartLinkSEO />} />
        
        {/* User routes - require authentication */}
        <Route path="/account" element={<RequireAuth><Account /></RequireAuth>} />
        <Route path="/profile/:username" element={<PublicProfile />} />
        <Route path="/smart-links" element={<RequireAuth><SmartLinks /></RequireAuth>} />
        <Route path="/promotion" element={<RequireAuth><Promotion /></RequireAuth>} />
        <Route path="/smart-links/create" element={<RequireAuth><CreateSmartLink /></RequireAuth>} />
        <Route path="/smart-links/edit/:id" element={<RequireAuth><EditSmartLink /></RequireAuth>} />
        <Route path="/bio-link/create" element={<RequireAuth><CreateBioLink /></RequireAuth>} />
        <Route path="/bio-link/edit/:id" element={<RequireAuth><EditBioLink /></RequireAuth>} />
        
        {/* Admin routes */}
        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="fix-subscriptions" element={<FixSubscriptions />} />
          {/* Add more admin routes here */}
        </Route>
        
        {/* Catch-all route for 404 Not Found */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
