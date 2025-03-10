
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { createPasswordResetUrl } from "../utils/tokenHelpers";

export function usePasswordReset() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const { toast } = useToast();

  const sendResetLink = async (email: string) => {
    setLoading(true);
    setError(null);

    try {
      const redirectUrl = createPasswordResetUrl(window.location.origin);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) throw error;

      setResetSent(true);
      toast({
        title: "Reset email sent",
        description: "Check your email for the password reset link.",
      });
      
    } catch (error) {
      console.error("Reset password error:", error);
      setError("Error sending reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    resetSent,
    sendResetLink,
    setResetSent
  };
}
