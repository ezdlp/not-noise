
import { Card } from "@/components/ui/card";

export function SocialMediaTools() {
  return (
    <section className="py-12 md:py-20 bg-neutral-seasalt">
      <div className="container px-4 mx-auto">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Social Media Tools
          </h2>
          <p className="text-lg text-muted-foreground">
            Generate social media assets in one click.
          </p>
        </div>

        <div className="flex flex-row flex-nowrap justify-center gap-4 md:gap-6 overflow-x-auto md:overflow-visible pb-4 md:pb-0">
          {socialPlatforms.map((platform) => (
            <Card 
              key={platform.name}
              className="flex-shrink-0 w-10 md:w-12 h-10 md:h-12 flex items-center justify-center p-2"
            >
              <img
                src={platform.icon}
                alt={platform.name}
                className="w-full h-full object-contain"
              />
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

const socialPlatforms = [
  { name: "Instagram", icon: "/lovable-uploads/instagram.svg" },
  { name: "Facebook", icon: "/lovable-uploads/facebook.svg" },
  { name: "Twitter", icon: "/lovable-uploads/twitter.svg" },
  { name: "TikTok", icon: "/lovable-uploads/tiktok.svg" },
  { name: "YouTube", icon: "/lovable-uploads/youtube.svg" },
];
