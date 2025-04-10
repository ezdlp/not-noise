import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Promotion, UIPromotionStatus, dbToUiStatus, uiToDbStatus } from "@/types/database";

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
    const { data: promotionData, error } = await supabase
      .from("promotions")
      .select("*")
      .eq("id", promotionId)
      .eq("user_id", user.id)
      .single();

    if (error || !promotionData) {
      throw new Error("Could not find the promotion or you don't have permission to access it");
    }

    // Cast the returned data to our Promotion type
    const promotion = promotionData as Promotion;

    if (promotion.status !== 'payment_pending') {
      throw new Error("This promotion is not in a payment pending state");
    }

    // Check for duplicate payment_pending promotions for the same track
    const { data: duplicates, error: duplicateError } = await supabase
      .from("promotions")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "payment_pending")
      .eq("spotify_track_id", promotion.spotify_track_id)
      .neq("id", promotionId); // Exclude the current promotion
    
    if (duplicateError) {
      console.warn("Error checking for duplicates:", duplicateError);
    } else if (duplicates && duplicates.length > 0) {
      // Delete duplicate payment_pending promotions
      console.log(`Removing ${duplicates.length} duplicate pending promotions`);
      
      for (const duplicate of duplicates) {
        const { error: deleteError } = await supabase
          .from("promotions")
          .delete()
          .eq("id", duplicate.id);
        
        if (deleteError) {
          console.error(`Error deleting duplicate promotion ${duplicate.id}:`, deleteError);
        }
      }
    }

    // Use the package_tier from the database with a fallback to 'silver'
    const packageTier = promotion.package_tier || 'silver';

    // Create a checkout session to resume payment
    const { data, error: checkoutError } = await supabase.functions.invoke("create-checkout-session", {
      body: {
        packageId: packageTier, // Use the package_tier with fallback
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

/**
 * Updates the status of a promotion campaign.
 * Only admin users can update promotions they didn't create.
 * 
 * @param promotionId - The ID of the promotion to update
 * @param newStatus - The new UI status to set (will be converted to DB status)
 * @returns Promise<boolean> - Whether the update was successful
 */
export async function updatePromotionStatus(
  promotionId: string, 
  newStatus: UIPromotionStatus
): Promise<boolean> {
  try {
    // Convert UI status to DB status
    const dbStatus = uiToDbStatus(newStatus);

    const { error } = await supabase
      .from("promotions")
      .update({ status: dbStatus, updated_at: new Date().toISOString() })
      .eq("id", promotionId);
    
    if (error) {
      console.error("Error updating promotion status:", error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update the promotion status",
        variant: "destructive",
      });
      return false;
    }
    
    toast({
      title: "Status Updated",
      description: `Promotion has been marked as ${newStatus}`,
    });
    
    return true;
  } catch (error: any) {
    console.error("Error in updatePromotionStatus:", error);
    toast({
      title: "Update Failed",
      description: error.message || "An unexpected error occurred",
      variant: "destructive",
    });
    return false;
  }
}
