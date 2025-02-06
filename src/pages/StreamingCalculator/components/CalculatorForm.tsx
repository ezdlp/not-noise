
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Calculator, Users2, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CalculatorFormProps {
  count: number;
  setCount: (count: number) => void;
  calculationType: "streams" | "monthlyListeners";
  setCalculationType: (type: "streams" | "monthlyListeners") => void;
}

const calculationLabels = {
  streams: {
    input: "Number of Streams",
    placeholder: "Enter total number of streams",
    tooltip: "Calculate earnings based on total stream count"
  },
  monthlyListeners: {
    input: "Monthly Listeners",
    placeholder: "Enter number of monthly listeners",
    tooltip: "Earnings calculated based on average 3 streams per listener monthly"
  }
};

export const CalculatorForm = ({ 
  count, 
  setCount, 
  calculationType,
  setCalculationType
}: CalculatorFormProps) => {
  const handleCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setCount(parseInt(value) || 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-2">
            <Label>Calculation Type</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Choose between calculating by total streams or monthly listeners</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <ToggleGroup
            type="single"
            value={calculationType}
            onValueChange={(value) => value && setCalculationType(value as "streams" | "monthlyListeners")}
            className="justify-start"
          >
            <ToggleGroupItem value="streams" className="gap-2">
              <Calculator className="w-4 h-4" />
              Total Streams
            </ToggleGroupItem>
            <ToggleGroupItem value="monthlyListeners" className="gap-2">
              <Users2 className="w-4 h-4" />
              Monthly Listeners
            </ToggleGroupItem>
          </ToggleGroup>

          <div className="space-y-2">
            <Label htmlFor="count">{calculationLabels[calculationType].input}</Label>
            <div className="relative">
              <Input
                id="count"
                type="text"
                value={count.toLocaleString()}
                onChange={handleCountChange}
                className="pl-10 text-lg"
                placeholder={calculationLabels[calculationType].placeholder}
              />
              {calculationType === "streams" ? (
                <Calculator className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              ) : (
                <Users2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {calculationLabels[calculationType].tooltip}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
