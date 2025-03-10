
import { DeviceInfo } from "@/models/deviceInfo";

class DeviceInfoService {
  getDeviceInfo(): DeviceInfo {
    const userAgent = navigator.userAgent;
    const deviceInfo: DeviceInfo = {
      user_agent: userAgent
    };

    // Extract browser information
    if (userAgent.indexOf("Chrome") > -1) {
      deviceInfo.browser_name = "Chrome";
      const match = userAgent.match(/Chrome\/([0-9.]+)/);
      if (match) deviceInfo.browser_version = match[1];
    } else if (userAgent.indexOf("Safari") > -1) {
      deviceInfo.browser_name = "Safari";
      const match = userAgent.match(/Version\/([0-9.]+)/);
      if (match) deviceInfo.browser_version = match[1];
    } else if (userAgent.indexOf("Firefox") > -1) {
      deviceInfo.browser_name = "Firefox";
      const match = userAgent.match(/Firefox\/([0-9.]+)/);
      if (match) deviceInfo.browser_version = match[1];
    } else if (userAgent.indexOf("MSIE") > -1 || userAgent.indexOf("Trident/") > -1) {
      deviceInfo.browser_name = "Internet Explorer";
      const match = userAgent.match(/(?:MSIE |rv:)([0-9.]+)/);
      if (match) deviceInfo.browser_version = match[1];
    } else if (userAgent.indexOf("Edge") > -1) {
      deviceInfo.browser_name = "Edge";
      const match = userAgent.match(/Edge\/([0-9.]+)/);
      if (match) deviceInfo.browser_version = match[1];
    }

    // Extract OS information
    if (userAgent.indexOf("Windows") > -1) {
      deviceInfo.os_name = "Windows";
      const match = userAgent.match(/Windows NT ([0-9.]+)/);
      if (match) {
        const version = match[1];
        switch (version) {
          case "10.0": deviceInfo.os_version = "10"; break;
          case "6.3": deviceInfo.os_version = "8.1"; break;
          case "6.2": deviceInfo.os_version = "8"; break;
          case "6.1": deviceInfo.os_version = "7"; break;
          case "6.0": deviceInfo.os_version = "Vista"; break;
          default: deviceInfo.os_version = version;
        }
      }
    } else if (userAgent.indexOf("Mac") > -1) {
      deviceInfo.os_name = "MacOS";
      const match = userAgent.match(/Mac OS X ([0-9_]+)/);
      if (match) deviceInfo.os_version = match[1].replace(/_/g, ".");
    } else if (userAgent.indexOf("Android") > -1) {
      deviceInfo.os_name = "Android";
      const match = userAgent.match(/Android ([0-9.]+)/);
      if (match) deviceInfo.os_version = match[1];
    } else if (userAgent.indexOf("iOS") > -1 || /iPhone|iPad|iPod/.test(userAgent)) {
      deviceInfo.os_name = "iOS";
      const match = userAgent.match(/OS ([0-9_]+)/);
      if (match) deviceInfo.os_version = match[1].replace(/_/g, ".");
    } else if (userAgent.indexOf("Linux") > -1) {
      deviceInfo.os_name = "Linux";
    }

    // Determine device type
    if (/Mobi|Android|iPhone|iPad|iPod|IEMobile|BlackBerry|Opera Mini/i.test(userAgent)) {
      if (/iPad|tablet|Tablet/i.test(userAgent)) {
        deviceInfo.device_type = 'tablet';
      } else {
        deviceInfo.device_type = 'mobile';
      }
    } else {
      deviceInfo.device_type = 'desktop';
    }

    // Add screen dimensions if available
    if (window.screen) {
      deviceInfo.screen_width = window.screen.width;
      deviceInfo.screen_height = window.screen.height;
    }

    return deviceInfo;
  }
}

export const deviceInfoService = new DeviceInfoService();
