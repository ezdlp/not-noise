
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface HelpArticleCardProps {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  popular?: boolean;
  featured?: boolean;
  className?: string;
}

export function HelpArticleCard({ 
  id,
  slug,
  title,
  excerpt,
  popular,
  featured,
  className
}: HelpArticleCardProps) {
  return (
    <Link to={`/help/${slug}`} className={cn("group", className)}>
      <div className="p-4 border rounded-lg hover:border-primary hover:shadow-sm transition-all">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-medium group-hover:text-primary transition-colors">
            {title}
          </h3>
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
        
        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
          {excerpt}
        </p>
        
        {(popular || featured) && (
          <div className="flex gap-2">
            {popular && <Badge variant="secondary" className="text-xs">Popular</Badge>}
            {featured && <Badge variant="outline" className="bg-primary/10 text-primary text-xs">Featured</Badge>}
          </div>
        )}
      </div>
    </Link>
  );
}
