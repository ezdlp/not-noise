
import React from 'react';
import { ShieldCheck, BadgeCheck, Bot } from "lucide-react";
import { Card } from '@/components/ui/card';
import { Separator } from "@/components/ui/separator";

const GuaranteedBotFree: React.FC = () => {
  return (
    <section className="py-16 md:py-24 bg-white border-t border-gray-100">
      <div className="container mx-auto px-4 md:px-8">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-4xl font-bold mb-6 font-heading">
            Your Music Deserves Safe and Genuine Exposure
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            At Soundraiser, we ensure your music reaches only authentic, engaged listeners by rigorously vetting every playlist using the trusted platform artist.tools.
          </p>
          <div className="flex items-center justify-center space-x-4 mb-8">
            <ShieldCheck className="w-6 h-6 text-primary" />
            <p className="text-lg font-medium">
              We promise a safe promotion experience, connecting you with real fans.
            </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Authentic Playlist */}
            <Card className="p-6 border-2 border-emerald-500">
              <div className="flex items-center gap-2 mb-4">
                <BadgeCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-semibold text-emerald-700">
                  Authentic Playlist
                </h3>
              </div>
              <div className="mb-6">
                <img
                  src="/lovable-uploads/0b479d71-dd71-45e9-9ce5-e71f80f98ff2.png"
                  alt="Authentic playlist statistics"
                  className="w-full rounded-lg shadow-md"
                />
              </div>
              <Separator className="my-4" />
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-emerald-700">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Steady, organic follower growth</span>
                </li>
                <li className="flex items-center gap-2 text-emerald-700">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Consistent engagement patterns</span>
                </li>
                <li className="flex items-center gap-2 text-emerald-700">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Verified curator information</span>
                </li>
                <li className="flex items-center gap-2 text-emerald-700">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Natural monthly listener ratios</span>
                </li>
              </ul>
            </Card>

            {/* Bot-Infested Playlist */}
            <Card className="p-6 border-2 border-red-300">
              <div className="flex items-center gap-2 mb-4">
                <Bot className="w-5 h-5 text-red-600" />
                <h3 className="text-lg font-semibold text-red-700">
                  Bot-Infested Playlist
                </h3>
              </div>
              <div className="mb-6">
                <img
                  src="/lovable-uploads/7c09dfee-3f6b-4dbd-94b0-20145a4f2c4d.png"
                  alt="Bot-infested playlist statistics"
                  className="w-full rounded-lg shadow-md"
                />
              </div>
              <Separator className="my-4" />
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-red-700">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  <span>Sudden, unnatural follower spikes</span>
                </li>
                <li className="flex items-center gap-2 text-red-700">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  <span>Mass follower drops</span>
                </li>
                <li className="flex items-center gap-2 text-red-700">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  <span>Suspicious curator profiles</span>
                </li>
                <li className="flex items-center gap-2 text-red-700">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  <span>Irregular engagement metrics</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GuaranteedBotFree;
