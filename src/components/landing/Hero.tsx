import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export const Hero = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-20">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent gradient-primary">
          One Link for All Your Music
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Create beautiful landing pages for your music. Share your tracks across all streaming platforms with a single link.
        </p>
        <Button size="lg" className="button-gradient">
          Create Your Smart Link <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
      <div className="mt-16 animate-float">
        <img
          src="https://images.unsplash.com/photo-1488590528505-98d2b5aba04b"
          alt="Smart Link Preview"
          className="rounded-lg shadow-2xl max-w-sm mx-auto"
        />
      </div>
    </div>
  );
};