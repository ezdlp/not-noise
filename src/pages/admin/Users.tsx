import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { UserPlus, Pencil, Trash2 } from "lucide-react";
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
}

export default function Users() {
  const navigate = useNavigate();
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);

  const { data: users, isLoading } = useQuery({
    queryKey: ["adminUsers"],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select(`
          *,
          user_roles (
            role
          ),
          smart_links:smart_links (
            id,
            title
          )
        `);

      if (error) throw error;
      return profiles as Profile[];
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

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Artist Name</TableHead>
            <TableHead>Genre</TableHead>
            <TableHead>Country</TableHead>
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
    </div>
  );
}