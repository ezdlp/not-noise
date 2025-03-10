
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
import { usePasswordReset } from "@/features/auth/hooks/usePasswordReset";

const formSchema = z.object({
  email: z.string().email("Please enter a valid email"),
});

const ResetPassword = () => {
  const navigate = useNavigate();
  const { loading, error, resetSent, sendResetLink, setResetSent } = usePasswordReset();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const handleResetPassword = async (values: z.infer<typeof formSchema>) => {
    await sendResetLink(values.email);
  };

  if (resetSent) {
    return (
      <AuthLayout>
        <div className="w-full space-y-8">
          <div className="space-y-4 text-left">
            <h2 className="text-2xl font-semibold">Check Your Email</h2>
            <p className="text-muted-foreground">
              We've sent a password reset link to:
              <br />
              <span className="font-medium text-foreground">{form.getValues("email")}</span>
            </p>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Didn't receive the email? Check your spam folder or try another email address.
            </p>
            
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setResetSent(false)}
              >
                Try another email
              </Button>
              
              <Button
                variant="link"
                className="w-full"
                onClick={() => navigate("/login")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
              </Button>
            </div>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="w-full space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">Reset Password</h2>
          <p className="text-sm text-muted-foreground">
            Enter your email to receive a password reset link
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleResetPassword)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Email address"
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
                  Sending...
                </>
              ) : (
                'Send Reset Link'
              )}
            </Button>

            <Button
              variant="link"
              className="w-full"
              onClick={() => navigate("/login")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Button>
          </form>
        </Form>
      </div>
    </AuthLayout>
  );
};

export default ResetPassword;
