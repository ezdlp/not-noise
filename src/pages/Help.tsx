import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { PageSEO } from "@/components/seo/PageSEO";
import { BookOpen, List, BarChart3, Image as ImageIcon, HelpCircle } from "lucide-react";
import { Footer } from "@/components/landing/Footer";

interface HelpCategory {
  id: string;
  name: string;
  icon?: string;
}

interface HelpArticle {
  id: string;
  title: string;
  content: string;
  category_id: string;
  slug: string;
}

interface HelpData {
  categories: HelpCategory[];
  articles: HelpArticle[];
}

function HelpSidebar({ 
  categories, 
  articles, 
  activeArticleId,
  onSelectArticle 
}: { 
  categories: HelpCategory[]; 
  articles: HelpArticle[];
  activeArticleId: string | null;
  onSelectArticle: (articleId: string) => void;
}) {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="font-medium mb-3">Categories</h3>
        <ul className="space-y-2">
          {categories.map((category) => (
            <li key={category.id}>
              <button 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors w-full text-left"
                onClick={() => {
                  const firstArticleInCategory = articles.find(a => a.category_id === category.id);
                  if (firstArticleInCategory) {
                    onSelectArticle(firstArticleInCategory.id);
                  }
                }}
              >
                {category.name}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="font-medium mb-3">Popular Articles</h3>
        <ul className="space-y-2">
          {articles.slice(0, 5).map((article) => (
            <li key={article.id}>
              <button 
                className={`text-sm ${activeArticleId === article.id ? 'text-primary font-medium' : 'text-muted-foreground'} hover:text-foreground transition-colors w-full text-left`}
                onClick={() => onSelectArticle(article.id)}
              >
                {article.title}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function HelpArticle({ 
  articleId,
  onBack
}: { 
  articleId: string | null;
  onBack: () => void;
}) {
  const { data: article, isLoading } = useQuery({
    queryKey: ['help-article', articleId],
    queryFn: async () => {
      if (!articleId) return null;
      
      const { data, error } = await supabase
        .from('help_articles')
        .select('*, help_categories(name)')
        .eq('id', articleId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!articleId,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="text-center py-12">
        <HelpCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Article Not Found</h2>
        <p className="text-muted-foreground mb-6">The article you're looking for doesn't exist or has been moved.</p>
        <button 
          onClick={onBack}
          className="text-primary hover:underline"
        >
          Return to Help Center
        </button>
      </div>
    );
  }

  return (
    <div>
      <button 
        onClick={onBack}
        className="text-sm text-muted-foreground hover:text-foreground mb-6 flex items-center"
      >
        ← Back to Help Center
      </button>
      
      <h1 className="text-3xl font-bold mb-6">{article.title}</h1>
      
      <div 
        className="prose prose-lg max-w-none [&_h2]:mt-8 [&_h2]:mb-4 [&_h3]:mt-6 [&_h3]:mb-3 [&_p]:mb-4 [&_ul]:mt-4 [&_ul]:mb-4 [&_li]:mb-2"
        dangerouslySetInnerHTML={{ __html: article.content }} 
      />
    </div>
  );
}

export default function Help() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [activeArticleId, setActiveArticleId] = useState<string | null>(null);

  // Check if we should show the homepage or an article
  const showHomepage = pathname === '/help';

  // Fetch help data (categories and articles)
  const { data: helpData, isLoading: isLoadingHelp } = useQuery({
    queryKey: ['help-data'],
    queryFn: async () => {
      // Fetch categories
      const { data: categories, error: categoriesError } = await supabase
        .from('help_categories')
        .select('*')
        .order('name');
      
      if (categoriesError) throw categoriesError;
      
      // Fetch articles
      const { data: articles, error: articlesError } = await supabase
        .from('help_articles')
        .select('*')
        .eq('status', 'published')
        .order('title');
      
      if (articlesError) throw articlesError;
      
      return { 
        categories, 
        articles 
      } as HelpData;
    },
  });

  // Handle article selection
  const handleArticleSelect = (articleId: string) => {
    setActiveArticleId(articleId);
    const article = helpData?.articles.find(a => a.id === articleId);
    if (article) {
      navigate(`/help/${article.slug}`);
    }
  };

  // Render homepage content
  const renderHomepage = () => {
    if (isLoadingHelp) {
      return (
        <div className="space-y-8">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
            {[1, 2, 3, 4].map((n) => (
              <Skeleton key={n} className="h-40" />
            ))}
          </div>
        </div>
      );
    }

    return (
      <div>
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">How can we help you?</h1>
          <p className="text-xl text-muted-foreground">
            Find answers to your questions about Soundraiser
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {helpData?.categories.map((category) => {
            // Determine icon based on category name or icon field
            let IconComponent = HelpCircle;
            if (category.name.toLowerCase().includes('smart link')) {
              IconComponent = List;
            } else if (category.name.toLowerCase().includes('analytics')) {
              IconComponent = BarChart3;
            } else if (category.name.toLowerCase().includes('design') || category.name.toLowerCase().includes('visual')) {
              IconComponent = ImageIcon;
            } else if (category.name.toLowerCase().includes('guide') || category.name.toLowerCase().includes('tutorial')) {
              IconComponent = BookOpen;
            }

            return (
              <div 
                key={category.id}
                className="border rounded-lg p-6 hover:border-primary hover:shadow-sm transition-all cursor-pointer"
                onClick={() => {
                  const firstArticleInCategory = helpData.articles.find(a => a.category_id === category.id);
                  if (firstArticleInCategory) {
                    handleArticleSelect(firstArticleInCategory.id);
                  }
                }}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="bg-primary/10 p-3 rounded-full mb-4">
                    <IconComponent className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-medium mb-2">{category.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {helpData.articles.filter(a => a.category_id === category.id).length} articles
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Popular Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {helpData?.articles.slice(0, 6).map((article) => (
              <div 
                key={article.id}
                className="p-4 border rounded-lg hover:border-primary hover:shadow-sm transition-all cursor-pointer"
                onClick={() => handleArticleSelect(article.id)}
              >
                <h3 className="font-medium mb-2">{article.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {article.content.replace(/<[^>]*>/g, '').substring(0, 120)}...
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <PageSEO
        title="Help Center | Soundraiser"
        description="Find answers to your questions about Soundraiser - smart links, promotion services, and more."
      />
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Sidebar - only show on larger screens and when not on homepage */}
          {!showHomepage && (
            <div className="hidden md:block md:col-span-3 lg:col-span-3">
              {isLoadingHelp ? (
                <div className="space-y-4">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-8 w-full mt-6" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : (
                <HelpSidebar
                  categories={helpData?.categories || []}
                  articles={helpData?.articles || []}
                  activeArticleId={activeArticleId}
                  onSelectArticle={handleArticleSelect}
                />
              )}
            </div>
          )}
          
          {/* Main content */}
          <div className={`md:col-span-${showHomepage ? '12' : '9'} lg:col-span-${showHomepage ? '12' : '9'}`}>
            {showHomepage ? (
              renderHomepage()
            ) : (
              <HelpArticle 
                articleId={activeArticleId} 
                onBack={() => {
                  setActiveArticleId(null);
                  navigate('/help');
                }}
              />
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
