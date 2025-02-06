
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
  const { toast } = useToast();
  const [formData, setFormData] = React.useState({
    email: "",
    password: "",
    artistName: "",
    genre: "",
    acceptTerms: false,
    acceptMarketing: false,
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement> | { target: { name: string; value: string } }
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
            marketing_consent: formData.acceptMarketing,
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
          <DialogTitle className="text-2xl">One last step before your promotion</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <div className="space-y-4 order-2 md:order-1">
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Why create an account?</h3>
              <ul className="space-y-2">
                {[
                  "Track your promotion progress in real-time",
                  "Get notified when playlists add your music",
                  "Access detailed performance analytics",
                  "Direct support channel",
                  "Exclusive music industry insights"
                ].map((benefit, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded-full bg-emerald-100 flex items-center justify-center">
                      <svg className="h-3 w-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
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

          <form onSubmit={handleSubmit} className="space-y-4 order-1 md:order-2">
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

            <div className="space-y-3">
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

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="marketing"
                  checked={formData.acceptMarketing}
                  onCheckedChange={(checked) =>
                    setFormData(prev => ({ ...prev, acceptMarketing: checked as boolean }))
                  }
                />
                <label
                  htmlFor="marketing"
                  className="text-sm text-gray-600"
                >
                  Send me music promotion tips and updates
                </label>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Creating Account..." : "Create Account & Continue to Payment"}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
