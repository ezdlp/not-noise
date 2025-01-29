import { Link2, BarChart3, Globe2, Mail, Activity, Zap } from "lucide-react";

const features = [
  {
    icon: Link2,
    title: "One Link for All Platforms",
    description: "Create a single, powerful smart link that connects your fans to your music across all major streaming platforms. Simplify your promotion strategy and reach listeners wherever they are.",
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
    <section className="py-32 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-night font-heading">
          From One Link to Endless Plays
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="p-8 rounded-xl bg-primary-light shadow-sm hover:shadow-md transition-all duration-200"
            >
              <div className="mb-6">
                <div className="w-12 h-12 rounded-lg bg-white/50 flex items-center justify-center">
                  <feature.icon className="h-7 w-7 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-medium mb-3 text-night font-heading">{feature.title}</h3>
              <p className="text-[#333333] leading-relaxed font-sans">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};