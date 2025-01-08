import { Music, Share2, BarChart3 } from "lucide-react";

const features = [
  {
    icon: Music,
    title: "Music First",
    description: "Showcase your music beautifully with custom landing pages designed for artists.",
  },
  {
    icon: Share2,
    title: "Share Everywhere",
    description: "One link to share your music across all major streaming platforms.",
  },
  {
    icon: BarChart3,
    title: "Track Performance",
    description: "Get insights into how your music is performing with detailed analytics.",
  },
];

export const Features = () => {
  return (
    <section className="py-20 px-4 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          Why Musicians Choose Soundraiser
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="p-6 rounded-lg bg-white shadow-lg hover:shadow-xl transition-shadow"
            >
              <feature.icon className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};