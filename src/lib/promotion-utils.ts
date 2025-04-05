
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

/**
 * Resumes the payment flow for a promotion campaign that was previously created
 * but not completed. This will redirect the user to the Stripe checkout page.
 * 
 * @param promotionId - The ID of the promotion to resume payment for
 */
export async function resumePaymentFlow(promotionId: string): Promise<void> {
  try {
    // Get the user session
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Get the promotion details
    const { data: promotion, error } = await supabase
      .from("promotions")
      .select("*")
      .eq("id", promotionId)
      .eq("user_id", user.id)
      .single();

    if (error || !promotion) {
      throw new Error("Could not find the promotion or you don't have permission to access it");
    }

    if (promotion.status !== "pending") {
      throw new Error("This promotion is not in a payment pending state");
    }

    // Create a checkout session to resume payment
    const { data, error: checkoutError } = await supabase.functions.invoke("create-checkout-session", {
      body: {
        packageId: promotion.package_tier || "silver",
        trackId: promotion.spotify_track_id,
        trackName: promotion.track_name,
        artistName: promotion.track_artist,
        genre: promotion.genre,
        basePrice: promotion.total_cost,
        artistId: promotion.spotify_artist_id,
        promotionId: promotion.id,
        isResumingPayment: true
      }
    });

    if (checkoutError || !data?.checkoutUrl) {
      console.error("Checkout error:", checkoutError);
      throw new Error("Failed to create checkout session");
    }

    // Redirect to Stripe checkout
    window.location.href = data.checkoutUrl;
  } catch (error: any) {
    console.error("Error resuming payment:", error);
    toast({
      title: "Payment Error",
      description: error.message || "An error occurred while trying to process your payment",
      variant: "destructive",
    });
    throw error;
  }
}
