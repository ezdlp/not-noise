
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ChevronRight, 
  ChevronDown,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { HelpCategory, HelpArticle } from "@/types/help";

interface HelpNavigationProps {
  categories: HelpCategory[];
  articles: HelpArticle[];
  activeArticleId: string | null;
  activeCategoryId: string | null;
  onSelectArticle: (articleId: string) => void;
  onSelectCategory: (categoryId: string) => void;
  className?: string;
}

export function HelpNavigation({
  categories,
  articles,
  activeArticleId,
  activeCategoryId,
  onSelectArticle,
  onSelectCategory,
  className
}: HelpNavigationProps) {
  const navigate = useNavigate();
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  
  // Initialize expanded state based on active category
  useEffect(() => {
    if (activeCategoryId) {
      setExpandedCategories(prev => ({
        ...prev,
        [activeCategoryId]: true
      }));
    }
  }, [activeCategoryId]);
  
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };
  
  return (
    <div className={cn("flex flex-col h-full", className)}>
      <div className="flex-1 overflow-auto">
        <h3 className="font-medium text-lg mb-3">Help Topics</h3>
        <nav className="space-y-1">
          {categories.map((category) => {
            const categoryArticles = articles.filter(a => a.category_id === category.id);
            const isExpanded = expandedCategories[category.id] || false;
            const Icon = category.icon;
            
            return (
              <div key={category.id} className="mb-2">
                <button 
                  className={cn(
                    "flex items-center justify-between w-full px-3 py-2 text-sm rounded-md transition-colors hover:bg-primary/5", 
                    activeCategoryId === category.id ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground"
                  )}
                  onClick={() => {
                    onSelectCategory(category.id);
                    toggleCategory(category.id);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span>{category.name}</span>
                  </div>
                  {isExpanded ? 
                    <ChevronDown className="h-4 w-4" /> : 
                    <ChevronRight className="h-4 w-4" />
                  }
                </button>
                
                {isExpanded && (
                  <div className="pl-9 mt-1 space-y-1">
                    {categoryArticles.map((article) => (
                      <button 
                        key={article.id}
                        className={cn(
                          "w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors hover:bg-primary/5",
                          activeArticleId === article.id ? "text-primary font-medium" : "text-muted-foreground"
                        )}
                        onClick={() => onSelectArticle(article.id)}
                      >
                        {article.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>
      
      <div className="mt-6">
        <Separator className="mb-6" />
        <div className="p-4 bg-primary/5 rounded-lg">
          <h4 className="font-medium mb-2">Need more help?</h4>
          <p className="text-sm text-muted-foreground mb-3">
            Can't find what you're looking for? Our support team is here to help.
          </p>
          <Button className="w-full" asChild>
            <a href="/contact" className="flex items-center justify-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Contact Support
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
