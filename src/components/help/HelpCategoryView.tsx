
import { HelpArticleCard } from "./HelpArticleCard";
import { HelpBreadcrumb } from "./HelpBreadcrumb";
import { HelpCategory, HelpArticle } from "@/types/help";
import { Separator } from "@/components/ui/separator";

interface HelpCategoryViewProps {
  category: HelpCategory;
  articles: HelpArticle[];
  onSelectArticle: (articleId: string) => void;
}

export function HelpCategoryView({
  category,
  articles,
  onSelectArticle
}: HelpCategoryViewProps) {
  // Helper function to create article excerpt
  const createExcerpt = (content: string, length = 120) => {
    const strippedContent = content.replace(/<[^>]*>/g, '');
    return strippedContent.length > length 
      ? `${strippedContent.substring(0, length)}...` 
      : strippedContent;
  };
  
  // Group articles by featured and regular
  const featuredArticles = articles.filter(article => article.featured);
  const regularArticles = articles.filter(article => !article.featured);
  
  const Icon = category.icon;
  
  return (
    <div>
      <HelpBreadcrumb category={category} />
      
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-primary/10 rounded-md">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">{category.name}</h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl">
          {category.description}
        </p>
      </div>
      
      {featuredArticles.length > 0 && (
        <div className="mb-10">
          <h2 className="text-xl font-semibold mb-4">Featured Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {featuredArticles.map(article => (
              <HelpArticleCard
                key={article.id}
                id={article.id}
                slug={article.slug}
                title={article.title}
                excerpt={createExcerpt(article.content)}
                featured={true}
                popular={article.popular}
                className="h-full"
              />
            ))}
          </div>
        </div>
      )}
      
      <div>
        <h2 className="text-xl font-semibold mb-4">All Articles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {regularArticles.map(article => (
            <HelpArticleCard
              key={article.id}
              id={article.id}
              slug={article.slug}
              title={article.title}
              excerpt={createExcerpt(article.content)}
              popular={article.popular}
              className="h-full"
            />
          ))}
        </div>
      </div>
      
      {articles.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No articles found in this category. Check back soon!
          </p>
        </div>
      )}
    </div>
  );
}
