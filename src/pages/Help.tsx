
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { PageSEO } from "@/components/seo/PageSEO";
import { 
  BookOpen, 
  List, 
  BarChart3, 
  Image as ImageIcon, 
  HelpCircle, 
  Search, 
  ChevronRight,
  Home,
  ArrowLeft
} from "lucide-react";
import { Footer } from "@/components/landing/Footer";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarHeader, 
  SidebarContent, 
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger
} from "@/components/ui/sidebar";

// Export the interfaces for use in other components
export interface HelpCategory {
  id: string;
  name: string;
  icon?: string;
  description?: string;
}

export interface HelpArticle {
  id: string;
  title: string;
  content: string;
  category_id: string;
  slug: string;
  excerpt?: string;
}

interface HelpData {
  categories: HelpCategory[];
  articles: HelpArticle[];
}

// Mock data - this would come from an API in a real application
const mockCategories: HelpCategory[] = [
  { 
    id: 'getting-started', 
    name: 'Getting Started', 
    icon: 'BookOpen',
    description: 'Learn the basics of Soundraiser and how to set up your account.'
  },
  { 
    id: 'smartlinks', 
    name: 'Smart Links', 
    icon: 'List',
    description: 'Create and customize Smart Links for your music releases.'
  },
  { 
    id: 'analytics', 
    name: 'Analytics & Tracking', 
    icon: 'BarChart3',
    description: 'Understand your audience and track performance metrics.'
  },
  { 
    id: 'design', 
    name: 'Design & Customization', 
    icon: 'Image',
    description: 'Customize the look and feel of your Smart Links.'
  },
  { 
    id: 'support', 
    name: 'Support', 
    icon: 'HelpCircle',
    description: 'Get help with common issues and contact our support team.'
  }
];
  
