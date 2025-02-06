
import { Button } from "@/components/ui/button";
import { BookOpen, FileText, Info, List } from "lucide-react";
import { cn } from "@/lib/utils";

const categories = [
  {
    title: "Getting Started",
    icon: BookOpen,
    items: ["Welcome Guide", "Creating Your Account", "Understanding Your Dashboard"],
  },
  {
    title: "Smart Links",
    icon: List,
    items: ["What are Smart Links?", "Creating Smart Links", "Analytics & Tracking", "Customization"],
  },
  {
    title: "Promotion",
    icon: FileText,
    items: ["How it Works", "Submission Guide", "Campaign Tracking", "Best Practices"],
  },
  {
    title: "Support",
    icon: Info,
    items: ["FAQs", "Contact Support", "Account Issues", "Billing Questions"],
  },
];

export function HelpSidebar() {
  return (
    <aside className="space-y-6">
      <div className="space-y-1">
        {categories.map((category) => (
          <div key={category.title} className="space-y-2">
            <div className="flex items-center gap-2 font-medium px-2 py-1.5">
              <category.icon className="h-4 w-4" />
              <span>{category.title}</span>
            </div>
            {category.items.map((item) => (
              <Button
                key={item}
                variant="ghost"
                className={cn(
                  "w-full justify-start pl-8 font-normal",
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
