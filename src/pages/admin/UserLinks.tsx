import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

interface SmartLink {
  id: string;
  title: string;
  created_at: string;
  platform_links: {
    id: string;
    platform_name: string;
  }[];
  link_views: {
    id: string;
  }[];
}

interface Profile {
  name: string;
  artist_name: string;
}

export default function UserLinks() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const { data: profile } = useQuery({
    queryKey: ["userProfile", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("name, artist_name")
        .eq("id", userId)
        .single();

      if (error) throw error;
      return data as Profile;
    },
  });

  const { data: smartLinks, isLoading } = useQuery({
    queryKey: ["userSmartLinks", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("smart_links")
        .select(`
          *,
          platform_links (
            id,
            platform_name
          ),
          link_views (
            id
          )
        `)
        .eq("user_id", userId);

      if (error) throw error;
      return data as SmartLink[];
    },
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate("/admin/users")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Users
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {profile?.artist_name}'s Smart Links
          </h1>
          <p className="text-muted-foreground">
            Viewing all smart links for {profile?.name}
          </p>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Platforms</TableHead>
            <TableHead>Views</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {smartLinks?.map((link) => (
            <TableRow key={link.id}>
              <TableCell className="font-medium">{link.title}</TableCell>
              <TableCell>{link.platform_links?.length || 0}</TableCell>
              <TableCell>{link.link_views?.length || 0}</TableCell>
              <TableCell>
                {formatDistanceToNow(new Date(link.created_at), {
                  addSuffix: true,
                })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}