
import React from 'react';
import { Button } from "@/components/ui/button";
import { analytics } from '@/services/analytics';

interface PlatformButtonProps {
  name: string;
  icon: string;
  action: string;
  url: string;
  onClick?: () => Promise<void>;
}

const PlatformButton = ({ name, icon, action, url, onClick }: PlatformButtonProps) => {
  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    console.log('Platform button clicked:', { name, url });
    
    try {
      // Track the click event before executing the custom handler
      const smartLinkId = new URL(url).pathname.split('/').pop() || 'unknown';
      analytics.trackPlatformClick(name, smartLinkId);
      
      if (onClick) {
        console.log('Executing click handler for platform:', name);
        await onClick();
        console.log('Click handler completed for platform:', name);
      }
      
      console.log('Opening URL for platform:', name);
      window.location.href = url;
    } catch (error) {
      console.error('Error in platform button click handler:', error);
      // Only navigate if explicitly requested, even if tracking fails
      window.location.href = url;
    }
  };

  return (
    <div className="flex items-center justify-between p-3 border-b last:border-b-0">
      <div className="flex items-center gap-3">
        <img 
          src={icon} 
          alt={`${name} logo`}
          className="w-8 h-8 object-contain"
        />
        <span className="font-medium text-gray-900">{name}</span>
      </div>
      <Button
        variant="default"
        className="bg-black hover:bg-black/90 text-white min-w-[100px]"
        onClick={handleClick}
      >
        {action}
      </Button>
    </div>
  );
};

export default PlatformButton;
