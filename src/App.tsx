import { useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useToast } from "@/components/ui/use-toast"
import { useSessionContext } from '@supabase/auth-helpers-react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { SiteLayout } from '@/components/SiteLayout';
import Account from '@/pages/Account';
import Dashboard from '@/pages/Dashboard';
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import NotFound from '@/pages/NotFound';
import Pricing from '@/pages/Pricing';
import Register from '@/pages/Register';
import SmartLink from '@/pages/SmartLink';
import ResetPassword from "@/pages/ResetPassword";
import UpdatePassword from "@/pages/UpdatePassword";

function App() {
  return (
    <Routes>
      <Route path="/" element={<SiteLayout><Home /></SiteLayout>} />
      <Route path="/pricing" element={<SiteLayout><Pricing /></SiteLayout>} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<ProtectedRoute><SiteLayout><Dashboard /></SiteLayout></ProtectedRoute>} />
      <Route path="/account" element={<ProtectedRoute><SiteLayout><Account /></SiteLayout></ProtectedRoute>} />
      <Route path="/smartlink/:id" element={<SiteLayout><SmartLink /></SiteLayout>} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/update-password" element={<UpdatePassword />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