const mockArticles: HelpArticle[] = [
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
    excerpt: 'Learn how to create and share your first Smart Link to promote your music across all platforms.'
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
    excerpt: 'Learn how to interpret your Smart Link analytics and gain insights about your audience.'
  },
  {
    id: '3',
    title: 'Customizing Your Smart Link',
    content: `
      <h2>Customizing Your Smart Link</h2>
      <p>Make your Smart Link stand out with custom designs and features.</p>
      <h3>Adding Custom Backgrounds</h3>
      <p>Upload your own background image or choose from our gallery of templates.</p>
      <h3>Custom Colors</h3>
      <p>Match your brand by customizing the colors of buttons, text, and other elements.</p>
      <h3>Custom Domain</h3>
      <p>Use your own domain for a more professional look (Premium feature).</p>
      <h3>Responsive Design</h3>
      <p>Your Smart Link will look great on any device, from desktop to mobile.</p>
    `,
    category_id: 'design',
    slug: 'customizing-your-smart-link',
    excerpt: 'Learn how to customize the appearance of your Smart Links to match your brand.'
  },
  {
    id: '4',
    title: 'Frequently Asked Questions',
    content: `
      <h2>Frequently Asked Questions</h2>
      <h3>What is Soundraiser?</h3>
      <p>Soundraiser is a platform built to empower independent musicians with digital tools to amplify their reach and get their music heard. We offer Smart Links, promotional services, and more.</p>
      <h3>How much does it cost?</h3>
      <p>We offer both free and premium plans. Check our pricing page for details.</p>
      <h3>Can I cancel anytime?</h3>
      <p>Yes, you can cancel your subscription at any time.</p>
      <h3>How do I contact support?</h3>
      <p>You can reach our support team via email at support@soundraiser.com or through the chat widget in your dashboard.</p>
    `,
    category_id: 'support',
    slug: 'frequently-asked-questions',
    excerpt: 'Find answers to common questions about Soundraiser.'
  },
  {
    id: '5',
    title: 'Creating Your Account',
    content: `
      <h2>Creating Your Soundraiser Account</h2>
      <p>Get started with Soundraiser by creating your account.</p>
      <h3>Step 1: Sign Up</h3>
      <p>Visit soundraiser.com and click "Sign Up" in the top right corner.</p>
      <h3>Step 2: Enter Your Information</h3>
      <p>Fill out the registration form with your name, email, and password.</p>
      <h3>Step 3: Verify Your Email</h3>
      <p>Check your inbox for a verification email and click the link to verify your account.</p>
      <h3>Step 4: Complete Your Profile</h3>
      <p>Add your artist name, profile picture, and other details to complete your profile.</p>
    `,
    category_id: 'getting-started',
    slug: 'creating-your-account',
    excerpt: 'Learn how to create and set up your Soundraiser account.'
  },
  {
    id: '6',
    title: 'Email Capture Setup',
    content: `
      <h2>Setting Up Email Capture</h2>
      <p>Grow your mailing list by capturing emails through your Smart Links.</p>
      <h3>Enabling Email Capture</h3>
      <p>In your Smart Link editor, toggle on the "Email Capture" option.</p>
      <h3>Customizing Your Form</h3>
      <p>Customize the form fields, messaging, and appearance to match your brand.</p>
      <h3>Integrating with Email Services</h3>
      <p>Connect your Mailchimp, ConvertKit, or other email service to automatically add subscribers to your list.</p>
      <h3>Downloading Your Leads</h3>
      <p>Export your captured emails as a CSV file to use with any email marketing service.</p>
    `,
    category_id: 'smartlinks',
    slug: 'email-capture-setup',
    excerpt: 'Learn how to set up email capture on your Smart Links to grow your fan base.'
  },
  {
    id: '7',
    title: 'Geographic Data Analysis',
    content: `
      <h2>Analyzing Geographic Data</h2>
      <p>Understand where your audience is coming from to better target your marketing efforts.</p>
      <h3>Viewing Geographic Data</h3>
      <p>In your analytics dashboard, navigate to the "Geography" section to see a breakdown of your audience by country, region, and city.</p>
      <h3>Using Geographic Insights</h3>
      <p>Use this data to plan tours, target ads, and customize your marketing messaging for different regions.</p>
      <h3>Exporting Geographic Reports</h3>
      <p>Export your geographic data as a CSV file for further analysis or to share with your team.</p>
    `,
    category_id: 'analytics',
    slug: 'geographic-data-analysis',
    excerpt: 'Learn how to analyze and use geographic data to better understand your audience.'
  },
  {
    id: '8',
    title: 'Troubleshooting Common Issues',
    content: `
      <h2>Troubleshooting Common Issues</h2>
      <p>Solutions to frequently encountered problems on Soundraiser.</p>
      <h3>Smart Link Not Working</h3>
      <p>If your Smart Link isn't working, check that all your streaming links are valid and that your link hasn't been deactivated.</p>
      <h3>Analytics Not Showing</h3>
      <p>If your analytics aren't showing, try clearing your cache or waiting a few minutes for the data to process.</p>
      <h3>Payment Issues</h3>
      <p>For payment-related issues, check that your payment method is valid and up to date in your account settings.</p>
      <h3>Account Access Problems</h3>
      <p>If you're having trouble accessing your account, use the "Forgot Password" option or contact our support team for assistance.</p>
    `,
    category_id: 'support',
    slug: 'troubleshooting-common-issues',
    excerpt: 'Find solutions to common problems you might encounter while using Soundraiser.'
  }
];

