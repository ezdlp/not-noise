import { Link2, BarChart3, Globe2, Mail, Activity, Zap } from "lucide-react";

const features = [
  {
    icon: Link2,
    title: "One Link for All Platforms",
    description: "Create a single, powerful smart link that connects your fans to your music across all major streaming platforms.",
    gradient: "from-[#FF0080] to-[#7928CA]",
    image: "/lovable-uploads/1312b6ce-b7d7-473c-8627-3a0fdb32da04.png"
  },
  {
    icon: Activity,
    title: "Meta Pixel Integration",
    description: "Track conversions and retarget your audience with built-in Meta Pixel support.",
    gradient: "from-[#7928CA] to-[#FF0080]",
    image: "/lovable-uploads/d852ef07-009f-4bf3-b033-645c174fb5d5.png"
  },
  {
    icon: Mail,
    title: "Email List Building",
    description: "Turn passive listeners into engaged fans with our email capture feature.",
    gradient: "from-[#FF4D4D] to-[#F9CB28]",
    image: "/lovable-uploads/e709fc84-dd53-4a41-be18-f0a50ed7e297.png"
  },
  {
    icon: BarChart3,
    title: "Real-Time Analytics",
    description: "Make data-driven decisions with comprehensive analytics across platforms.",
    gradient: "from-[#00DFD8] to-[#007CF0]",
    image: "/lovable-uploads/1c70ed85-bf94-44e9-9e08-37bfd96123f4.png"
  },
  {
    icon: Globe2,
    title: "Global Reach",
    description: "Automatically detect your fans' location and direct them to their preferred service.",
    gradient: "from-[#7928CA] to-[#FF0080]",
    image: "/lovable-uploads/54d53ec6-a05d-4cf2-ae38-13515de09118.png"
  },
  {
    icon: Zap,
    title: "Lightning Fast Setup",
    description: "Create professional smart links in seconds with our streamlined process.",
    gradient: "from-[#FF4D4D] to-[#F9CB28]",
    image: "/lovable-uploads/fb2d5a27-a139-4b3c-b391-64e6690afca2.png"
  },
];

export const Features = () => {
  return (
    <section className="py-32 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-night font-heading">
          From One Link to Endless Plays
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group relative rounded-xl overflow-hidden hover:-translate-y-1 transition-all duration-300"
            >
              {/* Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} opacity-90`}></div>
              
              {/* Content */}
              <div className="relative p-8 h-full flex flex-col">
                <div className="mb-6">
                  <div className="w-12 h-12 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-medium mb-3 text-white font-heading">{feature.title}</h3>
                <p className="text-white/90 leading-relaxed font-sans mb-6">{feature.description}</p>
                
                {/* Feature Image */}
                <div className="mt-auto">
                  <img 
                    src={feature.image} 
                    alt={feature.title}
                    className="w-full rounded-lg shadow-lg transform group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};