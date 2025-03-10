
/**
 * Helper utilities for parsing and handling authentication tokens from URLs
 */

/**
 * Extracts authentication parameters from the URL
 * Handles both query parameters and hash fragments, including malformed URLs
 */
export function extractAuthParamsFromUrl(): {
  accessToken: string | null;
  isRecovery: boolean;
  recoveryFlow: boolean;
} {
  const url = window.location.href;
  console.log("[Auth] Parsing URL:", url);
  
  // Get the search params
  const searchParams = new URLSearchParams(window.location.search);
  
  // Check for recovery in query params
  const isRecovery = searchParams.get('recovery') === 'true' || searchParams.get('type') === 'recovery';
  const recoveryFlow = isRecovery;
  
  // Extract access token from URL or query params
  let accessToken = null;
  
  // First, try to get from query params
  accessToken = searchParams.get('access_token');
  
  // If not found, try to extract from hash part  
  if (!accessToken && window.location.hash) {
    // Handle double hash issue (#recovery=true#access_token=...)
    const hashContent = window.location.hash.replace(/^#/, '');
    
    // Check if there's a double hash
    if (hashContent.includes('#')) {
      // Split by the second hash and get the access_token part
      const parts = hashContent.split('#');
      if (parts.length > 1) {
        const tokenPart = parts[1];
        if (tokenPart.startsWith('access_token=')) {
          // Extract access_token from the hash value
          const tokenParams = new URLSearchParams(tokenPart);
          accessToken = tokenParams.get('access_token');
        }
      }
    } else {
      // Standard hash parameters
      const hashParams = new URLSearchParams(hashContent);
      accessToken = hashParams.get('access_token');
    }
  }

  return {
    accessToken,
    isRecovery,
    recoveryFlow
  };
}

/**
 * Creates a properly formatted password reset URL
 * Uses query parameters instead of hash fragments to avoid parsing issues
 */
export function createPasswordResetUrl(baseUrl: string): string {
  // Create a proper URL with query parameters instead of hash fragments
  return `${baseUrl}/update-password?type=recovery&recovery=true`;
}
