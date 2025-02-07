import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { UserPlus, Pencil, Trash2, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Profile {
  id: string;
  name: string;
  artist_name: string;
  music_genre: string;
  country: string;
  email?: string;
  user_roles: UserRole[];
  smart_links: SmartLink[];
}

interface UserRole {
  id: string;
  role: 'admin' | 'user';
}

interface SmartLink {
  id: string;
  title: string;
}

export default function Users() {
  const navigate = useNavigate();
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [pageSize, setPageSize] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const { data: users, isLoading, error } = useQuery({
    queryKey: ["adminUsers", pageSize, currentPage, searchQuery],
    queryFn: async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.error("Not authenticated");
          throw new Error("Not authenticated");
        }

        const { data: userRoles, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .eq('role', 'admin');

        if (roleError || !userRoles?.length) {
          console.error("Not authorized");
          throw new Error("Not authorized");
        }

        let query = supabase
          .from("profiles")
          .select(`
            *,
            user_roles (
              role
            ),
            smart_links (
              id,
              title
            )
          `)
          .range(currentPage * pageSize, (currentPage + 1) * pageSize - 1);

        if (searchQuery) {
          query = query.or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
        }

        const { data: profiles, error: profilesError } = await query;

        if (profilesError) {
          console.error("Error fetching profiles:", profilesError);
          throw profilesError;
        }

        return profiles as Profile[];
      } catch (error) {
        console.error("Error in query function:", error);
        toast.error("Failed to load users");
        throw error;
      }
    },
    refetchInterval: 5000,
  });

  const handleEditUser = async (updatedProfile: Partial<Profile>) => {
    if (!selectedUser) return;

    const { error } = await supabase
      .from('profiles')
      .update(updatedProfile)
      .eq('id', selectedUser.id);

    if (error) {
      toast.error("Failed to update user");
      return;
    }

    toast.success("User updated successfully");
    setSelectedUser(null);
  };

  if (isLoading) return <div>Loading...</div>;

  if (error) {
    console.error("Error loading users:", error);
    return <div>Error loading users. Please try again.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-heading font-bold tracking-tight text-foreground">
            Users
          </h1>
          <p className="text-muted-foreground font-sans">
            Manage your application users.
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary-medium transition-colors">
          <UserPlus className="mr-2 h-4 w-4" />
          Add New User
        </Button>
      </div>

      <div className="flex justify-between items-center mb-4">
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 bg-neutral-light border-neutral focus:border-primary-medium transition-colors"
          />
        </div>
        <Select
          value={pageSize.toString()}
          onValueChange={(value) => {
            setPageSize(Number(value));
            setCurrentPage(0);
          }}
        >
          <SelectTrigger className="w-[180px] border-neutral hover:border-primary-medium transition-colors">
            <SelectValue placeholder="Select page size" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="20">20 per page</SelectItem>
            <SelectItem value="50">50 per page</SelectItem>
            <SelectItem value="100">100 per page</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-neutral bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-neutral-light hover:bg-neutral-light">
              <TableHead className="font-heading">Name</TableHead>
              <TableHead className="font-heading">Artist Name</TableHead>
              <TableHead className="font-heading">Genre</TableHead>
              <TableHead className="font-heading">Country</TableHead>
              <TableHead className="font-heading">Role</TableHead>
              <TableHead className="font-heading">Smart Links</TableHead>
              <TableHead className="font-heading">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map((user) => (
              <TableRow key={user.id} className="hover:bg-neutral-light transition-colors">
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.artist_name}</TableCell>
                <TableCell>{user.music_genre}</TableCell>
                <TableCell>{user.country}</TableCell>
                <TableCell>{user.user_roles?.[0]?.role || "user"}</TableCell>
                <TableCell>
                  <Button 
                    variant="link" 
                    onClick={() => navigate(`/admin/users/${user.id}/links`)}
                    className="text-primary hover:text-primary-medium transition-colors"
                  >
                    {user.smart_links?.length || 0} links
                  </Button>
                </TableCell>
                <TableCell className="space-x-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="hover:bg-primary-light transition-colors"
                        onClick={() => setSelectedUser(user)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-card">
                      <DialogHeader>
                        <DialogTitle className="font-heading">Edit User</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Name</Label>
                          <Input
                            id="name"
                            defaultValue={user.name}
                            onChange={(e) => setSelectedUser(prev => prev ? {...prev, name: e.target.value} : null)}
                            className="bg-neutral-light border-neutral focus:border-primary-medium transition-colors"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="artist_name">Artist Name</Label>
                          <Input
                            id="artist_name"
                            defaultValue={user.artist_name}
                            onChange={(e) => setSelectedUser(prev => prev ? {...prev, artist_name: e.target.value} : null)}
                            className="bg-neutral-light border-neutral focus:border-primary-medium transition-colors"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="music_genre">Genre</Label>
                          <Input
                            id="music_genre"
                            defaultValue={user.music_genre}
                            onChange={(e) => setSelectedUser(prev => prev ? {...prev, music_genre: e.target.value} : null)}
                            className="bg-neutral-light border-neutral focus:border-primary-medium transition-colors"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="country">Country</Label>
                          <Input
                            id="country"
                            defaultValue={user.country}
                            onChange={(e) => setSelectedUser(prev => prev ? {...prev, country: e.target.value} : null)}
                            className="bg-neutral-light border-neutral focus:border-primary-medium transition-colors"
                          />
                        </div>
                        <Button 
                          className="w-full bg-primary hover:bg-primary-medium transition-colors"
                          onClick={() => handleEditUser(selectedUser!)}
                        >
                          Save Changes
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="hover:bg-secondary-light hover:text-secondary transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end mt-4 space-x-2">
        <Button
          variant="outline"
          onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
          disabled={currentPage === 0}
          className="border-neutral hover:border-primary-medium hover:bg-primary-light transition-colors"
        >
          Previous
        </Button>
        <Button
          variant="outline"
          onClick={() => setCurrentPage(prev => prev + 1)}
          disabled={!users || users.length < pageSize}
          className="border-neutral hover:border-primary-medium hover:bg-primary-light transition-colors"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
