import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PlatformIcon } from "@/components/PlatformIcon";
import { useToast } from "@/components/ui/use-toast";
import { EmailSubscriptionForm } from "@/components/EmailSubscriptionForm";
import { ShareButton } from "@/components/ShareButton";
import { useMetaPixel } from "@/hooks/useMetaPixel";

export default function SmartLink() {
  const { slug } = useParams();
  const { toast } = useToast();
  const { trackEvent } = useMetaPixel();
  const [showEmailForm, setShowEmailForm] = useState(false);

  const { data: smartLink, isLoading } = useQuery({
    queryKey: ["smartLink", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("smart_links")
        .select(
          `
          *,
          platform_links (
            id,
            platform_id,
            platform_name,
            url
          ),
          user:profiles (
            id,
            full_name,
            avatar_url
          )
        `
        )
        .eq("slug", slug)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const recordView = async () => {
    try {
      // Get IP address
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const { ip } = await ipResponse.json();

      // Get geolocation from our Edge Function
      const { data: geoData } = await supabase.functions.invoke('get-geolocation', {
        body: { ip },
      });

      // Record the view with country information
      const { error: viewError } = await supabase
        .from('link_views')
        .insert({
          smart_link_id: smartLink?.id,
          user_agent: navigator.userAgent,
          ip_address: ip,
          country: geoData?.country || 'Unknown'
        });

      if (viewError) throw viewError;
    } catch (error) {
      console.error('Error recording view:', error);
    }
  };

  const handlePlatformClick = async (platformId: string) => {
    try {
      const platformLink = smartLink?.platform_links?.find(
        (pl) => pl.platform_id === platformId
      );

      if (!platformLink) return;

      // Get IP address
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const { ip } = await ipResponse.json();

      // Get geolocation from our Edge Function
      const { data: geoData } = await supabase.functions.invoke('get-geolocation', {
        body: { ip },
      });

      // Record the click with country information
      const { error: clickError } = await supabase
        .from('platform_clicks')
        .insert({
          platform_link_id: platformLink.id,
          user_agent: navigator.userAgent,
          ip_address: ip,
          country: geoData?.country || 'Unknown'
        });

      if (clickError) throw clickError;

      trackEvent("Click Platform Link", {
        platform: platformLink.platform_name,
        smartLinkId: smartLink?.id,
      });

      window.open(platformLink.url, '_blank');
    } catch (error) {
      console.error('Error recording click:', error);
    }
  };

  useEffect(() => {
    if (smartLink?.id) {
      recordView();
    }
  }, [smartLink?.id]);

  if (isLoading) {
    return (
      <div className="container max-w-2xl mx-auto py-6 px-4">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-[300px] w-[300px] rounded-lg" />
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
          <div className="w-full space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!smartLink) {
    return (
      <div className="container max-w-2xl mx-auto py-6 px-4">
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-2xl font-bold">Link not found</h1>
          <p className="text-muted-foreground">
            The link you're looking for doesn't exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-6 px-4">
      <div className="flex flex-col items-center gap-4">
        <Card className="w-[300px] h-[300px] rounded-lg overflow-hidden">
          <img
            src={smartLink.artwork_url || "/placeholder-artwork.jpg"}
            alt={smartLink.title}
            className="w-full h-full object-cover"
          />
        </Card>

        <h1 className="text-2xl font-bold text-center">{smartLink.title}</h1>
        <p className="text-muted-foreground">{smartLink.artist_name}</p>

        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={smartLink.user?.avatar_url || undefined} />
            <AvatarFallback>
              {smartLink.user?.full_name?.[0] || "U"}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground">
            {smartLink.user?.full_name}
          </span>
        </div>

        <div className="w-full space-y-2">
          {smartLink.platform_links?.map((platform) => (
            <Button
              key={platform.platform_id}
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => handlePlatformClick(platform.platform_id)}
            >
              <PlatformIcon platform={platform.platform_id} className="h-5 w-5" />
              <span>Listen on {platform.platform_name}</span>
            </Button>
          ))}
        </div>

        <Separator />

        <div className="flex gap-2">
          <ShareButton
            title={smartLink.title}
            text={`Listen to ${smartLink.title} by ${smartLink.artist_name}`}
            url={window.location.href}
          />
          <Button
            variant="outline"
            onClick={() => setShowEmailForm((prev) => !prev)}
          >
            Subscribe
          </Button>
        </div>

        {showEmailForm && (
          <Card className="w-full p-4">
            <EmailSubscriptionForm smartLinkId={smartLink.id} />
          </Card>
        )}
      </div>
    </div>
  );
}