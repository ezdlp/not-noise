import { useState, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { StatCard } from "@/components/analytics/StatCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";

export default function Features() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true,
    draggable: true,
    dragFree: true,
    containScroll: 'trimSnaps'
  });

  const scrollTo = useCallback(
    (index: number) => {
      if (!emblaApi) return;
      emblaApi.scrollTo(index);
      setSelectedIndex(index);
    },
    [emblaApi]
  );

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  const features = [
    {
      title: "Smart Links",
      description: "Create beautiful landing pages for your music releases.",
      stats: {
        views: 1200,
        clicks: 300,
        ctr: 25,
      },
    },
    {
      title: "Analytics",
      description: "Track performance and grow your audience.",
      stats: {
        views: 800,
        clicks: 200,
        ctr: 25,
      },
    },
    {
      title: "Social Media Tools",
      description: "Generate social media assets in one click.",
      stats: {
        views: 600,
        clicks: 150,
        ctr: 25,
      },
    },
  ];

  return (
    <section className="py-20 bg-neutral-seasalt">
      <div className="container px-4 mx-auto">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Release Pages that Convert
          </h2>
          <p className="text-lg text-muted-foreground">
            Create beautiful landing pages for your music. Share one link everywhere.
          </p>
        </div>

        <div className="relative mb-8">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex touch-pan-y">
              {features.map((feature, index) => (
                <Card key={index} className="min-w-[300px] mx-2">
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                  <div className="mt-4">
                    <StatCard title="Views" value={feature.stats.views} type="views" />
                    <StatCard title="Clicks" value={feature.stats.clicks} type="clicks" />
                    <StatCard title="CTR" value={`${feature.stats.ctr}%`} type="ctr" />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-2 mt-4">
          {[0, 1, 2].map((idx) => (
            <button
              key={idx}
              className={`w-2 h-2 rounded-full transition-all ${
                selectedIndex === idx ? 'bg-primary w-4' : 'bg-primary/20'
              }`}
              onClick={() => scrollTo(idx)}
            />
          ))}
        </div>

        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-4">More Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Badge variant="outline">Feature 1</Badge>
            <Badge variant="outline">Feature 2</Badge>
            <Badge variant="outline">Feature 3</Badge>
            <Badge variant="outline">Feature 4</Badge>
          </div>
        </div>
      </div>
    </section>
  );
}
