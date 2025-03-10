
import React, { ReactNode } from "react";

interface SmartLinkContainerProps {
  children: ReactNode;
  artworkUrl: string;
  hideBranding?: boolean;
}

const SmartLinkContainer = ({ children, artworkUrl, hideBranding }: SmartLinkContainerProps) => {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: `url(${artworkUrl})`,
          filter: 'blur(30px) brightness(0.7)',
          transform: 'scale(1.1)'
        }}
      />

      <div className="relative w-full max-w-md mx-auto px-4 py-8 z-10">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 shadow-xl">
          {children}
        </div>
        
        {!hideBranding && (
          <div className="mt-8 text-center">
            <a 
              href="https://soundraiser.io" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-white/80 hover:text-white transition-colors group"
            >
              <img 
                src="/lovable-uploads/soundraiser-logo/Iso A.svg"
                alt="Soundraiser"
                className="h-5 w-5 opacity-80 group-hover:opacity-100 transition-opacity"
              />
              <span className="text-sm font-medium">Powered by Soundraiser</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartLinkContainer;
