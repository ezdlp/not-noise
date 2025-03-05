import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { UserPlus, Pencil, Trash2, Search, Users, ArrowUpDown, X, Check } from "lucide-react";
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
import { useState, FormEvent } from "react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Profile } from "@/types/database";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { genres } from "@/lib/genres";
import { motion, AnimatePresence } from "framer-motion";

export default function UsersPage() {
  const navigate = useNavigate();
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [pageSize, setPageSize] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchValue, setSearchValue] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState({
    subscription: 'all' as 'all' | 'pro' | 'free',
    genre: 'all' as string,
    country: 'all' as string,
  });
  const [filteredCount, setFilteredCount] = useState<number>(0);
  const [countryOpen, setCountryOpen] = useState(false);

  const { data: countries = [], isLoading: isLoadingCountries } = useQuery({
    queryKey: ["uniqueCountries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('country')
        .not('country', 'is', null);

      if (error) {
        console.error("Error fetching countries:", error);
        return [];
      }

      const uniqueCountries = Array.from(new Set(data.map(p => p.country)))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));

      return uniqueCountries;
    }
  });

  const { data: users, isLoading, error: queryError } = useQuery({
    queryKey: ["adminUsers", currentPage, pageSize, sortDirection, filters, searchQuery],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Not authenticated");
      }

      const { data: isAdmin, error: adminCheckError } = await supabase.rpc('has_role', {
        _role: 'admin'
      });

      if (adminCheckError || !isAdmin) {
        console.error("Admin check error:", adminCheckError);
        throw new Error("Not authorized");
      }

      let query = supabase
        .from("profiles")
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
        `, { count: 'exact' })
        .order('created_at', { ascending: sortDirection === 'asc' });

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

      const { data, error: fetchError, count } = await query
        .range(currentPage * pageSize, (currentPage + 1) * pageSize - 1);

      if (fetchError) {
        console.error("Error fetching users:", fetchError);
        toast.error("Failed to load users");
        throw fetchError;
      }

      // Ensure all users have the expected structure for nested relationships
      const processedData = data?.map(user => ({
        ...user,
        user_roles: user.user_roles || [],
        subscriptions: user.subscriptions || [],
        smart_links: user.smart_links || []
      })) || [];

      setFilteredCount(count || 0);
      return processedData as Profile[];
    }
  });

  const handleEditUser = async (updatedProfile: Partial<Profile>) => {
    if (!selectedUser) return;

    const { error: updateError } = await supabase
      .from('profiles')
      .update(updatedProfile)
      .eq('id', selectedUser.id);

    if (updateError) {
      toast.error("Failed to update user");
      return;
    }

    toast.success("User updated successfully");
    setSelectedUser(null);
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchValue);
    setCurrentPage(0);
  };

  const toggleSort = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    setCurrentPage(0);
  };

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

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );

  if (queryError) {
    console.error("Error loading users:", queryError);
    return (
      <div className="text-center py-8 text-red-600">
        Error loading users. Please try again.
      </div>
    );
  }

  const activeFiltersCount = Object.values(filters).filter(value => value !== 'all').length + (searchQuery ? 1 : 0);

  return (
    <div className="space-y-6">
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

      <Card className="p-6">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <motion.span 
            key={filteredCount}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-semibold"
          >
            {filteredCount}
          </motion.span>
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
          onValueChange={(value) => setFilters(prev => ({ ...prev, subscription: value as 'all' | 'pro' | 'free' }))}
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

        <Popover open={countryOpen} onOpenChange={setCountryOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={countryOpen}
              className="w-[180px] justify-between"
            >
              {filters.country === 'all'
                ? "Select country"
                : filters.country}
              <ArrowUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[180px] p-0">
            <Command>
              <CommandInput placeholder="Search country..." />
              <CommandEmpty>No country found.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    setFilters(prev => ({ ...prev, country: 'all' }));
                    setCountryOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      filters.country === 'all' ? "opacity-100" : "opacity-0"
                    )}
                  />
                  All countries
                </CommandItem>
                {!isLoadingCountries && countries?.map((country) => (
                  <CommandItem
                    key={country}
                    onSelect={() => {
                      setFilters(prev => ({ ...prev, country }));
                      setCountryOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        filters.country === country ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {country}
                  </CommandItem>
                ))}
                {isLoadingCountries && (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    Loading countries...
                  </div>
                )}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>

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
            <AnimatePresence mode="wait">
              {users?.map((user) => (
                <motion.tr
                  key={user.id}
                  className="transition-colors hover:bg-muted/50"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.artist_name}</TableCell>
                  <TableCell>{user.music_genre}</TableCell>
                  <TableCell>{user.country}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={user.subscriptions && user.subscriptions.length > 0 && user.subscriptions[0]?.tier === 'pro' ? 'default' : 'secondary'}
                      className={`${
                        user.subscriptions && user.subscriptions.length > 0 && user.subscriptions[0]?.tier === 'pro' 
                          ? 'bg-primary/10 text-primary hover:bg-primary/20' 
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
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
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                              id="name"
                              defaultValue={user.name}
                              onChange={(e) => setSelectedUser(prev => prev ? {...prev, name: e.target.value} : null)}
                              className="bg-muted border-input focus:border-primary-medium transition-colors"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="artist_name">Artist Name</Label>
                            <Input
                              id="artist_name"
                              defaultValue={user.artist_name}
                              onChange={(e) => setSelectedUser(prev => prev ? {...prev, artist_name: e.target.value} : null)}
                              className="bg-muted border-input focus:border-primary-medium transition-colors"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="music_genre">Genre</Label>
                            <Select
                              defaultValue={user.music_genre}
                              onValueChange={(value) => setSelectedUser(prev => prev ? {...prev, music_genre: value} : null)}
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
                              defaultValue={user.country}
                              onValueChange={(value) => setSelectedUser(prev => prev ? {...prev, country: value} : null)}
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
                </motion.tr>
              ))}
              {(!users || users.length === 0) && (
                <motion.tr
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <TableCell colSpan={9} className="h-24 text-center">
                    <p className="text-muted-foreground font-sans">
                      {filters.subscription !== 'all' 
                        ? `No ${filters.subscription} users found 🎧` 
                        : "No users found. Try adjusting your filters 🎧"}
                    </p>
                  </TableCell>
                </motion.tr>
              )}
            </AnimatePresence>
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
