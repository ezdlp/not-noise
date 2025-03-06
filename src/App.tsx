
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Dashboard from "@/pages/Dashboard";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import UpdateProfile from "@/pages/UpdateProfile";
import SmartLink from "@/pages/SmartLink";
import SmartLinkAnalytics from "@/pages/SmartLinkAnalytics";
import { AdminLayout } from "@/components/admin/AdminLayout";
import ControlRoom from "@/pages/admin/ControlRoom";
import Blog from "@/pages/admin/Blog";
import Playlists from "@/pages/admin/Playlists";
import Users from "@/pages/admin/Users";
import Settings from "@/pages/admin/Settings";
import ImportData from "@/pages/admin/ImportData";
import Logout from "@/pages/Logout";
import PublicSmartLink from "@/pages/PublicSmartLink";
import Analytics from "@/pages/admin/Analytics";
import AnalyticsLogs from "@/pages/admin/AnalyticsLogs";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/update-profile"
            element={
              <PrivateRoute>
                <UpdateProfile />
              </PrivateRoute>
            }
          />
          <Route path="/smartlink/:id" element={<SmartLink />} />
          <Route
            path="/links/:id/analytics"
            element={
              <PrivateRoute>
                <SmartLinkAnalytics />
              </PrivateRoute>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/link/:slug" element={<PublicSmartLink />} />
          <Route path="/logout" element={<Logout />} />
          <Route
            path="/control-room"
            element={
              <PrivateRoute>
                <AdminLayout>
                  <ControlRoom />
                </AdminLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/control-room/blog"
            element={
              <PrivateRoute>
                <AdminLayout>
                  <Blog />
                </AdminLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/control-room/playlists"
            element={
              <PrivateRoute>
                <AdminLayout>
                  <Playlists />
                </AdminLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/control-room/users"
            element={
              <PrivateRoute>
                <AdminLayout>
                  <Users />
                </AdminLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/control-room/settings"
            element={
              <PrivateRoute>
                <AdminLayout>
                  <Settings />
                </AdminLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/control-room/import"
            element={
              <PrivateRoute>
                <AdminLayout>
                  <ImportData />
                </AdminLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/control-room/analytics"
            element={
              <PrivateRoute>
                <AdminLayout>
                  <Analytics />
                </AdminLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/control-room/analytics/logs"
            element={
              <PrivateRoute>
                <AdminLayout>
                  <AnalyticsLogs />
                </AdminLayout>
              </PrivateRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  return currentUser ? (
    children
  ) : (
    <Navigate to="/login" replace />
  );
}

export default App;
