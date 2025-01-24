export const extractSpotifyTrackId = (url: string): string | null => {
  try {
    // Handle both track URLs and URI formats
    if (url.includes('spotify:track:')) {
      return url.split('spotify:track:')[1];
    }
    
    const match = url.match(/track\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  } catch (error) {
    console.error('Error extracting Spotify track ID:', error);
    return null;
  }
};