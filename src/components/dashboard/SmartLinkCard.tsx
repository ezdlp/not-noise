import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { 
  EditIcon, 
  TrashIcon, 
  ExternalLinkIcon, 
  CopyIcon,
  BarChart2Icon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SmartLinkCardProps {
  link: any;
  onDelete: (id: string) => void;
}

export function SmartLinkCard({ link, onDelete }: SmartLinkCardProps) {
  const navigate = useNavigate();
  const views = link.link_views?.length || 0;
  const clicks = link.platform_clicks?.length || 0;
  const ctr = views > 0 ? ((clicks / views) * 100).toFixed(1) : "0";
  const smartLinkUrl = `${window.location.origin}/link/${link.id}`;

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  };

  return (
    <Card className="p-4 flex flex-col h-full transition-all duration-200 hover:shadow-lg hover:shadow-primary/20">
      <div className="flex gap-4">
        {link.artwork_url && (
          <img
            src={link.artwork_url}
            alt={link.title}
            className="w-24 h-24 object-cover rounded-lg shadow-md"
          />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg font-heading truncate hover:text-primary transition-colors">{link.title}</h3>
          <p className="text-sm text-muted-foreground">{link.artist_name}</p>
          <div className="flex items-center gap-2 mt-2">
            <code className="text-xs bg-secondary/10 px-2 py-1 rounded flex-1 truncate">
              {smartLinkUrl}
            </code>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 flex-shrink-0 hover:text-primary transition-colors"
                  onClick={() => copyToClipboard(smartLinkUrl)}
                >
                  <CopyIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Copy link</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 my-4 text-center">
        <div className="bg-primary/5 p-3 rounded-lg">
          <div className="text-2xl font-bold font-heading">{views}</div>
          <div className="text-sm text-muted-foreground">Views</div>
        </div>
        <div className="bg-secondary/5 p-3 rounded-lg">
          <div className="text-2xl font-bold font-heading">{clicks}</div>
          <div className="text-sm text-muted-foreground">Clicks</div>
        </div>
        <div className="bg-success/5 p-3 rounded-lg">
          <div className="text-2xl font-bold font-heading text-success">{ctr}%</div>
          <div className="text-sm text-muted-foreground">CTR</div>
        </div>
      </div>

      <div className="mt-auto pt-4 border-t flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {formatDistanceToNow(new Date(link.created_at), { addSuffix: true })}
        </div>
        <TooltipProvider>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/link/${link.id}`)}
                  className="hover:text-primary transition-colors"
                >
                  <ExternalLinkIcon className="w-4 h-4" />
                  <span className="sr-only">View</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View Smart Link</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/links/${link.id}/analytics`)}
                  className="hover:text-primary transition-colors"
                >
                  <BarChart2Icon className="w-4 h-4" />
                  <span className="sr-only">Analytics</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View Analytics</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/links/${link.id}/edit`)}
                  className="hover:text-primary transition-colors"
                >
                  <EditIcon className="w-4 h-4" />
                  <span className="sr-only">Edit</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Edit Smart Link</p>
              </TooltipContent>
            </Tooltip>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-600 transition-colors"
                >
                  <TrashIcon className="w-4 h-4" />
                  <span className="sr-only">Delete</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Smart Link</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{link.title}"? This action
                    cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(link.id)}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </TooltipProvider>
      </div>
    </Card>
  );
}