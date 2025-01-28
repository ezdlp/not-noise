import { useEffect, useState } from "react";
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

interface CookieSettings {
  analytics: boolean;
  marketing: boolean;
  necessary: boolean;
}

export function CookieConsent() {
  const [open, setOpen] = useState(false);
  const [isEU, setIsEU] = useState(false);
  const [settings, setSettings] = useState<CookieSettings>({
    analytics: false,
    marketing: false,
    necessary: true, // Always required
  });

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
    // Here you would implement the actual cookie settings
    // For example, enabling/disabling Google Analytics, Meta Pixel, etc.
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Cookie Preferences</DialogTitle>
          <DialogDescription>
            {isEU ? (
              "We use cookies to enhance your browsing experience. Please choose your cookie preferences below."
            ) : (
              "We use cookies to enhance your browsing experience. By continuing to use our site, you agree to our cookie policy."
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-start space-x-4">
            <Checkbox
              id="necessary"
              checked={settings.necessary}
              disabled
            />
            <div className="space-y-1">
              <Label htmlFor="necessary">Necessary Cookies</Label>
              <p className="text-sm text-muted-foreground">
                These cookies are required for basic site functionality and cannot be disabled.
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
            />
            <div className="space-y-1">
              <Label htmlFor="analytics">Analytics Cookies</Label>
              <p className="text-sm text-muted-foreground">
                Help us improve our website by collecting and reporting information about usage.
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
            />
            <div className="space-y-1">
              <Label htmlFor="marketing">Marketing Cookies</Label>
              <p className="text-sm text-muted-foreground">
                Used to track visitors across websites to display relevant advertisements.
              </p>
            </div>
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          {isEU ? (
            <>
              <Button variant="outline" onClick={handleRejectAll}>
                Reject All
              </Button>
              <Button variant="outline" onClick={handleSavePreferences}>
                Save Preferences
              </Button>
              <Button onClick={handleAcceptAll}>
                Accept All
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleSavePreferences}>
                Save Preferences
              </Button>
              <Button onClick={handleAcceptAll}>
                Accept
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}