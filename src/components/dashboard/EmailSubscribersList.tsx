
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Download } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface EmailSubscriber {
  id: string;
  email: string;
  subscribed_at: string;
  smart_link: {
    title: string;
  };
}

export function EmailSubscribersList() {
  const { data: subscribers, isLoading, error } = useQuery({
    queryKey: ["emailSubscribers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_subscribers")
        .select(`
          id,
          email,
          subscribed_at,
          smart_link:smart_links (
            title
          )
        `)
        .order("subscribed_at", { ascending: false });

      if (error) {
        console.error("Error fetching subscribers:", error);
        throw error;
      }

      return data as EmailSubscriber[];
    },
    retry: 1,
    meta: {
      onError: (error: Error) => {
        console.error("Error in email subscribers query:", error);
        toast.error("Failed to load email subscribers");
      }
    }
  });

  const handleExportCSV = () => {
    if (!subscribers?.length) return;

    const csvContent = [
      ["Email", "Release", "Subscribed Date"],
      ...subscribers.map((subscriber) => [
        subscriber.email,
        subscriber.smart_link.title,
        new Date(subscriber.subscribed_at).toLocaleDateString(),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("hidden", "");
    a.setAttribute("href", url);
    a.setAttribute("download", "email_subscribers.csv");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-6">
        <p className="text-muted-foreground">Failed to load subscribers</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Email Subscribers</h2>
          <p className="text-muted-foreground">
            Manage and export your email subscribers
          </p>
        </div>
        <Button onClick={handleExportCSV} disabled={!subscribers?.length}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {!subscribers?.length ? (
        <div className="text-center py-6">
          <p className="text-muted-foreground">No subscribers yet</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Release</TableHead>
              <TableHead>Subscribed</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscribers.map((subscriber) => (
              <TableRow key={subscriber.id}>
                <TableCell>{subscriber.email}</TableCell>
                <TableCell>{subscriber.smart_link.title}</TableCell>
                <TableCell>
                  {formatDistanceToNow(new Date(subscriber.subscribed_at), {
                    addSuffix: true,
                  })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
