import { Navigate } from "react-router-dom";

export default function Dashboard() {
  // Since we've moved to the sidebar layout, just redirect to the new dashboard
  return <Navigate to="/dashboard" replace />;
}
