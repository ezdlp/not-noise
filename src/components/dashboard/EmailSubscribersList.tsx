
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

interface EmailSubscriber {
  id: string;
  email: string;
  subscribed_at: string;
  smart_link: {
    title: string;
  };
}

interface RawEmailSubscriber {
  id: string;
  email: string;
  subscribed_at: string;
  smart_link: {
    title: string;
  } | {
    title: string;
  }[];
}

export function EmailSubscribersList() {
  const { data: subscribers, isLoading } = useQuery({
    queryKey: ['email-subscribers'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error("Not authenticated");
      
      const { data, error } = await supabase
        .from('email_subscribers')
        .select('id, email, subscribed_at, smart_link!inner(title)')
        .eq('user_id', user.id)
        .order('subscribed_at', { ascending: false });
        
      if (error) throw error;
      
      // Transform the data to match the EmailSubscriber interface
      return (data || []).map(subscriber => {
        const rawSubscriber = subscriber as unknown as RawEmailSubscriber;
        
        // Handle the case where smart_link could be an array or a single object
        const smartLinkTitle = Array.isArray(rawSubscriber.smart_link) 
          ? rawSubscriber.smart_link[0]?.title 
          : rawSubscriber.smart_link?.title;
          
        return {
          id: rawSubscriber.id,
          email: rawSubscriber.email,
          subscribed_at: rawSubscriber.subscribed_at,
          smart_link: {
            title: smartLinkTitle || 'Unknown'
          }
        };
      }) as EmailSubscriber[];
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Recent Email Subscribers</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
          </div>
        ) : subscribers && subscribers.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Smart Link</TableHead>
                <TableHead>Subscribed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscribers.slice(0, 5).map((subscriber) => (
                <TableRow key={subscriber.id}>
                  <TableCell className="font-medium">{subscriber.email}</TableCell>
                  <TableCell>{subscriber.smart_link.title}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDistanceToNow(new Date(subscriber.subscribed_at), { addSuffix: true })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-4">
            <p className="text-muted-foreground">No subscribers yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
