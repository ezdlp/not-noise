interface TrustedLabelsProps {
  isPricingPage?: boolean;
}

export const TrustedLabels = ({ isPricingPage = false }: TrustedLabelsProps) => {
  return (
    <section className="py-20 px-4 bg-gradient-to-b from-primary-light/30 to-primary-light/10">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-semibold text-neutral-night mb-12 font-heading">
          {isPricingPage 
            ? "Trusted by 10,000+ artists, including talent from major labels"
            : "Trusted by artists from these labels"
          }
        </h2>
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-20">
          {[
            { src: "/lovable-uploads/home/capitol-records.png", alt: "Capitol Records", height: "h-12" },
            { src: "/lovable-uploads/home/Def_Jam_Recording.png", alt: "Def Jam", height: "h-12" },
            { src: "/lovable-uploads/home/Universal_Music_Group.png", alt: "Universal Music", height: "h-12" },
            { src: "/lovable-uploads/home/1024px-Columbia_Records_.png", alt: "Columbia Records", height: "h-10" },
          ].map((logo) => (
            <img 
              key={logo.alt}
              src={logo.src} 
              alt={logo.alt} 
              className={`${logo.height} opacity-60 hover:opacity-100 transition-all duration-300 transform hover:scale-105`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};