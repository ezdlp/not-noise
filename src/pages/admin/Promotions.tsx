import React, { useState, useEffect } from 'react';
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
import { AlertCircle, CheckCircle, FileText, Loader2 } from "lucide-react";
import { formatDistance } from "date-fns";
import SpotifyPopularityBackfill from './components/SpotifyPopularityBackfill';
import { CampaignResultsUploader } from './components/CampaignResultsUploader';
import { CampaignResultsAnalyzer } from './components/CampaignResultsAnalyzer';
import { DeletePromotionDialog } from './components/DeletePromotionDialog';
import { Promotion } from "@/types/database";
import { updatePromotionStatus } from "@/lib/promotion-utils";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Promotions() {
  const [activeTab, setActiveTab] = useState("promotions");
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Promotion | null>(null);
  const [analysisDialogOpen, setAnalysisDialogOpen] = useState(false);
  
  useEffect(() => {
    const checkAuth = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Auth error:", error);
        toast({
          title: "Authentication Error",
          description: "Could not verify your admin session. Please try logging in again.",
          variant: "destructive",
        });
      } else if (data.session) {
        console.log("Auth session found:", data.session.user.id);
        
        const { data: roleData, error: roleError } = await supabase.rpc('has_role', {
          _role: 'admin'
        });
        
        if (roleError) {
          console.error("Role check error:", roleError);
        } else {
          console.log("Is admin:", roleData);
        }
      } else {
        console.warn("No auth session found");
      }
      setAuthChecked(true);
    };
    
    checkAuth();
  }, []);
  
  const { 
    data: promotions, 
    isLoading, 
    refetch,
    error
  } = useQuery({
    queryKey: ["admin-promotions"],
    queryFn: async () => {
      console.log("Fetching promotions...");
      
      const { data: sessionData } = await supabase.auth.getSession();
      console.log("Current session user:", sessionData?.session?.user?.id);
      
      const { data: promoData, error: promoError } = await supabase
        .from("promotions")
        .select(`*`)
        .order("created_at", { ascending: false });
      
      if (promoError) {
        console.error("Error fetching promotions:", promoError);
        throw promoError;
      }
      
      const enhancedPromotions = await Promise.all(
        (promoData || []).map(async (promo) => {
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select(`name, email, artist_name`)
            .eq("id", promo.user_id)
            .single();
            
          if (profileError && !profileError.message.includes("No rows found")) {
            console.error("Error fetching profile for user ID:", promo.user_id, profileError);
          }
          
          return {
            ...promo,
            profiles: profileData || null
          };
        })
      );
      
      console.log(`Fetched ${enhancedPromotions?.length || 0} promotions`);
      return enhancedPromotions as unknown as Promotion[] || [];
    },
    enabled: authChecked,
  });

  const handleStatusChange = async (promotionId: string, newStatus: 'pending' | 'active' | 'completed' | 'rejected') => {
    try {
      setUpdatingStatus(promotionId);
      
      let dbStatus = newStatus;
      
      const success = await updatePromotionStatus(promotionId, dbStatus);
      
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
    const uiStatus = status === 'pending' ? 'payment_pending' : 
                     status === 'completed' ? 'delivered' :
                     status === 'rejected' ? 'cancelled' : status;
                     
    switch (uiStatus) {
      case 'payment_pending': return "bg-yellow-100 text-yellow-800";
      case 'active': return "bg-green-100 text-green-800";
      case 'delivered': return "bg-blue-100 text-blue-800";
      case 'cancelled': return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    const uiStatus = status === 'pending' ? 'payment_pending' : 
                     status === 'completed' ? 'delivered' :
                     status === 'rejected' ? 'cancelled' : status;
                     
    switch(uiStatus) {
      case 'delivered': 
        return <CheckCircle className="h-4 w-4 text-blue-700" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4 text-red-700" />;
      default:
        return null;
    }
  };
  
  const getStatusDisplay = (status: string) => {
    const uiStatus = status === 'pending' ? 'payment_pending' : 
                     status === 'completed' ? 'delivered' :
                     status === 'rejected' ? 'cancelled' : status;
                     
    switch(uiStatus) {
      case 'payment_pending': return 'Payment Pending';
      case 'active': return 'Active';
      case 'delivered': return 'Delivered';
      case 'cancelled': return 'Cancelled';
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const openCampaignAnalyzer = (campaign: Promotion) => {
    setSelectedCampaign(campaign);
    setAnalysisDialogOpen(true);
  };

  const showDebugInfo = process.env.NODE_ENV === 'development';

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Playlist Promotions</h1>
        <p className="text-muted-foreground">
          Manage promotions and related data collection
        </p>
      </div>

      {showDebugInfo && error && (
        <Card className="p-4 mb-4 bg-red-50 border-red-200">
          <h3 className="text-red-700 font-medium">Error Loading Promotions</h3>
          <pre className="text-xs mt-2 whitespace-pre-wrap">{JSON.stringify(error, null, 2)}</pre>
        </Card>
      )}

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
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      <div className="mt-2">Loading promotions...</div>
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
                              {getStatusDisplay(promo.status)}
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
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2">
                            <Select
                              disabled={updatingStatus === promo.id}
                              defaultValue={promo.status}
                              onValueChange={(value) => handleStatusChange(promo.id, value as 'pending' | 'active' | 'completed' | 'rejected')}
                            >
                              <SelectTrigger className="w-[110px]">
                                <SelectValue placeholder="Change status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Payment Pending</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="completed">Delivered</SelectItem>
                                <SelectItem value="rejected">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => openCampaignAnalyzer(promo)}
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              Results
                            </Button>
                          </div>
                          <div>
                            <DeletePromotionDialog 
                              promotionId={promo.id}
                              promotionName={`${promo.track_name} by ${promo.track_artist}`}
                              onSuccess={() => refetch()}
                            />
                          </div>
                        </div>
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

      <Dialog open={analysisDialogOpen} onOpenChange={setAnalysisDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Campaign Results: {selectedCampaign?.track_name} by {selectedCampaign?.track_artist}
            </DialogTitle>
          </DialogHeader>
          
          {selectedCampaign && (
            <CampaignResultsAnalyzer 
              campaign={selectedCampaign} 
              onComplete={() => refetch()}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
