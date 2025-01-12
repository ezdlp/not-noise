import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useState } from "react";
import PlatformItem from "@/components/create-smart-link/PlatformItem";

const getPlatformIcon = (platformId: string) => {
  const icons: { [key: string]: string } = {
    spotify: "/lovable-uploads/spotify.png",
    apple: "/lovable-uploads/applemusic.png",
    amazon: "/lovable-uploads/amazonmusic.png",
    youtube_music: "/lovable-uploads/youtubemusic.png",
    deezer: "/lovable-uploads/deezer.png",
    soundcloud: "/lovable-uploads/soundcloud.png",
    youtube: "/lovable-uploads/youtube.png",
    itunes: "/lovable-uploads/itunes.png",
    tidal: "/lovable-uploads/tidal.png",
    anghami: "/lovable-uploads/anghami.png",
    napster: "/lovable-uploads/napster.png",
    boomplay: "/lovable-uploads/boomplay.png",
    yandex: "/lovable-uploads/yandex.png",
    beatport: "/lovable-uploads/beatport.png",
    bandcamp: "/lovable-uploads/bandcamp.png",
    audius: "/lovable-uploads/audius.png",
  };
  return icons[platformId] || "/placeholder.svg";
};

const EditSmartLink = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [emailCaptureEnabled, setEmailCaptureEnabled] = useState(false);
  const [emailCaptureTitle, setEmailCaptureTitle] = useState("");
  const [emailCaptureDescription, setEmailCaptureDescription] = useState("");
  const [metaPixelId, setMetaPixelId] = useState("");
  const [metaViewEvent, setMetaViewEvent] = useState("");
  const [metaClickEvent, setMetaClickEvent] = useState("");

  const { data: smartLink, isLoading } = useQuery({
    queryKey: ["smartLink", id],
    queryFn: async () => {
      const { data: smartLink, error } = await supabase
        .from("smart_links")
        .select(`
          *,
          platform_links (
            id,
            platform_id,
            platform_name,
            url
          ),
          profiles (
            artist_name
          )
        `)
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      if (!smartLink) throw new Error("Smart link not found");

      // Initialize form state
      setTitle(smartLink.title);
      setSlug(smartLink.slug || "");
      setEmailCaptureEnabled(smartLink.email_capture_enabled || false);
      setEmailCaptureTitle(smartLink.email_capture_title || "");
      setEmailCaptureDescription(smartLink.email_capture_description || "");
      setMetaPixelId(smartLink.meta_pixel_id || "");
      setMetaViewEvent(smartLink.meta_view_event || "");
      setMetaClickEvent(smartLink.meta_click_event || "");

      return smartLink;
    },
  });

  const handleSave = async () => {
    try {
      // Check if slug exists (excluding current smart link)
      const { data: existingSlug } = await supabase
        .from("smart_links")
        .select("id")
        .eq("slug", slug)
        .neq("id", id)
        .maybeSingle();

      if (existingSlug) {
        toast.error("This URL slug is already taken. Please choose another one.");
        return;
      }

      const { error } = await supabase
        .from("smart_links")
        .update({
          title,
          slug,
          email_capture_enabled: emailCaptureEnabled,
          email_capture_title: emailCaptureTitle,
          email_capture_description: emailCaptureDescription,
          meta_pixel_id: metaPixelId,
          meta_view_event: metaViewEvent,
          meta_click_event: metaClickEvent,
        })
        .eq("id", id);

      if (error) throw error;

      toast.success("Smart link updated successfully!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error updating smart link:", error);
      toast.error("Failed to update smart link");
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-2xl mx-auto p-6">
          <div className="space-y-4">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-[400px] w-full" />
          </div>
        </Card>
      </div>
    );
  }

  if (!smartLink) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-2xl mx-auto p-6">
          <p className="text-center text-muted-foreground">Smart link not found</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Edit Smart Link</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Update your smart link settings
          </p>
        </div>

        <div className="space-y-6">
          {/* Preview Card */}
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <img
                src={smartLink.artwork_url}
                alt={`${smartLink.title} artwork`}
                className="w-24 h-24 object-cover rounded-lg"
              />
              <div className="space-y-4 flex-1">
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="font-semibold text-lg"
                  placeholder="Enter title..."
                />
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">xnoi.se/</span>
                  <Input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder={slug || "custom-url-slug"}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Platform Links */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Platform Links</h2>
            <div className="space-y-2">
              {smartLink.platform_links.map((platform: any) => (
                <PlatformItem
                  key={platform.id}
                  platform={{
                    id: platform.platform_id,
                    name: platform.platform_name,
                    enabled: true,
                    url: platform.url,
                    icon: getPlatformIcon(platform.platform_id),
                  }}
                  onToggle={() => {}}
                  onUrlChange={(id, url) => updatePlatformUrl(id, url)}
                  isDraggable={false}
                />
              ))}
            </div>
          </div>

          {/* Additional Platforms */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Additional Services</h2>
            <div className="space-y-2">
              {additionalPlatforms.map((platform) => (
                <PlatformItem
                  key={platform.id}
                  platform={platform}
                  onToggle={togglePlatform}
                  onUrlChange={() => {}}
                  isDraggable={false}
                />
              ))}
            </div>
          </div>

          {/* Email Capture Settings */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Email Capture</h2>
            <div className="flex items-center space-x-2">
              <Switch
                id="email-capture"
                checked={emailCaptureEnabled}
                onCheckedChange={setEmailCaptureEnabled}
              />
              <Label htmlFor="email-capture">Enable email capture form</Label>
            </div>
            {emailCaptureEnabled && (
              <div className="space-y-4 pl-6">
                <div className="space-y-2">
                  <Label>Form Title</Label>
                  <Input
                    value={emailCaptureTitle}
                    onChange={(e) => setEmailCaptureTitle(e.target.value)}
                    placeholder="Enter form title..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={emailCaptureDescription}
                    onChange={(e) => setEmailCaptureDescription(e.target.value)}
                    placeholder="Enter form description..."
                  />
                </div>
              </div>
            )}
          </div>

          {/* Meta Pixel Settings */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Meta Pixel</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Meta Pixel ID</Label>
                <Input
                  value={metaPixelId}
                  onChange={(e) => setMetaPixelId(e.target.value)}
                  placeholder="Enter Meta Pixel ID..."
                />
              </div>
              {metaPixelId && (
                <>
                  <div className="space-y-2">
                    <Label>View Event Name</Label>
                    <Input
                      value={metaViewEvent}
                      onChange={(e) => setMetaViewEvent(e.target.value)}
                      placeholder="e.g., SmartLinkView"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Click Event Name</Label>
                    <Input
                      value={metaClickEvent}
                      onChange={(e) => setMetaClickEvent(e.target.value)}
                      placeholder="e.g., SmartLinkClick"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex justify-between pt-6">
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default EditSmartLink;
