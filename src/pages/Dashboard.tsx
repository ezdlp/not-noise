import { useQuery } from "@tanstack/react-query";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { SmartLinksList } from "@/components/dashboard/SmartLinksList";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Dashboard() {
  const { data: links, isLoading } = useQuery({
    queryKey: ["smartLinks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("smart_links")
        .select(`
          *,
          platform_links (
            id,
            platform_id,
            platform_name,
            url
          ),
          link_views (
            id,
            viewed_at
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        toast.error("Failed to load smart links");
        throw error;
      }

      return data;
    },
  });

  return (
    <div className="container mx-auto py-8 px-4">
      <DashboardStats />
      <div className="mt-8">
        <SmartLinksList links={links} isLoading={isLoading} />
      </div>
    </div>
  );
}