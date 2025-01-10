export const TrustedLabels = () => {
  return (
    <section className="py-16 px-4">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-xl font-medium text-gray-600 mb-8">
          Trusted by artists from these labels
        </h2>
        <div className="flex justify-center items-center gap-12 flex-wrap">
          <img src="/lovable-uploads/home/capitol-records.png" alt="Capitol Records" className="h-12 opacity-80 hover:opacity-100 transition-opacity" />
          <img src="/lovable-uploads/home/Def_Jam_Recording.png" alt="Def Jam" className="h-12 opacity-80 hover:opacity-100 transition-opacity" />
          <img src="/lovable-uploads/home/Universal_Music_Group.png" alt="Universal Music" className="h-12 opacity-80 hover:opacity-100 transition-opacity" />
          <img src="/lovable-uploads/home/1024px-Columbia_Records_.png" alt="Columbia Records" className="h-12 opacity-80 hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </section>
  );
};