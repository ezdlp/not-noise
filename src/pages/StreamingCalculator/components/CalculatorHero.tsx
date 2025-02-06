
import React from "react";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export const CalculatorHero = () => {
  return (
    <div className="relative py-20">
      {/* Content */}
      <div className="relative container mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
          Music Streaming Royalty Calculator
        </h1>
        <div className="space-y-4">
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Calculate your potential earnings across major streaming platforms using the latest 2025 rates. 
            Get accurate estimates based on streams or monthly listeners.
          </p>
          
          <div className="flex items-center justify-center gap-2 text-white/80 text-sm md:text-base">
            <Info className="w-4 h-4" />
            <Tooltip>
              <TooltipTrigger className="max-w-xl text-left">
                These calculations are estimates based on average rates. Actual earnings may vary as streaming platforms use complex formulas that consider factors like subscription type, geographic location, and total platform revenue rather than a fixed per-stream rate.
              </TooltipTrigger>
              <TooltipContent className="max-w-sm">
                Estimated earnings. Actual revenue depends on factors like listener location and subscription type.
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
};
