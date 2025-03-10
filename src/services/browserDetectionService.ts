
import { BrowserInfo } from '@/models/browserInfo';

/**
 * Service for detecting browser and device information
 */
class BrowserDetectionService {
  /**
   * Get information about the current browser and device
   */
  getBrowserInfo(): BrowserInfo {
    if (typeof window === 'undefined') {
      return this.getDefaultBrowserInfo();
    }

    try {
      const userAgent = navigator.userAgent;
      const screenWidth = window.screen.width;
      const screenHeight = window.screen.height;

      // Device type detection
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      const isTablet = /iPad|Android(?!.*Mobile)/i.test(userAgent) || (screenWidth > 768 && screenWidth < 1024);
      
      let deviceType = 'desktop';
      if (isMobile) deviceType = 'mobile';
      if (isTablet) deviceType = 'tablet';

      // Browser detection
      let browserName = 'Unknown';
      let browserVersion = 'Unknown';
      
      // Detect Chrome
      if (/Chrome/.test(userAgent) && !/Chromium|Edge|Edg|OPR|Opera|Brave|Firefox/.test(userAgent)) {
        browserName = 'Chrome';
        browserVersion = userAgent.match(/Chrome\/(\d+\.\d+)/)?.[1] || 'Unknown';
      } 
      // Detect Firefox
      else if (/Firefox/.test(userAgent)) {
        browserName = 'Firefox';
        browserVersion = userAgent.match(/Firefox\/(\d+\.\d+)/)?.[1] || 'Unknown';
      } 
      // Detect Safari
      else if (/Safari/.test(userAgent) && !/Chrome|Chromium|Edge|Edg|OPR|Opera|Brave/.test(userAgent)) {
        browserName = 'Safari';
        browserVersion = userAgent.match(/Version\/(\d+\.\d+)/)?.[1] || 'Unknown';
      } 
      // Detect Edge
      else if (/Edge|Edg/.test(userAgent)) {
        browserName = 'Edge';
        browserVersion = userAgent.match(/Edge\/(\d+\.\d+)/)?.[1] || 
                         userAgent.match(/Edg\/(\d+\.\d+)/)?.[1] || 'Unknown';
      } 
      // Detect Opera
      else if (/OPR|Opera/.test(userAgent)) {
        browserName = 'Opera';
        browserVersion = userAgent.match(/OPR\/(\d+\.\d+)/)?.[1] || 
                         userAgent.match(/Opera\/(\d+\.\d+)/)?.[1] || 'Unknown';
      }

      // OS detection
      let osName = 'Unknown';
      let osVersion = 'Unknown';
      
      // Detect Windows
      if (/Windows/.test(userAgent)) {
        osName = 'Windows';
        const windowsVersion = userAgent.match(/Windows NT (\d+\.\d+)/)?.[1];
        
        switch (windowsVersion) {
          case '10.0': osVersion = '10'; break;
          case '6.3': osVersion = '8.1'; break;
          case '6.2': osVersion = '8'; break;
          case '6.1': osVersion = '7'; break;
          case '6.0': osVersion = 'Vista'; break;
          case '5.2': 
          case '5.1': osVersion = 'XP'; break;
          default: osVersion = windowsVersion || 'Unknown';
        }
      } 
      // Detect macOS
      else if (/Macintosh|Mac OS X/.test(userAgent)) {
        osName = 'macOS';
        const macOSMatch = userAgent.match(/Mac OS X (\d+[._]\d+)/)?.[1];
        osVersion = macOSMatch ? macOSMatch.replace('_', '.') : 'Unknown';
      } 
      // Detect iOS
      else if (/iPhone|iPad|iPod/.test(userAgent)) {
        osName = 'iOS';
        const iOSMatch = userAgent.match(/OS (\d+_\d+)/)?.[1];
        osVersion = iOSMatch ? iOSMatch.replace('_', '.') : 'Unknown';
      } 
      // Detect Android
      else if (/Android/.test(userAgent)) {
        osName = 'Android';
        osVersion = userAgent.match(/Android (\d+\.\d+)/)?.[1] || 'Unknown';
      } 
      // Detect Linux
      else if (/Linux/.test(userAgent)) {
        osName = 'Linux';
        osVersion = 'Unknown'; // Linux version is rarely specified in user agent
      }

      return {
        browser_name: browserName,
        browser_version: browserVersion,
        os_name: osName,
        os_version: osVersion,
        device_type: deviceType,
        screen_width: screenWidth,
        screen_height: screenHeight
      };
    } catch (error) {
      console.error('[BrowserDetectionService] Error detecting browser info:', error);
      return this.getDefaultBrowserInfo();
    }
  }

  /**
   * Provide default browser info when detection fails or in server context
   */
  private getDefaultBrowserInfo(): BrowserInfo {
    return {
      browser_name: 'Unknown',
      browser_version: 'Unknown',
      os_name: 'Unknown',
      os_version: 'Unknown',
      device_type: 'Unknown',
      screen_width: 0,
      screen_height: 0
    };
  }
}

export const browserDetectionService = new BrowserDetectionService();
