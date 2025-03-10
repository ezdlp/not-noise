
import React from "react";
import { Loader2 } from "lucide-react";

const SmartLinkLoader = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-xl text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
        <p className="text-center mt-4 text-gray-600 font-medium">Loading your music...</p>
      </div>
    </div>
  );
};

export default SmartLinkLoader;
