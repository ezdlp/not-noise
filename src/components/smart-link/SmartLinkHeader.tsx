import React, { useEffect } from 'react';
import { SmartImage } from '@/components/ui/smart-image';

interface SmartLinkHeaderProps {
  title: string;
  artistName: string;
  artworkUrl: string;
}

const SmartLinkHeader = ({ title, artistName, artworkUrl }: SmartLinkHeaderProps) => {
  useEffect(() => {
    console.log("Artwork URL received:", artworkUrl);
  }, [artworkUrl]);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    console.error("Failed to load artwork:", img.src);
    console.log("Original artwork URL:", artworkUrl);
    img.src = "/placeholder.svg";
  };

  return (
    <div className="text-center mb-8">
      <SmartImage
        src={artworkUrl || "/placeholder.svg"}
        alt={`${title} cover`}
        className="w-72 h-72 mx-auto rounded-2xl shadow-xl mb-6 object-cover"
        onError={handleImageError}
        priority={true}
        width={288}  // 72 * 4 for high DPI displays
        height={288}
      />
      <h1 className="text-2xl font-bold mb-1 text-gray-900">{title}</h1>
      <p className="text-lg text-gray-600 mb-2">
        {artistName}
      </p>
    </div>
  );
};

export default SmartLinkHeader;
