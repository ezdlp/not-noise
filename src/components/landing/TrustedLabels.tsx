export const TrustedLabels = () => {
  return (
    <section className="py-12 px-4 bg-white/50 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-xl font-medium text-gray-600 mb-10 font-poppins">
          Trusted by artists from these labels
        </h2>
        <div className="flex justify-center items-center gap-16 flex-wrap">
          <img src="/lovable-uploads/home/capitol-records.png" alt="Capitol Records" className="h-14 opacity-50 hover:opacity-100 transition-opacity duration-300" />
          <img src="/lovable-uploads/home/Def_Jam_Recording.png" alt="Def Jam" className="h-14 opacity-50 hover:opacity-100 transition-opacity duration-300" />
          <img src="/lovable-uploads/home/Universal_Music_Group.png" alt="Universal Music" className="h-14 opacity-50 hover:opacity-100 transition-opacity duration-300" />
          <img src="/lovable-uploads/home/1024px-Columbia_Records_.png" alt="Columbia Records" className="h-14 opacity-50 hover:opacity-100 transition-opacity duration-300" />
        </div>
      </div>
    </section>
  );
};