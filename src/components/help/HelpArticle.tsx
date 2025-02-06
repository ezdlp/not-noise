
import { LucideIcon } from "lucide-react";

interface HelpArticleProps {
  title: string;
  content: string;
  icon: LucideIcon;
}

export function HelpArticle({ title, content, icon: Icon }: HelpArticleProps) {
  return (
    <article className="p-6 bg-white rounded-lg border border-border">
      <div className="flex items-start gap-4">
        <div className="p-2 rounded-lg bg-primary/5">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">{title}</h3>
          <div className="text-muted-foreground whitespace-pre-line">
            {content}
          </div>
        </div>
      </div>
    </article>
  );
}
