
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { extractAuthParamsFromUrl } from "../utils/tokenHelpers";
import { useNavigate } from "react-router-dom";

export function usePasswordUpdate() {
  const [isLoading, setIsLoading] = useState(false);
  const [isValidatingToken, setIsValidatingToken] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Validate the token when the component mounts
  useEffect(() => {
    const validateToken = async () => {
      setIsValidatingToken(true);
      setError(null);

      try {
        const { accessToken, isRecovery } = extractAuthParamsFromUrl();
        
        console.log("[usePasswordUpdate] Token validation:", { 
          hasToken: !!accessToken, 
          isRecovery 
        });

        if (!isRecovery) {
          setError("Invalid password reset link. Please request a new one.");
          setIsValidToken(false);
          return;
        }

        if (!accessToken) {
          setError("Authentication token is missing. Please request a new password reset link.");
          setIsValidToken(false);
          return;
        }

        // Verify the token by getting the user session
        const { data, error } = await supabase.auth.getUser(accessToken);
        
        if (error || !data.user) {
          console.error("[usePasswordUpdate] Token validation error:", error);
          setError("Your reset link has expired or is invalid. Please request a new one.");
          setIsValidToken(false);
          return;
        }

        setIsValidToken(true);
      } catch (error: any) {
        console.error("[usePasswordUpdate] Error validating token:", error);
        setError("An unexpected error occurred. Please try again or request a new password reset link.");
        setIsValidToken(false);
      } finally {
        setIsValidatingToken(false);
      }
    };

    validateToken();
  }, []);

  const updatePassword = async (password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { accessToken } = extractAuthParamsFromUrl();
      
      if (!accessToken) {
        throw new Error("Missing authentication token");
      }
      
      const { error } = await supabase.auth.updateUser(
        { password }
      );

      if (error) throw error;

      setIsSuccess(true);
      toast({
        title: "Success!",
        description: "Your password has been updated successfully.",
      });
      
      // Clear URL parameters for security
      window.history.replaceState({}, "", window.location.pathname);
      
    } catch (error: any) {
      console.error("[usePasswordUpdate] Error updating password:", error);
      setError(error.message || "Failed to update password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const redirectToLogin = () => {
    navigate("/login");
  };

  return {
    isLoading,
    isValidatingToken,
    error,
    isSuccess,
    isValidToken,
    updatePassword,
    redirectToLogin
  };
}
