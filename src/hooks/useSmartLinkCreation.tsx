
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useSmartLinkCreation() {
  const navigate = useNavigate();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const handleCreateClick = async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      toast.error("Please log in to create a smart link");
      return;
    }

    try {
      const { data: canCreate, error } = await supabase
        .rpc('check_smart_link_limit', { user_id: user.user.id });

      if (error) throw error;

      if (!canCreate) {
        setShowUpgradeModal(true);
        return;
      }

      navigate("/create");
    } catch (error) {
      console.error("Error checking smart link limit:", error);
      toast.error("Failed to check link limit");
    }
  };

  return {
    handleCreateClick,
    showUpgradeModal,
    setShowUpgradeModal
  };
}
