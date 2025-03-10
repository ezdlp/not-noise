
/**
 * Service for IP-based location detection
 */
class LocationService {
  private cachedLocation: {
    country: string;
    country_code: string;
    ip_hash: string;
  } | null = null;
  
  /**
   * Get location information based on the client's IP address
   * Uses IP geolocation services to determine country information
   */
  async getLocationInfo() {
    // Return cached location if available
    if (this.cachedLocation) {
      return this.cachedLocation;
    }
    
    try {
      // Use a simple public API to get location info
      const response = await fetch('https://ipapi.co/json/');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch location: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Hash the IP for privacy
      const ipHash = await this.hashIp(data.ip);
      
      this.cachedLocation = {
        country: data.country_name || 'Unknown',
        country_code: data.country_code || 'XX',
        ip_hash: ipHash
      };
      
      return this.cachedLocation;
    } catch (error) {
      console.error('Error getting location info:', error);
      return null;
    }
  }
  
  /**
   * Create a one-way hash of an IP address for privacy
   */
  private async hashIp(ip: string): Promise<string> {
    try {
      // Use Web Crypto API to create a SHA-256 hash
      const encoder = new TextEncoder();
      const data = encoder.encode(ip + 'soundraiser-salt');
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      
      // Convert hash to hex string
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      return hashHex;
    } catch (error) {
      console.error('Error hashing IP:', error);
      return 'hash-error';
    }
  }
}

export const locationService = new LocationService();
