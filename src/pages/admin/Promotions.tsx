
import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { AlertCircle, CheckCircle } from "lucide-react";
import { formatDistance } from "date-fns";
import SpotifyPopularityBackfill from './components/SpotifyPopularityBackfill';
import { CampaignResultsUploader } from './components/CampaignResultsUploader';
import { Promotion } from "@/types/database";
import { updatePromotionStatus } from "@/lib/promotion-utils";

export default function Promotions() {
  const [activeTab, setActiveTab] = useState("promotions");
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  
  const { 
    data: promotions, 
    isLoading, 
    refetch 
  } = useQuery({
    queryKey: ["admin-promotions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("promotions")
        .select(`
          *,
          profiles:user_id (
            name,
            email,
            artist_name
          )
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as unknown as Promotion[] || [];
    },
  });

  const handleStatusChange = async (promotionId: string, newStatus: 'pending' | 'active' | 'completed' | 'cancelled' | 'rejected') => {
    try {
      setUpdatingStatus(promotionId);
      
      const success = await updatePromotionStatus(promotionId, newStatus);
      
      if (success) {
        await refetch();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to update status: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setUpdatingStatus(null);
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return "bg-yellow-100 text-yellow-800";
      case 'active': return "bg-green-100 text-green-800";
      case 'completed': return "bg-blue-100 text-blue-800";
      case 'cancelled': return "bg-red-100 text-red-800";
      case 'rejected': return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'completed': 
        return <CheckCircle className="h-4 w-4 text-blue-700" />;
      case 'cancelled':
      case 'rejected':
        return <AlertCircle className="h-4 w-4 text-red-700" />;
      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Playlist Promotions</h1>
        <p className="text-muted-foreground">
          Manage promotions and related data collection
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="promotions">Promotion Campaigns</TabsTrigger>
          <TabsTrigger value="campaign-results">Campaign Results</TabsTrigger>
          <TabsTrigger value="tools">Admin Tools</TabsTrigger>
        </TabsList>
        
        <TabsContent value="promotions">
          <Card className="overflow-hidden">
            <Table>
              <TableCaption>
                {isLoading ? "Loading promotions..." : `Showing ${promotions?.length || 0} promotions`}
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Track</TableHead>
                  <TableHead>Artist</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Genre</TableHead>
                  <TableHead>Submissions</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-10">
                      Loading promotions...
                    </TableCell>
                  </TableRow>
                ) : promotions?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-10">
                      No promotions found
                    </TableCell>
                  </TableRow>
                ) : (
                  promotions?.map((promo: Promotion) => (
                    <TableRow key={promo.id}>
                      <TableCell className="font-medium">{promo.track_name}</TableCell>
                      <TableCell>{promo.track_artist}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{promo.profiles?.name || 'Unknown'}</span>
                          <span className="text-xs text-muted-foreground">{promo.profiles?.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge 
                            className={getStatusColor(promo.status)}
                            variant="outline"
                          >
                            <span className="flex items-center gap-1">
                              {getStatusIcon(promo.status)}
                              {promo.status.charAt(0).toUpperCase() + promo.status.slice(1)}
                            </span>
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>{promo.genre}</TableCell>
                      <TableCell>{promo.submission_count}</TableCell>
                      <TableCell>
                        {formatDistance(new Date(promo.created_at), new Date(), { 
                          addSuffix: true 
                        })}
                      </TableCell>
                      <TableCell>${promo.total_cost}</TableCell>
                      <TableCell>
                        <Select
                          disabled={updatingStatus === promo.id}
                          defaultValue={promo.status}
                          onValueChange={(value) => handleStatusChange(promo.id, value as 'pending' | 'active' | 'completed' | 'cancelled' | 'rejected')}
                        >
                          <SelectTrigger className="w-[110px]">
                            <SelectValue placeholder="Change status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
        
        <TabsContent value="campaign-results">
          <CampaignResultsUploader 
            campaigns={promotions || []} 
            isLoading={isLoading} 
          />
        </TabsContent>
        
        <TabsContent value="tools">
          <div className="grid grid-cols-1 gap-6">
            <SpotifyPopularityBackfill />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
