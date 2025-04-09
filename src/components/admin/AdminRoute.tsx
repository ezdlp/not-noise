
import { useQuery } from "@tanstack/react-query";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [sessionVerified, setSessionVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // First ensure we have a valid session
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Session check error:", error);
          setError("Authentication error");
          toast({
            title: "Authentication Error",
            description: "Please log in again to continue",
            variant: "destructive",
          });
        } else if (!data.session) {
          console.warn("No active session found");
          setError("No active session");
        } else {
          console.log("Session found for user:", data.session.user.id);
          setSessionVerified(true);
          setError(null);
        }
      } catch (e) {
        console.error("Exception checking session:", e);
        setError("Session check failed");
      }
    };
    
    checkSession();
    
    // Also listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state changed:", event, session?.user.id);
        setSessionVerified(!!session);
        setError(null);
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const { data: isAdmin, isLoading, error: adminCheckError } = useQuery({
    queryKey: ["adminCheck"],
    queryFn: async () => {
      console.log("Checking admin role...");
      
      try {
        // Get current session directly before checking role
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.warn("No session when checking admin role");
          return false;
        }
        
        console.log("User ID when checking admin:", session.user.id);
        
        // Try both methods to check for admin access
        
        // Method 1: Check with RPC function
        const { data: rpcData, error: rpcError } = await supabase.rpc('has_role', {
          _role: 'admin'
        });

        if (!rpcError && rpcData === true) {
          console.log("Admin role confirmed via RPC");
          return true;
        }
        
        if (rpcError) {
          console.error("Error checking admin role via RPC:", rpcError);
        }
        
        // Method 2: Check profiles.is_admin directly as fallback
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', session.user.id)
          .single();
        
        if (profileError) {
          console.error("Error checking admin status in profile:", profileError);
          return false;
        }
        
        console.log("Admin profile check result:", profileData);
        return profileData?.is_admin === true;
      } catch (e) {
        console.error("Exception checking admin status:", e);
        return false;
      }
    },
    enabled: sessionVerified, // Only run when we have verified the session
    retry: 2, // Retry twice in case of network issues
    retryDelay: 1000, // Wait 1 second between retries
  });

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Error</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <div className="flex justify-center">
            <button
              onClick={() => window.location.href = '/login'}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!sessionVerified || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (adminCheckError) {
    toast({
      title: "Error Checking Permissions",
      description: "There was a problem verifying your admin access",
      variant: "destructive",
    });
    console.error("Admin check error:", adminCheckError);
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
