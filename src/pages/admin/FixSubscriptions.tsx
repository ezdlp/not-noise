
import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoCircle, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const FixSubscriptions = () => {
  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isFixing, setIsFixing] = useState(false);
  const [fixResult, setFixResult] = useState<any>(null);

  // Fetch users with potential subscription issues
  const { data: potentialIssues, isLoading, refetch } = useQuery({
    queryKey: ['potential-subscription-issues'],
    queryFn: async () => {
      const { data: usersWithMultipleSubscriptions, error } = await supabase
        .from('subscriptions')
        .select(`
          user_id,
          count(*),
          profiles!inner(email, name)
        `)
        .gt('count', 1)
        .group('user_id, profiles.email, profiles.name');

      if (error) throw error;
      
      // Get information about imported users
      const { data: importedUsers } = await supabase
        .from('import_logs')
        .select('mapped_user_id')
        .not('mapped_user_id', 'is', null);
      
      const importedUserIds = new Set(importedUsers?.map(u => u.mapped_user_id) || []);
      
      return (usersWithMultipleSubscriptions || []).map(user => ({
        ...user,
        wasImported: importedUserIds.has(user.user_id)
      }));
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Find user by email
  const { mutate: findUserByEmail, isLoading: isFindingUser } = useMutation({
    mutationFn: async (email: string) => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email')
        .ilike('email', `%${email}%`)
        .limit(10);
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data && data.length > 0) {
        setUserId(data[0].id);
        toast.success(`Found user: ${data[0].email}`);
      } else {
        toast.error('No user found with that email');
      }
    },
    onError: (error) => {
      toast.error(`Error finding user: ${error.message}`);
    }
  });

  // Fix subscription
  const fixSubscription = async () => {
    if (!userId) {
      toast.error('Please enter a user ID');
      return;
    }

    setIsFixing(true);
    setFixResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('You must be logged in to fix subscriptions');
        setIsFixing(false);
        return;
      }

      const response = await fetch('https://owtufhdsuuyrgmxytclj.supabase.co/functions/v1/fix-subscription-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ userId })
      });

      const result = await response.json();

      if (response.ok) {
        setFixResult(result);
        toast.success('Subscription fixed successfully!');
        refetch();
      } else {
        toast.error(`Error fixing subscription: ${result.error}`);
        setFixResult({ error: result.error });
      }
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
      setFixResult({ error: error.message });
    } finally {
      setIsFixing(false);
    }
  };

  // Filter users based on search term
  const filteredIssues = searchTerm && potentialIssues 
    ? potentialIssues.filter(issue => 
        issue.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.user_id?.includes(searchTerm)
      ) 
    : potentialIssues;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Fix Subscription Issues</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Fix Individual Subscription</CardTitle>
            <CardDescription>Enter a user's email or ID to fix their subscription</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input 
                  placeholder="Search by email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                />
                <Button 
                  onClick={() => findUserByEmail(email)} 
                  disabled={!email || isFindingUser}
                >
                  Find
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Input 
                placeholder="User ID" 
                value={userId} 
                onChange={e => setUserId(e.target.value)} 
              />
              <Button 
                onClick={fixSubscription} 
                disabled={!userId || isFixing}
                className="w-full"
              >
                {isFixing ? 'Fixing...' : 'Fix Subscription'}
              </Button>
            </div>

            {fixResult && (
              <div className="mt-4">
                {fixResult.error ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                      {fixResult.error}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-700">Success</AlertTitle>
                    <AlertDescription className="text-green-600">
                      Fixed subscription for user. Found {fixResult.total_subscriptions_found} subscriptions, keeping {fixResult.kept_subscription.id}.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Database Insights</CardTitle>
            <CardDescription>Understanding the current subscription data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground space-y-2">
              <p><InfoCircle className="inline h-4 w-4 mr-1" /> The issue occurs when a user has multiple subscription records in the database.</p>
              <p><InfoCircle className="inline h-4 w-4 mr-1" /> The system generally picks the first subscription record it finds, which might be the 'free' tier instead of 'pro'.</p>
              <p><InfoCircle className="inline h-4 w-4 mr-1" /> This tool prioritizes yearly subscriptions over monthly ones, and active over inactive.</p>
              <p><InfoCircle className="inline h-4 w-4 mr-1" /> It also cancels (but does not refund) any duplicate active subscriptions.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users with Multiple Subscriptions</CardTitle>
          <CardDescription>These users may have subscription display issues</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Search by email or ID..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {isLoading ? (
            <div className="text-center p-4">Loading potential issues...</div>
          ) : filteredIssues && filteredIssues.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead>Subscription Count</TableHead>
                    <TableHead>Imported User</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIssues.map((issue) => (
                    <TableRow key={issue.user_id}>
                      <TableCell>{issue.profiles?.email}</TableCell>
                      <TableCell className="font-mono text-xs">{issue.user_id}</TableCell>
                      <TableCell>{issue.count}</TableCell>
                      <TableCell>
                        {issue.wasImported ? (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                            Imported
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            Native
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setUserId(issue.user_id);
                            toast.info(`Selected user: ${issue.profiles?.email}`);
                          }}
                        >
                          Select
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          ) : (
            <div className="text-center p-4">
              {searchTerm ? 'No matching results found.' : 'No potential issues found. All users have at most one subscription record.'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FixSubscriptions;
