
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
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { SocialCardPreviewDialog } from "./SocialCardPreviewDialog";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { UpgradeModal } from "../subscription/UpgradeModal";

interface SmartLinkCardProps {
  link: any;
  onDelete?: (id: string) => void;
  onAnalyticsClick?: () => void;
}

export function SmartLinkCard({ link, onDelete, onAnalyticsClick }: SmartLinkCardProps) {
  const navigate = useNavigate();
  const [isCopied, setIsCopied] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const { isFeatureEnabled } = useFeatureAccess();
  const canUseSocialAssets = isFeatureEnabled('social_assets');

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from("smart_links")
        .delete()
        .eq("id", link.id);

      if (error) throw error;

      if (onDelete) {
        onDelete(link.id);
      }
      toast.success("Smart link deleted successfully");
    } catch (error) {
      console.error("Error deleting smart link:", error);
      toast.error("Failed to delete smart link");
    }
  };

  const copyToClipboard = async () => {
    const url = `${window.location.origin}/link/${link.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  const generateSocialAsset = async () => {
    if (!link.artwork_url) {
      toast.error("This smart link doesn't have artwork");
      return;
    }
    setPreviewOpen(true);
  };

  const totalClicks = link.platform_links?.reduce((sum: number, pl: any) => 
    sum + (pl.platform_clicks?.length || 0), 0) || 0;

  return (
    <>
      <Card className="flex flex-col md:flex-row gap-5 p-4 h-full bg-white border-[#E6E6E6] shadow-[0_2px_4px_rgba(15,15,15,0.05)]">
        <div className="flex-shrink-0">
          <img
            src={link.artwork_url || "/placeholder.svg"}
            alt={link.title}
            className="w-32 h-32 object-cover rounded-lg"
          />
        </div>
        <div className="flex-grow flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg font-dm-sans text-[#0F0F0F] truncate max-w-[200px]">{link.title}</h3>
                <p className="text-xs font-poppins text-muted-foreground">{link.artist_name}</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVerticalIcon className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate(`/links/${link.id}/edit`)}>
                    <EditIcon className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={handleDelete}
                  >
                    <TrashIcon className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <div className="flex items-center gap-3 text-xs font-dm-sans text-[#0F0F0F] mb-4">
              <span>{link.link_views?.length || 0} views</span>
              <span className="text-neutral-border">•</span>
              <span>{totalClicks} clicks</span>
              <span className="text-neutral-border">•</span>
              <span>
                {link.link_views?.length
                  ? ((totalClicks / link.link_views.length) * 100).toFixed(1)
                  : "0"}% CTR
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-[#E6E6E6] transition-colors duration-150"
                    asChild
                  >
                    <Link to={`/link/${link.slug}`} target="_blank">
                      <ExternalLinkIcon className="h-4 w-4" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View Link</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-[#E6E6E6] transition-colors duration-150"
                    onClick={copyToClipboard}
                  >
                    {isCopied ? (
                      <CheckIcon className="h-4 w-4" />
                    ) : (
                      <CopyIcon className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Copy URL</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-[#E6E6E6] transition-colors duration-150"
                    onClick={onAnalyticsClick}
                  >
                    <BarChart2Icon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Analytics</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-[#E6E6E6] transition-colors duration-150"
                    onClick={generateSocialAsset}
                  >
                    <InstagramIcon className={`h-4 w-4 ${!canUseSocialAssets ? 'text-[#999999]' : ''}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Create Instagram Posts (Pro Feature)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </Card>

      <SocialCardPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        smartLink={link}
        onGenerate={generateSocialAsset}
        canUseSocialAssets={canUseSocialAssets}
      />
    </>
  );
}
