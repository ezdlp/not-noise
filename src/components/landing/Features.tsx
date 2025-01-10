import { BarChart3, Globe, Clock, Heart, Zap } from "lucide-react";

const features = [
  {
    icon: Globe,
    title: "Expand Your Reach",
    description: "Are you ready to take your music beyond your current fanbase? Our Smart Links make it simple to reach new listeners across the globe, wherever they stream music.",
    image: "/lovable-uploads/expand-reach.png"
  },
  {
    icon: Zap,
    title: "Streamline Your Marketing",
    description: "Simplify your marketing efforts with one link for promotions of all streaming platforms. Our Music Smart Links make sharing music as you launch and promote it across social media campaigns.",
    image: "/lovable-uploads/streamline-marketing.png"
  },
  {
    icon: BarChart3,
    title: "Track Results",
    description: "Understand your audience better with Smart Link Analytics. Discover which songs resonate, where you need to up your approach to reach more engagement.",
    image: "/lovable-uploads/track-results.png"
  },
  {
    icon: Clock,
    title: "Maximize Your Time",
    description: "Enhance your flow in the music industry. Our Smart Link generator does the work for you, instantly pulling together all your streaming links and pre-filling it page. Just one click and under 30 seconds is all it takes. More time to create and promote your music.",
    image: "/lovable-uploads/maximize-time.png"
  },
  {
    icon: Heart,
    title: "Enhance Fan Experience",
    description: "Give your fans an experience they'll love. Smart pages are simple yet functional, beautifully designed and load at lightning speed. This minimizes fan friction and keeps the experience smooth as they discover and listen to your latest tracks.",
    image: "/lovable-uploads/enhance-fans.png"
  }
];

export const Features = () => {
  return (
    <section className="py-20 px-4 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
          From One Link to Endless Plays
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="p-6 rounded-xl bg-white shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="relative mb-6 rounded-lg overflow-hidden">
                <img 
                  src={feature.image} 
                  alt={feature.title}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-4 left-4 bg-black/10 backdrop-blur-sm p-2 rounded-full">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};