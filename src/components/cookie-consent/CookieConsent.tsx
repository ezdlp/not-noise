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
  const [open, setOpen] = useState(false);
  const [isEU, setIsEU] = useState(false);
  const [settings, setSettings] = useState<CookieSettings>({
    analytics: false,
    marketing: false,
    necessary: true, // Always required
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
        setOpen(true);
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
    setOpen(false);
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
    setOpen(false);
  };

  const handleSavePreferences = () => {
    saveConsent(settings);
    setOpen(false);
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[400px] p-6 fixed bottom-4 right-4 shadow-lg animate-slide-in-bottom">
        <DialogHeader className="flex items-center space-y-2">
          <div className="flex items-center gap-2">
            <Music className="w-5 h-5 text-primary" />
            <DialogTitle className="text-lg font-heading">Before the show starts... 🎸</DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            {isEU 
              ? "We use cookies to enhance your experience. Choose your preferences!"
              : "We use cookies to enhance your experience. By continuing, you agree to our cookie policy."
            }
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
                These cookies are required for essential website functionality and cannot be disabled.
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
                These cookies help us understand how visitors interact with our website by collecting and reporting anonymous information.
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
                These cookies are used to track visitors across websites to enable us to display relevant advertisements.
              </p>
            </div>
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          {isEU ? (
            <>
              <Button variant="outline" onClick={handleRejectAll} className="w-full sm:w-auto">
                Reject All
              </Button>
              <Button variant="outline" onClick={handleSavePreferences} className="w-full sm:w-auto">
                Save Preferences
              </Button>
              <Button onClick={handleAcceptAll} className="w-full sm:w-auto">
                Accept All
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleSavePreferences} className="w-full sm:w-auto">
                Customize
              </Button>
              <Button onClick={handleAcceptAll} className="w-full sm:w-auto">
                Accept
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}