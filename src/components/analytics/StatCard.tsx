
import React from 'react';
import { Eye, MousePointer, Target, TrendingUp, TrendingDown, HelpCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';

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

const bgColorMap = {
  views: 'bg-primary/10',
  clicks: 'bg-emerald-100',
  ctr: 'bg-rose-100',
};

const iconColorMap = {
  views: 'text-primary',
  clicks: 'text-emerald-600',
  ctr: 'text-rose-600',
};

export function StatCard({ title, value, type, trend }: StatCardProps) {
  const Icon = iconMap[type];
  
  return (
    <Card className="p-6 bg-white border-neutral-border transition-colors duration-200 hover:bg-neutral-seasalt/50">
      <div className="flex items-center justify-between mb-3">
        <div className={cn("p-2 rounded-lg", bgColorMap[type])}>
          <Icon size={18} className={cn(iconColorMap[type])} />
        </div>
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      </div>
      <p className="text-2xl font-semibold text-neutral-night">{value}</p>
      {trend !== undefined && (
        <div className="flex items-center gap-2 mt-4">
          <div className="flex items-center gap-1">
            {trend >= 0 ? (
              <TrendingUp size={14} className="text-emerald-600" />
            ) : (
              <TrendingDown size={14} className="text-rose-600" />
            )}
            <span className={`text-sm ${trend >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {Math.abs(trend)}%
            </span>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle size={14} className="text-muted-foreground/70 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">Compared to previous week (last 7 days vs 7-14 days ago)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
    </Card>
  );
}
