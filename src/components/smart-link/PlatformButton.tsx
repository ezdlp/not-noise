
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
      className="w-full flex items-center justify-between px-6 py-4 hover:bg-black/5 transition-colors"
    >
      <div className="flex items-center gap-4">
        {iconUrl && (
          <img 
            src={iconUrl} 
            alt={platformName} 
            className="w-5 h-5 object-contain"
          />
        )}
        <span className="text-sm font-medium">{platformName}</span>
      </div>
      <div className="bg-black text-white px-6 py-2 rounded-full">
        <span className="text-sm font-medium">{actionText}</span>
      </div>
    </button>
  );
};
