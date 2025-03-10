
import React from 'react';
import { Progress } from "@/components/ui/progress";

interface BackfillProgressProps {
  progress: number;
  processed: number;
  totalEstimate: number;
}

export function BackfillProgress({ progress, processed, totalEstimate }: BackfillProgressProps) {
  if (totalEstimate <= 0) return null;
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <span className="text-sm font-medium">Progress</span>
        <span className="text-sm text-muted-foreground">
          {processed} / ~{totalEstimate} links
        </span>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
}
