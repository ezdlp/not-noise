
import { OptimizedImage } from "@/components/ui/optimized-image";

interface TrustedLabelsProps {
  isPricingPage?: boolean;
}

export const TrustedLabels = ({ isPricingPage = false }: TrustedLabelsProps) => {
  return (
    <section className="py-12 md:py-20 px-4 bg-gradient-to-b from-primary-light/30 to-primary-light/10">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-2xl md:text-4xl font-semibold text-neutral-night mb-8 md:mb-12 font-heading">
          {isPricingPage 
            ? "Trusted by 10,000+ artists, including talent from major labels"
            : "Trusted by artists from these labels"
          }
        </h2>
        <div className="flex flex-wrap justify-center items-center gap-6 md:gap-20">
          {[
            { 
              src: "/lovable-uploads/home/capitol-records.png", 
              alt: "Capitol Records", 
              height: "h-8 md:h-12",
              width: { mobile: 96, desktop: 144 } // 32px * 3 for mobile, 48px * 3 for desktop (maintaining aspect ratio)
            },
            { 
              src: "/lovable-uploads/home/Def_Jam_Recording.png", 
              alt: "Def Jam", 
              height: "h-8 md:h-12",
              width: { mobile: 96, desktop: 144 }
            },
            { 
              src: "/lovable-uploads/home/Universal_Music_Group.png", 
              alt: "Universal Music", 
              height: "h-8 md:h-12",
              width: { mobile: 96, desktop: 144 }
            },
            { 
              src: "/lovable-uploads/home/1024px-Columbia_Records_.png", 
              alt: "Columbia Records", 
              height: "h-7 md:h-10",
              width: { mobile: 84, desktop: 120 } // 28px * 3 for mobile, 40px * 3 for desktop
            },
          ].map((logo) => (
            <div key={logo.alt} className="relative group">
              <OptimizedImage 
                src={logo.src} 
                alt={logo.alt} 
                className={`${logo.height} w-auto opacity-50 hover:opacity-100 transition-all duration-300 transform hover:scale-105`}
                width={logo.width.desktop}
                height={48} // Maximum height (desktop)
                sizes={`(max-width: 768px) ${logo.width.mobile}px, ${logo.width.desktop}px`}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

