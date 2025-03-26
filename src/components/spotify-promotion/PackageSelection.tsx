import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { CheckIcon, MusicIcon, AlertCircleIcon, CheckCircleIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";

// Genre options for playlist targeting
const GENRE_OPTIONS = [
  "Pop", "Hip-Hop/Rap", "R&B", "Rock", "Electronic/Dance", 
  "Indie", "Alternative", "Country", "Latin", "Jazz", 
  "Folk/Singer-Songwriter", "Classical", "Metal", "Reggae", "Soul"
];

// Package tiers with their features and pricing
const PACKAGES = [
  {
    id: "starter",
    name: "Starter",
    price: 49,
    features: [
      "10-15 Playlist Submissions",
      "Estimated 2-5 Playlist Adds",
      "Reach: ~5,000 potential listeners",
      "Campaign Duration: 2 weeks",
      "Basic Performance Report"
    ],
    color: "bg-blue-50 text-blue-700 border-blue-200"
  },
  {
    id: "growth",
    name: "Growth",
    price: 99,
    features: [
      "25-30 Playlist Submissions",
      "Estimated 7-12 Playlist Adds",
      "Reach: ~20,000 potential listeners",
      "Campaign Duration: 3 weeks",
      "Detailed Performance Report",
      "Social Media Promotion"
    ],
    color: "bg-purple-50 text-purple-700 border-purple-200",
    recommended: true
  },
  {
    id: "pro",
    name: "Professional",
    price: 199,
    features: [
      "45-50 Playlist Submissions",
      "Estimated 15-25 Playlist Adds",
      "Reach: ~50,000 potential listeners",
      "Campaign Duration: 4 weeks",
      "Advanced Analytics Dashboard",
      "Personalized Curator Feedback",
      "Featured in Newsletter",
      "Priority Support"
    ],
    color: "bg-emerald-50 text-emerald-700 border-emerald-200"
  }
];

type SpotifyTrack = {
  id: string;
  name: string;
  artist: string;
  albumCover: string;
  releaseDate: string;
  previewUrl?: string;
};

type PackageSelectionProps = {
  track: SpotifyTrack;
  onComplete: () => void;
};

export function PackageSelection({ track, onComplete }: PackageSelectionProps) {
  const [selectedPackage, setSelectedPackage] = useState<string>("");
  const [selectedGenre, setSelectedGenre] = useState<string>("");
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const { toast } = useToast();

  // Get user subscription to determine if they get a discount
  const { data: userSubscription } = useQuery({
    queryKey: ["user-subscription"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("subscriptions")
        .select("tier")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  // Whether the user is on a Pro plan (gets 10% discount)
  const isProUser = userSubscription?.tier === "pro";

  // Get the selected package details
  const packageDetails = PACKAGES.find(pkg => pkg.id === selectedPackage);

  // Calculate price with discount if applicable
  const calculatePrice = (basePrice: number) => {
    if (isProUser) {
      const discountedPrice = basePrice * 0.9; // 10% discount
      return discountedPrice.toFixed(2);
    }
    return basePrice.toFixed(2);
  };

  // Handle package selection
  const handlePackageSelect = (packageId: string) => {
    setSelectedPackage(packageId);
    setErrorMessage("");
  };

  // Handle genre selection
  const handleGenreSelect = (genre: string) => {
    setSelectedGenre(genre);
    setErrorMessage("");
  };

  // Handle checkout process
  const handleCheckout = async () => {
    if (!selectedPackage) {
      setErrorMessage("Please select a promotion package");
      return;
    }

    if (!selectedGenre) {
      setErrorMessage("Please select a genre for targeting");
      return;
    }

    setIsCheckingOut(true);
    setPaymentStatus("processing");
    
    try {
      // Get the user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create a checkout session with Stripe
      const response = await fetch("/api/payments/create-promotion-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          packageId: selectedPackage,
          trackId: track.id,
          trackName: track.name,
          artistName: track.artist,
          genre: selectedGenre,
          basePrice: packageDetails?.price || 0,
          discountApplied: isProUser,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create checkout session");
      }

      const { checkoutUrl, promotionId } = await response.json();

      // Redirect to Stripe Checkout
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error("Checkout error:", error);
      setPaymentStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "An error occurred during checkout");
      toast({
        title: "Checkout Failed",
        description: "There was a problem initiating checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCheckingOut(false);
    }
  };

  // Handle success message after payment return
  const isSuccess = new URLSearchParams(window.location.search).get("success") === "true";
  if (isSuccess && paymentStatus === "idle") {
    setPaymentStatus("success");
  }

  return (
    <div className="space-y-6">
      {/* Track Information */}
      <div className="flex items-center space-x-4">
        {track.albumCover ? (
          <img 
            src={track.albumCover} 
            alt={`${track.name} cover`}
            className="h-14 w-14 rounded-md object-cover"
          />
        ) : (
          <div className="h-14 w-14 rounded-md bg-muted flex items-center justify-center">
            <MusicIcon className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
        <div>
          <h3 className="font-medium">{track.name}</h3>
          <p className="text-sm text-muted-foreground">{track.artist}</p>
        </div>
      </div>

      <Separator />

      {/* Package Selection */}
      {paymentStatus === "success" ? (
        <div className="text-center py-6 space-y-4">
          <div className="rounded-full bg-green-100 p-3 w-12 h-12 flex items-center justify-center mx-auto">
            <CheckCircleIcon className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-lg font-medium">Promotion Campaign Created</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Your promotion campaign has been successfully created. We'll start pitching your track to playlist curators right away.
          </p>
          <Button onClick={onComplete} className="mt-4">
            View My Campaigns
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Select a Genre</h3>
              <Select onValueChange={handleGenreSelect} value={selectedGenre}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select genre for playlist targeting" />
                </SelectTrigger>
                <SelectContent>
                  {GENRE_OPTIONS.map((genre) => (
                    <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Helps us target the right playlists for your music
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {PACKAGES.map((pkg) => (
                <Card 
                  key={pkg.id}
                  className={`border-2 cursor-pointer transition-all hover:shadow-md ${
                    selectedPackage === pkg.id 
                      ? "border-primary ring-2 ring-primary ring-opacity-50" 
                      : "border-muted"
                  }`}
                  onClick={() => handlePackageSelect(pkg.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{pkg.name}</CardTitle>
                      {pkg.recommended && (
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                          Recommended
                        </Badge>
                      )}
                    </div>
                    <CardDescription>
                      ${isProUser 
                        ? <span><s>{pkg.price}</s> {calculatePrice(pkg.price)}</span> 
                        : pkg.price}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ul className="space-y-2 text-sm">
                      {pkg.features.map((feature, i) => (
                        <li key={i} className="flex items-start">
                          <CheckIcon className="h-4 w-4 text-primary shrink-0 mr-2 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      variant={selectedPackage === pkg.id ? "default" : "outline"}
                      className="w-full"
                      onClick={() => handlePackageSelect(pkg.id)}
                    >
                      {selectedPackage === pkg.id ? "Selected" : "Select"}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>

          {errorMessage && (
            <Alert variant="destructive">
              <AlertCircleIcon className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          {isProUser && selectedPackage && (
            <Alert className="bg-primary/10 border-primary/30">
              <CheckCircleIcon className="h-4 w-4 text-primary" />
              <AlertTitle>Pro Discount Applied</AlertTitle>
              <AlertDescription>
                As a Pro user, you're receiving 10% off this promotion package!
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end">
            <Button 
              onClick={handleCheckout}
              disabled={!selectedPackage || !selectedGenre || isCheckingOut}
              className="min-w-[120px]"
            >
              {isCheckingOut ? "Processing..." : "Checkout"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
} 