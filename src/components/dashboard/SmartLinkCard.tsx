
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  BarChart2Icon,
  EditIcon,
  ExternalLinkIcon,
  MoreVerticalIcon,
  TrashIcon,
  CopyIcon,
  CheckIcon,
  InstagramIcon,
  EyeIcon,
  MousePointerIcon,
  TargetIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { SocialCardPreviewDialog } from "./SocialCardPreviewDialog";
import { cn } from "@/lib/utils";

interface SmartLinkCardProps {
  link: any;
  onDelete?: (id: string) => void;
}

export function SmartLinkCard({ link, onDelete }: SmartLinkCardProps) {
  const navigate = useNavigate();
  const [isCopied, setIsCopied] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const handleDelete = async () => {
    if (onDelete) {
      onDelete(link.id);
    }
  };

  const copyToClipboard = async () => {
    const url = `${window.location.origin}/link/${link.slug || link.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  const views = link.link_views?.length || 0;
  const clicks = link.platform_links?.reduce((sum: number, pl: any) => sum + (pl.platform_clicks?.length || 0), 0) || 0;
  const ctr = views > 0 ? ((clicks / views) * 100).toFixed(1) : "0";

  return (
    <>
      <Card className="group overflow-hidden bg-white border-neutral-border transition-colors duration-200 hover:bg-neutral-seasalt/50">
        <div className="relative">
          <img
            src={link.artwork_url || "/placeholder.svg"}
            alt={link.title}
            className="w-full aspect-square object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="absolute bottom-2 right-2 flex gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => navigate(`/link/${link.id}`)}
                    >
                      <ExternalLinkIcon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>View Smart Link</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => navigate(`/links/${link.id}/analytics`)}
                    >
                      <BarChart2Icon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>View Analytics</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => navigate(`/links/${link.id}/edit`)}
                    >
                      <EditIcon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Edit Smart Link</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-medium text-neutral-night truncate">{link.title}</h3>
              <p className="text-sm text-muted-foreground truncate">{link.artist_name}</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                  <MoreVerticalIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={copyToClipboard}>
                  {isCopied ? <CheckIcon className="mr-2 h-4 w-4" /> : <CopyIcon className="mr-2 h-4 w-4" />}
                  Copy URL
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPreviewOpen(true)}>
                  <InstagramIcon className="mr-2 h-4 w-4" />
                  Create Social Post
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-rose-600 focus:text-rose-600"
                >
                  <TrashIcon className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-neutral-border">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <EyeIcon className="w-3 h-3" />
                <span className="text-xs">Views</span>
              </div>
              <p className="font-medium">{views}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <MousePointerIcon className="w-3 h-3" />
                <span className="text-xs">Clicks</span>
              </div>
              <p className="font-medium">{clicks}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <TargetIcon className="w-3 h-3" />
                <span className="text-xs">CTR</span>
              </div>
              <p className="font-medium">{ctr}%</p>
            </div>
          </div>
        </div>
      </Card>

      <SocialCardPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        smartLink={link}
      />
    </>
  );
}
