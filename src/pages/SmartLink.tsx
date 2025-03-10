
import React from "react";
import { SmartLinkSEO } from "@/components/seo/SmartLinkSEO";
import SmartLinkHeader from "@/components/smart-link/SmartLinkHeader";
import SmartLinkLoader from "@/components/smart-link/SmartLinkLoader";
import SmartLinkError from "@/components/smart-link/SmartLinkError";
import SmartLinkContainer from "@/components/smart-link/SmartLinkContainer";
import PlatformButtonList from "@/components/smart-link/PlatformButtonList";
import EmailSubscribeForm from "@/components/smart-link/EmailSubscribeForm";
import { useSmartLink } from "@/hooks/useSmartLink";
import { useSmartLinkTracking } from "@/hooks/useSmartLinkTracking";
import { useMetaPixel } from "@/hooks/useMetaPixel";

export default function SmartLink() {
  // Use custom hooks to fetch and manage data
  const { smartLink, isLoading, error, slug } = useSmartLink();
  const { handlePlatformClick } = useSmartLinkTracking(slug, smartLink?.id);
  
  // Initialize Meta Pixel if available
  useMetaPixel(smartLink?.meta_pixel_id, smartLink?.meta_view_event);

  // Show loading state
  if (isLoading) {
    console.log("Smart link is loading...");
    return <SmartLinkLoader />;
  }

  // Show error state
  if (error || !smartLink) {
    console.error("Smart link error or not found:", error);
    return <SmartLinkError />;
  }

  // Prepare streaming platforms data for SEO
  const streamingPlatforms = smartLink.platform_links?.map(pl => ({
    name: pl.platform_name,
    url: pl.url
  })) || [];

  // Handle platform click with smart link context
  const onPlatformClick = (platformLinkId: string) => {
    return handlePlatformClick(platformLinkId, smartLink);
  };

  return (
    <SmartLinkContainer 
      artworkUrl={smartLink.artwork_url}
      hideBranding={smartLink.profiles?.hide_branding}
    >
      <SmartLinkSEO
        title={smartLink.title}
        artistName={smartLink.artist_name}
        artworkUrl={smartLink.artwork_url}
        description={smartLink.description}
        releaseDate={smartLink.release_date}
        streamingPlatforms={streamingPlatforms}
      />
      
      <SmartLinkHeader
        title={smartLink.title}
        artistName={smartLink.artist_name}
        artworkUrl={smartLink.artwork_url}
        description={smartLink.description}
        contentType={smartLink.content_type}
      />
      
      <PlatformButtonList 
        platformLinks={smartLink.platform_links}
        onPlatformClick={onPlatformClick}
      />

      {smartLink.email_capture_enabled && (
        <EmailSubscribeForm
          smartLinkId={smartLink.id}
          title={smartLink.email_capture_title}
          description={smartLink.email_capture_description}
        />
      )}
    </SmartLinkContainer>
  );
}
