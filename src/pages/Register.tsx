import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Mail, Lock, User, Music, Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AuthError } from "@supabase/supabase-js";
import { useToast } from "@/components/ui/use-toast";
import { Progress } from "@/components/ui/progress";
import { countries } from "@/lib/countries";
import { genres } from "@/lib/genres";

export default function Register() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    artistName: "",
    musicGenre: "",
    country: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/dashboard");
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.match(/[A-Z]/)) strength += 25;
    if (password.match(/[0-9]/)) strength += 25;
    if (password.match(/[^A-Za-z0-9]/)) strength += 25;
    setPasswordStrength(strength);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement> | { target: { name: string; value: string } }
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "password") {
      calculatePasswordStrength(value);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (passwordStrength < 75) {
      setError("Password is not strong enough");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Sign up with user metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: null,
          data: {
            name: formData.name,
            artistName: formData.artistName,
            musicGenre: formData.musicGenre,
            country: formData.country,
            email_confirm: true
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        toast({
          title: "Registration successful!",
          description: "Your account has been created. You can now log in.",
        });
        
        navigate("/login");
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Create an account</h2>
          <p className="mt-2 text-muted-foreground">
            Sign up to start creating smart links
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleRegister} className="mt-8 space-y-6">
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
              />
            </div>

            <div className="relative">
              <Music className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                name="artistName"
                type="text"
                placeholder="Artist Name"
                value={formData.artistName}
                onChange={handleInputChange}
                className="pl-10"
                required
              />
            </div>

            <Select
              name="musicGenre"
              value={formData.musicGenre}
              onValueChange={(value) =>
                handleInputChange({ target: { name: "musicGenre", value } })
              }
              required
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Music Genre" />
              </SelectTrigger>
              <SelectContent>
                {genres.map((genre) => (
                  <SelectItem key={genre} value={genre}>
                    {genre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              name="country"
              value={formData.country}
              onValueChange={(value) =>
                handleInputChange({ target: { name: "country", value } })
              }
              required
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Country" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

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
              />
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  name="password"
                  type="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="pl-10"
                  required
                />
              </div>
              <Progress value={passwordStrength} className="h-1" />
              <p className="text-sm text-muted-foreground">
                Password strength: {passwordStrength}%
              </p>
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                name="confirmPassword"
                type="password"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="pl-10"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Create account"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Button
              variant="link"
              className="p-0 h-auto font-normal"
              onClick={() => navigate("/login")}
            >
              Sign in here
            </Button>
          </p>
        </form>
      </div>
    </div>
  );
}