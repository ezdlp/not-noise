import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PlusIcon, Link2Icon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SmartLinksList } from "@/components/dashboard/SmartLinksList";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { EmailSubscribersList } from "@/components/dashboard/EmailSubscribersList";
import { toast } from "sonner";

export default function Dashboard() {
  const navigate = useNavigate();

  const { data: smartLinks, isLoading } = useQuery({
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
    <div className="container py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-heading">Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your smart links and track their performance
          </p>
        </div>
        <Button 
          onClick={() => navigate("/create")} 
          className="gap-2 bg-primary hover:bg-primary-hover transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          Create Smart Link
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <DashboardStats data={smartLinks} />
      </div>

      <Card className="p-6 transition-all duration-200 hover:shadow-lg hover:shadow-primary/10">
        <div className="flex items-center gap-2 mb-6">
          <Link2Icon className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold font-heading">Your Smart Links</h2>
        </div>
        <SmartLinksList links={smartLinks} isLoading={isLoading} />
      </Card>

      <Card className="p-6 transition-all duration-200 hover:shadow-lg hover:shadow-primary/10">
        <EmailSubscribersList />
      </Card>
    </div>
  );
}