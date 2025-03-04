
import React from 'react';
import { Eye, MousePointer, Target, TrendingUp, TrendingDown, HelpCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from '@/components/ui/skeleton';

interface StatCardProps {
  title: string | React.ReactNode;
  value: string | number;
  type: 'views' | 'clicks' | 'ctr' | 'spotify';
  trend?: number;
  isLoading?: boolean;
  customIcon?: React.ReactNode;
}

const iconMap = {
  views: Eye,
  clicks: MousePointer,
  ctr: Target,
  spotify: null, // We'll use customIcon for this
};

export function StatCard({ 
  title, 
  value, 
  type, 
  trend, 
  isLoading = false,
  customIcon 
}: StatCardProps) {
  const Icon = iconMap[type];
  
  return (
    <Card className="p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-md bg-white border border-neutral-border h-full flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-[#6B7280] font-dm-sans">
          {title}
        </h3>
        {customIcon || (Icon && <Icon size={16} className="text-primary" />)}
      </div>
      
      {isLoading ? (
        <Skeleton className="h-8 w-20 mb-2" />
      ) : (
        <p className="text-2xl font-semibold text-[#111827] font-poppins mb-2">{value}</p>
      )}
      
      {trend !== undefined && (
        isLoading ? (
          <Skeleton className="h-5 w-16" />
        ) : (
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
                } animate-fade-in font-dm-sans`}
              >
                {Math.abs(trend)}{type === 'spotify' ? '' : '%'}
              </span>
            </div>
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle size={14} className="text-[#6B7280] hover:text-primary transition-colors" />
                </TooltipTrigger>
                <TooltipContent className="bg-white border border-neutral-border shadow-md">
                  <p className="text-sm font-dm-sans">
                    {type === 'spotify' 
                      ? 'Change in popularity score over the last 7 days'
                      : 'Compared to previous week (last 7 days vs 7-14 days ago)'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )
      )}
    </Card>
  );
}
