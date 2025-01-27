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
    highlighted: true,
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
    <section className="py-20 px-4 bg-white relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 w-72 h-72 bg-accent rounded-full mix-blend-multiply filter blur-xl"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-secondary rounded-full mix-blend-multiply filter blur-xl"></div>
      </div>
      
      <div className="max-w-6xl mx-auto relative">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 font-heading text-onyx">
          From One Link to Endless Plays
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className={`p-8 rounded-xl border transition-all duration-300 hover:translate-y-[-8px] hover:shadow-xl ${
                feature.highlighted 
                  ? 'bg-accent text-white border-accent' 
                  : 'bg-neutral border-primary/10 hover:bg-gradient-to-br hover:from-secondary/10 hover:to-transparent'
              }`}
              style={{
                transitionDelay: `${index * 100}ms`
              }}
            >
              <div className="mb-6">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  feature.highlighted 
                    ? 'bg-white/20' 
                    : 'bg-secondary/10'
                }`}>
                  <feature.icon className={`h-6 w-6 ${
                    feature.highlighted 
                      ? 'text-white' 
                      : 'text-secondary'
                  }`} />
                </div>
              </div>
              <h3 className={`text-xl font-bold mb-3 font-heading ${
                feature.highlighted ? 'text-white' : 'text-onyx'
              }`}>
                {feature.title}
              </h3>
              <p className={`leading-relaxed ${
                feature.highlighted ? 'text-white/90' : 'text-onyx/80'
              }`}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};