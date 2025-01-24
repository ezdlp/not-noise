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
  InfoIcon,
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
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

interface SmartLinkCardProps {
  link: any;
  onDelete?: (id: string) => void;
  popularityScore?: number | null;
}

export function SmartLinkCard({ link, onDelete, popularityScore = null }: SmartLinkCardProps) {
  const navigate = useNavigate();
  const [isCopied, setIsCopied] = useState(false);

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

  const getScoreColor = (score: number | null) => {
    if (!score) return "text-muted-foreground";
    if (score <= 20) return "text-[#ea384c]";
    if (score <= 30) return "text-yellow-500";
    if (score <= 60) return "text-blue-500";
    return "text-green-500";
  };

  const getProgressColor = (score: number | null) => {
    if (!score) return "bg-muted-foreground/30";
    if (score <= 20) return "bg-[#ea384c]";
    if (score <= 30) return "bg-yellow-500";
    if (score <= 60) return "bg-blue-500";
    return "bg-green-500";
  };

  const getProgressBgColor = (score: number | null) => {
    if (!score) return "bg-muted-foreground/10";
    if (score <= 20) return "bg-[#ea384c]/25";
    if (score <= 30) return "bg-yellow-500/25";
    if (score <= 60) return "bg-blue-500/25";
    return "bg-green-500/25";
  };

  const getScoreMessage = (score: number | null) => {
    if (!score) {
      return "Unable to retrieve Spotify popularity score. This could be because there's no Spotify link added or the track information is unavailable.";
    }
    const baseMessage = "Spotify Popularity Score (0-100): ";
    if (score <= 20) {
      return baseMessage + "Your music needs more engagement to trigger Spotify's algorithms. At this stage, songs typically don't appear in Discover Weekly or Release Radar.";
    }
    if (score <= 30) {
      return baseMessage + "You're approaching the algorithm threshold! Songs in this range start appearing in Radio stations and 'Fans Also Like' features.";
    }
    if (score <= 60) {
      return baseMessage + "Great news! Your music is now active in Spotify's algorithm, appearing in Discover Weekly and Release Radar. Keep the momentum going!";
    }
    return baseMessage + "Impressive! Your music has strong algorithmic presence, getting premium placement and maximum exposure across Spotify's ecosystem.";
  };

  return (
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
            <div className="mt-2">
              <div className="text-sm text-muted-foreground mb-1">Popularity Score</div>
              <div className="flex items-center gap-2">
                <div className="w-32">
                  <Progress 
                    value={popularityScore || 0} 
                    className={`h-2 ${getProgressBgColor(popularityScore)}`}
                    indicatorClassName={getProgressColor(popularityScore)}
                  />
                </div>
                <span className={`text-sm font-medium ${getScoreColor(popularityScore)}`}>
                  {popularityScore ?? "-"}
                </span>
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>{getScoreMessage(popularityScore)}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
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
        <div className="flex flex-wrap gap-2">
          <TooltipProvider delayDuration={0}>
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
                  onClick={() => navigate(`/dashboard/analytics/${link.id}`)}
                >
                  <BarChart2Icon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Analytics</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </Card>
