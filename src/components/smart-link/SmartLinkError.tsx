
import React from "react";
import { AlertTriangle } from "lucide-react";

const SmartLinkError = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-xl max-w-md w-full mx-4 text-center">
        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
        <h1 className="text-2xl font-semibold text-gray-900 mb-3">Link Not Found</h1>
        <p className="text-gray-600">
          This link may have been removed or is temporarily unavailable.
        </p>
        <div className="mt-6">
          <a 
            href="https://soundraiser.io" 
            className="text-primary hover:text-primary/80 font-medium transition-colors"
          >
            Return to Soundraiser
          </a>
        </div>
      </div>
    </div>
  );
};

export default SmartLinkError;
