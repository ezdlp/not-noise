
import { Card } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { Eye, MousePointer, Target, TrendingUp, TrendingDown } from "lucide-react";

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
  const isMobile = useIsMobile();
  const Icon = iconMap[type];
  
  return (
    <Card className="p-4 md:p-6 transition-all duration-200 hover:translate-y-[-1px] hover:bg-neutral-seasalt/5">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <Icon size={16} className="text-primary opacity-70" />
      </div>
      <p className="text-xl md:text-2xl font-semibold text-neutral-night">{value}</p>
      {trend !== undefined && !isMobile && (
        <div className="flex items-center gap-2 mt-2">
          {trend >= 0 ? (
            <TrendingUp size={14} className="text-success" />
          ) : (
            <TrendingDown size={14} className="text-destructive" />
          )}
          <span className={`text-sm ${trend >= 0 ? 'text-success' : 'text-destructive'}`}>
            {Math.abs(trend)}%
          </span>
        </div>
      )}
    </Card>
  );
}
