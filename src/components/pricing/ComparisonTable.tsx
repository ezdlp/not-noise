
import { Check, HelpCircle, X } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const ComparisonTable = () => {
  // Feature categories with detailed descriptions
  const features = [
    {
      category: "Smart Links",
      items: [
        {
          name: "Smart Link Creation",
          free: "Up to 10 smart links",
          pro: "Unlimited smart links",
        },
      ],
    },
    {
      category: "Streaming Platforms",
      items: [
        {
          name: "Essential Platforms",
          free: "Spotify, Apple Music, YouTube Music, Amazon Music, Deezer, Soundcloud, YouTube, iTunes Store",
          pro: "All essential platforms plus Tidal, Beatport, Bandcamp, Napster, Anghami, Boomplay, Yandex Music, Audius, and new platforms added regularly",
          info: "Pro users get access to all current and future streaming platforms",
        },
        {
          name: "Platform Reordering",
          free: false,
          pro: true,
          info: "Arrange platforms in any order to prioritize specific services",
        },
      ],
    },
    {
      category: "Analytics",
      items: [
        {
          name: "Basic Analytics",
          free: "Views, Clicks, and CTR tracking",
          pro: "Views, Clicks, and CTR tracking",
        },
        {
          name: "Advanced Analytics",
          free: false,
          pro: "Platform-specific clicks, daily performance, fan locations, and trends",
          info: "Get detailed insights about where your fans come from and how they interact with your music",
        },
        {
          name: "Analytics Export",
          free: false,
          pro: "Export all analytics data in CSV format",
        },
      ],
    },
    {
      category: "Fan Engagement",
      items: [
        {
          name: "Meta Pixel Integration",
          free: true,
          pro: true,
        },
        {
          name: "Fan Email Collection",
          free: false,
          pro: "Collect fan emails with customizable forms",
          info: "Build your mailing list directly through your smart links",
        },
        {
          name: "Social Media Cards",
          free: false,
          pro: "Automatic eye-catching preview cards for social media",
          info: "Your links will display beautifully when shared on Instagram, X, Facebook, and other platforms - no design skills needed",
        },
      ],
    },
    {
      category: "Customization",
      items: [
        {
          name: "Custom URL Slugs",
          free: true,
          pro: true,
        },
        {
          name: "Branding",
          free: "Includes Soundraiser branding",
          pro: "Option to remove Soundraiser branding",
        },
      ],
    },
    {
      category: "Support",
      items: [
        {
          name: "Customer Support",
          free: "Standard email support",
          pro: "Priority 24/7 support with response within 12 hours",
        },
        {
          name: "Feature Access",
          free: "Standard updates",
          pro: "Early access to new features",
        },
      ],
    },
  ];

  return (
    <div className="mt-24 mb-16 px-4">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">Compare Plans in Detail</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Choose the plan that best fits your needs. Upgrade, downgrade, or cancel anytime.
        </p>
      </div>

      <div className="max-w-[1200px] mx-auto">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-background sticky top-0">
              <tr className="border-b">
                <th className="text-left p-4 min-w-[200px]">Features</th>
                <th className="p-4 min-w-[200px]">
                  <div className="font-bold text-lg">Free</div>
                  <div className="text-sm text-muted-foreground">For emerging artists</div>
                </th>
                <th className="p-4 min-w-[200px] bg-primary/5 rounded-t-lg relative">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary px-3 py-1 rounded-full text-white text-xs">
                    Most Popular
                  </div>
                  <div className="font-bold text-lg">Pro</div>
                  <div className="text-sm text-muted-foreground">For artists who want more</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {features.map((category, categoryIndex) => (
                <React.Fragment key={category.category}>
                  <tr className="bg-muted/50">
                    <td colSpan={3} className="p-4 font-semibold">
                      {category.category}
                    </td>
                  </tr>
                  {category.items.map((feature, featureIndex) => (
                    <tr 
                      key={`${category.category}-${featureIndex}`}
                      className="border-b hover:bg-muted/30 transition-colors"
                    >
                      <td className="p-4 align-middle">
                        <div className="flex items-center gap-2">
                          {feature.name}
                          {feature.info && (
                            <TooltipProvider>
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
                          <span className="text-sm">{feature.pro}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ComparisonTable;
