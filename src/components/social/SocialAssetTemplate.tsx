import React from 'react';

interface SocialAssetTemplateProps {
  title: string;
  artistName: string;
  artworkUrl: string;
  platformIcons: {
    spotify?: boolean;
    appleMusic?: boolean;
    youtubeMusic?: boolean;
  };
}

const SocialAssetTemplate = ({ 
  title, 
  artistName, 
  artworkUrl,
  platformIcons 
}: SocialAssetTemplateProps) => {
  return (
    <div 
      id="social-asset-template"
      className="relative w-[1200px] h-[630px] overflow-hidden bg-black"
      style={{ fontFamily: 'DM Sans, sans-serif' }}
    >
      {/* Background Image with Blur */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: `url(${artworkUrl})`,
          filter: 'blur(30px) brightness(0.7)',
          transform: 'scale(1.1)'
        }}
      />

      {/* Content Container */}
      <div className="relative h-full flex flex-col items-center justify-center p-12 z-10">
        {/* Artist Name */}
        <h2 className="text-4xl font-bold text-white mb-8 text-center">
          {artistName}
        </h2>

        {/* Artwork */}
        <img 
          src={artworkUrl}
          alt={`${title} cover`}
          className="w-80 h-80 object-cover rounded-2xl shadow-2xl mb-8"
        />

        {/* Title */}
        <h1 className="text-5xl font-bold text-white mb-12 text-center">
          {title}
        </h1>

        {/* Platform Icons */}
        <div className="flex items-center justify-center gap-6">
          {platformIcons.spotify && (
            <img 
              src="/lovable-uploads/spotify.png" 
              alt="Spotify"
              className="w-12 h-12 object-contain brightness-0 invert"
            />
          )}
          {platformIcons.appleMusic && (
            <img 
              src="/lovable-uploads/applemusic.png" 
              alt="Apple Music"
              className="w-12 h-12 object-contain brightness-0 invert"
            />
          )}
          {platformIcons.youtubeMusic && (
            <img 
              src="/lovable-uploads/youtubemusic.png" 
              alt="YouTube Music"
              className="w-12 h-12 object-contain brightness-0 invert"
            />
          )}
        </div>

        {/* Powered by */}
        <div className="absolute bottom-8 left-0 right-0 text-center">
          <p className="text-white/60 text-lg">Listen Now on notnoise</p>
        </div>
      </div>
    </div>
  );
};

export default SocialAssetTemplate;