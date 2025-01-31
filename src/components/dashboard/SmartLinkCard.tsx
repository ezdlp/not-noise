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
  ImageIcon,
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
import { toPng } from 'html-to-image';

interface SmartLinkCardProps {
  link: any;
  onDelete?: (id: string) => void;
}

export function SmartLinkCard({ link, onDelete }: SmartLinkCardProps) {
  const navigate = useNavigate();
  const [isCopied, setIsCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

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

    setIsGenerating(true);
    const loadingToast = toast.loading("✨ We're doing some magic! Your asset will be ready in seconds...");

    try {
      // Create a temporary container
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '-9999px';
      document.body.appendChild(container);

      // Get the HTML template from the Edge Function
      const { data: templateHtml, error: templateError } = await supabase.functions.invoke('generate-social-assets', {
        body: {
          smartLinkId: link.id,
          platform: 'instagram_square',
          artworkUrl: link.artwork_url,
          title: link.title,
          artistName: link.artist_name
        }
      });

      if (templateError) throw templateError;

      // Set the HTML content
      container.innerHTML = templateHtml;

      // Wait for fonts to load
      await document.fonts.ready;

      // Wait for the artwork image to load
      const artworkImg = container.querySelector('.artwork') as HTMLImageElement;
      if (!artworkImg) throw new Error('Artwork image not found in template');

      await new Promise((resolve, reject) => {
        artworkImg.onload = resolve;
        artworkImg.onerror = () => reject(new Error('Failed to load artwork image'));
      });

      // Convert to image with proper dimensions
      const dataUrl = await toPng(container, {
        quality: 1,
        pixelRatio: 2,
        width: 1080,
        height: 1080,
        backgroundColor: '#6851FB',
      });

      // Remove the temporary container
      document.body.removeChild(container);

      // Convert data URL to Blob
      const res = await fetch(dataUrl);
      const blob = await res.blob();

      // Upload to Supabase Storage
      const filename = `${link.id}-instagram-square-${Date.now()}.png`;
      const filePath = `${link.id}/${filename}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('social-media-assets')
        .upload(filePath, blob, {
          contentType: 'image/png',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('social-media-assets')
        .getPublicUrl(filePath);

      toast.dismiss(loadingToast);
      toast.success("Asset generated successfully!");

      // Open the generated image in a new tab
      window.open(publicUrl, '_blank');
    } catch (error) {
      console.error('Error generating asset:', error);
      toast.dismiss(loadingToast);
      toast.error("Failed to generate social media asset");
    } finally {
      setIsGenerating(false);
    }
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
              <DropdownMenuItem onClick={generateSocialAsset} disabled={isGenerating}>
                <ImageIcon className="mr-2 h-4 w-4" />
                Generate Test Asset
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
          </TooltipProvider>
        </div>
      </div>
    </Card>
  );
}
