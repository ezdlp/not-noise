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
  const [showConsent, setShowConsent] = useState(false);
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
        setShowConsent(true);
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
    setShowConsent(false);
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
    setShowConsent(false);
    setShowSettings(false);
  };

  const handleSavePreferences = () => {
    saveConsent(settings);
    setShowConsent(false);
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
      {/* Main Consent Dialog */}
      <Dialog open={showConsent} onOpenChange={setShowConsent}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <Music className="w-5 h-5 text-primary" />
              <DialogTitle>Before the show starts... 🎸</DialogTitle>
            </div>
            <DialogDescription>
              We use cookies to enhance your experience and analyze site usage. Your privacy matters - choose your preferences below.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            {isEU ? (
              <>
                <Button onClick={handleAcceptAll}>Accept All</Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleRejectAll} className="flex-1">
                    Reject All
                  </Button>
                  <Button variant="outline" onClick={() => setShowSettings(true)} className="flex-1">
                    Customize
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Button onClick={handleAcceptAll}>Accept</Button>
                <Button variant="outline" onClick={() => setShowSettings(true)}>
                  Customize
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Cookie Settings</DialogTitle>
            <DialogDescription>
              Choose which cookies you want to accept. Your choices help us provide a better experience.
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