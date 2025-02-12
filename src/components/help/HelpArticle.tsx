
import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface HelpArticleProps {
  title: string;
  content: string;
  icon: LucideIcon;
}

export function HelpArticle({ title, content, icon: Icon }: HelpArticleProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-4">
          <div className="p-2 rounded-lg bg-primary/5">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-muted-foreground whitespace-pre-line">
          {content}
        </div>
      </CardContent>
    </Card>
  );
}
