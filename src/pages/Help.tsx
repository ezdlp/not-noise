import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
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

  const renderContent = () => {
    switch (activeCategory) {
      case "getting-started":
        return (
          <div className="space-y-6">
            <HelpArticle
              title="Welcome Guide"
              icon={BookOpen}
              content={`
                Welcome to Soundraiser! We're excited to help you promote your music effectively. 
                This guide will walk you through everything you need to know to get started.
                
                Our platform helps you create professional Smart Links, track performance, and grow your audience through powerful marketing tools.
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
                
                Once your account is created, you'll have immediate access to create your first Smart Link.
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
                
                Each section is designed to give you clear insights into your music's performance.
              `}
            />
            <HelpArticle
              title="Platform Overview"
              icon={BookOpen}
              content={`
                Soundraiser offers a comprehensive suite of tools:
                - Smart Links creation and management
                - Advanced analytics and tracking
                - Email capture and fan data collection
                - Meta Pixel integration for retargeting
                - Social media optimization
                - Custom branding options
                
                Each feature is designed to help you promote your music more effectively.
              `}
            />
          </div>
        );
      case "smart-links":
        return (
          <div className="space-y-6">
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
              title="Custom URLs"
              icon={List}
              content={`
                Customize your Smart Link URLs:
                - Create memorable, branded URLs
                - Choose custom slugs for each link
                - Use your artist name or song title
                - Maintain consistent branding
                - Track performance by URL
                - Manage multiple custom URLs
              `}
            />
            <HelpArticle
              title="Email Capture"
              icon={List}
              content={`
                Build your fan email list:
                - Customize email capture forms
                - Set up automated responses
                - Export subscriber data
                - Track conversion rates
                - Segment your audience
                - Integrate with email marketing tools
              `}
            />
            <HelpArticle
              title="Design & Customization"
              icon={List}
              content={`
                Create your unique branded experience:
                - Customize colors and themes
                - Upload custom artwork
                - Add artist bio and details
                - Customize button styles
                - Add custom backgrounds
                - Create mobile-optimized layouts
              `}
            />
          </div>
        );
      case "analytics":
        return (
          <div className="space-y-6">
            <HelpArticle
              title="Dashboard Overview"
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
              title="Performance Metrics"
              icon={BarChart3}
              content={`
                Track key performance indicators:
                - Total link views
                - Platform-specific clicks
                - Conversion rates
                - Geographic distribution
                - Device analytics
                - Time-based performance
              `}
            />
            <HelpArticle
              title="Meta Pixel Setup"
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
            <HelpArticle
              title="Conversion Tracking"
              icon={BarChart3}
              content={`
                Monitor and optimize conversions:
                - Track click-through rates
                - Measure platform preferences
                - Monitor email signups
                - Track custom events
                - Analyze user journeys
                - Export conversion data
              `}
            />
            <HelpArticle
              title="Audience Insights"
              icon={BarChart3}
              content={`
                Understand your audience better:
                - Geographic distribution
                - Platform preferences
                - Device usage
                - Time-based activity
                - Engagement patterns
                - Audience segmentation
              `}
            />
          </div>
        );
      case "social-media":
        return (
          <div className="space-y-6">
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
            <HelpArticle
              title="Best Practices"
              icon={ImageIcon}
              content={`
                Optimize your social media strategy:
                - Timing your posts
                - Platform-specific content
                - Hashtag strategies
                - Engagement optimization
                - Cross-platform promotion
                - Content calendar planning
              `}
            />
            <HelpArticle
              title="Supported Networks"
              icon={ImageIcon}
              content={`
                Share across major platforms:
                - Facebook & Instagram
                - Twitter & X
                - TikTok
                - LinkedIn
                - YouTube
                - Pinterest
                
                Each platform is optimized for maximum engagement and reach.
              `}
            />
          </div>
        );
      case "support":
        return (
          <div className="space-y-6">
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
            <HelpArticle
              title="Account Issues"
              icon={HelpCircle}
              content={`
                Get help with your account:
                - Password reset
                - Account security
                - Profile updates
                - Linking platforms
                - Account recovery
                - Data management
              `}
            />
            <HelpArticle
              title="Billing Questions"
              icon={HelpCircle}
              content={`
                Understanding billing and subscriptions:
                - Plan comparisons
                - Payment methods
                - Subscription management
                - Invoices and receipts
                - Pro plan features
                - Refund policy
              `}
            />
          </div>
        );
    }
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
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8">
          {/* Enhanced Sidebar */}
          <div className="relative">
            <ScrollArea className="h-[calc(100vh-200px)] md:sticky md:top-20">
              <HelpSidebar 
                activeCategory={activeCategory} 
                onCategoryChange={handleCategoryChange} 
              />
            </ScrollArea>
          </div>

          {/* Main Content */}
          <div className="space-y-8">
            {renderContent()}

            {/* Contact Support Card */}
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
