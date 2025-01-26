import { Link2, BarChart3, Globe2, Mail, Activity, Zap } from "lucide-react";

const features = [
  {
    icon: Link2,
    title: "One Link for All Platforms",
    description: "Create a single, powerful smart link that connects your fans to your music across all streaming platforms. Simplify your promotion strategy and reach listeners wherever they are.",
  },
  {
    icon: Activity,
    title: "Meta Pixel Integration",
    description: "Track conversions and retarget your audience with built-in Meta Pixel support. Create custom audiences from your link visitors and optimize your ad campaigns for better ROI.",
  },
  {
    icon: Mail,
    title: "Email List Building",
    description: "Turn passive listeners into engaged fans with our email capture feature. Build your mailing list directly through your smart link and own your audience data.",
  },
  {
    icon: BarChart3,
    title: "Real-Time Analytics",
    description: "Make data-driven decisions with comprehensive analytics. Track views, clicks, and conversion rates across platforms to understand what resonates with your audience.",
  },
  {
    icon: Globe2,
    title: "Global Reach",
    description: "Automatically detect your fans' location and direct them to their preferred local streaming service. Remove friction and increase streams with smart geographic routing.",
  },
  {
    icon: Zap,
    title: "Lightning Fast Setup",
    description: "Create professional smart links in seconds, not minutes. Our streamlined process automatically pulls your music data and pre-fills your page, saving you valuable time.",
  },
];

export const Features = () => {
  return (
    <section className="py-20 px-4 bg-gradient-to-b from-white to-softLavender">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-neonPurple font-heading">
          From One Link to Endless Plays
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className={`p-8 rounded-xl border border-transparent shadow-lg hover:shadow-xl transition-all duration-300 ${
                index % 3 === 0 ? 'bg-gradient-to-br from-neonPurple/10 to-electricPink/10' :
                index % 3 === 1 ? 'bg-gradient-to-br from-oceanBlue/10 to-neonGreen/10' :
                'bg-gradient-to-br from-vividOrange/10 to-vibrantYellow/10'
              }`}
            >
              <div className="mb-6">
                <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center group">
                  <feature.icon className={`h-6 w-6 ${
                    index % 3 === 0 ? 'text-neonPurple' :
                    index % 3 === 1 ? 'text-oceanBlue' :
                    'text-vividOrange'
                  } group-hover:scale-110 transition-all duration-300`} />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-3 text-onyx font-heading">{feature.title}</h3>
              <p className="text-gray-700 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};