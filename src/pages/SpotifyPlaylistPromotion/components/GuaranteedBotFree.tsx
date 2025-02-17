
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, BadgeCheck, Bot } from "lucide-react";
import CTAScrollButton from './CTAScrollButton';
import { Card } from '@/components/ui/card';
import { Toggle } from '@/components/ui/toggle';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const GuaranteedBotFree: React.FC = () => {
  const [showBotted, setShowBotted] = useState(false);

  return (
    <section className="py-16 md:py-24 bg-white">
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

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Toggle Control */}
          <div className="flex justify-center gap-4 mb-8">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Toggle
                    pressed={!showBotted}
                    onPressedChange={() => setShowBotted(false)}
                    className="data-[state=on]:bg-emerald-50 data-[state=on]:text-emerald-900 px-4 py-2"
                  >
                    <BadgeCheck className="w-4 h-4 mr-2" />
                    Authentic Playlist
                  </Toggle>
                </TooltipTrigger>
                <TooltipContent>
                  View metrics for a genuine, verified playlist
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Toggle
                    pressed={showBotted}
                    onPressedChange={() => setShowBotted(true)}
                    className="data-[state=on]:bg-red-50 data-[state=on]:text-red-900 px-4 py-2"
                  >
                    <Bot className="w-4 h-4 mr-2" />
                    Bot-Infested Playlist
                  </Toggle>
                </TooltipTrigger>
                <TooltipContent>
                  View metrics for a suspicious playlist
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Comparison View */}
          <Card className="overflow-hidden shadow-lg">
            <motion.div
              initial={false}
              animate={{ opacity: showBotted ? 1 : 0, scale: showBotted ? 1 : 0.95 }}
              transition={{ duration: 0.3 }}
              className={`absolute inset-0 ${showBotted ? 'pointer-events-auto' : 'pointer-events-none'}`}
            >
              <img
                src="/lovable-uploads/7c09dfee-3f6b-4dbd-94b0-20145a4f2c4d.png"
                alt="Bot-infested playlist statistics"
                className="w-full"
              />
            </motion.div>

            <motion.div
              initial={false}
              animate={{ opacity: !showBotted ? 1 : 0, scale: !showBotted ? 1 : 0.95 }}
              transition={{ duration: 0.3 }}
              className={`relative ${!showBotted ? 'pointer-events-auto' : 'pointer-events-none'}`}
            >
              <img
                src="/lovable-uploads/0b479d71-dd71-45e9-9ce5-e71f80f98ff2.png"
                alt="Authentic playlist statistics"
                className="w-full"
              />
            </motion.div>
          </Card>

          {/* Feature Comparison */}
          <div className="grid md:grid-cols-2 gap-6 mt-8">
            <Card className={`p-6 ${!showBotted ? 'ring-2 ring-primary ring-offset-2' : ''} transition-all`}>
              <h3 className="text-lg font-semibold mb-2 text-emerald-700 flex items-center space-x-2">
                <BadgeCheck className="w-5 h-5" />
                <span>Authentic Growth Indicators</span>
              </h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Steady, organic follower growth</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Consistent engagement patterns</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Verified curator information</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Natural monthly listener ratios</span>
                </li>
              </ul>
            </Card>

            <Card className={`p-6 ${showBotted ? 'ring-2 ring-red-500 ring-offset-2' : ''} transition-all`}>
              <h3 className="text-lg font-semibold mb-2 text-red-700 flex items-center space-x-2">
                <Bot className="w-5 h-5" />
                <span>Bot Activity Warning Signs</span>
              </h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  <span>Sudden, unnatural follower spikes</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  <span>Mass follower drops</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  <span>Suspicious curator profiles</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  <span>Irregular engagement metrics</span>
                </li>
              </ul>
            </Card>
          </div>

          <div className="mt-12 flex justify-center">
            <CTAScrollButton text="Get Real Playlist Exposure" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default GuaranteedBotFree;
