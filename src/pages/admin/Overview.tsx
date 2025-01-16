import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function Overview() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["adminStats"],
    queryFn: async () => {
      const [
        { count: usersCount },
        { count: linksCount },
        { count: postsCount },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("smart_links").select("*", { count: "exact", head: true }),
        supabase.from("blog_posts").select("*", { count: "exact", head: true }),
      ]);

      return {
        users: usersCount || 0,
        links: linksCount || 0,
        posts: postsCount || 0,
      };
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Overview</h1>
        <p className="text-muted-foreground">
          Welcome to the admin dashboard. Here's an overview of your application.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <h3 className="font-semibold text-lg">Total Users</h3>
          <p className="text-3xl font-bold">{stats?.users}</p>
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold text-lg">Smart Links</h3>
          <p className="text-3xl font-bold">{stats?.links}</p>
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold text-lg">Blog Posts</h3>
          <p className="text-3xl font-bold">{stats?.posts}</p>
        </Card>
      </div>
    </div>
  );
}