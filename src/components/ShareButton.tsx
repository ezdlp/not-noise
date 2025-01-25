import React from 'react';
import { Button } from "@/components/ui/button";
import { Share } from "lucide-react";

interface ShareButtonProps {
  title: string;
  text: string;
  url: string;
}

export const ShareButton = ({ title, text, url }: ShareButtonProps) => {
  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title,
          text,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <Button variant="outline" onClick={handleShare}>
      <Share className="h-4 w-4 mr-2" />
      Share
    </Button>
  );
};