
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { MessageSquare, ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { HelpCategory, HelpArticle } from "@/types/help";

interface HelpSidebarProps {
  categories: HelpCategory[];
  articles: HelpArticle[];
  activeArticleId: string | null;
  activeCategoryId: string | null;
  onSelectArticle: (articleId: string) => void;
  onSelectCategory: (categoryId: string) => void;
  className?: string;
}

export function HelpSidebar({
  categories,
  articles,
  activeArticleId,
  activeCategoryId,
  onSelectArticle,
  onSelectCategory,
  className
}: HelpSidebarProps) {
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
    <div className={cn("space-y-6", className)}>
      <div className="sticky top-24">
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
        
        <div className="mt-8 p-4 bg-primary/5 rounded-lg">
          <h4 className="font-medium mb-2">Need more help?</h4>
          <p className="text-sm text-muted-foreground mb-3">
            Can't find what you're looking for? Reach out to our support team.
          </p>
          <Button size="sm" className="w-full" asChild>
            <a href="/contact">
              <MessageSquare className="h-4 w-4 mr-2" />
              Contact Support
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
