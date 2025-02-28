
import { IconType } from "@/types/help";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface HelpCategoryCardProps {
  id: string;
  name: string;
  description: string;
  icon: IconType;
  articleCount: number;
  className?: string;
}

export function HelpCategoryCard({ 
  id, 
  name, 
  description, 
  icon: Icon, 
  articleCount, 
  className 
}: HelpCategoryCardProps) {
  return (
    <Link to={`/help/category/${id}`}>
      <Card className={cn("h-full transition-all hover:shadow-md hover:border-primary/50", className)}>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-primary/10 rounded-md">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <Badge variant="outline" className="text-xs">
              {articleCount} {articleCount === 1 ? 'article' : 'articles'}
            </Badge>
          </div>
          <CardTitle className="text-lg">{name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
