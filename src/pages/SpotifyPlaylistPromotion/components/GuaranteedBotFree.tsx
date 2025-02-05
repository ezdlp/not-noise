
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeftRight, ShieldCheck, BadgeCheck, Bot } from "lucide-react";

const GuaranteedBotFree: React.FC = () => {
  const [showBotted, setShowBotted] = useState(false);

  return (
    <section className="py-20 bg-white">
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

        <div className="relative max-w-4xl mx-auto">
          {/* Updated control panel with better visibility */}
          <div className="absolute top-8 left-1/2 -translate-x-1/2 z-20">
            <div className="bg-white/95 backdrop-blur-xl shadow-lg rounded-full px-6 py-3 flex items-center space-x-4 border border-white/20">
              <button
                onClick={() => setShowBotted(false)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-300 ${
                  !showBotted ? 'bg-primary text-white shadow-md scale-[1.02]' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <BadgeCheck className="w-4 h-4" />
                <span className="font-medium">Authentic</span>
              </button>
              <ArrowLeftRight className="w-4 h-4 text-gray-400" />
              <button
                onClick={() => setShowBotted(true)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-300 ${
                  showBotted ? 'bg-red-500 text-white shadow-md scale-[1.02]' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Bot className="w-4 h-4" />
                <span className="font-medium">Bot-Infested</span>
              </button>
            </div>
          </div>

          <div className="relative rounded-xl overflow-hidden shadow-lg">
            {/* Dark overlay for better contrast */}
            <div className="absolute inset-0 bg-black/10 pointer-events-none z-10"></div>

            <motion.div
              initial={false}
              animate={{ opacity: showBotted ? 1 : 0, scale: showBotted ? 1 : 0.95 }}
              transition={{ duration: 0.3 }}
              className={`absolute inset-0 ${showBotted ? 'pointer-events-auto' : 'pointer-events-none'}`}
            >
              {/* Bot-infested Playlist */}
              <div className="relative">
                <img
                  src="/lovable-uploads/7c09dfee-3f6b-4dbd-94b0-20145a4f2c4d.png"
                  alt="Bot-infested playlist statistics"
                  className="w-full"
                />
                <div className="absolute top-24 left-4 bg-red-500/90 text-white px-6 py-3 rounded-lg backdrop-blur-sm shadow-lg flex items-center space-x-2">
                  <Bot className="w-5 h-5" />
                  <span className="text-sm font-medium">Bot-Infested Playlist Example</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={false}
              animate={{ opacity: !showBotted ? 1 : 0, scale: !showBotted ? 1 : 0.95 }}
              transition={{ duration: 0.3 }}
              className={`relative ${!showBotted ? 'pointer-events-auto' : 'pointer-events-none'}`}
            >
              {/* Authentic Playlist */}
              <div className="relative">
                <img
                  src="/lovable-uploads/0b479d71-dd71-45e9-9ce5-e71f80f98ff2.png"
                  alt="Authentic playlist statistics"
                  className="w-full"
                />
                <div className="absolute top-24 left-4 bg-emerald-500/90 text-white px-6 py-3 rounded-lg backdrop-blur-sm shadow-lg flex items-center space-x-2">
                  <BadgeCheck className="w-5 h-5" />
                  <span className="text-sm font-medium">Authentic Playlist Example</span>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="mt-8 grid md:grid-cols-2 gap-6">
            <div className={`p-6 rounded-lg ${!showBotted ? 'bg-emerald-50 border-2 border-emerald-200' : 'bg-gray-50 border-2 border-transparent'} transition-colors`}>
              <h3 className="text-lg font-semibold mb-2 text-emerald-700 flex items-center space-x-2">
                <BadgeCheck className="w-5 h-5" />
                <span>Authentic Growth Indicators</span>
              </h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Steady, organic follower growth</li>
                <li>• Consistent engagement patterns</li>
                <li>• Verified curator information</li>
                <li>• Natural monthly listener ratios</li>
              </ul>
            </div>
            <div className={`p-6 rounded-lg ${showBotted ? 'bg-red-50 border-2 border-red-200' : 'bg-gray-50 border-2 border-transparent'} transition-colors`}>
              <h3 className="text-lg font-semibold mb-2 text-red-700 flex items-center space-x-2">
                <Bot className="w-5 h-5" />
                <span>Bot Activity Warning Signs</span>
              </h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Sudden, unnatural follower spikes</li>
                <li>• Mass follower drops</li>
                <li>• Suspicious curator profiles</li>
                <li>• Irregular engagement metrics</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GuaranteedBotFree;

