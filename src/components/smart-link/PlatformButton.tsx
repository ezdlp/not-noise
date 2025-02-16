
import React from 'react';
import { analyticsService } from '@/services/analyticsService';

interface PlatformButtonProps {
  platformId: string;
  platformName: string;
  url: string;
  iconUrl?: string;
  onClick?: () => Promise<void>;
  actionText?: string;
}

export const PlatformButton: React.FC<PlatformButtonProps> = ({ 
  platformId, 
  platformName, 
  url, 
  iconUrl,
  onClick,
  actionText = 'Play'
}) => {
  const handleClick = async () => {
    if (onClick) {
      await onClick();
    } else {
      try {
        await analyticsService.trackPlatformClick(platformId);
        window.open(url, '_blank');
      } catch (error) {
        console.error('Error tracking platform click:', error);
        window.open(url, '_blank');
      }
    }
  };

  return (
    <button
      onClick={handleClick}
      className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-neutral-border hover:bg-neutral-seasalt transition-colors duration-200"
    >
      <div className="flex items-center gap-2">
        {iconUrl && (
          <img 
            src={iconUrl} 
            alt={platformName} 
            className="w-5 h-5 object-contain"
          />
        )}
        <span className="text-sm font-medium">{platformName}</span>
      </div>
      <span className="text-sm font-medium">{actionText}</span>
    </button>
  );
};
