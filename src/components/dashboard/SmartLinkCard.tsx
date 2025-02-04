
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

interface SmartLinkCardProps {
  link: any;
  onDelete?: (id: string) => void;
}

export function SmartLinkCard({ link, onDelete }: SmartLinkCardProps) {
  const navigate = useNavigate();
  const [isCopied, setIsCopied] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

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

  return (
    <>
      <Card className="flex flex-col md:flex-row gap-4 p-4">
        <div className="flex-shrink-0">
          <img
            src={link.artwork_url || "/placeholder.svg"}
            alt={link.title}
            className="w-24 h-24 object-cover rounded-lg"
          />
        </div>
        <div className="flex-grow space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold">{link.title}</h3>
              <p className="text-sm text-muted-foreground">{link.artist_name}</p>
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
                <DropdownMenuItem onClick={() => navigate(`/links/${link.id}/analytics`)}>
                  <BarChart2Icon className="mr-2 h-4 w-4" />
                  Analytics
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
          <div className="flex flex-wrap gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
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
                    className="h-8 w-8"
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
                    className="h-8 w-8"
                    onClick={() => navigate(`/links/${link.id}/analytics`)}
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
                    className="h-8 w-8"
                    onClick={generateSocialAsset}
                  >
                    <InstagramIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Create Social Media Assets</p>
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
      />
    </>
  );
}
