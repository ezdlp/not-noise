
import { HelpCategoryCard } from "./HelpCategoryCard";
import { HelpArticleCard } from "./HelpArticleCard";
import { HelpCategory, HelpArticle } from "@/types/help";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface HelpHomeProps {
  categories: HelpCategory[];
  articles: HelpArticle[];
  featuredArticles: HelpArticle[];
  popularArticles: HelpArticle[];
  onSelectArticle: (articleId: string) => void;
}

export function HelpHome({
  categories,
  articles,
  featuredArticles,
  popularArticles,
  onSelectArticle
}: HelpHomeProps) {
  // Helper function to create article excerpt
  const createExcerpt = (content: string, length = 120) => {
    const strippedContent = content.replace(/<[^>]*>/g, '');
    return strippedContent.length > length 
      ? `${strippedContent.substring(0, length)}...` 
      : strippedContent;
  };
  
  return (
    <div>
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-4">How can we help you?</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Find answers to your questions about Soundraiser's music promotion tools and services
        </p>
      </div>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Browse by Category</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <HelpCategoryCard
              key={category.id}
              id={category.id}
              name={category.name}
              description={category.description}
              icon={category.icon}
              articleCount={articles.filter(a => a.category_id === category.id).length}
            />
          ))}
        </div>
      </section>
      
      <section>
        <Tabs defaultValue="featured" className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Popular Articles</h2>
            <TabsList>
              <TabsTrigger value="featured">Featured</TabsTrigger>
              <TabsTrigger value="popular">Most Viewed</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="featured" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {featuredArticles.map((article) => (
                <HelpArticleCard
                  key={article.id}
                  id={article.id}
                  slug={article.slug}
                  title={article.title}
                  excerpt={createExcerpt(article.content)}
                  featured={article.featured}
                  popular={article.popular}
                />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="popular" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {popularArticles.map((article) => (
                <HelpArticleCard
                  key={article.id}
                  id={article.id}
                  slug={article.slug}
                  title={article.title}
                  excerpt={createExcerpt(article.content)}
                  featured={article.featured}
                  popular={article.popular}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}
