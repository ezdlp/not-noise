
import { useState } from "react";
import { ThumbsUp, ThumbsDown, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { HelpArticle as HelpArticleType } from "@/types/help";
import { HelpBreadcrumb } from "./HelpBreadcrumb";

interface HelpArticleProps {
  article: HelpArticleType;
  relatedArticles: HelpArticleType[];
  onBack: () => void;
  onArticleSelect: (articleId: string) => void;
}

export function HelpArticle({ 
  article, 
  relatedArticles, 
  onBack, 
  onArticleSelect 
}: HelpArticleProps) {
  const [feedback, setFeedback] = useState<"helpful" | "not-helpful" | null>(null);
  const category = article.category;
  
  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <HelpBreadcrumb category={category} article={article} />
        
        <Button 
          onClick={onBack}
          variant="ghost" 
          size="sm"
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 md:self-end"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Help Center
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {article.popular && (
          <Badge variant="secondary" className="text-xs">Popular</Badge>
        )}
        {article.featured && (
          <Badge variant="outline" className="bg-primary/10 text-primary text-xs">Featured</Badge>
        )}
      </div>
      
      <article>
        <h1 className="text-3xl font-bold mb-6">{article.title}</h1>
        
        <div 
          className="prose prose-lg max-w-none [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:mt-8 [&_h2]:mb-4 [&_h3]:text-xl [&_h3]:font-medium [&_h3]:mt-6 [&_h3]:mb-3 [&_p]:mb-4 [&_ul]:mt-4 [&_ul]:mb-4 [&_li]:mb-2 [&_a]:text-primary [&_a]:no-underline [&_a]:hover:underline"
          dangerouslySetInnerHTML={{ __html: article.content }} 
        />
      </article>
      
      {relatedArticles.length > 0 && (
        <div className="mt-12 pt-8 border-t">
          <h3 className="text-xl font-semibold mb-4">Related Articles</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {relatedArticles.map((relatedArticle) => (
              <button
                key={relatedArticle.id}
                onClick={() => onArticleSelect(relatedArticle.id)}
                className="p-4 border rounded-lg hover:border-primary hover:shadow-sm transition-all text-left w-full group"
              >
                <h4 className="font-medium flex items-center group-hover:text-primary transition-colors">
                  <ArrowLeft className="h-4 w-4 mr-2 rotate-180 text-primary" />
                  {relatedArticle.title}
                </h4>
              </button>
            ))}
          </div>
        </div>
      )}
      
      <div className="mt-12 pt-6 border-t">
        <h3 className="text-xl font-semibold mb-4">Was this article helpful?</h3>
        <div className="flex space-x-3">
          <Button 
            variant={feedback === "helpful" ? "default" : "outline"} 
            size="sm"
            className="gap-2" 
            onClick={() => setFeedback("helpful")}
          >
            <ThumbsUp className="h-4 w-4" />
            Yes
          </Button>
          <Button 
            variant={feedback === "not-helpful" ? "default" : "outline"} 
            size="sm"
            className="gap-2" 
            onClick={() => setFeedback("not-helpful")}
          >
            <ThumbsDown className="h-4 w-4" />
            No
          </Button>
        </div>
        
        {feedback === "not-helpful" && (
          <div className="mt-4">
            <p className="text-sm mb-2">Sorry this wasn't helpful. How can we improve this article?</p>
            <div className="flex gap-3 mt-3">
              <Button size="sm" variant="outline" asChild>
                <a href="/contact">Contact Support</a>
              </Button>
            </div>
          </div>
        )}
        
        {feedback === "helpful" && (
          <p className="mt-4 text-sm text-muted-foreground">
            Thanks for your feedback!
          </p>
        )}
        
        {!feedback && (
          <p className="mt-4 text-sm text-muted-foreground">
            Need more help? <a href="/contact" className="text-primary hover:underline">Contact Support</a>
          </p>
        )}
      </div>
    </div>
  );
}
