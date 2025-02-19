
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface StatCardProps {
  title: string;
  value: number;
  previousValue: number;
  type?: string;
  description?: string;
  trend?: number;
}

export function StatCard({ title, value, previousValue, description, type, trend }: StatCardProps) {
  const percentChange = trend ?? (previousValue > 0 
    ? ((value - previousValue) / previousValue) * 100
    : 0);

  return (
    <Card className="p-6 space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      <p className="text-2xl font-bold">{value.toLocaleString()}</p>
      {(previousValue > 0 || trend !== undefined) && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="flex items-center gap-1 text-sm">
              {percentChange >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
              <span className={percentChange >= 0 ? "text-green-500" : "text-red-500"}>
                {Math.abs(percentChange).toFixed(1)}%
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>Compared to previous period</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
    </Card>
  );
}
