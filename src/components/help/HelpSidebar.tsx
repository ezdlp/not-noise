
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { BookOpen, List, BarChart3, Image as ImageIcon, HelpCircle, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { HelpCategory } from "@/pages/Help";
import { useState } from "react";

interface HelpSidebarProps {
  activeCategory: HelpCategory;
  onCategoryChange: (category: HelpCategory) => void;
}

const categories = [
  {
    title: "Getting Started",
    value: "getting-started" as HelpCategory,
    icon: BookOpen,
    items: ["Welcome Guide", "Creating Your Account", "Understanding Your Dashboard", "Platform Overview"],
  },
  {
    title: "Smart Links",
    value: "smart-links" as HelpCategory,
    icon: List,
    items: ["What are Smart Links?", "Creating Smart Links", "Custom URLs", "Email Capture", "Design & Customization"],
  },
  {
    title: "Analytics & Tracking",
    value: "analytics" as HelpCategory,
    icon: BarChart3,
    items: ["Dashboard Overview", "Performance Metrics", "Meta Pixel Setup", "Conversion Tracking", "Audience Insights"],
  },
  {
    title: "Social Media",
    value: "social-media" as HelpCategory,
    icon: ImageIcon,
    items: ["Social Cards", "Platform Integration", "Best Practices", "Supported Networks"],
  },
  {
    title: "Support",
    value: "support" as HelpCategory,
    icon: HelpCircle,
    items: ["FAQs", "Contact Support", "Account Issues", "Billing Questions"],
  },
];

export function HelpSidebar({ activeCategory, onCategoryChange }: HelpSidebarProps) {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    [activeCategory]: true
  });

  const toggleCategory = (value: HelpCategory) => {
    setExpandedCategories(prev => ({
      ...prev,
      [value]: !prev[value]
    }));
  };

  return (
    <aside className="space-y-2">
      <div className="space-y-1">
        {categories.map((category) => (
          <div key={category.title} className="space-y-1">
            <button
              onClick={() => {
                onCategoryChange(category.value);
                toggleCategory(category.value);
              }}
              className={cn(
                "flex items-center justify-between w-full px-3 py-2 rounded-md transition-colors hover:bg-primary/5",
                activeCategory === category.value && "bg-primary/10 text-primary"
              )}
            >
              <div className="flex items-center gap-2">
                <category.icon className="h-4 w-4" />
                <span className="font-medium">{category.title}</span>
              </div>
              {expandedCategories[category.value] ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
            
            {expandedCategories[category.value] && (
              <div className="ml-9 space-y-1">
                {category.items.map((item, index) => (
                  <Button
                    key={item}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start font-normal h-8 hover:bg-primary/5",
                      activeCategory === category.value
                        ? "text-primary"
                        : "text-muted-foreground"
                    )}
                  >
                    <span className="truncate">{item}</span>
                    {(item === "Meta Pixel Setup" || item === "Email Capture") && (
                      <Badge 
                        variant="outline" 
                        className="ml-2 bg-primary/5 text-primary border-primary/20"
                      >
                        Pro
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
}
