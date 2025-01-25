import React from 'react';
import { 
  faSpotify, 
  faApple, 
  faSoundcloud,
  faYoutube,
  faDeezer,
  faBandcamp,
  IconDefinition
} from '@fortawesome/free-brands-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const platformIcons: Record<string, IconDefinition> = {
  spotify: faSpotify,
  applemusic: faApple,
  soundcloud: faSoundcloud,
  youtube: faYoutube,
  deezer: faDeezer,
  bandcamp: faBandcamp,
};

interface PlatformIconProps {
  platform: string;
  className?: string;
}

export const PlatformIcon = ({ platform, className }: PlatformIconProps) => {
  const icon = platformIcons[platform.toLowerCase()];
  
  if (!icon) {
    console.warn(`No icon found for platform: ${platform}`);
    return null;
  }

  return <FontAwesomeIcon icon={icon} className={className} />;
};