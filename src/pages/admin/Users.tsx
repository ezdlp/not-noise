import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { UserPlus, Pencil, Trash2, Mail } from "lucide-react";
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
import { User } from '@supabase/supabase-js';

interface UserRole {
  role: 'admin' | 'user';
}

interface Profile {
  id: string;
  name: string;
  artist_name: string;
  music_genre: string;
  country: string;
  user_roles: UserRole[];
  smart_links: {
    id: string;
    title: string;
  }[];
  email?: string;
}

export default function Users() {
  const navigate = useNavigate();
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [pageSize, setPageSize] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(0);

  const { data: users, isLoading } = useQuery({
    queryKey: ["adminUsers", pageSize, currentPage],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data: userRoles, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'admin');

      if (roleError || !userRoles?.length) {
        throw new Error("Not authorized");
      }

      // Get all users with their profiles and emails
      const { data: profiles, error } = await supabase
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

      if (error) {
        console.error("Error fetching profiles:", error);
        throw error;
      }

      // Get emails from auth.users
      const { data: authData, error: authError } = await supabase.auth.admin.listUsers({
        page: currentPage + 1,
        perPage: pageSize,
      });

      if (authError) {
        console.error("Error fetching auth users:", authError);
        throw authError;
      }

      const authUsers = authData?.users as User[];

      // Merge profiles with emails
      const profilesWithEmail = profiles.map(profile => ({
        ...profile,
        email: authUsers?.find(user => user.id === profile.id)?.email
      }));

      return profilesWithEmail as Profile[];
    },
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">Manage your application users.</p>
        </div>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Add New User
        </Button>
      </div>

      <div className="flex justify-end mb-4">
        <Select
          value={pageSize.toString()}
          onValueChange={(value) => {
            setPageSize(Number(value));
            setCurrentPage(0);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select page size" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="20">20 per page</SelectItem>
            <SelectItem value="50">50 per page</SelectItem>
            <SelectItem value="100">100 per page</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Artist Name</TableHead>
            <TableHead>Genre</TableHead>
            <TableHead>Country</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Smart Links</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users?.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.name}</TableCell>
              <TableCell>{user.artist_name}</TableCell>
              <TableCell>{user.music_genre}</TableCell>
              <TableCell>{user.country}</TableCell>
              <TableCell className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {user.email}
              </TableCell>
              <TableCell>{user.user_roles?.[0]?.role || "user"}</TableCell>
              <TableCell>
                <Button 
                  variant="link" 
                  onClick={() => navigate(`/admin/users/${user.id}/links`)}
                >
                  {user.smart_links?.length || 0} links
                </Button>
              </TableCell>
              <TableCell className="space-x-2">
                <Dialog open={selectedUser?.id === user.id} onOpenChange={(open) => !open && setSelectedUser(null)}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => setSelectedUser(user)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit User</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          defaultValue={user.name}
                          onChange={(e) => setSelectedUser(prev => prev ? {...prev, name: e.target.value} : null)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="artist_name">Artist Name</Label>
                        <Input
                          id="artist_name"
                          defaultValue={user.artist_name}
                          onChange={(e) => setSelectedUser(prev => prev ? {...prev, artist_name: e.target.value} : null)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="music_genre">Genre</Label>
                        <Input
                          id="music_genre"
                          defaultValue={user.music_genre}
                          onChange={(e) => setSelectedUser(prev => prev ? {...prev, music_genre: e.target.value} : null)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="country">Country</Label>
                        <Input
                          id="country"
                          defaultValue={user.country}
                          onChange={(e) => setSelectedUser(prev => prev ? {...prev, country: e.target.value} : null)}
                        />
                      </div>
                      <Button 
                        className="w-full" 
                        onClick={() => handleEditUser(selectedUser!)}
                      >
                        Save Changes
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button variant="ghost" size="icon">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex justify-end mt-4">
        <div className="space-x-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
            disabled={currentPage === 0}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => prev + 1)}
            disabled={!users || users.length < pageSize}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}