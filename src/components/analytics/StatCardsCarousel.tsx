
import { useState, useCallback, useEffect } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { StatCard } from './StatCard';

interface StatCardsCarouselProps {
  stats: Array<{
    title: string;
    value: string | number;
    type: 'views' | 'clicks' | 'ctr';
    trend?: number;
  }>;
}

export const StatCardsCarousel = ({ stats }: StatCardsCarouselProps) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: false,
    dragFree: true,
    containScroll: 'trimSnaps',
    align: 'start',
  });

  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    
    emblaApi.on('select', onSelect);
    onSelect(); // Initialize with current slide
    
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <div className="relative">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {stats.map((stat, index) => (
            <div 
              key={index}
              className="flex-[0_0_90%] min-w-0 pl-4 first:pl-0"
            >
              <StatCard {...stat} />
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-center gap-2 mt-4">
        {stats.map((_, index) => (
          <button
            key={index}
            className={`w-2 h-2 rounded-full transition-all ${
              index === selectedIndex ? 'bg-primary' : 'bg-neutral-200'
            }`}
            onClick={() => emblaApi?.scrollTo(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
