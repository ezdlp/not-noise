
/**
 * Service for device detection and information
 */
export class DeviceInfoService {
  /**
   * Get device information from the current browser
   */
  getDeviceInfo() {
    if (typeof window === 'undefined') {
      return {
        user_agent: '',
        browser_name: '',
        browser_version: '',
        os_name: '',
        os_version: '',
        device_type: '',
        screen_width: 0,
        screen_height: 0
      };
    }

    const userAgent = navigator.userAgent;
    const screenWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    const screenHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
    
    // Simple browser detection
    const browserInfo = this.detectBrowser(userAgent);
    const osInfo = this.detectOS(userAgent);
    const deviceType = this.detectDeviceType(userAgent, screenWidth);

    return {
      user_agent: userAgent,
      browser_name: browserInfo.name,
      browser_version: browserInfo.version,
      os_name: osInfo.name,
      os_version: osInfo.version,
      device_type: deviceType,
      screen_width: screenWidth,
      screen_height: screenHeight
    };
  }

  /**
   * Detect browser name and version
   */
  private detectBrowser(userAgent: string) {
    // Simple detection for common browsers
    if (userAgent.indexOf('Firefox') > -1) {
      return {
        name: 'Firefox',
        version: this.extractVersion(userAgent, 'Firefox/')
      };
    } else if (userAgent.indexOf('Chrome') > -1) {
      return {
        name: 'Chrome',
        version: this.extractVersion(userAgent, 'Chrome/')
      };
    } else if (userAgent.indexOf('Safari') > -1) {
      return {
        name: 'Safari',
        version: this.extractVersion(userAgent, 'Version/')
      };
    } else if (userAgent.indexOf('Edge') > -1) {
      return {
        name: 'Edge',
        version: this.extractVersion(userAgent, 'Edge/')
      };
    } else if (userAgent.indexOf('Edg') > -1) {
      return {
        name: 'Edge',
        version: this.extractVersion(userAgent, 'Edg/')
      };
    } else if (userAgent.indexOf('MSIE') > -1 || userAgent.indexOf('Trident/') > -1) {
      return {
        name: 'Internet Explorer',
        version: this.extractVersion(userAgent, 'MSIE ')
      };
    }
    
    return {
      name: 'Unknown',
      version: 'Unknown'
    };
  }

  /**
   * Detect operating system name and version
   */
  private detectOS(userAgent: string) {
    // Detect common operating systems
    if (userAgent.indexOf('Windows') > -1) {
      return {
        name: 'Windows',
        version: this.extractWindowsVersion(userAgent)
      };
    } else if (userAgent.indexOf('Mac OS X') > -1) {
      return {
        name: 'macOS',
        version: this.extractVersion(userAgent, 'Mac OS X ')
          .replace(/_/g, '.')
          .replace(/;/g, '')
      };
    } else if (userAgent.indexOf('Android') > -1) {
      return {
        name: 'Android',
        version: this.extractVersion(userAgent, 'Android ')
      };
    } else if (userAgent.indexOf('iOS') > -1 || userAgent.indexOf('iPhone OS') > -1) {
      return {
        name: 'iOS',
        version: this.extractVersion(userAgent, 'iPhone OS ')
          .replace(/_/g, '.')
          .replace(/;/g, '')
      };
    } else if (userAgent.indexOf('Linux') > -1) {
      return {
        name: 'Linux',
        version: 'Unknown'
      };
    }
    
    return {
      name: 'Unknown',
      version: 'Unknown'
    };
  }

  /**
   * Extract Windows version from user agent
   */
  private extractWindowsVersion(userAgent: string) {
    if (userAgent.indexOf('Windows NT 10.0') > -1) return '10';
    if (userAgent.indexOf('Windows NT 6.3') > -1) return '8.1';
    if (userAgent.indexOf('Windows NT 6.2') > -1) return '8';
    if (userAgent.indexOf('Windows NT 6.1') > -1) return '7';
    if (userAgent.indexOf('Windows NT 6.0') > -1) return 'Vista';
    if (userAgent.indexOf('Windows NT 5.1') > -1) return 'XP';
    return 'Unknown';
  }

  /**
   * Detect device type (mobile, tablet, desktop)
   */
  private detectDeviceType(userAgent: string, screenWidth: number) {
    const isMobile = /Mobi|Android|iPhone|iPad|iPod|Windows Phone/i.test(userAgent);
    
    if (isMobile) {
      if (
        /iPad|Tablet|Android(?!.*Mobile)/i.test(userAgent) || 
        (screenWidth >= 768 && /Android|iPhone|iPod/i.test(userAgent))
      ) {
        return 'tablet';
      }
      return 'mobile';
    }
    
    return 'desktop';
  }

  /**
   * Extract version number from user agent string
   */
  private extractVersion(userAgent: string, versionMark: string) {
    const idx = userAgent.indexOf(versionMark);
    if (idx === -1) return 'Unknown';
    
    let version = userAgent.substring(idx + versionMark.length);
    const endIdx = version.indexOf(' ');
    if (endIdx !== -1) {
      version = version.substring(0, endIdx);
    }
    
    // Clean up the version string
    version = version.replace(/;/g, '').replace(/_/g, '.');
    
    return version;
  }
}

export const deviceInfoService = new DeviceInfoService();
