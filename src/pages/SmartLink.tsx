
import React, { useEffect } from "react";
import SmartLinkContainer from "@/components/smart-link/SmartLinkContainer";
import PlatformButtonList from "@/components/smart-link/PlatformButtonList";
import SmartLinkLoader from "@/components/smart-link/SmartLinkLoader";
import SmartLinkError from "@/components/smart-link/SmartLinkError";
import { useSmartLink } from "@/hooks/useSmartLink";
import { useSmartLinkTracking } from "@/features/smart-links/hooks/useSmartLinkTracking";

const SmartLink = () => {
  const { smartLink, isLoading, error } = useSmartLink();
  const { trackPlatformClick } = useSmartLinkTracking(smartLink);
  
  // Set the page title based on the smart link data
  useEffect(() => {
    if (smartLink) {
      document.title = `${smartLink.title} by ${smartLink.artist} | Soundraiser`;
    }
  }, [smartLink]);

  // Handle platform button clicks
  const handlePlatformClick = async (platformLinkId: string) => {
    try {
      await trackPlatformClick(platformLinkId);
    } catch (error) {
      console.error("Error tracking platform click:", error);
    }
  };

  // Show loading state
  if (isLoading) {
    return <SmartLinkLoader />;
  }

  // Show error state if link not found or other error
  if (error || !smartLink) {
    return <SmartLinkError />;
  }

  return (
    <SmartLinkContainer 
      artworkUrl={smartLink.artwork_url} 
      hideBranding={smartLink.profiles?.hide_branding}
    >
      <div className="space-y-6">
        {/* Artist and title information */}
        <div className="text-center space-y-2">
          <h2 className="text-xl font-medium text-gray-700">{smartLink.artist}</h2>
          <h1 className="text-3xl font-bold text-gray-900">{smartLink.title}</h1>
        </div>
        
        {/* Album artwork */}
        <div className="flex justify-center">
          <img 
            src={smartLink.artwork_url} 
            alt={`${smartLink.title} by ${smartLink.artist}`}
            className="w-full max-w-[300px] h-auto rounded-xl shadow-md"
          />
        </div>
        
        {/* Platform links */}
        <PlatformButtonList 
          platformLinks={smartLink.platform_links || []}
          onPlatformClick={handlePlatformClick}
        />
      </div>
    </SmartLinkContainer>
  );
};

export default SmartLink;
