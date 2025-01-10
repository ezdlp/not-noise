import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import PlatformsSection from "@/components/create-smart-link/PlatformsSection";
import { useState } from "react";

const EditSmartLink = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [emailCaptureEnabled, setEmailCaptureEnabled] = useState(false);
  const [emailCaptureTitle, setEmailCaptureTitle] = useState("");
  const [emailCaptureDescription, setEmailCaptureDescription] = useState("");
  const [platforms, setPlatforms] = useState<any[]>([]);

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

      // Initialize form state with fetched data
      setTitle(data.title);
      setEmailCaptureEnabled(data.email_capture_enabled || false);
      setEmailCaptureTitle(data.email_capture_title || "");
      setEmailCaptureDescription(data.email_capture_description || "");
      
      // Transform platform links into the format expected by PlatformsSection
      const transformedPlatforms = data.platform_links.map((link: any) => ({
        id: link.platform_id,
        name: link.platform_name,
        enabled: true,
        url: link.url,
        icon: `/lovable-uploads/${link.platform_id}.png`,
      }));
      setPlatforms(transformedPlatforms);

      return data;
    },
  });

  const handleSave = async () => {
    try {
      // Update smart link details
      const { error: updateError } = await supabase
        .from("smart_links")
        .update({
          title,
          email_capture_enabled: emailCaptureEnabled,
          email_capture_title: emailCaptureTitle,
          email_capture_description: emailCaptureDescription,
        })
        .eq("id", id);

      if (updateError) throw updateError;

      // Update platform links
      const enabledPlatforms = platforms.filter(p => p.enabled);
      
      for (const platform of enabledPlatforms) {
        const { error: platformError } = await supabase
          .from("platform_links")
          .upsert({
            smart_link_id: id,
            platform_id: platform.id,
            platform_name: platform.name,
            url: platform.url,
          }, {
            onConflict: 'smart_link_id,platform_id'
          });

        if (platformError) throw platformError;
      }

      toast.success("Smart link updated successfully!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error updating smart link:", error);
      toast.error("Failed to update smart link");
    }
  };

  const togglePlatform = (platformId: string) => {
    setPlatforms(prev =>
      prev.map(p =>
        p.id === platformId ? { ...p, enabled: !p.enabled } : p
      )
    );
  };

  const updatePlatformUrl = (platformId: string, url: string) => {
    setPlatforms(prev =>
      prev.map(p =>
        p.id === platformId ? { ...p, url } : p
      )
    );
  };

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

      <Card className="p-6 space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter title..."
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              checked={emailCaptureEnabled}
              onCheckedChange={setEmailCaptureEnabled}
            />
            <Label>Enable email capture form</Label>
          </div>

          {emailCaptureEnabled && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Form Title</Label>
                <Input
                  value={emailCaptureTitle}
                  onChange={(e) => setEmailCaptureTitle(e.target.value)}
                  placeholder="Enter form title..."
                />
              </div>
              <div className="space-y-2">
                <Label>Form Description</Label>
                <Input
                  value={emailCaptureDescription}
                  onChange={(e) => setEmailCaptureDescription(e.target.value)}
                  placeholder="Enter form description..."
                />
              </div>
            </div>
          )}
        </div>

        <PlatformsSection
          title="Platform Links"
          platforms={platforms}
          onToggle={togglePlatform}
          onUrlChange={updatePlatformUrl}
        />

        <div className="flex justify-end">
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </Card>
    </div>
  );
};

export default EditSmartLink;