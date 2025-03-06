
import React, { ReactElement } from "react";
import { Tooltip, TooltipProps } from "recharts";
import { cn } from "@/lib/utils";

export type ChartConfig = {
  grid?: boolean;
  legend?: boolean;
  xAxis?: boolean;
  yAxis?: boolean;
  aspectRatio?: string;
  tooltipType?: "standard" | "custom";
}

interface ChartContainerProps {
  children: ReactElement;
  config?: ChartConfig;
  className?: string;
}

export function ChartContainer({
  children,
  config = {
    grid: true,
    legend: true,
    xAxis: true,
    yAxis: true,
    aspectRatio: "3/2",
    tooltipType: "standard"
  },
  className,
}: ChartContainerProps) {
  return (
    <div className={cn("w-full rounded-lg border bg-card p-6", className)}>
      {children}
    </div>
  );
}

interface ChartTooltipProps extends Omit<TooltipProps<number, string>, 'formatter'> {
  formatter?: (value: number, name: string, props: any, index: number) => React.ReactNode;
}

export function ChartTooltip({ 
  active, 
  payload, 
  label, 
  formatter,
  ...rest 
}: ChartTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <div className="text-sm font-medium">{label}</div>
        {payload.map((item: any, index: number) => (
          <div
            key={`item-${index}`}
            className="flex items-center text-xs"
          >
            <div
              className="mr-1 h-2 w-2 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="font-medium">
              {item.name}:
            </span>
            <span className="ml-1">
              {formatter ? formatter(item.value, item.name, item, index) : item.value}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return null;
}
