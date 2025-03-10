
import React from "react";

const SmartLinkError = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 shadow-xl max-w-md w-full mx-4">
        <h1 className="text-2xl font-semibold text-center text-gray-900 mb-4">Link Not Found</h1>
        <p className="text-center text-gray-600">
          This link may have been removed or is temporarily unavailable.
        </p>
      </div>
    </div>
  );
};

export default SmartLinkError;
