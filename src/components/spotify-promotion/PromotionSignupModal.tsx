
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { genres } from "@/lib/genres";
import { Info, CheckCircle2 } from "lucide-react";

interface PromotionSignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedPackage: {
    name: string;
    submissions: number;
    price: number;
  };
}

export const PromotionSignupModal = ({
  isOpen,
  onClose,
  onSuccess,
  selectedPackage,
}: PromotionSignupModalProps) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSignIn, setIsSignIn] = React.useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = React.useState({
    email: "",
    password: "",
    artistName: "",
    genre: "",
    acceptTerms: false,
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement> | { target: { name: string; value: string } }
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      toast({
        title: "Welcome back!",
        description: "Proceeding to checkout...",
      });

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            artist_name: formData.artistName,
            music_genre: formData.genre,
          }
        }
      });

      if (signUpError) throw signUpError;

      toast({
        title: "Account created!",
        description: "Proceeding to checkout...",
      });

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => !isLoading && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {isSignIn ? "Welcome back!" : "One last step before your promotion"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-[35%_65%] gap-6 mt-4">
          <div className="space-y-4 order-2 md:order-1">
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Why create an account?</h3>
              <ul className="space-y-2">
                {[
                  "Track your promotion progress",
                  "Access your campaign report",
                  "Direct support channel",
                  "Exclusive music industry insights",
                  "Store and access historical campaign data and results"
                ].map((benefit, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded-full bg-emerald-100 flex items-center justify-center">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    </div>
                    <span className="text-sm text-gray-600">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 bg-primary/5 rounded-lg">
              <h4 className="font-medium text-primary mb-2">Selected Package</h4>
              <p className="text-sm text-gray-600">
                {selectedPackage.name} Package
                <br />
                {selectedPackage.submissions} Playlist Submissions
                <br />
                ${selectedPackage.price}
              </p>
            </div>
          </div>

          <div className="order-1 md:order-2">
            <div className="flex justify-end mb-4">
              <Button
                variant="ghost"
                className="text-sm"
                onClick={() => setIsSignIn(!isSignIn)}
              >
                {isSignIn ? "Need an account? Sign up" : "Already have an account? Sign in"}
              </Button>
            </div>

            <form onSubmit={isSignIn ? handleSignIn : handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  minLength={8}
                />
              </div>

              {!isSignIn && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="artistName">Artist Name</Label>
                    <Input
                      id="artistName"
                      name="artistName"
                      type="text"
                      placeholder="Your artist name"
                      value={formData.artistName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="genre">Primary Genre</Label>
                    <Select
                      value={formData.genre}
                      onValueChange={(value) =>
                        handleInputChange({ target: { name: "genre", value } })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a genre" />
                      </SelectTrigger>
                      <SelectContent>
                        {genres.map((genre) => (
                          <SelectItem key={genre} value={genre}>
                            {genre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {!isSignIn && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="terms"
                    checked={formData.acceptTerms}
                    onCheckedChange={(checked) =>
                      setFormData(prev => ({ ...prev, acceptTerms: checked as boolean }))
                    }
                    required
                  />
                  <label
                    htmlFor="terms"
                    className="text-sm text-gray-600"
                  >
                    I accept the terms and conditions
                  </label>
                </div>
              )}

              <Button
                type="submit"
                className="w-full px-6 py-3"
                disabled={isLoading}
              >
                {isLoading 
                  ? (isSignIn ? "Signing in..." : "Creating Account...") 
                  : (isSignIn ? "Sign in & Continue to Payment" : "Create Account & Continue to Payment")}
              </Button>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

