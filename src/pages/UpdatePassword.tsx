
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { AuthLayout } from "@/features/auth/components/AuthLayout";
import { usePasswordUpdate } from "@/features/auth/hooks/usePasswordUpdate";
import { PasswordRequirements } from "@/features/auth/components/PasswordRequirements";

const formSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const UpdatePassword = () => {
  const navigate = useNavigate();
  const {
    loading,
    error,
    passwordStrength,
    passwordRequirements,
    isVerifying,
    recoveryFlow,
    checkPasswordRequirements,
    initializeRecoveryFlow,
    updatePassword,
  } = usePasswordUpdate();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    initializeRecoveryFlow();
  }, []);

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    await updatePassword(values.password);
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
                  <PasswordRequirements 
                    passwordRequirements={passwordRequirements}
                    passwordStrength={passwordStrength}
                  />
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
