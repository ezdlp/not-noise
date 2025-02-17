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
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { usePlatformState } from "@/components/create-smart-link/hooks/usePlatformState";
import PlatformsSection from "@/components/create-smart-link/PlatformsSection";
import { arrayMove } from '@dnd-kit/sortable';
import { UpgradeModal } from "@/components/subscription/UpgradeModal";
import { Textarea } from "@/components/ui/textarea";
import { ArtworkUploader } from "@/components/smart-link/ArtworkUploader";

const EditSmartLink = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isFeatureEnabled } = useFeatureAccess();
  const canReorderPlatforms = isFeatureEnabled('platform_reordering');
  
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [artistName, setArtistName] = useState("");
  const [artworkUrl, setArtworkUrl] = useState("");
  const [slug, setSlug] = useState("");
  const [emailCaptureEnabled, setEmailCaptureEnabled] = useState(false);
  const [emailCaptureTitle, setEmailCaptureTitle] = useState("");
  const [emailCaptureDescription, setEmailCaptureDescription] = useState("");
  const [metaPixelEnabled, setMetaPixelEnabled] = useState(false);
  const [metaPixelId, setMetaPixelId] = useState("");
  const [metaViewEvent, setMetaViewEvent] = useState("");
  const [metaClickEvent, setMetaClickEvent] = useState("");

  const {
    platforms,
    setPlatforms,
    additionalPlatforms,
    togglePlatform,
    updateUrl,
    isPro,
  } = usePlatformState("");

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
          )
        `)
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      if (!smartLink) throw new Error("Smart link not found");

      setTitle(smartLink.title);
      setDescription(smartLink.description || "");
      setArtistName(smartLink.artist_name);
      setArtworkUrl(smartLink.artwork_url || "");
      setSlug(smartLink.slug || "");
      setEmailCaptureEnabled(smartLink.email_capture_enabled || false);
      setEmailCaptureTitle(smartLink.email_capture_title || "");
      setEmailCaptureDescription(smartLink.email_capture_description || "");
      setMetaPixelEnabled(!!smartLink.meta_pixel_id);
      setMetaPixelId(smartLink.meta_pixel_id || "");
      setMetaViewEvent(smartLink.meta_view_event || "");
      setMetaClickEvent(smartLink.meta_click_event || "");

      setPlatforms(prevPlatforms => 
        prevPlatforms.map(platform => {
          const matchingLink = smartLink.platform_links?.find(
            pl => pl.platform_id === platform.id
          );
          return {
            ...platform,
            enabled: !!matchingLink,
            url: matchingLink?.url || ""
          };
        })
      );

      return smartLink;
    },
  });

  const handleDragEnd = (event: any) => {
    if (!canReorderPlatforms) {
      setShowUpgradeModal(true);
      return;
    }

    const { active, over } = event;
    if (active.id !== over.id) {
      setPlatforms((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handlePlatformToggle = (platformId: string) => {
    if (platformId === "upgrade") {
      setShowUpgradeModal(true);
      return;
    }
    togglePlatform(platformId);
  };

  const handleSave = async () => {
    try {
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

      const { error: smartLinkError } = await supabase
        .from("smart_links")
        .update({
          title,
          description,
          artist_name: artistName,
          slug,
          email_capture_enabled: emailCaptureEnabled,
          email_capture_title: emailCaptureTitle,
          email_capture_description: emailCaptureDescription,
          meta_pixel_id: metaPixelEnabled ? metaPixelId : null,
          meta_view_event: metaPixelEnabled ? metaViewEvent : null,
          meta_click_event: metaPixelEnabled ? metaClickEvent : null,
        })
        .eq("id", id);

      if (smartLinkError) throw smartLinkError;

      const { error: deleteError } = await supabase
        .from("platform_links")
        .delete()
        .eq("smart_link_id", id);

      if (deleteError) throw deleteError;

      const platformLinksToInsert = platforms
        .filter(platform => platform.enabled)
        .map(platform => ({
          smart_link_id: id,
          platform_id: platform.id,
          platform_name: platform.name,
          url: platform.url,
        }));

      const { error: platformLinksError } = await supabase
        .from("platform_links")
        .insert(platformLinksToInsert);

      if (platformLinksError) throw platformLinksError;

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
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <ArtworkUploader
                currentArtwork={artworkUrl}
                onArtworkChange={setArtworkUrl}
                smartLinkId={smartLink.id}
              />
              <div className="space-y-4 flex-1">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="font-semibold text-lg"
                    placeholder="Enter title..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Artist Name</Label>
                  <Input
                    value={artistName}
                    onChange={(e) => setArtistName(e.target.value)}
                    placeholder="Enter artist name..."
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">soundraiser.io/link/</span>
                  <Input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="custom-url-slug"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter a description for your release..."
                className="resize-none"
              />
            </div>
          </Card>

          <div className="space-y-4">
            <PlatformsSection
              title="Standard Platforms"
              platforms={platforms}
              onToggle={handlePlatformToggle}
              onUrlChange={updateUrl}
              onDragEnd={handleDragEnd}
              isDraggable={canReorderPlatforms}
            />

            <PlatformsSection
              title="Additional Platforms"
              description={!isPro ? "Premium platforms to expand your reach" : undefined}
              platforms={additionalPlatforms}
              onToggle={handlePlatformToggle}
              onUrlChange={updateUrl}
              isDraggable={false}
              isBlurred={!isPro}
            />
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Meta Pixel</h2>
            <div className="flex items-center space-x-2">
              <Switch
                id="meta-pixel"
                checked={metaPixelEnabled}
                onCheckedChange={setMetaPixelEnabled}
              />
              <Label htmlFor="meta-pixel">Enable Meta Pixel tracking</Label>
            </div>
            {metaPixelEnabled && (
              <div className="space-y-4 pl-6">
                <div className="space-y-2">
                  <Label>Meta Pixel ID</Label>
                  <Input
                    value={metaPixelId}
                    onChange={(e) => setMetaPixelId(e.target.value)}
                    placeholder="Enter Meta Pixel ID..."
                  />
                </div>
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
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Email Capture</h2>
            <div className="flex items-center space-x-2">
              <Switch
                id="email-capture"
                checked={emailCaptureEnabled}
                onCheckedChange={setEmailCaptureEnabled}
                disabled={!isFeatureEnabled('email_capture')}
              />
              <Label htmlFor="email-capture">Enable email capture form</Label>
            </div>
            {emailCaptureEnabled && isFeatureEnabled('email_capture') && (
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
            {!isFeatureEnabled('email_capture') && (
              <div className="rounded-lg border border-dashed p-6 text-center">
                <h3 className="font-semibold mb-1">Premium Feature</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Upgrade to collect emails from your fans
                </p>
                <Button variant="outline" onClick={() => setShowUpgradeModal(true)}>
                  Upgrade to Pro
                </Button>
              </div>
            )}
          </div>

          <div className="flex justify-between pt-6">
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        </div>
      </Card>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        feature="access all music platforms"
        description="Upgrade to Pro to add more music platforms and customize their order!"
      />
    </div>
  );
};

export default EditSmartLink;
