
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AuthError, AuthApiError } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
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
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  terms: z.boolean().refine((val) => val === true, "You must accept the terms"),
});

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

const RECAPTCHA_SITE_KEY = "6LeUZ30pAAAAACaK4YM4czGhGFU-A6HliZYn680F";

export default function Register() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [recaptchaReady, setRecaptchaReady] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      terms: true,
    },
  });

  // Check if reCAPTCHA is ready
  useEffect(() => {
    // Simple direct check if grecaptcha exists and is ready
    if (window.grecaptcha) {
      window.grecaptcha.ready(() => {
        console.log("reCAPTCHA is ready");
        setRecaptchaReady(true);
      });
    } else {
      console.log("Waiting for reCAPTCHA to load...");
      // Set up a listener to check every 100ms
      const checkRecaptchaInterval = setInterval(() => {
        if (window.grecaptcha) {
          window.grecaptcha.ready(() => {
            console.log("reCAPTCHA is ready");
            setRecaptchaReady(true);
          });
          clearInterval(checkRecaptchaInterval);
        }
      }, 100);

      // Clean up interval on unmount
      return () => clearInterval(checkRecaptchaInterval);
    }
  }, []);

  useEffect(() => {
    if (!registrationComplete) {
      const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user && event === 'SIGNED_IN') {
          const redirectPath = sessionStorage.getItem('redirectAfterAuth');
          if (redirectPath) {
            sessionStorage.removeItem('redirectAfterAuth');
            navigate(redirectPath);
          } else {
            navigate("/dashboard");
          }
        }
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    }
  }, [navigate, registrationComplete]);

  const checkPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 33;
    if (/[A-Z]/.test(password)) strength += 33;
    if (/[0-9]/.test(password)) strength += 34;
    setPasswordStrength(strength);
  };

  const verifyRecaptcha = async () => {
    try {
      if (!window.grecaptcha) {
        throw new Error('reCAPTCHA not available');
      }

      console.log('Executing reCAPTCHA...');
      const token = await window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { 
        action: 'register' 
      });
      
      console.log('Verifying token with edge function...');
      const { error } = await supabase.functions.invoke('verify-recaptcha', {
        body: { token }
      });

      if (error) {
        console.error('reCAPTCHA verification failed:', error);
        throw error;
      }

      console.log('reCAPTCHA verification successful');
      return true;
    } catch (error) {
      console.error('reCAPTCHA verification error:', error);
      throw new Error('Security verification failed. Please try again.');
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (passwordStrength < 66) {
      setError("Please use a stronger password");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await verifyRecaptcha();

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            name: values.name
          }
        }
      });

      if (authError) {
        console.error("Auth error:", authError);
        if (authError instanceof AuthApiError) {
          // The key change is here - properly handling the email exists error
          if (authError.message.includes("User already registered")) {
            setError("This email is already registered. Please sign in instead.");
            return;
          }
          
          switch (authError.status) {
            case 400:
              setError("Invalid email format or password requirements not met");
              break;
            case 422:
              setError("Invalid email format. Please enter a valid email address.");
              break;
            case 500:
              setError("There was an issue creating your account. Please try again later.");
              break;
            default:
              setError(authError.message);
          }
        } else {
          throw authError;
        }
        return;
      }

      // Only show success state if we actually created a new user
      if (authData.user && !authData.user.identities?.length) {
        setError("This email is already registered. Please sign in instead.");
        return;
      }

      if (authData.user) {
        setRegistrationComplete(true);
        toast({
          title: "Registration successful!",
          description: "Please check your email to confirm your account.",
          duration: 6000,
        });
      }
    } catch (error) {
      console.error("Registration error:", error);
      if (error instanceof AuthError) {
        setError(error.message);
      } else if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setResendingEmail(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: form.getValues("email"),
      });
      
      if (error) {
        throw error;
      }

      toast({
        title: "Email sent!",
        description: "A new confirmation email has been sent to your inbox.",
        duration: 4000,
      });
    } catch (error) {
      console.error("Error resending email:", error);
      toast({
        title: "Error",
        description: "Failed to resend confirmation email. Please try again.",
        variant: "destructive",
        duration: 4000,
      });
    } finally {
      setResendingEmail(false);
    }
  };

  if (registrationComplete) {
    return (
      <AuthLayout>
        <div className="space-y-8">
          <div className="bg-green-50 p-8 rounded-lg">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Check your email</h2>
            <p className="text-gray-600 mb-4">
              We've sent you an email with a confirmation link. Please check your inbox and click the link to activate your account.
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Don't see the email? Check your spam folder or click below to resend it.
            </p>
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleResendEmail}
                disabled={resendingEmail}
              >
                {resendingEmail ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Resend confirmation email'
                )}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate("/login")}
              >
                Go to Login
              </Button>
            </div>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="flex flex-col items-start space-y-6 w-full">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Create an account</h1>
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Button
              variant="link"
              className="p-0 h-auto font-normal"
              onClick={() => navigate("/login")}
            >
              Sign in
            </Button>
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="w-full">
            <AlertDescription>
              {error}
              {error.includes("already registered") || error.includes("already exists") ? (
                <Button
                  variant="link"
                  className="p-0 h-auto font-normal ml-2"
                  onClick={() => navigate("/login")}
                >
                  Click here to login
                </Button>
              ) : null}
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder="Full Name"
                      {...field}
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder="Email"
                      type="email"
                      {...field}
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormControl>
                    <Input
                      placeholder="Password"
                      type="password"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        checkPasswordStrength(e.target.value);
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
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="terms"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={loading}
                    />
                  </FormControl>
                  <label className="text-sm text-muted-foreground">
                    I agree to the{" "}
                    <Button variant="link" className="p-0 h-auto font-normal" onClick={(e) => e.preventDefault()}>
                      Terms of Service
                    </Button>{" "}
                    and{" "}
                    <Button variant="link" className="p-0 h-auto font-normal" onClick={(e) => e.preventDefault()}>
                      Privacy Policy
                    </Button>
                  </label>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={loading || !recaptchaReady}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : !recaptchaReady ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading security verification...
                </>
              ) : (
                'Create account'
              )}
            </Button>
          </form>
        </Form>

        <p className="text-xs text-muted-foreground/70 mt-4">
          This site is protected by reCAPTCHA and the Google{" "}
          <a 
            href="https://policies.google.com/privacy" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-inherit hover:underline"
          >
            Privacy Policy
          </a>{" "}
          and{" "}
          <a 
            href="https://policies.google.com/terms" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-inherit hover:underline"
          >
            Terms of Service
          </a>{" "}
          apply.
        </p>
      </div>
    </AuthLayout>
  );
}
