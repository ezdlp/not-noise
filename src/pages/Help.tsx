
import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  BookOpen,
  Search,
  List,
  HelpCircle,
  BarChart3,
  Image as ImageIcon,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HelpArticle } from "@/components/help/HelpArticle";
import { HelpSidebar } from "@/components/help/HelpSidebar";
import { Button } from "@/components/ui/button";

export type HelpCategory = "getting-started" | "smart-links" | "analytics" | "social-media" | "support";

export default function Help() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<HelpCategory>("getting-started");

  const handleCategoryChange = (category: HelpCategory) => {
    setActiveCategory(category);
  };

  return (
    <div className="min-h-screen bg-neutral-seasalt">
      {/* Hero Section */}
      <div className="bg-white border-b border-border">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-6">
            How can we help you?
          </h1>
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12"
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-8">
          <ScrollArea className="h-[calc(100vh-200px)] md:sticky md:top-20">
            <HelpSidebar activeCategory={activeCategory} onCategoryChange={handleCategoryChange} />
          </ScrollArea>

          <div className="space-y-8">
            <Tabs value={activeCategory} onValueChange={(value) => handleCategoryChange(value as HelpCategory)} className="w-full">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="getting-started">Getting Started</TabsTrigger>
                <TabsTrigger value="smart-links">Smart Links</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="social-media">Social Media</TabsTrigger>
                <TabsTrigger value="support">Support</TabsTrigger>
              </TabsList>

              <TabsContent value="getting-started" className="space-y-6">
                <HelpArticle
                  title="Welcome to Soundraiser"
                  icon={BookOpen}
                  content={`
                    Welcome to Soundraiser! We're excited to help you promote your music effectively. 
                    This guide will walk you through everything you need to know to get started.
                  `}
                />
                <HelpArticle
                  title="Creating Your Account"
                  icon={List}
                  content={`
                    Creating an account is quick and easy:
                    1. Click the Sign Up button
                    2. Enter your email and password
                    3. Fill in your artist details
                    4. Start creating Smart Links or access analytics features
                  `}
                />
                <HelpArticle
                  title="Understanding Your Dashboard"
                  icon={BarChart3}
                  content={`
                    Your dashboard is your command center:
                    - View your Smart Links performance
                    - Track audience engagement
                    - Monitor conversion rates
                    - Access Meta Pixel integration
                    - View social media metrics
                    - Manage email subscribers
                  `}
                />
              </TabsContent>

              <TabsContent value="smart-links" className="space-y-6">
                <HelpArticle
                  title="What are Smart Links?"
                  icon={List}
                  content={`
                    Smart Links are powerful music marketing tools that:
                    - Share your music across all streaming platforms
                    - Track listener engagement
                    - Capture fan emails
                    - Enable retargeting with Meta Pixel
                    - Create customized social cards
                    - Provide detailed analytics
                  `}
                />
                <HelpArticle
                  title="Creating Smart Links"
                  icon={List}
                  content={`
                    Create your Smart Link in minutes:
                    1. Click "Create Smart Link"
                    2. Enter your track or album details
                    3. Add your streaming platform links
                    4. Customize your page design
                    5. Set up email capture
                    6. Configure Meta Pixel
                    7. Customize your social cards
                    8. Share your link!
                  `}
                />
                <HelpArticle
                  title="Email Capture & Custom URLs"
                  icon={List}
                  content={`
                    Maximize your Smart Links:
                    - Set up email capture forms
                    - Create custom URLs
                    - Design branded experiences
                    - Manage subscriber lists
                    - Export contact data
                    - Track conversion rates
                  `}
                />
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6">
                <HelpArticle
                  title="Analytics Dashboard Overview"
                  icon={BarChart3}
                  content={`
                    Your analytics dashboard provides:
                    - Real-time performance tracking
                    - Click-through rates
                    - Geographic data
                    - Platform preferences
                    - Audience behavior insights
                    - Conversion tracking
                  `}
                />
                <HelpArticle
                  title="Meta Pixel Integration"
                  icon={BarChart3}
                  content={`
                    Enhance your marketing with Meta Pixel:
                    - Set up Meta Pixel tracking
                    - Create custom audiences
                    - Track conversion events
                    - Retarget your audience
                    - Optimize ad campaigns
                    - Measure ROI
                  `}
                />
              </TabsContent>

              <TabsContent value="social-media" className="space-y-6">
                <HelpArticle
                  title="Social Cards"
                  icon={ImageIcon}
                  content={`
                    Create engaging social media presence:
                    - Customize social preview cards
                    - Optimize for each platform
                    - Add branded visuals
                    - Set up platform-specific metadata
                    - Track social engagement
                  `}
                />
                <HelpArticle
                  title="Platform Integration"
                  icon={ImageIcon}
                  content={`
                    Integrate with major platforms:
                    - Facebook sharing optimization
                    - Twitter card customization
                    - Instagram bio links
                    - LinkedIn professional sharing
                    - Platform-specific analytics
                  `}
                />
              </TabsContent>

              <TabsContent value="support" className="space-y-6">
                <HelpArticle
                  title="FAQs"
                  icon={HelpCircle}
                  content={`
                    Common questions about:
                    - Smart Links features
                    - Analytics & tracking
                    - Meta Pixel setup
                    - Social media integration
                    - Email capture
                    - Account management
                    - Billing & subscriptions
                  `}
                />
                <HelpArticle
                  title="Contact Support"
                  icon={HelpCircle}
                  content={`
                    Need additional help?
                    - 24/7 email support
                    - Live chat (Pro plans)
                    - Technical assistance
                    - Feature requests
                    - Account help
                  `}
                />
              </TabsContent>
            </Tabs>

            <div className="bg-primary/5 rounded-lg p-6 text-center">
              <h3 className="text-lg font-semibold mb-2">Still need help?</h3>
              <p className="text-muted-foreground mb-4">
                Our support team is here to help you succeed
              </p>
              <Button>Contact Support</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
