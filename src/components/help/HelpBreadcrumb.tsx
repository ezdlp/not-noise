
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { HelpCategory, HelpArticle } from "@/types/help";

interface HelpBreadcrumbProps {
  category?: HelpCategory | null;
  article?: HelpArticle | null;
}

export function HelpBreadcrumb({ category, article }: HelpBreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex items-center text-sm text-muted-foreground">
        <li>
          <Link to="/help" className="hover:text-foreground transition-colors">
            Help Center
          </Link>
        </li>
        
        {category && (
          <>
            <li className="mx-2 text-muted-foreground">
              <ChevronRight className="h-4 w-4" />
            </li>
            <li>
              {article ? (
                <Link to={`/help/category/${category.id}`} className="hover:text-foreground transition-colors">
                  {category.name}
                </Link>
              ) : (
                <span>{category.name}</span>
              )}
            </li>
          </>
        )}
        
        {article && (
          <>
            <li className="mx-2 text-muted-foreground">
              <ChevronRight className="h-4 w-4" />
            </li>
            <li className="max-w-[250px] truncate">
              <span>{article.title}</span>
            </li>
          </>
        )}
      </ol>
    </nav>
  );
}
