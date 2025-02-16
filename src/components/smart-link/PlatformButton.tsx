
import React from 'react';
import { analyticsService } from '@/services/analyticsService';

interface PlatformButtonProps {
  platformId: string;
  platformName: string;
  url: string;
  className?: string;
  iconUrl?: string;
}

export const PlatformButton: React.FC<PlatformButtonProps> = ({ 
  platformId, 
  platformName, 
  url, 
  className = '',
  iconUrl
}) => {
  const handleClick = async () => {
    try {
      // Track the click before redirecting
      await analyticsService.trackPlatformClick(platformId);
      // Open the platform URL in a new tab
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error tracking platform click:', error);
      // Still open the URL even if tracking fails
      window.open(url, '_blank');
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-neutral-border hover:bg-neutral-seasalt transition-colors duration-200 ${className}`}
    >
      {iconUrl && (
        <img 
          src={iconUrl} 
          alt={platformName} 
          className="w-5 h-5 object-contain"
        />
      )}
      <span className="text-sm font-medium">{platformName}</span>
    </button>
  );
};
