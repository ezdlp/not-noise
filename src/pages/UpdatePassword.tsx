
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Progress } from "@/components/ui/progress";
import { AuthLayout } from "@/components/auth/AuthLayout";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const formSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const UpdatePassword = () => {
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
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Extract parameters from URL and handle various formats
  const parseUrlParameters = () => {
    const url = window.location.href;
    console.log("[UpdatePassword] Parsing URL:", url);
    
    // Get the search params
    const searchParams = new URLSearchParams(location.search);
    
    // Check for recovery in query params (new format)
    const isRecovery = searchParams.get('recovery') === 'true' || searchParams.get('type') === 'recovery';
    if (isRecovery) {
      console.log("[Recovery] Found recovery indicator in query params");
      setRecoveryFlow(true);
    }

    // Extract access token from URL or query params
    let token = null;
    
    // First, try to get from query params
    token = searchParams.get('access_token');
    
    // If not found, try to extract from hash part  
    if (!token && window.location.hash) {
      // Handle double hash issue (#recovery=true#access_token=...)
      const hashContent = window.location.hash.replace(/^#/, '');
      
      // Check if there's a double hash
      if (hashContent.includes('#')) {
        // Split by the second hash and get the access_token part
        const parts = hashContent.split('#');
        if (parts.length > 1) {
          const tokenPart = parts[1];
          if (tokenPart.startsWith('access_token=')) {
            // Extract access_token from the hash value
            const tokenParams = new URLSearchParams(tokenPart);
            token = tokenParams.get('access_token');
            console.log("[Recovery] Extracted access token from malformed hash");
          }
        }
      } else {
        // Standard hash parameters
        const hashParams = new URLSearchParams(hashContent);
        token = hashParams.get('access_token');
      }
    }
    
    if (token) {
      console.log("[Recovery] Found access token");
      setAccessToken(token);
      return { isRecovery: true, token };
    }

    return { isRecovery, token: null };
  };

  useEffect(() => {
    const initializeComponent = async () => {
      console.log("[UpdatePassword] Component mounted, current URL:", window.location.href);
      
      // Parse all parameters from URL
      const { isRecovery, token } = parseUrlParameters();
      setRecoveryFlow(isRecovery);
      
      // Listen for auth state changes
      const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log("[Recovery] Auth event:", event, "Session:", session ? "exists" : "none");
        
        if (event === "PASSWORD_RECOVERY") {
          console.log("[Recovery] PASSWORD_RECOVERY event detected");
          setRecoveryFlow(true);
          setSession(session);
          setIsVerifying(false);
        } 
        else if (event === "SIGNED_IN") {
          console.log("[Recovery] User signed in, session is available");
          setSession(session);
          setIsVerifying(false);
        }
        else if (event === "INITIAL_SESSION") {
          console.log("[Recovery] Initial session event, checking session");
          if (session && isRecovery) {
            setSession(session);
            setIsVerifying(false);
          }
        }
      });

      try {
        // Try to handle the recovery token if present
        if (token) {
          console.log("[Recovery] Attempting to exchange access token for session");
          try {
            const { data, error } = await supabase.auth.exchangeCodeForSession(token);
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
        
        // Check if we have an active session
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        console.log("[Recovery] Current session:", currentSession ? "Active" : "None");
        
        if (currentSession && isRecovery) {
          console.log("[Recovery] Valid recovery session found");
          setSession(currentSession);
          setIsVerifying(false);
        } 
        else if (currentSession && !isRecovery) {
          console.log("[Recovery] Not in recovery flow but has session, redirecting");
          navigate("/dashboard");
        }
        else if (isRecovery) {
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

      return () => {
        if (authListener && authListener.subscription) {
          authListener.subscription.unsubscribe();
        }
      };
    };

    initializeComponent();
  }, [navigate, location]);

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

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    if (passwordStrength < 75) {
      setError("Password is not strong enough");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("[Recovery] Updating password...");
      
      // Check if we have a session
      if (!session) {
        console.log("[Recovery] No session available, checking if we can get one");
        
        // If we have an access token but no session, try to exchange it
        if (accessToken) {
          console.log("[Recovery] Trying to exchange access token for session");
          const { data, error } = await supabase.auth.exchangeCodeForSession(accessToken);
          if (error) {
            console.error("[Recovery] Failed to exchange token:", error);
            throw new Error("Unable to establish auth session. Please request a new password reset link.");
          }
          setSession(data.session);
        } else {
          // Try to get current session as a last resort
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          if (!currentSession) {
            throw new Error("Auth session missing! Please request a new password reset link.");
          }
          setSession(currentSession);
        }
      }

      // Update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: values.password
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

  if (isVerifying) {
    return (
      <AuthLayout>
        <div className="w-full space-y-6 text-center">
          <h2 className="text-2xl font-semibold">Verifying Your Link</h2>
          <p className="text-sm text-muted-foreground">Please wait while we verify your password reset link...</p>
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </AuthLayout>
    );
  }

  if (!recoveryFlow) {
    return (
      <AuthLayout>
        <div className="w-full space-y-6 text-center">
          <h2 className="text-2xl font-semibold">Password Reset Error</h2>
          <p className="text-sm text-muted-foreground">
            {error || "No active recovery session found. Please request a new password reset link."}
          </p>
          <Button
            className="w-full"
            onClick={() => navigate("/reset-password")}
          >
            Request New Reset Link
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate("/login")}
          >
            Back to Login
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="w-full space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">Update Password</h2>
          <p className="text-sm text-muted-foreground">
            Enter your new password
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="New password"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        checkPasswordRequirements(e.target.value);
                      }}
                      disabled={loading}
                    />
                  </FormControl>
                  <Progress 
                    value={passwordStrength} 
                    className="h-1" 
                    style={{
                      backgroundColor: '#ECE9FF',
                      '--progress-background': '#6851FB'
                    } as React.CSSProperties} 
                  />
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    {[
                      { key: 'minLength', label: 'At least 8 characters' },
                      { key: 'hasUppercase', label: 'One uppercase letter' },
                      { key: 'hasLowercase', label: 'One lowercase letter' },
                      { key: 'hasNumber', label: 'One number' },
                    ].map(({ key, label }) => (
                      <div
                        key={key}
                        className={`flex items-center gap-2 ${
                          passwordRequirements[key as keyof typeof passwordRequirements]
                            ? "text-primary"
                            : "text-muted-foreground"
                        }`}
                      >
                        {passwordRequirements[key as keyof typeof passwordRequirements] ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                        <span>{label}</span>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Confirm new password"
                      {...field}
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Password'
              )}
            </Button>
          </form>
        </Form>
      </div>
    </AuthLayout>
  );
};

export default UpdatePassword;
