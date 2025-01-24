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
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

interface SmartLinkCardProps {
  link: any;
  onDelete?: (id: string) => void;
}

export function SmartLinkCard({ link, onDelete }: SmartLinkCardProps) {
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
              <Button variant="ghost" size="icon">
                <MoreVerticalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate(`/links/${link.id}/edit`)}>
                <EditIcon className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(`/dashboard/analytics/${link.id}`)}>
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
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            asChild
          >
            <Link to={`/link/${link.slug}`} target="_blank">
              <ExternalLinkIcon className="mr-2 h-4 w-4" />
              View Link
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={copyToClipboard}
          >
            {isCopied ? (
              <CheckIcon className="mr-2 h-4 w-4" />
            ) : (
              <CopyIcon className="mr-2 h-4 w-4" />
            )}
            Copy URL
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/dashboard/analytics/${link.id}`)}
          >
            <BarChart2Icon className="mr-2 h-4 w-4" />
            Analytics
          </Button>
        </div>
      </div>
    </Card>
  );
}