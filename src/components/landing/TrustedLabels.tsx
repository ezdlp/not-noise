export const TrustedLabels = () => {
  return (
    <section className="py-12 px-4 bg-neutral overflow-hidden">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-xl font-medium text-onyx mb-10 font-heading">
          Trusted by artists from these labels
        </h2>
        <div className="relative">
          <div className="flex space-x-16 animate-marquee">
            <img src="/lovable-uploads/home/capitol-records.png" alt="Capitol Records" className="h-14 opacity-70 hover:opacity-100 transition-opacity" />
            <img src="/lovable-uploads/home/Def_Jam_Recording.png" alt="Def Jam" className="h-14 opacity-70 hover:opacity-100 transition-opacity" />
            <img src="/lovable-uploads/home/Universal_Music_Group.png" alt="Universal Music" className="h-14 opacity-70 hover:opacity-100 transition-opacity" />
            <img src="/lovable-uploads/home/1024px-Columbia_Records_.png" alt="Columbia Records" className="h-14 opacity-70 hover:opacity-100 transition-opacity" />
            {/* Duplicate for seamless loop */}
            <img src="/lovable-uploads/home/capitol-records.png" alt="Capitol Records" className="h-14 opacity-70 hover:opacity-100 transition-opacity" />
            <img src="/lovable-uploads/home/Def_Jam_Recording.png" alt="Def Jam" className="h-14 opacity-70 hover:opacity-100 transition-opacity" />
            <img src="/lovable-uploads/home/Universal_Music_Group.png" alt="Universal Music" className="h-14 opacity-70 hover:opacity-100 transition-opacity" />
            <img src="/lovable-uploads/home/1024px-Columbia_Records_.png" alt="Columbia Records" className="h-14 opacity-70 hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </div>
    </section>
  );
};