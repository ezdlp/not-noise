
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { PageSEO } from "@/components/seo/PageSEO";
import { Footer } from "@/components/landing/Footer";
import { BookOpen, List, BarChart3, Image as ImageIcon, HelpCircle } from "lucide-react";

// Define types for help data
interface HelpCategory {
  id: string;
  name: string;
  position: number;
}

interface HelpArticle {
  id: string;
  title: string;
  content: string;
  category_id: string;
  position: number;
}

// Simple component implementations to replace the imported ones
const HelpSidebar = ({ 
  categories = [], 
  articles = [], 
  activeArticleId = null, 
  onSelectArticle = () => {} 
}: { 
  categories: HelpCategory[]; 
  articles: HelpArticle[]; 
  activeArticleId: string | null; 
  onSelectArticle: (id: string) => void; 
}) => {
  return (
    <aside className="space-y-2">
      <div className="space-y-1">
        {categories.map((category) => (
          <div key={category.id} className="space-y-1">
            <div className="flex items-center justify-between w-full px-3 py-2 rounded-md transition-colors hover:bg-primary/5">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span className="font-medium">{category.name}</span>
              </div>
            </div>
            
            <div className="ml-9 space-y-1">
              {articles
                .filter(article => article.category_id === category.id)
                .map((article) => (
                  <button
                    key={article.id}
                    onClick={() => onSelectArticle(article.id)}
                    className={`w-full text-left px-3 py-1 text-sm rounded-md hover:bg-primary/5 ${
                      activeArticleId === article.id ? "text-primary bg-primary/10" : "text-muted-foreground"
                    }`}
                  >
                    <span className="truncate">{article.title}</span>
                  </button>
                ))}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};

const HelpArticle = ({ 
  articleId, 
  onBack 
}: { 
  articleId: string | null; 
  onBack: () => void; 
}) => {
  const { data: article, isLoading } = useQuery({
    queryKey: ["help-article", articleId],
    queryFn: async () => {
      if (!articleId) return null;
      
      const { data, error } = await supabase
        .from("help_articles")
        .select("*")
        .eq("id", articleId)
        .single();
      
      if (error) throw error;
      return data as HelpArticle;
    },
    enabled: !!articleId
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="text-center py-12">
        <p>Article not found. Please select another article.</p>
        <button 
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
        >
          Back to Help Center
        </button>
      </div>
    );
  }

  return (
    <div>
      <button 
        onClick={onBack}
        className="mb-6 text-sm text-primary hover:underline flex items-center"
      >
        ← Back to Help Center
      </button>
      
      <h1 className="text-2xl font-bold mb-4">{article.title}</h1>
      
      <div 
        className="prose max-w-none"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />
    </div>
  );
};

export default function Help() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [activeArticleId, setActiveArticleId] = useState<string | null>(null);

  // Fetch help categories and articles
  const { data: helpData, isLoading: isLoadingHelp } = useQuery({
    queryKey: ["help-content"],
    queryFn: async () => {
      const { data: categories, error: categoriesError } = await supabase
        .from("help_categories")
        .select("*")
        .order("position");

      if (categoriesError) throw categoriesError;

      const { data: articles, error: articlesError } = await supabase
        .from("help_articles")
        .select("*")
        .order("position");

      if (articlesError) throw articlesError;

      return {
        categories: categories || [],
        articles: articles || []
      };
    }
  });

  const handleArticleSelect = (articleId: string) => {
    setActiveArticleId(articleId);
    navigate(`/help/article/${articleId}`);
  };

  // Determine if we're showing the help center homepage or an article
  const showHomepage = !activeArticleId;

  // Function to render the help center homepage
  const renderHomepage = () => {
    return (
      <div className="prose max-w-full">
        <h1>Help Center</h1>
        <p className="lead">Find answers to your questions about Soundraiser</p>

        {isLoadingHelp ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-full max-w-md mb-4" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-8 w-full max-w-md mb-4" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-8">
            {helpData?.categories.map((category) => (
              <div key={category.id} className="border rounded-lg p-4 bg-background">
                <h2 className="text-lg font-semibold mb-2">{category.name}</h2>
                <ul className="space-y-2">
                  {helpData.articles
                    .filter(article => article.category_id === category.id)
                    .slice(0, 5)
                    .map(article => (
                      <li key={article.id}>
                        <button 
                          className="text-blue-500 hover:underline text-left w-full"
                          onClick={() => handleArticleSelect(article.id)}
                        >
                          {article.title}
                        </button>
                      </li>
                    ))}
                </ul>
                {helpData.articles.filter(article => article.category_id === category.id).length > 5 && (
                  <div className="mt-2">
                    <button 
                      className="text-sm text-muted-foreground hover:text-foreground"
                      onClick={() => {/* Show more articles in this category */}}
                    >
                      View more...
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
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
