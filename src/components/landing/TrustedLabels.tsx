export const TrustedLabels = () => {
  return (
    <section className="py-16 px-4 bg-primary-light">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-2xl font-medium text-night mb-10 font-heading">
          Trusted by Leading Music Labels
        </h2>
        <div className="flex justify-center items-center gap-16 flex-wrap">
          {[
            { src: "/lovable-uploads/home/capitol-records.png", alt: "Capitol Records", height: "h-6" },
            { src: "/lovable-uploads/home/Def_Jam_Recording.png", alt: "Def Jam", height: "h-8" },
            { src: "/lovable-uploads/home/Universal_Music_Group.png", alt: "Universal Music", height: "h-8" },
            { src: "/lovable-uploads/home/1024px-Columbia_Records_.png", alt: "Columbia Records", height: "h-6" },
          ].map((logo) => (
            <img 
              key={logo.alt}
              src={logo.src} 
              alt={logo.alt} 
              className={`${logo.height} opacity-70 hover:opacity-100 transition-opacity`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};