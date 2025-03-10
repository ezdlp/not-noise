
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { extractAuthParamsFromUrl } from "../utils/tokenHelpers";

export function usePasswordUpdate() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordRequirements, setPasswordRequirements] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
  });
  const [isVerifying, setIsVerifying] = useState(true);
  const [recoveryFlow, setRecoveryFlow] = useState(false);
  const [session, setSession] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const checkPasswordRequirements = (password: string) => {
    const requirements = {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
    };
    setPasswordRequirements(requirements);

    let strength = 0;
    if (requirements.minLength) strength += 25;
    if (requirements.hasUppercase) strength += 25;
    if (requirements.hasLowercase) strength += 25;
    if (requirements.hasNumber) strength += 25;
    setPasswordStrength(strength);

    return requirements;
  };

  const initializeRecoveryFlow = async () => {
    console.log("[PasswordUpdate] Initializing recovery flow");
    setIsVerifying(true);
    
    try {
      // Parse all parameters from URL
      const { accessToken, recoveryFlow } = extractAuthParamsFromUrl();
      setRecoveryFlow(recoveryFlow);
      
      // Set up auth state listener
      const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log("[Recovery] Auth event:", event, "Session:", session ? "exists" : "none");
        
        if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN" || event === "INITIAL_SESSION") {
          if (session && recoveryFlow) {
            console.log("[Recovery] Valid session detected for recovery flow");
            setSession(session);
            setIsVerifying(false);
          }
        }
      });

      // Try to exchange token if present
      if (accessToken) {
        console.log("[Recovery] Attempting to exchange access token for session");
        try {
          const { data, error } = await supabase.auth.exchangeCodeForSession(accessToken);
          if (error) {
            console.error("[Recovery] Failed to exchange token:", error);
            throw error;
          }
          console.log("[Recovery] Successfully exchanged token for session", data);
          setSession(data.session);
          setIsVerifying(false);
          return;
        } catch (tokenError) {
          console.error("[Recovery] Token exchange error:", tokenError);
        }
      }
      
      // Check for existing session if no token exchange
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      console.log("[Recovery] Current session:", currentSession ? "Active" : "None");
      
      if (currentSession && recoveryFlow) {
        console.log("[Recovery] Valid recovery session found");
        setSession(currentSession);
        setIsVerifying(false);
      } 
      else if (currentSession && !recoveryFlow) {
        console.log("[Recovery] Not in recovery flow but has session, redirecting");
        navigate("/dashboard");
      }
      else if (recoveryFlow) {
        console.log("[Recovery] In recovery flow but no session yet");
        setIsVerifying(false);
      }
      else {
        console.log("[Recovery] No active recovery session");
        setError("No active recovery session found. Please request a new password reset link.");
        setIsVerifying(false);
      }
    } catch (error) {
      console.error("[Recovery] Verification error:", error);
      setError("Error checking authentication state. Please request a new password reset link.");
      setIsVerifying(false);
    }
  };

  const updatePassword = async (password: string) => {
    if (passwordStrength < 75) {
      setError("Password is not strong enough");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("[Recovery] Updating password...");
      
      // Check if we have a session
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      const activeSession = session || currentSession;
      
      if (!activeSession) {
        console.error("[Recovery] No active session found");
        throw new Error("Auth session missing! Please request a new password reset link.");
      }

      // Update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) {
        throw new Error(updateError.message);
      }

      toast({
        title: "Password updated",
        description: "Your password has been successfully updated. You can now log in with your new password.",
      });

      console.log("[Recovery] Password updated successfully, signing out...");
      await supabase.auth.signOut();
      
      setTimeout(() => navigate("/login"), 2000);
    } catch (error: any) {
      console.error("[Recovery] Update password error:", error);
      setError(`Error updating password: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    passwordStrength,
    passwordRequirements,
    isVerifying,
    recoveryFlow,
    checkPasswordRequirements,
    initializeRecoveryFlow,
    updatePassword,
  };
}
