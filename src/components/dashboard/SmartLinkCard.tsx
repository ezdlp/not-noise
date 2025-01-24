import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

interface SmartLinkCardProps {
  link: {
    id: string;
    title: string;
    artwork_url?: string;
    created_at: string;
    slug?: string;
    platform_links: Array<{
      id: string;
      platform_id: string;
      platform_name: string;
      url: string;
    }>;
    link_views: Array<{
      id: string;
      viewed_at: string;
    }>;
  };
}

const SmartLinkCard = ({ link }: SmartLinkCardProps) => {
  const smartLinkUrl = `${window.location.origin}/link/${link.slug || link.id}`;
  const totalViews = link.link_views?.length || 0;
  const platformCount = link.platform_links?.length || 0;

  return (
    <Link to={`/link/${link.slug || link.id}`}>
      <Card className="hover:shadow-lg transition-shadow duration-200">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            {link.artwork_url && (
              <img
                src={link.artwork_url}
                alt={link.title}
                className="w-24 h-24 object-cover rounded-lg"
              />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {link.title}
              </h3>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="secondary">
                  {totalViews} {totalViews === 1 ? "view" : "views"}
                </Badge>
                <Badge variant="secondary">
                  {platformCount} {platformCount === 1 ? "platform" : "platforms"}
                </Badge>
                <Badge variant="outline">
                  Created{" "}
                  {formatDistanceToNow(new Date(link.created_at), {
                    addSuffix: true,
                  })}
                </Badge>
              </div>
              <div className="mt-2">
                <p className="text-sm text-gray-500 truncate">{smartLinkUrl}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default SmartLinkCard;