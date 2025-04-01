
// Global window object extensions
interface Window {
  smartLinkData?: {
    title: string;
    artistName: string;
    description: string;
    artworkUrl: string;
  };
  switchToSmartLinkTracking?: () => void;
  fbq?: any;
  dataLayer?: any[];
  gtag?: (...args: any[]) => void;
}
