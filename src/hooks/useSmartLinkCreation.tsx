
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { analytics } from "@/services/analytics";

export function useSmartLinkCreation() {
  const navigate = useNavigate();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const handleCreateClick = async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      toast.error("Please log in to create a smart link");
      analytics.trackEvent({
        action: 'smart_link_create_attempt',
        category: 'Smart Link',
        label: 'unauthenticated'
      });
      return;
    }

    try {
      const { data: canCreate, error } = await supabase
        .rpc('check_smart_link_limit', { user_id: user.user.id });

      if (error) throw error;

      if (!canCreate) {
        setShowUpgradeModal(true);
        analytics.trackProFeatureAttempt('create_smart_link', false);
        return;
      }

      analytics.trackFeatureUsage('create_smart_link', true);
      navigate("/create");
    } catch (error) {
      console.error("Error checking smart link limit:", error);
      toast.error("Failed to check link limit");
      analytics.trackFeatureUsage('create_smart_link', false, {
        error: 'limit_check_failed'
      });
    }
  };

  return {
    handleCreateClick,
    showUpgradeModal,
    setShowUpgradeModal
  };
}
