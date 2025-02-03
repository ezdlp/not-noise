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
import { Cookie } from "lucide-react";

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

  // Don't show cookie consent on smart link pages
  if (location.pathname.startsWith('/link/')) {
    return null;
  }

  return (
    <>
      {/* Main Consent Dialog */}
      <Dialog open={showConsent} onOpenChange={setShowConsent}>
        {showConsent && <div className="fixed inset-0 bg-[#0f0f0f] bg-opacity-60 z-40" />}
        <DialogContent className="sm:max-w-[500px] bg-[#fafafa] z-50">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <DialogTitle className="text-base">
                Before the show starts... Cookie Settings <Cookie className="inline-block w-4 h-4 text-[#0f0f0f]" />
              </DialogTitle>
            </div>
            <DialogDescription className="text-sm">
              We use cookies to improve your experience and analyze site usage.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            {isEU ? (
              <>
                <Button 
                  onClick={handleAcceptAll}
                  className="bg-[#0f0f0f] hover:bg-[#0f0f0f]/90 text-white"
                >
                  Accept Cookies
                </Button>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={handleRejectAll} 
                    className="flex-1 border-[#0f0f0f] text-[#0f0f0f] hover:bg-[#0f0f0f] hover:text-white"
                  >
                    Reject Cookies
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowSettings(true)} 
                    className="flex-1 border-[#0f0f0f] text-[#0f0f0f] hover:bg-[#0f0f0f] hover:text-white"
                  >
                    Customize
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Button 
                  onClick={handleAcceptAll}
                  className="bg-[#0f0f0f] hover:bg-[#0f0f0f]/90 text-white"
                >
                  Accept Cookies
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowSettings(true)}
                  className="border-[#0f0f0f] text-[#0f0f0f] hover:bg-[#0f0f0f] hover:text-white"
                >
                  Customize
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        {showSettings && <div className="fixed inset-0 bg-[#0f0f0f] bg-opacity-60 z-40" />}
        <DialogContent className="sm:max-w-[500px] bg-[#fafafa] z-50">
          <DialogHeader>
            <DialogTitle className="text-base">Cookie Settings <Cookie className="inline-block w-4 h-4 text-[#0f0f0f]" /></DialogTitle>
            <DialogDescription className="text-sm">
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
            <Button 
              variant="outline" 
              onClick={() => setShowSettings(false)}
              className="border-[#0f0f0f] text-[#0f0f0f] hover:bg-[#0f0f0f] hover:text-white"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSavePreferences}
              className="bg-[#0f0f0f] hover:bg-[#0f0f0f]/90 text-white"
            >
              Save Preferences
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}