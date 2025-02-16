
import React from "react";
import { Check, HelpCircle, X, Clock, Sparkles, Link, BarChart3, Download, ArrowUpDown, Mail, Instagram, Palette, HeadphonesIcon, Zap } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const ComparisonTable = () => {
  const features = [
    {
      name: "Smart Link Creation",
      icon: <Link className="h-4 w-4" />,
      free: "Up to 10 smart links",
      pro: "Unlimited smart links",
      info: "Create trackable smart links for your music",
    },
    {
      name: "Music Platforms",
      icon: <HeadphonesIcon className="h-4 w-4" />,
      free: "Spotify, Apple Music, YouTube Music, Amazon Music, Deezer, Soundcloud, YouTube, iTunes Store",
      pro: "All from Free plus Tidal, Beatport, Bandcamp, Napster, Anghami, Boomplay, Yandex Music, Audius",
      info: "Connect with major streaming platforms",
    },
    {
      name: "Platform Reordering",
      icon: <ArrowUpDown className="h-4 w-4" />,
      free: false,
      pro: true,
      info: "Arrange platforms in any order to prioritize specific services",
    },
    {
      name: "Analytics Dashboard",
      icon: <BarChart3 className="h-4 w-4" />,
      free: "Views, Clicks, CTR tracking",
      pro: "Everything in Free plus Platform-specific clicks, Daily performance, Fan locations, Performance trends",
      info: "Track and analyze your smart link performance",
    },
    {
      name: "Analytics Export",
      icon: <Download className="h-4 w-4" />,
      free: false,
      pro: true,
      info: "Export your analytics data in CSV format",
    },
    {
      name: "Meta Pixel Integration",
      icon: <Sparkles className="h-4 w-4" />,
      free: true,
      pro: true,
      info: "Track your marketing campaigns with Meta Pixel integration",
    },
    {
      name: "Fan Email Collection",
      icon: <Mail className="h-4 w-4" />,
      free: false,
      pro: true,
      info: "Build your mailing list directly through your smart links",
    },
    {
      name: "Social Media Cards",
      icon: <Instagram className="h-4 w-4" />,
      free: false,
      pro: true,
      info: "Your links will display beautifully when shared on social media",
    },
    {
      name: "Custom URL Slugs",
      icon: <Link className="h-4 w-4" />,
      free: true,
      pro: true,
      info: "Customize your link URLs",
    },
    {
      name: "Branding",
      icon: <Palette className="h-4 w-4" />,
      free: false,
      pro: true,
      info: "Remove Soundraiser branding from your links",
    },
    {
      name: "Support Response Time",
      icon: <Clock className="h-4 w-4" />,
      free: "Standard (48h)",
      pro: "Priority (12h)",
      info: "Get help when you need it",
    },
    {
      name: "Feature Updates",
      icon: <Zap className="h-4 w-4" />,
      free: "Standard updates",
      pro: "Early access",
      info: "Access to new features and improvements",
    },
  ];

  return (
    <div className="mt-24 mb-16 px-4" id="compare-plans">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">Compare Plans in Detail</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Choose the plan that best fits your needs. Upgrade, downgrade, or cancel anytime.
        </p>
      </div>

      <div className="max-w-[1000px] mx-auto">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-background sticky top-0">
              <tr className="border-b">
                <th className="text-left p-4 min-w-[280px]">Features</th>
                <th className="p-4 min-w-[140px]">
                  <div className="font-bold text-lg">Free</div>
                  <div className="text-sm text-muted-foreground">For emerging artists</div>
                </th>
                <th className="p-4 min-w-[140px] bg-primary/5 rounded-t-lg">
                  <div className="relative">
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-primary px-3 py-1 rounded-full text-white text-xs whitespace-nowrap">
                      Most Popular
                    </div>
                    <div className="font-bold text-lg">Pro</div>
                    <div className="text-sm text-muted-foreground">For artists who want more</div>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {features.map((feature, index) => (
                <tr 
                  key={feature.name}
                  className={`border-b transition-colors hover:bg-muted/30 ${index % 2 === 0 ? 'bg-muted/10' : ''}`}
                >
                  <td className="p-4 align-middle">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{feature.icon}</span>
                      <span className="font-medium">{feature.name}</span>
                      {feature.info && (
                        <TooltipProvider delayDuration={0}>
                          <Tooltip>
                            <TooltipTrigger>
                              <HelpCircle className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-[300px]">{feature.info}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-center align-middle">
                    {typeof feature.free === 'boolean' ? (
                      feature.free ? (
                        <Check className="h-5 w-5 text-primary mx-auto" />
                      ) : (
                        <X className="h-5 w-5 text-muted-foreground mx-auto" />
                      )
                    ) : (
                      <span className="text-sm">{feature.free}</span>
                    )}
                  </td>
                  <td className="p-4 text-center align-middle bg-primary/5">
                    {typeof feature.pro === 'boolean' ? (
                      feature.pro ? (
                        <Check className="h-5 w-5 text-primary mx-auto" />
                      ) : (
                        <X className="h-5 w-5 text-muted-foreground mx-auto" />
                      )
                    ) : (
                      <span className="text-sm font-medium">{feature.pro}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ComparisonTable;
