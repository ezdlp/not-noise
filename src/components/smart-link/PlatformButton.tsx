import React from 'react';
import { Button } from "@/components/ui/button";

interface PlatformButtonProps {
  name: string;
  icon: string;
  action: string;
  url: string;
}

const PlatformButton = ({ name, icon, action, url }: PlatformButtonProps) => {
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
        onClick={() => window.open(url, '_blank')}
      >
        {action}
      </Button>
    </div>
  );
};

export default PlatformButton;