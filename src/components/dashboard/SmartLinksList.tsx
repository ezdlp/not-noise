import { Link } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

interface SmartLinksListProps {
  links: Array<{
    id: string;
    title: string;
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
  }>;
  isLoading?: boolean;
}

const SmartLinksList = ({ links, isLoading }: SmartLinksListProps) => {
  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!links?.length) {
    return <div>No smart links found</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>URL</TableHead>
          <TableHead>Views</TableHead>
          <TableHead>Platforms</TableHead>
          <TableHead>Created</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {links.map((link) => {
          const smartLinkUrl = `${window.location.origin}/link/${link.slug || link.id}`;
          const totalViews = link.link_views?.length || 0;
          const platformCount = link.platform_links?.length || 0;

          return (
            <TableRow key={link.id}>
              <TableCell>
                <Link
                  to={`/link/${link.slug || link.id}`}
                  className="hover:underline"
                >
                  {link.title}
                </Link>
              </TableCell>
              <TableCell className="text-sm text-gray-500">
                {smartLinkUrl}
              </TableCell>
              <TableCell>
                <Badge variant="secondary">
                  {totalViews} {totalViews === 1 ? "view" : "views"}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">
                  {platformCount} {platformCount === 1 ? "platform" : "platforms"}
                </Badge>
              </TableCell>
              <TableCell>
                {formatDistanceToNow(new Date(link.created_at), {
                  addSuffix: true,
                })}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export default SmartLinksList;