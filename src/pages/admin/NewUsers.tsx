import * as React from "react";
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { toast } from 'sonner';

// UI Components
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

// Icons
import {
  UserPlus,
  Pencil,
  Trash2,
  Search,
  Users as UsersIcon,
  ArrowUpDown,
  X,
} from 'lucide-react';

// Data
import { genres } from '@/lib/genres';

const NewUsersPage = () => {
  // Navigation
  const navigate = useNavigate();
  
  // State
  const [selectedUser, setSelectedUser] = React.useState<any>(null);
  const [searchValue, setSearchValue] = React.useState('');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(20);
  const [filters, setFilters] = React.useState({
    subscription: 'all',
    genre: 'all',
    country: 'all',
  });
  
  // Fetch countries for filter
  const { data: countries = [] } = useQuery({
    queryKey: ['uniqueCountries'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('country')
          .not('country', 'is', null);

        if (error) {
          console.error('Error fetching countries:', error);
          return [];
        }

        const uniqueCountries = Array.from(new Set(data.map(p => p.country)))
          .filter(Boolean)
          .sort((a, b) => String(a).localeCompare(String(b)));

        return uniqueCountries;
      } catch (err) {
        console.error('Error fetching countries:', err);
        return [];
      }
    },
  });

  // Fetch users
  const { 
    data: users = [], 
    isLoading, 
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ['adminUsers', currentPage, pageSize, sortDirection, filters, searchQuery],
    queryFn: async () => {
      try {
        // Check authentication
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error('Not authenticated');
        }

        // Check admin role
        const { data: isAdmin, error: adminCheckError } = await supabase.rpc('has_role', {
          _role: 'admin'
        });

        if (adminCheckError || !isAdmin) {
          console.error('Admin check error:', adminCheckError);
          throw new Error('Not authorized');
        }

        // Build query
        let query = supabase
          .from('profiles')
          .select(`
            *,
            user_roles (
              id,
              role
            ),
            subscriptions (
              tier,
              is_lifetime,
              is_early_adopter,
              current_period_end
            ),
            smart_links (
              id,
              title,
              artist_name,
              created_at,
              user_id,
              content_type
            )
          `, { count: 'exact' });

        // Apply sorting
        query = query.order('created_at', { ascending: sortDirection === 'asc' });

        // Apply filters
        if (filters.subscription !== 'all') {
          query = query.eq('subscriptions.tier', filters.subscription);
        }
        if (filters.genre !== 'all') {
          query = query.eq('music_genre', filters.genre);
        }
        if (filters.country !== 'all') {
          query = query.eq('country', filters.country);
        }
        if (searchQuery) {
          query = query.or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,artist_name.ilike.%${searchQuery}%`);
        }

        // Apply pagination
        const { data, error: fetchError, count } = await query
          .range(currentPage * pageSize, (currentPage + 1) * pageSize - 1);

        if (fetchError) {
          console.error('Error fetching users:', fetchError);
          toast.error('Failed to load users');
          throw fetchError;
        }

        // Process data to ensure all expected properties exist
        const processedData = (data || []).map(user => ({
          ...user,
          user_roles: Array.isArray(user.user_roles) ? user.user_roles : [],
          subscriptions: Array.isArray(user.subscriptions) ? user.subscriptions : [],
          smart_links: Array.isArray(user.smart_links) ? user.smart_links : []
        }));

        return { users: processedData, count: count || 0 };
      } catch (err) {
        console.error('Error in users query:', err);
        toast.error('An error occurred while loading users');
        throw err;
      }
    },
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Calculate active filters count
  const activeFiltersCount = 
    Object.values(filters).filter(value => value !== 'all').length + 
    (searchQuery ? 1 : 0);

  // Handle user edit
  const handleEditUser = async (updatedProfile) => {
    if (!selectedUser) return;
    
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updatedProfile)
        .eq('id', selectedUser.id);

      if (updateError) {
        toast.error('Failed to update user');
        return;
      }

      toast.success('User updated successfully');
      setSelectedUser(null);
      refetch();
    } catch (err) {
      console.error('Error updating user:', err);
      toast.error('An error occurred while updating the user');
    }
  };

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchValue);
    setCurrentPage(0);
  };

  // Toggle sort direction
  const toggleSort = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    setCurrentPage(0);
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      subscription: 'all',
      genre: 'all',
      country: 'all',
    });
    setSearchQuery('');
    setSearchValue('');
    setCurrentPage(0);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Error state
  if (queryError) {
    return (
      <div className="text-center py-8 text-red-600">
        <h2 className="text-2xl font-bold mb-4">Error loading users</h2>
        <p>Please try again or contact support if the problem persists.</p>
        <Button 
          onClick={() => refetch()}
          className="mt-4"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-heading font-bold tracking-tight">
            Users
          </h1>
          <p className="text-muted-foreground font-sans">
            Manage your application users
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary-medium transition-colors">
          <UserPlus className="mr-2 h-4 w-4" />
          Add New User
        </Button>
      </div>

      {/* Stats Card */}
      <Card className="p-6">
        <div className="flex items-center gap-2">
          <UsersIcon className="h-5 w-5 text-primary" />
          <span className="text-2xl font-semibold">
            {users?.count || 0}
          </span>
          <span className="text-muted-foreground text-base font-normal">
            {activeFiltersCount > 0 ? 'filtered' : 'total'} users
          </span>
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="ml-2 h-8 px-2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4 mr-1" />
              Clear filters
            </Button>
          )}
        </div>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center mb-4">
        <form onSubmit={handleSearch} className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-8 bg-background border-input focus:border-primary-medium transition-colors"
          />
        </form>

        <Select
          value={filters.subscription}
          onValueChange={(value) => setFilters(prev => ({ ...prev, subscription: value }))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Subscription tier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tiers</SelectItem>
            <SelectItem value="pro">Pro users</SelectItem>
            <SelectItem value="free">Free users</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.genre}
          onValueChange={(value) => setFilters(prev => ({ ...prev, genre: value }))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select genre" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All genres</SelectItem>
            {genres.map(genre => (
              <SelectItem key={genre} value={genre}>{genre}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.country}
          onValueChange={(value) => setFilters(prev => ({ ...prev, country: value }))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select country" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All countries</SelectItem>
            {countries.map(country => (
              <SelectItem key={country} value={country}>{country}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={String(pageSize)}
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

      {/* Users Table */}
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-muted/50">
              <TableHead className="font-heading">Name</TableHead>
              <TableHead className="font-heading">Email</TableHead>
              <TableHead className="font-heading">Artist Name</TableHead>
              <TableHead className="font-heading">Genre</TableHead>
              <TableHead className="font-heading">Country</TableHead>
              <TableHead className="font-heading">Plan</TableHead>
              <TableHead className="font-heading">Smart Links</TableHead>
              <TableHead 
                className="font-heading cursor-pointer group"
                onClick={toggleSort}
              >
                <div className="flex items-center gap-2">
                  Created At
                  <ArrowUpDown className={`h-4 w-4 transition-colors ${sortDirection === 'desc' ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />
                </div>
              </TableHead>
              <TableHead className="font-heading">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.users && users.users.length > 0 ? (
              users.users.map((user) => (
                <TableRow key={user.id} className="transition-colors hover:bg-muted/50">
                  <TableCell className="font-medium">{user.name || 'N/A'}</TableCell>
                  <TableCell>{user.email || 'N/A'}</TableCell>
                  <TableCell>{user.artist_name || 'N/A'}</TableCell>
                  <TableCell>{user.music_genre || 'N/A'}</TableCell>
                  <TableCell>{user.country || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge className={user.subscriptions && user.subscriptions.length > 0 && user.subscriptions[0]?.tier === 'pro' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}>
                      {user.subscriptions && user.subscriptions.length > 0 && user.subscriptions[0]?.tier === 'pro' ? 'Pro' : 'Free'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="link" 
                      onClick={() => navigate(`/control-room/smart-links?userId=${user.id}`)}
                      className="text-primary hover:text-primary-medium transition-colors"
                    >
                      {user.smart_links?.length || 0} links
                    </Button>
                  </TableCell>
                  <TableCell>
                    {user.created_at ? format(new Date(user.created_at), 'MMM d, yyyy') : 'N/A'}
                  </TableCell>
                  <TableCell className="space-x-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="hover:bg-primary/10 transition-colors"
                          onClick={() => setSelectedUser(user)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-card">
                        <DialogHeader>
                          <DialogTitle className="font-heading">Edit User</DialogTitle>
                        </DialogHeader>
                        {selectedUser && (
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="name">Name</Label>
                              <Input
                                id="name"
                                defaultValue={selectedUser.name}
                                onChange={(e) => setSelectedUser(prev => ({...prev, name: e.target.value}))}
                                className="bg-muted border-input focus:border-primary-medium transition-colors"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="artist_name">Artist Name</Label>
                              <Input
                                id="artist_name"
                                defaultValue={selectedUser.artist_name}
                                onChange={(e) => setSelectedUser(prev => ({...prev, artist_name: e.target.value}))}
                                className="bg-muted border-input focus:border-primary-medium transition-colors"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="music_genre">Genre</Label>
                              <Select
                                defaultValue={selectedUser.music_genre}
                                onValueChange={(value) => setSelectedUser(prev => ({...prev, music_genre: value}))}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select genre" />
                                </SelectTrigger>
                                <SelectContent>
                                  {genres.map(genre => (
                                    <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="country">Country</Label>
                              <Select
                                defaultValue={selectedUser.country}
                                onValueChange={(value) => setSelectedUser(prev => ({...prev, country: value}))}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select country" />
                                </SelectTrigger>
                                <SelectContent>
                                  {countries.map(country => (
                                    <SelectItem key={country} value={country}>{country}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <Button 
                              className="w-full bg-primary hover:bg-primary-medium transition-colors"
                              onClick={() => handleEditUser(selectedUser)}
                            >
                              Save Changes
                            </Button>
                          </div>
                        )}
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
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center">
                  <p className="text-muted-foreground font-sans">
                    {filters.subscription !== 'all' 
                      ? `No ${filters.subscription} users found 🎧` 
                      : "No users found. Try adjusting your filters 🎧"}
                  </p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
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
          disabled={!users?.users || users.users.length < pageSize}
          className="border-neutral hover:border-primary-medium hover:bg-primary-light transition-colors"
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default NewUsersPage; 