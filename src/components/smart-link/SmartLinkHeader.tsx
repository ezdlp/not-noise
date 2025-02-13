
import React, { useEffect } from 'react';

interface SmartLinkHeaderProps {
  title: string;
  artistName?: string;
  artworkUrl: string;
  description?: string;
}

const SmartLinkHeader = ({ title, artistName, artworkUrl, description }: SmartLinkHeaderProps) => {
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
      <img
        src={artworkUrl || "/placeholder.svg"}
        alt={`${title} cover`}
        className="w-72 h-72 mx-auto rounded-2xl shadow-xl mb-6 object-cover"
        onError={handleImageError}
      />
      <h1 className="text-2xl font-bold mb-1 text-gray-900">{title}</h1>
      {artistName && <p className="text-lg text-gray-600 mb-2">{artistName}</p>}
      {description && (
        <p className="text-sm text-gray-500 max-w-md mx-auto mt-3 px-4">
          {description}
        </p>
      )}
    </div>
  );
};

export default SmartLinkHeader;
