
import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HelpSearchResult, HelpArticle } from "@/types/help";

interface HelpSearchResultsProps {
  searchQuery: string;
  searchResults: HelpSearchResult[];
  popularArticles: HelpArticle[];
  onSelectArticle: (articleId: string) => void;
  onClearSearch: () => void;
}

export function HelpSearchResults({
  searchQuery,
  searchResults,
  popularArticles,
  onSelectArticle,
  onClearSearch
}: HelpSearchResultsProps) {
  const [highlightedResults, setHighlightedResults] = useState<{ article: HelpArticle, excerpt: string }[]>([]);
  
  useEffect(() => {
    // Generate excerpts with highlighted search terms
    if (searchQuery.trim()) {
      const results = searchResults.map(result => {
        const { article } = result;
        const plainContent = article.content.replace(/<[^>]*>/g, '');
        
        // Try to find the search term in the content
        const index = plainContent.toLowerCase().indexOf(searchQuery.toLowerCase());
        let excerpt = '';
        
        if (index >= 0) {
          // Extract context around the match
          const start = Math.max(0, index - 60);
          const end = Math.min(plainContent.length, index + searchQuery.length + 60);
          excerpt = plainContent.substring(start, end);
          
          // Add ellipsis if we're not starting at the beginning or ending at the end
          if (start > 0) excerpt = '...' + excerpt;
          if (end < plainContent.length) excerpt = excerpt + '...';
        } else {
          // If no match in content, just take the beginning
          excerpt = plainContent.substring(0, 150) + '...';
        }
        
        return { article, excerpt };
      });
      
      setHighlightedResults(results);
    }
  }, [searchResults, searchQuery]);
  
  if (searchResults.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="bg-primary/5 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <Search className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No results found</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          We couldn't find any articles matching "{searchQuery}". Try different keywords or check out the popular articles below.
        </p>
        
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={onClearSearch}
        >
          Clear Search
        </Button>
        
        <div className="mt-8">
          <h3 className="text-lg font-medium mb-4">Popular Articles</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {popularArticles.slice(0, 4).map(article => (
              <button
                key={article.id}
                onClick={() => onSelectArticle(article.id)}
                className="p-4 border rounded-lg hover:border-primary hover:shadow-sm transition-all text-left"
              >
                <h4 className="font-medium">{article.title}</h4>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center mb-4">
        <p className="text-muted-foreground">
          Found {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'} for "{searchQuery}"
        </p>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={onClearSearch}
        >
          Clear Search
        </Button>
      </div>
      
      <div className="grid gap-4">
        {highlightedResults.map(({ article, excerpt }) => (
          <button
            key={article.id}
            onClick={() => onSelectArticle(article.id)}
            className="p-4 border rounded-lg hover:border-primary hover:shadow-sm transition-all text-left w-full"
          >
            <div className="flex items-start gap-3">
              <div>
                <h3 className="font-medium mb-1">{article.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {excerpt}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                    {article.category?.name || 'General'}
                  </span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
