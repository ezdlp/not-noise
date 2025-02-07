
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
import { Mail, Lock, User, Music, Check, Eye, EyeOff, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AuthError, AuthApiError } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { countries } from "@/lib/countries";
import { genres } from "@/lib/genres";

export default function Register() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    artist_name: "",
    music_genre: "",
    country: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordRequirements, setPasswordRequirements] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
  });

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        navigate("/dashboard");
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  const checkPasswordRequirements = (password: string) => {
    setPasswordRequirements({
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
    });

    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    setPasswordStrength(strength);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement> | { target: { name: string; value: string } }
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "password") {
      checkPasswordRequirements(value);
    }
  };

  const createProfile = async (userId: string, profileData: {
    id: string;
    name: string;
    artist_name: string;
    music_genre: string;
    country: string;
    email: string;
  }) => {
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([profileData]);

    if (profileError) {
      console.error("Error creating profile:", profileError);
      throw profileError;
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
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            artist_name: formData.artist_name,
            music_genre: formData.music_genre,
            country: formData.country,
          }
        }
      });

      if (authError) {
        console.error("Auth error:", authError);
        if (authError instanceof AuthApiError) {
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

      if (authData.user) {
        try {
          await createProfile(authData.user.id, {
            id: authData.user.id,
            name: formData.name,
            artist_name: formData.artist_name,
            music_genre: formData.music_genre,
            country: formData.country,
            email: formData.email
          });
          
          console.log("Registration successful:", authData.user);
          toast({
            title: "Registration successful!",
            description: "Your account has been created. You can now start using the app.",
          });
        } catch (profileError) {
          console.error("Profile creation error:", profileError);
          // Even if profile creation fails, the user is already created
          toast({
            title: "Partial registration complete",
            description: "Your account was created but there was an issue setting up your profile. Please contact support.",
            variant: "destructive"
          });
        }
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
            <AlertDescription>
              {error}
              {error.includes("already exists") && (
                <Button
                  variant="link"
                  className="p-0 h-auto font-normal ml-2"
                  onClick={() => navigate("/login")}
                >
                  Click here to login
                </Button>
              )}
            </AlertDescription>
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
                name="artist_name"
                type="text"
                placeholder="Artist Name"
                value={formData.artist_name}
                onChange={handleInputChange}
                className="pl-10"
                required
              />
            </div>

            <Select
              name="music_genre"
              value={formData.music_genre}
              onValueChange={(value) =>
                handleInputChange({ target: { name: "music_genre", value } })
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
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
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
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="pl-10 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
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
