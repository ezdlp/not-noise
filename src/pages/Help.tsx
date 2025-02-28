
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { PageSEO } from "@/components/seo/PageSEO";
import { BookOpen, List, BarChart3, Image as ImageIcon, HelpCircle } from "lucide-react";
import { Footer } from "@/components/landing/Footer";
import { cn } from "@/lib/utils";

// Export the interfaces for use in other components
export interface HelpCategory {
  id: string;
  name: string;
  icon?: string;
}

export interface HelpArticle {
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
      
      // Instead of fetching from a non-existent table, we'll use mock data
      // This would normally come from the database
      const mockArticles = [
        {
          id: '1',
          title: 'Getting Started with Smart Links',
          content: `
            <h2>Getting Started with Smart Links</h2>
            <p>Smart Links are a powerful way to share your music across all streaming platforms with a single link. Here's how to get started:</p>
            <h3>Step 1: Create Your Smart Link</h3>
            <p>Navigate to the dashboard and click "Create New Smart Link". Enter your song or album title and artist name.</p>
            <h3>Step 2: Add Streaming Platforms</h3>
            <p>Add links to your music on different streaming platforms. You can manually enter links or let our system search for them automatically.</p>
            <h3>Step 3: Customize Your Link</h3>
            <p>Add artwork, change your URL slug, and set up additional options like email capture or Meta Pixel tracking.</p>
            <h3>Step 4: Share Your Link</h3>
            <p>Copy your Smart Link and share it on social media, in your bio, or wherever you promote your music!</p>
          `,
          category_id: 'smartlinks',
          slug: 'getting-started-with-smart-links',
          category: { name: 'Smart Links' }
        },
        {
          id: '2',
          title: 'Understanding Analytics',
          content: `
            <h2>Understanding Your Analytics Dashboard</h2>
            <p>Your Smart Link analytics provide valuable insights into how fans are interacting with your music.</p>
            <h3>Views vs. Clicks</h3>
            <p>Views represent how many times your Smart Link page was loaded. Clicks show how many times visitors clicked through to a streaming platform.</p>
            <h3>Click-Through Rate (CTR)</h3>
            <p>This percentage shows how many people who viewed your link clicked on a streaming platform. A higher CTR means your link is effectively converting views to platform visits.</p>
            <h3>Geographic Data</h3>
            <p>See where your fans are located around the world. This can help with planning promotions, tours, and targeted advertising.</p>
            <h3>Platform Popularity</h3>
            <p>Understand which streaming platforms your audience prefers. This can inform your promotional strategy and help you focus on the platforms where your fans are most active.</p>
          `,
          category_id: 'analytics',
          slug: 'understanding-analytics',
          category: { name: 'Analytics & Tracking' }
        }
      ];
      
      return mockArticles.find(a => a.id === articleId) || null;
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

  // Use mock data instead of fetching from non-existent tables
  const { data: helpData, isLoading: isLoadingHelp } = useQuery({
    queryKey: ['help-data'],
    queryFn: async () => {
      // Since the tables don't exist, we'll use mock data
      const mockCategories: HelpCategory[] = [
        { id: 'getting-started', name: 'Getting Started', icon: 'BookOpen' },
        { id: 'smartlinks', name: 'Smart Links', icon: 'List' },
        { id: 'analytics', name: 'Analytics & Tracking', icon: 'BarChart3' },
        { id: 'design', name: 'Design & Customization', icon: 'Image' },
        { id: 'support', name: 'Support', icon: 'HelpCircle' }
      ];
      
      const mockArticles: HelpArticle[] = [
        {
          id: '1',
          title: 'Getting Started with Smart Links',
          content: '<p>Smart Links guide content...</p>',
          category_id: 'smartlinks',
          slug: 'getting-started-with-smart-links'
        },
        {
          id: '2',
          title: 'Understanding Analytics',
          content: '<p>Analytics guide content...</p>',
          category_id: 'analytics',
          slug: 'understanding-analytics'
        },
        {
          id: '3',
          title: 'Customizing Your Smart Link',
          content: '<p>Customization guide content...</p>',
          category_id: 'design',
          slug: 'customizing-your-smart-link'
        },
        {
          id: '4',
          title: 'Frequently Asked Questions',
          content: '<p>FAQ content...</p>',
          category_id: 'support',
          slug: 'frequently-asked-questions'
        },
        {
          id: '5',
          title: 'Creating Your Account',
          content: '<p>Account creation guide...</p>',
          category_id: 'getting-started',
          slug: 'creating-your-account'
        },
        {
          id: '6',
          title: 'Email Capture Setup',
          content: '<p>Email capture guide...</p>',
          category_id: 'smartlinks',
          slug: 'email-capture-setup'
        }
      ];
      
      return { 
        categories: mockCategories, 
        articles: mockArticles 
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
          <div className={cn(
            "md:col-span-9 lg:col-span-9",
            showHomepage && "md:col-span-12 lg:col-span-12"
          )}>
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
