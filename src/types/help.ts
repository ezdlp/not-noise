
import { LucideIcon } from "lucide-react";

export type IconType = LucideIcon;

export interface HelpCategory {
  id: string;
  name: string;
  icon: IconType;
  description: string;
}

export interface HelpArticle {
  id: string;
  title: string;
  content: string;
  category_id: string;
  slug: string;
  category?: HelpCategory;
  popular?: boolean;
  featured?: boolean;
  related?: string[];
}

export interface HelpSearchResult {
  article: HelpArticle;
  relevance: number;
}
