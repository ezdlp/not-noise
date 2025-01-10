import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";

const EditSmartLink = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: smartLink, isLoading } = useQuery({
    queryKey: ["smartLink", id],
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
          )
        `)
        .eq("id", id)
        .single();

      if (error) {
        toast.error("Failed to load smart link");
        throw error;
      }

      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="container py-8 space-y-8">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  if (!smartLink) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Smart Link Not Found</h1>
          <p className="text-muted-foreground mt-2">
            The smart link you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Button onClick={() => navigate("/dashboard")} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
      
      <div>
        <h1 className="text-2xl font-bold">Edit Smart Link</h1>
        <p className="text-muted-foreground">
          Update your smart link details and platform links
        </p>
      </div>

      {/* TODO: Add edit form components here */}
      <pre className="bg-slate-100 p-4 rounded-lg">
        {JSON.stringify(smartLink, null, 2)}
      </pre>
    </div>
  );
};

export default EditSmartLink;