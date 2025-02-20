
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
            { src: "/lovable-uploads/home/capitol-records.png", alt: "Capitol Records", height: "h-8 md:h-12", width: 160 },
            { src: "/lovable-uploads/home/Def_Jam_Recording.png", alt: "Def Jam", height: "h-8 md:h-12", width: 160 },
            { src: "/lovable-uploads/home/Universal_Music_Group.png", alt: "Universal Music", height: "h-8 md:h-12", width: 160 },
            { src: "/lovable-uploads/home/1024px-Columbia_Records_.png", alt: "Columbia Records", height: "h-7 md:h-10", width: 140 },
          ].map((logo) => (
            <div key={logo.alt} className={logo.height}>
              <OptimizedImage 
                src={logo.src}
                alt={logo.alt}
                width={logo.width}
                height={48}
                objectFit="contain"
                className="opacity-50 hover:opacity-100 transition-all duration-300 transform hover:scale-105 h-full"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
