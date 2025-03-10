
import { useState, useEffect } from "react";
import { AuthLayout } from "@/features/auth/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, ArrowLeft } from "lucide-react";
import { PasswordRequirements } from "@/features/auth/components/PasswordRequirements";
import { usePasswordUpdate } from "@/features/auth/hooks/usePasswordUpdate";
import { PasswordResetSuccess } from "@/features/auth/components/PasswordResetSuccess";

const passwordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .refine((val) => /[A-Z]/.test(val), {
        message: "Password must include at least one uppercase letter",
      })
      .refine((val) => /[a-z]/.test(val), {
        message: "Password must include at least one lowercase letter",
      })
      .refine((val) => /[0-9]/.test(val), {
        message: "Password must include at least one number",
      }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type PasswordFormValues = z.infer<typeof passwordSchema>;

const UpdatePassword = () => {
  const { 
    isLoading, 
    isValidatingToken, 
    error, 
    isSuccess, 
    isValidToken, 
    updatePassword,
    redirectToLogin
  } = usePasswordUpdate();
  
  const [passwordRequirements, setPasswordRequirements] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
  });
  const [passwordStrength, setPasswordStrength] = useState(0);

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const handleSubmit = async (values: PasswordFormValues) => {
    await updatePassword(values.password);
  };

  const calculatePasswordStrength = (password: string) => {
    // Initialize strength score
    let strength = 0;
    
    // Check each requirement
    const requirements = {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
    };
    
    // Update state with current requirements status
    setPasswordRequirements(requirements);
    
    // Calculate strength score (25% for each requirement)
    Object.values(requirements).forEach(isValid => {
      if (isValid) strength += 25;
    });
    
    setPasswordStrength(strength);
  };

  // Calculate password strength on input
  useEffect(() => {
    const password = form.watch("password");
    calculatePasswordStrength(password);
  }, [form.watch("password")]);

  return (
    <AuthLayout>
      {isSuccess ? (
        <PasswordResetSuccess onGoToLogin={redirectToLogin} />
      ) : (
        <div className="w-full space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold">Update Your Password</h1>
            <p className="text-sm text-muted-foreground">
              Enter a new password for your account
            </p>
          </div>

          {(isValidatingToken || (isLoading && !error)) && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!isValidatingToken && !error && isValidToken && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="password">New Password</Label>
                      <FormControl>
                        <Input
                          type="password"
                          id="password"
                          placeholder="••••••••"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <PasswordRequirements 
                  passwordRequirements={passwordRequirements}
                  passwordStrength={passwordStrength}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <FormControl>
                        <Input
                          type="password"
                          id="confirmPassword"
                          placeholder="••••••••"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Update Password"
                    )}
                  </Button>
                  
                  <Button
                    variant="link"
                    className="w-full"
                    onClick={redirectToLogin}
                    type="button"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Login
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </div>
      )}
    </AuthLayout>
  );
};

export default UpdatePassword;
