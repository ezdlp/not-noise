import React from 'react';
import { Button } from "@/components/ui/button";
import { analytics } from '@/services/analytics';

interface PlatformButtonProps {
  platformId: string;
  platformName: string;
  actionText: string;
  url: string;
  iconUrl: string;
  onClick?: () => Promise<void>;
}

const PlatformButton = ({ platformId, platformName, actionText, url, iconUrl, onClick }: PlatformButtonProps) => {
  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    console.log('Platform button clicked:', { platformName, url });
    
    try {
      const startTime = performance.now();
      // Track the click event before executing the custom handler
      const smartLinkId = new URL(url).pathname.split('/').pop() || 'unknown';
      analytics.trackPlatformClick(platformName, smartLinkId);
      
      if (onClick) {
        console.log('Executing click handler for platform:', platformName);
        await onClick();
        console.log('Click handler completed for platform:', platformName);
        
        // Track successful interaction time
        const duration = performance.now() - startTime;
        analytics.trackFeatureEngagement(`platform_${platformId}`, duration, {
          success: true
        });
      }
      
      console.log('Opening URL for platform:', platformName);
      window.location.href = url;
    } catch (error) {
      console.error('Error in platform button click handler:', error);
      analytics.trackFeatureEngagement(`platform_${platformId}`, 0, {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      // Only navigate if explicitly requested, even if tracking fails
      window.location.href = url;
    }
  };

  return (
    <div className="flex items-center justify-between p-3 border-b last:border-b-0">
      <div className="flex items-center gap-3">
        <img 
          src={iconUrl} 
          alt={`${platformName} logo`}
          className="w-8 h-8 object-contain"
          onError={(e) => {
            e.currentTarget.src = '/lovable-uploads/music.png';
          }}
        />
        <span className="font-medium text-gray-900">{platformName}</span>
      </div>
      <Button
        variant="default"
        className="bg-black hover:bg-black/90 text-white min-w-[100px]"
        onClick={handleClick}
      >
        {actionText}
      </Button>
    </div>
  );
};

export default PlatformButton;
