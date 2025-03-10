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
    const extractTokenFromHash = () => {
      const hash = window.location.hash;
      if (hash) {
        const params = new URLSearchParams(hash.substring(1));
        if (params.has('access_token') || params.has('token')) {
          const token = params.get('access_token') || params.get('token');
          console.log("Found token in hash:", token ? "Present" : "Not found");
          return { token, type: 'recovery' };
        }
      }
      
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      const type = urlParams.get('type');
      
      console.log("URL params extraction result:", token ? "Token found" : "No token found", type);
      
      return { token, type };
    };

    const checkSession = async () => {
      setIsVerifying(true);
      setError(null);
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log("Current session:", session ? "Active" : "None");
        
        if (session?.access_token) {
          const { error: sessionError } = await supabase.auth.updateUser({
            password: form.getValues('password') || 'temporary_value_to_check_token'
          });
          
          if (!sessionError) {
            console.log("User is already logged in, not recovery");
            setIsVerifying(false);
            return;
          }
        }
        
        const { token, type } = extractTokenFromHash();
        
        if (!token) {
          setError("No recovery token found. Please request a new password reset link.");
          setIsVerifying(false);
          return;
        }
        
        if (type !== 'recovery') {
          setError("Invalid token type. Please request a new password reset link.");
          setIsVerifying(false);
          return;
        }
        
        setRecoveryToken(token);
        
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
      } catch (err: any) {
        console.error("Error in token validation:", err);
        setError(`Error processing password reset: ${err.message}. Please try again or request a new link.`);
        setIsVerifying(false);
      }
    };

    checkSession();
    
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth event:", event);
      
      if (event === "PASSWORD_RECOVERY") {
        console.log("PASSWORD_RECOVERY event detected");
        
        const { token } = extractTokenFromHash();
        if (token) {
          setRecoveryToken(token);
          setIsVerifying(false);
        }
      } else if (event === "SIGNED_IN") {
        if (form.getValues('password')) {
          console.log("Password updated and signed in, redirecting to dashboard");
          navigate("/dashboard");
        } else {
          console.log("Signed in without password update, signing out");
          await supabase.auth.signOut();
        }
      }
    });

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
      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: recoveryToken,
        type: 'recovery'
      });
      
      if (verifyError) {
        throw new Error("Token verification failed: " + verifyError.message);
      }
      
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

      await supabase.auth.signOut();
      
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
