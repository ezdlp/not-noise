
import React from 'react';
import { Card } from "@/components/ui/card";
import { 
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { formatDistance } from "date-fns";

export default function Promotions() {
  const { data: promotions, isLoading } = useQuery({
    queryKey: ["admin-promotions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("promotions")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return "bg-yellow-100 text-yellow-800";
      case 'active': return "bg-green-100 text-green-800";
      case 'completed': return "bg-blue-100 text-blue-800";
      case 'cancelled': return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Playlist Promotions</h1>
        <p className="text-muted-foreground">
          Manage and monitor user playlist promotion campaigns
        </p>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableCaption>
            {isLoading ? "Loading promotions..." : `Showing ${promotions?.length || 0} promotions`}
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Track</TableHead>
              <TableHead>Artist</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Genre</TableHead>
              <TableHead>Submissions</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10">
                  Loading promotions...
                </TableCell>
              </TableRow>
            ) : promotions?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10">
                  No promotions found
                </TableCell>
              </TableRow>
            ) : (
              promotions?.map((promo: any) => (
                <TableRow key={promo.id}>
                  <TableCell className="font-medium">{promo.track_name}</TableCell>
                  <TableCell>{promo.track_artist}</TableCell>
                  <TableCell>
                    <Badge 
                      className={getStatusColor(promo.status)}
                      variant="outline"
                    >
                      {promo.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{promo.genre}</TableCell>
                  <TableCell>{promo.submission_count}</TableCell>
                  <TableCell>
                    {formatDistance(new Date(promo.created_at), new Date(), { 
                      addSuffix: true 
                    })}
                  </TableCell>
                  <TableCell>${promo.total_cost}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
