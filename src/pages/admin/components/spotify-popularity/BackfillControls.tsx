
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface BackfillControlsProps {
  batchSize: number;
  isRunning: boolean;
  onBatchSizeChange: (size: number) => void;
  onReset: () => void;
  onRun: () => void;
}

export function BackfillControls({ 
  batchSize, 
  isRunning, 
  onBatchSizeChange, 
  onReset, 
  onRun 
}: BackfillControlsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="batchSize">Batch Size</Label>
        <Input
          id="batchSize"
          type="number"
          value={batchSize}
          onChange={(e) => onBatchSizeChange(parseInt(e.target.value) || 10)}
          disabled={isRunning}
          min={1}
          max={50}
        />
        <p className="text-sm text-muted-foreground">
          Number of links to process in each batch (1-50)
        </p>
      </div>
    </div>
  );
}

export function BackfillFooterControls({ 
  isRunning, 
  onReset, 
  onRun 
}: Pick<BackfillControlsProps, 'isRunning' | 'onReset' | 'onRun'>) {
  return (
    <div className="flex justify-between">
      <Button variant="outline" onClick={onReset} disabled={isRunning}>
        Reset
      </Button>
      <Button 
        onClick={onRun} 
        disabled={isRunning}
        className="bg-[#6851FB] hover:bg-[#4A47A5] text-white"
      >
        {isRunning ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Running...
          </>
        ) : (
          'Run Backfill'
        )}
      </Button>
    </div>
  );
}
