
import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  BookOpen,
  Search,
  List,
  HelpCircle,
  Info,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HelpArticle } from "@/components/help/HelpArticle";
import { HelpSidebar } from "@/components/help/HelpSidebar";
import { Button } from "@/components/ui/button";

export type HelpCategory = "getting-started" | "smart-links" | "promotion" | "faq";

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
          <HelpSidebar activeCategory={activeCategory} onCategoryChange={handleCategoryChange} />

          <div className="space-y-8">
            <Tabs value={activeCategory} onValueChange={(value) => handleCategoryChange(value as HelpCategory)} className="w-full">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="getting-started">Getting Started</TabsTrigger>
                <TabsTrigger value="smart-links">Smart Links</TabsTrigger>
                <TabsTrigger value="promotion">Promotion</TabsTrigger>
                <TabsTrigger value="faq">FAQ</TabsTrigger>
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
                    4. Start creating Smart Links or submit your music for promotion
                  `}
                />
                <HelpArticle
                  title="Understanding Your Dashboard"
                  icon={Info}
                  content={`
                    Your dashboard is your command center:
                    - View your Smart Links performance
                    - Track promotion campaigns
                    - Monitor audience engagement
                    - Access quick actions for common tasks
                  `}
                />
              </TabsContent>

              <TabsContent value="smart-links" className="space-y-6">
                <HelpArticle
                  title="What are Smart Links?"
                  icon={HelpCircle}
                  content={`
                    Smart Links are powerful music marketing tools that:
                    - Share your music across all streaming platforms
                    - Track listener engagement
                    - Capture fan emails
                    - Enable retargeting with Meta Pixel
                  `}
                />
                <HelpArticle
                  title="Creating Your First Smart Link"
                  icon={List}
                  content={`
                    Create your first Smart Link in minutes:
                    1. Click "Create Smart Link"
                    2. Enter your track or album details
                    3. Add your streaming platform links
                    4. Customize your page design
                    5. Enable email capture and Meta Pixel if desired
                    6. Share your link!
                  `}
                />
              </TabsContent>

              <TabsContent value="promotion" className="space-y-6">
                <HelpArticle
                  title="How Our Promotion Works"
                  icon={Info}
                  content={`
                    Our Spotify playlist promotion service:
                    - Connects you with real playlist curators
                    - Targets playlists matching your genre
                    - Provides detailed campaign reports
                    - Offers different packages for your budget
                  `}
                />
                <HelpArticle
                  title="Submitting Your Track"
                  icon={List}
                  content={`
                    Submit your track for promotion:
                    1. Choose your promotion package
                    2. Enter your track details
                    3. Select your target genre
                    4. Complete payment
                    5. Track your campaign progress
                  `}
                />
              </TabsContent>

              <TabsContent value="faq" className="space-y-6">
                <HelpArticle
                  title="Smart Links FAQ"
                  icon={HelpCircle}
                  content={`
                    Common questions about Smart Links:
                    - How many links can I create?
                    - Which platforms are supported?
                    - How do I track performance?
                    - Can I customize the design?
                  `}
                />
                <HelpArticle
                  title="Promotion FAQ"
                  icon={HelpCircle}
                  content={`
                    Common questions about promotion:
                    - How long does promotion take?
                    - What results can I expect?
                    - How are playlists selected?
                    - What happens after submission?
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
