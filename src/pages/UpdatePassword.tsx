
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  const [recoveryToken, setRecoveryToken] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    // Extract token from URL
    const extractTokenFromUrl = () => {
      // First check for URL params
      const params = new URLSearchParams(window.location.search);
      let token = params.get('token');
      let type = params.get('type');
      
      // If not in params, check hash fragment (for some auth providers)
      if (!token) {
        const hash = window.location.hash;
        if (hash) {
          const hashParams = new URLSearchParams(hash.substring(1));
          if (hashParams.has('access_token')) {
            token = hashParams.get('access_token');
            type = 'recovery';
          }
        }
      }
      
      console.log("Extracted token:", token ? "Found" : "Not found");
      console.log("Token type:", type);
      
      return { token, type };
    };

    const handlePasswordRecovery = async () => {
      setIsVerifying(true);
      
      try {
        // First make sure user is signed out
        await supabase.auth.signOut();
        
        const { token, type } = extractTokenFromUrl();
        
        if (!token || type !== 'recovery') {
          setError("Invalid or missing recovery token. Please request a new password reset link.");
          setIsVerifying(false);
          return;
        }
        
        setRecoveryToken(token);
        
        // Verify the token is valid but don't update password yet
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'recovery'
        });
        
        if (verifyError) {
          console.error("Token verification error:", verifyError);
          setError("Invalid or expired recovery token. Please request a new password reset link.");
          setIsVerifying(false);
          return;
        }
        
        console.log("Token verified successfully");
        setIsVerifying(false);
      } catch (err) {
        console.error("Password recovery handling error:", err);
        setError("Error processing password reset. Please try again or request a new link.");
        setIsVerifying(false);
      }
    };

    handlePasswordRecovery();
    
    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth event:", event);
      
      if (event === "PASSWORD_RECOVERY") {
        // This event indicates we're in password recovery flow
        console.log("PASSWORD_RECOVERY event detected");
      } else if (event === "SIGNED_IN") {
        // If they somehow got signed in without updating password,
        // sign them out and keep them on this page
        if (!form.getValues('password')) {
          console.log("Signed in without password update, signing out");
          await supabase.auth.signOut();
        } else {
          // If they've set a password and then got signed in, that means
          // the password update succeeded, so redirect to dashboard
          navigate("/dashboard");
        }
      }
    });

    // Cleanup
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate, form]);

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

    if (!recoveryToken) {
      setError("No recovery token found. Please request a new password reset link.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use the verifyOtp method first to ensure the token is still valid
      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: recoveryToken,
        type: 'recovery'
      });
      
      if (verifyError) {
        throw new Error("Token verification failed: " + verifyError.message);
      }
      
      // Now update the password
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

      // Sign out after updating password to ensure clean login state
      await supabase.auth.signOut();
      
      // After successful password update, redirect to login
      setTimeout(() => navigate("/login"), 2000);
    } catch (error: any) {
      console.error("Update password error:", error);
      setError(`Error updating password: ${error.message}. Please try again or request a new password reset link.`);
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
