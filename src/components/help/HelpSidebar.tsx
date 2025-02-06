
import { Button } from "@/components/ui/button";
import { BookOpen, FileText, Info, List } from "lucide-react";
import { cn } from "@/lib/utils";
import { HelpCategory } from "@/pages/Help";

interface HelpSidebarProps {
  activeCategory: HelpCategory;
  onCategoryChange: (category: HelpCategory) => void;
}

const categories = [
  {
    title: "Getting Started",
    value: "getting-started" as HelpCategory,
    icon: BookOpen,
    items: ["Welcome Guide", "Creating Your Account", "Understanding Your Dashboard"],
  },
  {
    title: "Smart Links",
    value: "smart-links" as HelpCategory,
    icon: List,
    items: ["What are Smart Links?", "Creating Smart Links", "Analytics & Tracking", "Customization"],
  },
  {
    title: "Promotion",
    value: "promotion" as HelpCategory,
    icon: FileText,
    items: ["How it Works", "Submission Guide", "Campaign Tracking", "Best Practices"],
  },
  {
    title: "Support",
    value: "faq" as HelpCategory,
    icon: Info,
    items: ["FAQs", "Contact Support", "Account Issues", "Billing Questions"],
  },
];

export function HelpSidebar({ activeCategory, onCategoryChange }: HelpSidebarProps) {
  return (
    <aside className="space-y-6">
      <div className="space-y-1">
        {categories.map((category) => (
          <div key={category.title} className="space-y-2">
            <button
              onClick={() => onCategoryChange(category.value)}
              className={cn(
                "flex items-center gap-2 font-medium px-2 py-1.5 w-full text-left rounded-md transition-colors",
                activeCategory === category.value
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-primary/5"
              )}
            >
              <category.icon className="h-4 w-4" />
              <span>{category.title}</span>
            </button>
            {category.items.map((item) => (
              <Button
                key={item}
                variant="ghost"
                className={cn(
                  "w-full justify-start pl-8 font-normal",
                  activeCategory === category.value
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                {item}
              </Button>
            ))}
          </div>
        ))}
      </div>
    </aside>
  );
}
