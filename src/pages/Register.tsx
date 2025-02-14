
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, Lock, User, Eye, EyeOff, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AuthError, AuthApiError } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { AuthLayout } from "@/components/auth/AuthLayout";

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

export default function Register() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [recaptchaLoaded, setRecaptchaLoaded] = useState(false);
  const [emailChecking, setEmailChecking] = useState(false);
  const [termsAccepted] = useState(true);

  useEffect(() => {
    window.grecaptcha?.ready(() => {
      setRecaptchaLoaded(true);
      console.log('reCAPTCHA ready');
    });
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

  const handleInputChange = async (
    e: React.ChangeEvent<HTMLInputElement> | { target: { name: string; value: string } }
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    if (name === "password") {
      checkPasswordStrength(value);
    }

    if (name === "email" && value) {
      setEmailChecking(true);
      const exists = await checkEmailExists(value);
      setEmailChecking(false);
      if (exists) {
        toast({
          title: "Account exists",
          description: "Please sign in to your existing account instead.",
          duration: 5000,
        });
      }
    }
  };

  const checkEmailExists = async (email: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
        }
      });

      if (!error) {
        setError(`An account with this email already exists. Please sign in instead.`);
        return true;
      }
      
      if (error.status === 400 && error.message.includes("not found")) {
        setError(null);
        return false;
      }

      console.log("Error checking email:", error);
      return false;
    } catch (err) {
      console.error("Error checking email:", err);
      return false;
    }
  };

  const verifyRecaptcha = async () => {
    try {
      if (!recaptchaLoaded) {
        throw new Error('reCAPTCHA not loaded');
      }

      console.log('Executing reCAPTCHA...');
      const token = await window.grecaptcha.execute(import.meta.env.VITE_RECAPTCHA_SITE_KEY, { 
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordStrength < 66) {
      setError("Please use a stronger password");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const emailExists = await checkEmailExists(formData.email);
      if (emailExists) {
        setLoading(false);
        return;
      }

      await verifyRecaptcha();

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name
          }
        }
      });

      if (authError) {
        console.error("Auth error:", authError);
        if (authError instanceof AuthApiError) {
          switch (authError.status) {
            case 400:
              if (authError.message.includes("already exists")) {
                setError("This email is already registered. Please sign in instead.");
              } else {
                setError("Invalid email format or password requirements not met");
              }
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
        email: formData.email,
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
        <div className="space-y-8 text-center">
          <div className="bg-green-50 p-8 rounded-lg">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <Check className="h-6 w-6 text-green-600" />
            </div>
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
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>
        <p className="text-sm text-muted-foreground">
          Sign up to start creating smart links
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
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

      <form onSubmit={handleRegister} className="space-y-6">
        <div className="space-y-4">
          <div className="relative">
            <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              name="name"
              type="text"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleInputChange}
              className="pl-10"
              required
              disabled={loading}
            />
          </div>

          <div className="relative">
            <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              name="email"
              type="email"
              placeholder="Email address"
              value={formData.email}
              onChange={handleInputChange}
              className="pl-10"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={formData.password}
                onChange={handleInputChange}
                className="pl-10 pr-10"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            <Progress 
              value={passwordStrength} 
              className="h-1" 
              style={{
                backgroundColor: '#ECE9FF',
                '--progress-background': '#6851FB'
              } as React.CSSProperties} 
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox id="terms" checked={termsAccepted} />
          <label
            htmlFor="terms"
            className="text-sm text-muted-foreground"
          >
            I agree to the{" "}
            <Button variant="link" className="p-0 h-auto font-normal" onClick={(e) => e.preventDefault()}>
              Terms of Service
            </Button>{" "}
            and{" "}
            <Button variant="link" className="p-0 h-auto font-normal" onClick={(e) => e.preventDefault()}>
              Privacy Policy
            </Button>
          </label>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={loading || !recaptchaLoaded || emailChecking}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : emailChecking ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Checking email...
            </>
          ) : (
            'Create account'
          )}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Button
            variant="link"
            className="p-0 h-auto font-normal"
            onClick={() => navigate("/login")}
            disabled={loading}
          >
            Sign in here
          </Button>
        </p>

        <p className="text-xs text-muted-foreground text-center mt-4">
          This site is protected by reCAPTCHA and the Google{" "}
          <a 
            href="https://policies.google.com/privacy" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Privacy Policy
          </a>{" "}
          and{" "}
          <a 
            href="https://policies.google.com/terms" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Terms of Service
          </a>{" "}
          apply.
        </p>
      </form>
    </AuthLayout>
  );
}
