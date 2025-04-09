
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  BarChart2Icon, 
  EditIcon, 
  TrashIcon, 
  SearchIcon,
  Link2Icon,
  ExternalLinkIcon,
  ArrowLeft,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  AlertCircle
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { SmartLink } from "@/types/database";
import { Card, CardContent } from "@/components/ui/card";

export default function SmartLinks() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('userId');
  const [pageSize, setPageSize] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [hasError, setHasError] = useState<boolean>(false);

  const { data: adminStatus, isLoading: adminLoading } = useQuery({
    queryKey: ["checkAdminStatus"],
    queryFn: async () => {
      // Check admin status to prevent unauthorized access
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return { isAdmin: false, message: "Not authenticated" };

        // Try to check with RPC first
        const { data: rpcData, error: rpcError } = await supabase
          .rpc('has_role', { _role: 'admin' });

        if (!rpcError && rpcData === true) {
          return { isAdmin: true, message: "Admin via RPC" };
        }

        // Also check profiles.is_admin as fallback
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', session.user.id)
          .single();

        console.log("Admin checks:", {
          rpcData,
          rpcError,
          profile,
          profileError
        });

        return { 
          isAdmin: (rpcData === true) || (profile && profile.is_admin), 
          message: "Admin status checked" 
        };
      } catch (e) {
        console.error("Error checking admin status:", e);
        return { isAdmin: false, message: "Error checking permissions" };
      }
    },
    retry: 1
  });

  const { data: userData } = useQuery({
    queryKey: ["adminUser", userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!userId && !!adminStatus?.isAdmin
  });

  const { data: totalCount } = useQuery({
    queryKey: ["adminTotalSmartLinks", userId],
    queryFn: async () => {
      let query = supabase
        .from("smart_links")
        .select('*', { count: 'exact', head: true });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { count, error } = await query;

      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!adminStatus?.isAdmin,
    onError: (error) => {
      console.error("Error fetching smart links count:", error);
      setHasError(true);
    }
  });

  const { data: smartLinks, isLoading, error: fetchError } = useQuery({
    queryKey: ["adminSmartLinks", userId, currentPage, pageSize, sortDirection],
    queryFn: async () => {
      try {
        if (!adminStatus?.isAdmin) {
          throw new Error("Unauthorized: Admin access required");
        }

        let query = supabase
          .from("smart_links")
          .select(`
            *,
            profiles!inner (
              name,
              email,
              artist_name
            ),
            platform_links (
              id,
              platform_id,
              platform_name,
              url,
              platform_clicks (
                id,
                clicked_at
              )
            ),
            link_views (
              id,
              viewed_at
            ),
            email_subscribers (
              id
            )
          `)
          .order('created_at', { ascending: sortDirection === 'asc' })
          .range(currentPage * pageSize, (currentPage + 1) * pageSize - 1);

        if (userId) {
          query = query.eq('user_id', userId);
        }

        const { data, error } = await query;

        if (error) {
          console.error("Error fetching smart links:", error);
          toast.error("Failed to load smart links");
          throw error;
        }

        return data as SmartLink[];
      } catch (error) {
        console.error("Error in smart links query:", error);
        setHasError(true);
        throw error;
      }
    },
    enabled: !!adminStatus?.isAdmin,
    retry: 1
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("smart_links")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminSmartLinks"] });
      toast.success("Smart link deleted successfully");
    },
    onError: (error) => {
      console.error("Error deleting smart link:", error);
      toast.error("Failed to delete smart link");
    },
  });

  if (adminLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-3">Checking permissions...</span>
      </div>
    );
  }

  if (!adminStatus?.isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-gray-600 mb-6 text-center">
          You don't have permission to access this page.
        </p>
        <Button
          onClick={() => navigate('/dashboard')}
        >
          Back to Dashboard
        </Button>
      </div>
    );
  }

  if (hasError || fetchError) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-heading font-bold tracking-tight">Smart Links</h1>
        </div>

        <Card className="p-6">
          <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[200px]">
            <AlertCircle className="h-12 w-12 text-orange-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error Loading Smart Links</h2>
            <p className="text-gray-600 mb-4 text-center max-w-md">
              There was a problem loading the smart links data. This might be due to a network issue or server problem.
            </p>
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => navigate('/dashboard')}
              >
                Back to Dashboard
              </Button>
              <Button
                onClick={() => {
                  setHasError(false);
                  queryClient.invalidateQueries({ queryKey: ["adminSmartLinks"] });
                }}
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredLinks = smartLinks?.filter(link => 
    link.title?.toLowerCase().includes(search.toLowerCase()) ||
    link.artist_name?.toLowerCase().includes(search.toLowerCase()) ||
    link.profiles?.email?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil((totalCount ?? 0) / pageSize);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-heading font-bold tracking-tight">
            {userData ? `Smart Links for ${userData.name}` : 'All Smart Links'}
          </h1>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3">Loading smart links...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-4">
            {userId && (
              <Button
                variant="ghost"
                onClick={() => navigate('/control-room/users')}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Users
              </Button>
            )}
            <div>
              <h1 className="text-3xl font-heading font-bold tracking-tight">
                {userData ? `Smart Links for ${userData.name}` : 'All Smart Links'}
              </h1>
              <p className="text-muted-foreground">
                {userData ? `Viewing links created by ${userData.artist_name || userData.name}` : 'Overview of all smart links created on the platform'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-2 text-2xl font-semibold">
          <Link2Icon className="h-5 w-5 text-primary" />
          <span>{totalCount ?? 0}</span>
          <span className="text-muted-foreground text-base font-normal">total smart links</span>
        </div>
      </Card>

      <div className="flex justify-between items-center mb-4">
        <div className="relative w-72">
          <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, artist or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex items-center gap-4">
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => {
              setPageSize(parseInt(value));
              setCurrentPage(0);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select page size" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="20">20 per page</SelectItem>
                <SelectItem value="50">50 per page</SelectItem>
                <SelectItem value="100">100 per page</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredLinks && filteredLinks.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Artist</TableHead>
                {!userId && <TableHead>Created By</TableHead>}
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                    className="flex items-center gap-1"
                  >
                    Created
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Clicks</TableHead>
                <TableHead>CTR</TableHead>
                <TableHead>Platforms</TableHead>
                <TableHead>Subscribers</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLinks.map((link) => {
                const views = link.link_views?.length || 0;
                const clicks = link.platform_links?.reduce((sum, pl) => 
                  sum + (pl.platform_clicks?.length || 0), 0) || 0;
                const ctr = views > 0 ? ((clicks / views) * 100).toFixed(1) : "0";

                return (
                  <TableRow key={link.id}>
                    <TableCell className="font-medium">{link.title || 'Untitled'}</TableCell>
                    <TableCell>{link.artist_name || 'Unknown Artist'}</TableCell>
                    {!userId && (
                      <TableCell>
                        <div>
                          <div>{link.profiles?.name || 'Unknown'}</div>
                          <div className="text-sm text-muted-foreground">
                            {link.profiles?.email || 'No email'}
                          </div>
                        </div>
                      </TableCell>
                    )}
                    <TableCell>
                      {link.created_at ? formatDistanceToNow(new Date(link.created_at), { addSuffix: true }) : 'Unknown'}
                    </TableCell>
                    <TableCell>{views}</TableCell>
                    <TableCell>{clicks}</TableCell>
                    <TableCell>{ctr}%</TableCell>
                    <TableCell>{link.platform_links?.length || 0}</TableCell>
                    <TableCell>{link.email_subscribers?.length || 0}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => window.open(`/link/${link.slug}`, '_blank')}
                      >
                        <ExternalLinkIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/links/${link.id}/analytics`)}
                      >
                        <BarChart2Icon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/links/${link.id}/edit`)}
                      >
                        <EditIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteMutation.mutate(link.id)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <Card className="p-6">
          <CardContent className="pt-6">
            <div className="text-center py-10">
              <Link2Icon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Smart Links Found</h3>
              <p className="text-gray-500 mb-6">
                {search ? 'No results match your search criteria.' : 'No smart links have been created yet.'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {currentPage * pageSize + 1} to {Math.min((currentPage + 1) * pageSize, totalCount ?? 0)} of {totalCount} results
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
            disabled={currentPage === 0}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
            disabled={currentPage >= totalPages - 1}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
