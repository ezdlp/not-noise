
import { useQuery } from "@tanstack/react-query";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [sessionVerified, setSessionVerified] = useState(false);

  // First ensure we have a valid session
  useEffect(() => {
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Session check error:", error);
        toast({
          title: "Authentication Error",
          description: "Please log in again to continue",
          variant: "destructive",
        });
      } else if (!data.session) {
        console.warn("No active session found");
      } else {
        console.log("Session found for user:", data.session.user.id);
        setSessionVerified(true);
      }
    };
    
    checkSession();
    
    // Also listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state changed:", event, session?.user.id);
        setSessionVerified(!!session);
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const { data: isAdmin, isLoading } = useQuery({
    queryKey: ["adminCheck"],
    queryFn: async () => {
      console.log("Checking admin role...");
      
      // Get current session directly before checking role
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.warn("No session when checking admin role");
        return false;
      }
      
      console.log("User ID when checking admin:", session.user.id);
      
      const { data, error } = await supabase.rpc('has_role', {
        _role: 'admin'
      });

      if (error) {
        console.error("Error checking admin role:", error);
        return false;
      }

      console.log("Admin role check result:", data);
      return data;
    },
    enabled: sessionVerified, // Only run when we have verified the session
    retry: 1, // Retry once in case of network issues
  });

  if (!sessionVerified || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    toast({
      title: "Access Denied",
      description: "You don't have admin permissions to access this page",
      variant: "destructive",
    });
    return <Navigate to="/dashboard" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
