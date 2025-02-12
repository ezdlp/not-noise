
import { Button } from "@/components/ui/button";
import { SmartLinkCard } from "./SmartLinkCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UpgradeModal } from "../subscription/UpgradeModal";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { useNavigate } from "react-router-dom";

interface SmartLinksListProps {
  links?: any[];
  isLoading: boolean;
}

export function SmartLinksList({ links = [], isLoading }: SmartLinksListProps) {
  const [sortBy, setSortBy] = useState<string>("newest");
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const { subscription, isFeatureEnabled } = useFeatureAccess();
  const navigate = useNavigate();

  const handleAnalyticsClick = (linkId: string) => {
    if (subscription?.tier === 'pro') {
      navigate(`/links/${linkId}/analytics`);
    } else {
      setShowAnalyticsModal(true);
    }
  };

  const sortedLinks = [...links].sort((a, b) => {
    switch (sortBy) {
      case "most-views":
        return (b.link_views?.length || 0) - (a.link_views?.length || 0);
      case "most-clicks":
        return (b.platform_clicks?.length || 0) - (a.platform_clicks?.length || 0);
      case "highest-ctr": {
        const ctrA = a.link_views?.length ? (a.platform_clicks?.length || 0) / a.link_views.length : 0;
        const ctrB = b.link_views?.length ? (b.platform_clicks?.length || 0) / b.link_views.length : 0;
        return ctrB - ctrA;
      }
      case "oldest":
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      default: // "newest"
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (links.length === 0) {
    return (
      <div className="text-center py-12 space-y-4">
        <div>
          <p className="text-xl font-semibold">No smart links yet</p>
          <p className="text-muted-foreground">Create your first smart link to start sharing your music</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Your Smart Links</h2>
          {subscription?.tier === 'free' && (
            <div className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
              {links.length} / 10 Free Links
            </div>
          )}
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="most-views">Most Views</SelectItem>
              <SelectItem value="most-clicks">Most Clicks</SelectItem>
              <SelectItem value="highest-ctr">Highest CTR</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sortedLinks.map((link) => (
          <SmartLinkCard
            key={link.id}
            link={link}
            onAnalyticsClick={() => handleAnalyticsClick(link.id)}
          />
        ))}
      </div>

      <UpgradeModal
        isOpen={showAnalyticsModal}
        onClose={() => setShowAnalyticsModal(false)}
        feature="access advanced analytics"
        description="Upgrade to Pro to unlock detailed analytics including platform-specific clicks, daily performance, and fan locations!"
      />
    </div>
  );
}
