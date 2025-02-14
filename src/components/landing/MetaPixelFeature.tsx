
import { Card } from "@/components/ui/card";

export function MetaPixelFeature() {
  return (
    <section className="py-12 md:py-20">
      <div className="container px-4 mx-auto">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Meta Pixel Integration
          </h2>
          <p className="text-lg text-muted-foreground">
            Track conversions and build custom audiences with Meta Pixel integration.
          </p>
        </div>

        <div className="relative">
          <Card className="overflow-hidden">
            <div className="h-[250px] md:h-[500px] relative">
              <img
                src="/lovable-uploads/meta-pixel-integration.png"
                alt="Meta Pixel Integration"
                className="w-full h-full object-contain"
              />
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
