
import React from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { CalendarClock, Calculator } from "lucide-react";

interface CalculatorFormProps {
  streamCount: number;
  setStreamCount: (count: number) => void;
  timeframe: "monthly" | "yearly";
  setTimeframe: (timeframe: "monthly" | "yearly") => void;
}

export const CalculatorForm = ({ 
  streamCount, 
  setStreamCount, 
  timeframe, 
  setTimeframe 
}: CalculatorFormProps) => {
  const handleStreamCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setStreamCount(parseInt(value) || 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-2">
          <Label htmlFor="streamCount">Number of Streams</Label>
          <div className="relative">
            <Input
              id="streamCount"
              type="text"
              value={streamCount.toLocaleString()}
              onChange={handleStreamCountChange}
              className="pl-10 text-lg"
              placeholder="Enter number of streams"
            />
            <Calculator className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Timeframe</Label>
          <ToggleGroup
            type="single"
            value={timeframe}
            onValueChange={(value) => value && setTimeframe(value as "monthly" | "yearly")}
            className="justify-start"
          >
            <ToggleGroupItem value="monthly" className="gap-2">
              <CalendarClock className="w-4 h-4" />
              Monthly
            </ToggleGroupItem>
            <ToggleGroupItem value="yearly" className="gap-2">
              <CalendarClock className="w-4 h-4" />
              Yearly
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>
    </div>
  );
};
