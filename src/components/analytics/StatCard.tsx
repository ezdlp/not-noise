
import React from 'react';
import { Eye, MousePointer, Target, TrendingUp, TrendingDown, HelpCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface StatCardProps {
  title: string;
  value: string | number;
  type: 'views' | 'clicks' | 'ctr';
  trend?: number;
}

const iconMap = {
  views: Eye,
  clicks: MousePointer,
  ctr: Target,
};

export function StatCard({ title, value, type, trend }: StatCardProps) {
  const Icon = iconMap[type];
  
  return (
    <Card className="p-6 transition-all duration-300 hover:translate-y-[-2px] hover:shadow-md bg-white">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-muted-foreground font-dm-sans">{title}</h3>
        <Icon size={16} className="text-primary" />
      </div>
      <p className="text-2xl font-semibold text-neutral-night font-poppins mb-2">{value}</p>
      {trend !== undefined && (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {trend >= 0 ? (
              <TrendingUp size={14} className="text-success animate-fade-in" />
            ) : (
              <TrendingDown size={14} className="text-destructive animate-fade-in" />
            )}
            <span 
              className={`text-sm font-medium ${
                trend >= 0 ? 'text-success' : 'text-destructive'
              } animate-fade-in`}
            >
              {Math.abs(trend)}%
            </span>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle size={14} className="text-muted-foreground hover:text-primary transition-colors" />
              </TooltipTrigger>
              <TooltipContent className="bg-white border border-neutral-border shadow-md">
                <p className="text-sm">Compared to previous week (last 7 days vs 7-14 days ago)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
    </Card>
  );
}
