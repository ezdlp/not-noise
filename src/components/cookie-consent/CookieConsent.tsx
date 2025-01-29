import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { getUserLocation } from "@/utils/geolocation";
import { analyticsService } from "@/services/analytics";
import { Music } from "lucide-react";

interface CookieSettings {
  analytics: boolean;
  marketing: boolean;
  necessary: boolean;
}

export function CookieConsent() {
  const location = useLocation();
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isEU, setIsEU] = useState(false);
  const [settings, setSettings] = useState<CookieSettings>({
    analytics: false,
    marketing: false,
    necessary: true,
  });

  // Don't show cookie consent on smart link pages
  if (location.pathname.startsWith('/link/')) {
    return null;
  }

  useEffect(() => {
    const initAnalytics = async () => {
      await analyticsService.initialize();
      const hasConsent = localStorage.getItem("cookieConsent");
      if (hasConsent) {
        const savedSettings = JSON.parse(hasConsent);
        if (savedSettings.analytics || savedSettings.marketing) {
          analyticsService.enableAnalytics();
        }
      }
    };

    initAnalytics();
  }, []);

  useEffect(() => {
    const checkConsent = async () => {
      const hasConsent = localStorage.getItem("cookieConsent");
      if (!hasConsent) {
        const location = await getUserLocation();
        setIsEU(location.isEU);
        setShowBanner(true);
      }
    };
    
    checkConsent();
  }, []);

  const handleAcceptAll = () => {
    setSettings({
      analytics: true,
      marketing: true,
      necessary: true,
    });
    saveConsent({
      analytics: true,
      marketing: true,
      necessary: true,
    });
    setShowBanner(false);
    setShowSettings(false);
  };

  const handleRejectAll = () => {
    setSettings({
      analytics: false,
      marketing: false,
      necessary: true,
    });
    saveConsent({
      analytics: false,
      marketing: false,
      necessary: true,
    });
    setShowBanner(false);
    setShowSettings(false);
  };

  const handleSavePreferences = () => {
    saveConsent(settings);
    setShowBanner(false);
    setShowSettings(false);
  };

  const saveConsent = (settings: CookieSettings) => {
    localStorage.setItem("cookieConsent", JSON.stringify(settings));
    if (settings.analytics || settings.marketing) {
      analyticsService.enableAnalytics();
    } else {
      analyticsService.disableAnalytics();
    }
  };

  return (
    <>
      {/* Initial Banner */}
      {showBanner && (
        <div className="fixed bottom-4 right-4 w-[300px] bg-background border rounded-lg shadow-lg p-4 animate-slide-in-bottom">
          <div className="flex items-center gap-2 mb-2">
            <Music className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-heading">Before the show starts... 🎸</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            We use cookies to enhance your experience.
          </p>
          <div className="flex flex-col gap-2">
            {isEU ? (
              <>
                <Button size="sm" onClick={handleAcceptAll}>Accept All</Button>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={handleRejectAll}>
                    Reject All
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowSettings(true)}>
                    Customize
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Button size="sm" onClick={handleAcceptAll}>Accept</Button>
                <Button size="sm" variant="outline" onClick={() => setShowSettings(true)}>
                  Customize
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Cookie Settings</DialogTitle>
            <DialogDescription>
              Choose which cookies you want to accept.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-start space-x-4">
              <Checkbox
                id="necessary"
                checked={settings.necessary}
                disabled
                className="mt-1"
              />
              <div className="space-y-1">
                <Label htmlFor="necessary" className="font-medium">Necessary Cookies</Label>
                <p className="text-sm text-muted-foreground">
                  Required for essential website functionality.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <Checkbox
                id="analytics"
                checked={settings.analytics}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, analytics: checked as boolean })
                }
                className="mt-1"
              />
              <div className="space-y-1">
                <Label htmlFor="analytics" className="font-medium">Analytics Cookies</Label>
                <p className="text-sm text-muted-foreground">
                  Help us understand how visitors interact with our website.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <Checkbox
                id="marketing"
                checked={settings.marketing}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, marketing: checked as boolean })
                }
                className="mt-1"
              />
              <div className="space-y-1">
                <Label htmlFor="marketing" className="font-medium">Marketing Cookies</Label>
                <p className="text-sm text-muted-foreground">
                  Enable relevant advertisements across websites.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePreferences}>
              Save Preferences
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}