function HelpSidebar({ 
  categories,
  articles,
  activeArticle,
  activeCategory,
  onSelectArticle,
  onSelectCategory 
}: { 
  categories: HelpCategory[];
  articles: HelpArticle[];
  activeArticle: HelpArticle | null;
  activeCategory: HelpCategory | null;
  onSelectArticle: (articleId: string) => void;
  onSelectCategory: (categoryId: string) => void;
}) {
  const [openCategories, setOpenCategories] = useState<string[]>([]);
  
  useEffect(() => {
    // Open the category of the active article
    if (activeArticle) {
      setOpenCategories(prev => 
        prev.includes(activeArticle.category_id) 
          ? prev 
          : [...prev, activeArticle.category_id]
      );
    }
    
    // Open the active category
    if (activeCategory) {
      setOpenCategories(prev => 
        prev.includes(activeCategory.id) 
          ? prev 
          : [...prev, activeCategory.id]
      );
    }
  }, [activeArticle, activeCategory]);

  const handleToggleCategory = (categoryId: string) => {
    setOpenCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId) 
        : [...prev, categoryId]
    );
  };

  return (
    <ScrollArea className="h-[calc(100vh-180px)]">
      <div className="pr-4 py-4">
        <div className="space-y-1">
          <Button 
            variant="ghost" 
            className="w-full justify-start mb-2"
            onClick={() => onSelectCategory('')}
          >
            <Home className="mr-2 h-4 w-4" />
            Help Center Home
          </Button>
          
          <Separator className="my-4" />
          
          <div className="text-sm font-medium text-muted-foreground mb-2">Categories</div>
          
          <Accordion
            type="multiple"
            value={openCategories}
            className="space-y-1"
          >
            {categories.map((category) => {
              // Get articles for this category
              const categoryArticles = articles.filter(
                article => article.category_id === category.id
              );
              
              // Determine icon
              let Icon = HelpCircle;
              if (category.icon === 'BookOpen') Icon = BookOpen;
              if (category.icon === 'List') Icon = List;
              if (category.icon === 'BarChart3') Icon = BarChart3;
              if (category.icon === 'Image') Icon = ImageIcon;
              if (category.icon === 'HelpCircle') Icon = HelpCircle;
              
              return (
                <AccordionItem 
                  key={category.id} 
                  value={category.id}
                  className="border-none"
                >
                  <AccordionTrigger 
                    onClick={(e) => {
                      e.preventDefault();
                      handleToggleCategory(category.id);
                      if (!openCategories.includes(category.id)) {
                        onSelectCategory(category.id);
                      }
                    }}
                    className={cn(
                      "py-2 px-3 rounded-md hover:bg-muted hover:no-underline",
                      activeCategory?.id === category.id && "bg-primary/10 text-primary hover:bg-primary/10"
                    )}
                  >
                    <div className="flex items-center">
                      <Icon className="h-4 w-4 mr-2" />
                      <span className="text-sm">{category.name}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-1 pt-1">
                    <div className="ml-6 border-l pl-3 space-y-1">
                      {categoryArticles.map((article) => (
                        <Button
                          key={article.id}
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "w-full justify-start text-sm font-normal h-8",
                            activeArticle?.id === article.id ? "bg-primary/5 text-primary" : "text-muted-foreground"
                          )}
                          onClick={() => onSelectArticle(article.id)}
                        >
                          {article.title}
                        </Button>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
        
        <Separator className="my-4" />
        
        <div className="text-sm text-muted-foreground">
          <p className="mb-2">Need more help?</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-start mb-2"
          >
            Contact Support
          </Button>
        </div>
      </div>
    </ScrollArea>
  );
}

function HelpArticleContent({ 
  article,
  categories,
  articles,
  onBack,
  onSelectArticle
}: { 
  article: HelpArticle;
  categories: HelpCategory[];
  articles: HelpArticle[];
  onBack: () => void;
  onSelectArticle: (articleId: string) => void;
}) {
  const category = categories.find(c => c.id === article.category_id);
  const relatedArticles = articles
    .filter(a => a.category_id === article.category_id && a.id !== article.id)
    .slice(0, 3);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center text-sm text-muted-foreground mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          className="p-0 h-auto font-normal"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <span className="mx-2">/</span>
        <span>{category?.name}</span>
        <ChevronRight className="h-4 w-4 mx-1" />
        <span className="text-foreground">{article.title}</span>
      </div>
      
      <div className="space-y-6">
        <div
          className="prose prose-lg max-w-none [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:mt-8 [&_h2]:mb-4 [&_h3]:text-xl [&_h3]:font-medium [&_h3]:mt-6 [&_h3]:mb-3 [&_p]:mb-4 [&_ul]:mt-4 [&_ul]:mb-4 [&_li]:mb-2"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
        
        <div className="border-t pt-8 mt-12">
          <h3 className="text-lg font-semibold mb-4">Related Articles</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {relatedArticles.map((relatedArticle) => (
              <Card 
                key={relatedArticle.id} 
                className="hover:border-primary hover:shadow-sm transition-all cursor-pointer"
                onClick={() => onSelectArticle(relatedArticle.id)}
              >
                <CardHeader className="p-4">
                  <CardTitle className="text-base">{relatedArticle.title}</CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
        
        <div className="border rounded-lg p-6 text-center mt-12">
          <h3 className="text-lg font-semibold mb-2">Was this article helpful?</h3>
          <div className="flex justify-center gap-2 mt-4">
            <Button variant="outline">Yes, it helped</Button>
            <Button variant="outline">No, I need more help</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function HelpCategoryContent({
  category,
  articles,
  onSelectArticle
}: {
  category: HelpCategory;
  articles: HelpArticle[];
  onSelectArticle: (articleId: string) => void;
}) {
  const categoryArticles = articles.filter(article => article.category_id === category.id);
  
  // Determine icon
  let Icon = HelpCircle;
  if (category.icon === 'BookOpen') Icon = BookOpen;
  if (category.icon === 'List') Icon = List;
  if (category.icon === 'BarChart3') Icon = BarChart3;
  if (category.icon === 'Image') Icon = ImageIcon;
  if (category.icon === 'HelpCircle') Icon = HelpCircle;

  return (
    <div>
      <div className="mb-8 max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-primary/10 p-3 rounded-full">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">{category.name}</h1>
        </div>
        {category.description && (
          <p className="text-lg text-muted-foreground mb-8">{category.description}</p>
        )}
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 max-w-3xl mx-auto">
        {categoryArticles.map((article) => (
          <Card 
            key={article.id} 
            className="hover:border-primary hover:shadow-sm transition-all cursor-pointer"
            onClick={() => onSelectArticle(article.id)}
          >
            <CardHeader className="p-6">
              <CardTitle className="mb-2">{article.title}</CardTitle>
              {article.excerpt && (
                <CardDescription>{article.excerpt}</CardDescription>
              )}
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}

function HelpHomepage({
  categories,
  articles,
  onSelectCategory,
  onSelectArticle
}: {
  categories: HelpCategory[];
  articles: HelpArticle[];
  onSelectCategory: (categoryId: string) => void;
  onSelectArticle: (articleId: string) => void;
}) {
  const popularArticles = articles.slice(0, 4);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">How can we help you?</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Find answers to your questions about Soundraiser
        </p>
        
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-10 h-12"
            placeholder="Search help articles..."
          />
        </div>
      </div>

      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-6">Help Categories</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => {
            // Determine icon
            let Icon = HelpCircle;
            if (category.icon === 'BookOpen') Icon = BookOpen;
            if (category.icon === 'List') Icon = List;
            if (category.icon === 'BarChart3') Icon = BarChart3;
            if (category.icon === 'Image') Icon = ImageIcon;
            if (category.icon === 'HelpCircle') Icon = HelpCircle;
            
            const categoryArticles = articles.filter(
              article => article.category_id === category.id
            );

            return (
              <Card 
                key={category.id}
                className="border hover:border-primary hover:shadow-sm transition-all cursor-pointer"
                onClick={() => onSelectCategory(category.id)}
              >
                <CardHeader className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-primary/10 p-3 rounded-full">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle>{category.name}</CardTitle>
                  </div>
                  {category.description && (
                    <CardDescription>{category.description}</CardDescription>
                  )}
                </CardHeader>
                <CardFooter className="px-6 py-4 border-t bg-muted/40">
                  <span className="text-sm text-muted-foreground">
                    {categoryArticles.length} articles
                  </span>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-6">Popular Articles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {popularArticles.map((article) => (
            <Card 
              key={article.id}
              className="hover:border-primary hover:shadow-sm transition-all cursor-pointer"
              onClick={() => onSelectArticle(article.id)}
            >
              <CardHeader className="p-4">
                <CardTitle className="text-base">{article.title}</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {article.excerpt || article.content.replace(/<[^>]*>/g, '').substring(0, 120)}...
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="bg-muted/30 rounded-lg p-8 mt-12 text-center">
        <h2 className="text-xl font-semibold mb-2">Need more help?</h2>
        <p className="text-muted-foreground mb-6">
          Contact our support team and we'll get back to you as soon as possible.
        </p>
        <Button>Contact Support</Button>
      </div>
    </div>
  );
}

export default function Help() {
  const { slug } = useParams<{ slug?: string }>();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [activeArticleId, setActiveArticleId] = useState<string | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  
  const { data: helpData, isLoading: isLoadingHelp } = useQuery({
    queryKey: ['help-data'],
    queryFn: async () => {      
      return { 
        categories: mockCategories, 
        articles: mockArticles 
      } as HelpData;
    },
  });

  useEffect(() => {
    // If there's a slug parameter, try to find the matching article or category
    if (slug) {
      const article = helpData?.articles.find(a => a.slug === slug);
      if (article) {
        setActiveArticleId(article.id);
        setActiveCategoryId(article.category_id);
        return;
      }
      
      // If no article found, check if it's a category
      const category = helpData?.categories.find(c => c.id === slug);
      if (category) {
        setActiveCategoryId(category.id);
        setActiveArticleId(null);
      }
    } else {
      // On the main help page
      setActiveArticleId(null);
      setActiveCategoryId(null);
    }
  }, [slug, helpData]);

  // Handle article selection
  const handleArticleSelect = (articleId: string) => {
    const article = helpData?.articles.find(a => a.id === articleId);
    if (article) {
      setActiveArticleId(articleId);
      navigate(`/help/${article.slug}`);
    }
  };

  // Handle category selection
  const handleCategorySelect = (categoryId: string) => {
    if (!categoryId) {
      // Navigate to home page
      setActiveCategoryId(null);
      setActiveArticleId(null);
      navigate('/help');
      return;
    }
    
    const category = helpData?.categories.find(c => c.id === categoryId);
    if (category) {
      setActiveCategoryId(categoryId);
      setActiveArticleId(null);
      navigate(`/help/${category.id}`);
    }
  };

  const activeArticle = activeArticleId ? helpData?.articles.find(a => a.id === activeArticleId) || null : null;
  const activeCategory = activeCategoryId ? helpData?.categories.find(c => c.id === activeCategoryId) || null : null;
  
  const renderContent = () => {
    if (isLoadingHelp) {
      return (
        <div className="space-y-8 max-w-3xl mx-auto">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            {[1, 2, 3, 4].map((n) => (
              <Skeleton key={n} className="h-40" />
            ))}
          </div>
        </div>
      );
    }

    if (!helpData) {
      return (
        <div className="text-center py-12">
          <HelpCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Content Not Found</h2>
          <p className="text-muted-foreground mb-6">
            We couldn't find the help content you're looking for.
          </p>
          <Button 
            onClick={() => navigate('/help')}
          >
            Return to Help Center
          </Button>
        </div>
      );
    }

    // Show article content
    if (activeArticle) {
      return (
        <HelpArticleContent 
          article={activeArticle}
          categories={helpData.categories}
          articles={helpData.articles}
          onBack={() => {
            if (activeCategoryId) {
              handleCategorySelect(activeCategoryId);
            } else {
              navigate('/help');
            }
          }}
          onSelectArticle={handleArticleSelect}
        />
      );
    }
    
    // Show category content
    if (activeCategory) {
      return (
        <HelpCategoryContent 
          category={activeCategory}
          articles={helpData.articles}
          onSelectArticle={handleArticleSelect}
        />
      );
    }
    
    // Show homepage
    return (
      <HelpHomepage 
        categories={helpData.categories}
        articles={helpData.articles}
        onSelectCategory={handleCategorySelect}
        onSelectArticle={handleArticleSelect}
      />
    );
  };

  // Mobile sidebar
  const renderMobileSidebar = () => {
    if (!helpData) return null;
    
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="md:hidden mb-4"
          >
            <List className="h-4 w-4 mr-2" />
            Browse Help Topics
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[300px] p-0">
          <div className="p-6 border-b">
            <h2 className="font-semibold">Help Center</h2>
          </div>
          <div className="px-3 py-2">
            <HelpSidebar
              categories={helpData.categories}
              articles={helpData.articles}
              activeArticle={activeArticle}
              activeCategory={activeCategory}
              onSelectArticle={handleArticleSelect}
              onSelectCategory={handleCategorySelect}
            />
          </div>
        </SheetContent>
      </Sheet>
    );
  };

  return (
    <>
      <PageSEO
        title={activeArticle 
          ? `${activeArticle.title} | Help Center` 
          : activeCategory 
            ? `${activeCategory.name} | Help Center` 
            : "Help Center | Soundraiser"
        }
        description="Find answers to your questions about Soundraiser - smart links, promotion services, and more."
      />
      
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <Sidebar>
            <SidebarHeader>
              <div className="p-2">
                <div className="font-semibold text-lg">Help Center</div>
              </div>
            </SidebarHeader>
            
            <SidebarContent>
              {helpData && (
                <HelpSidebar
                  categories={helpData.categories}
                  articles={helpData.articles}
                  activeArticle={activeArticle}
                  activeCategory={activeCategory}
                  onSelectArticle={handleArticleSelect}
                  onSelectCategory={handleCategorySelect}
                />
              )}
            </SidebarContent>
          </Sidebar>
          
          <div className="flex-1 flex flex-col">
            <div className="container mx-auto px-4 py-8">
              {renderMobileSidebar()}
              {renderContent()}
            </div>
            <div className="mt-auto">
              <Footer />
            </div>
          </div>
        </div>
      </SidebarProvider>
    </>
  );
}
