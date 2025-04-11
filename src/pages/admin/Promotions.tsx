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
import { AlertCircle, CheckCircle, FileText, Loader2, Edit, Save, Globe, Pencil, Check, X } from "lucide-react";
import { formatDistance, format } from "date-fns";
import SpotifyPopularityBackfill from './components/SpotifyPopularityBackfill';
import { CampaignResultsUploader } from './components/CampaignResultsUploader';
import { CampaignResultsAnalyzer } from './components/CampaignResultsAnalyzer';
import { DeletePromotionDialog } from './components/DeletePromotionDialog';
import { Promotion, UIPromotionStatus, dbToUiStatus } from "@/types/database";
import { updatePromotionStatus } from "@/lib/promotion-utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function Promotions() {
  const [activeTab, setActiveTab] = useState("promotions");
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Promotion | null>(null);
  const [analysisDialogOpen, setAnalysisDialogOpen] = useState(false);
  const [editingGenre, setEditingGenre] = useState<string | null>(null);
  const [genreValue, setGenreValue] = useState<string>("");
  const [editingDuration, setEditingDuration] = useState<string | null>(null);
  const [durationValue, setDurationValue] = useState<number>(7);
  
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
            .select(`name, email, artist_name, country`)
            .eq("id", promo.user_id)
            .single();
            
          if (profileError && !profileError.message.includes("No rows found")) {
            console.error("Error fetching profile for user ID:", promo.user_id, profileError);
          }
          
          // Fetch Spotify popularity scores
          let popularityScore = null;
          try {
            // Use fetch directly to get spotify track popularity
            const apiUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
            
            if (apiUrl && apiKey) {
              const response = await fetch(
                `${apiUrl}/rest/v1/spotify_popularity?track_id=eq.${promo.spotify_track_id}&select=popularity`,
                {
                  headers: {
                    'apikey': apiKey,
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                  }
                }
              );
              
              if (response.ok) {
                const data = await response.json();
                if (data && data.length > 0 && data[0].popularity !== undefined) {
                  popularityScore = data[0].popularity;
                }
              }
            }
          } catch (popError) {
            console.error("Error fetching popularity score:", popError);
          }
          
          const stripeFeePercent = 0.029;
          const stripeFeeFixed = 0.30;
          const netTotal = promo.total_cost - (promo.total_cost * stripeFeePercent + stripeFeeFixed);
          
          return {
            ...promo,
            profiles: profileData || null,
            popularity_score: popularityScore,
            net_total: parseFloat(netTotal.toFixed(2))
          };
        })
      );
      
      console.log(`Fetched ${enhancedPromotions?.length || 0} promotions`);
      return enhancedPromotions as unknown as Promotion[] || [];
    },
    enabled: authChecked,
  });

  const handleStatusChange = async (promotionId: string, newUiStatus: UIPromotionStatus) => {
    try {
      setUpdatingStatus(promotionId);
      
      const success = await updatePromotionStatus(promotionId, newUiStatus);
      
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
  
  const getStatusColor = (dbStatus: string) => {
    const uiStatus = dbToUiStatus(dbStatus as Promotion['status']);
                     
    switch (uiStatus) {
      case 'payment_pending': return "bg-yellow-100 text-yellow-800";
      case 'active': return "bg-green-100 text-green-800";
      case 'delivered': return "bg-blue-100 text-blue-800";
      case 'cancelled': return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (dbStatus: string) => {
    const uiStatus = dbToUiStatus(dbStatus as Promotion['status']);
                     
    switch(uiStatus) {
      case 'delivered': 
        return <CheckCircle className="h-4 w-4 text-blue-700" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4 text-red-700" />;
      default:
        return null;
    }
  };
  
  const getStatusDisplay = (dbStatus: string) => {
    const uiStatus = dbToUiStatus(dbStatus as Promotion['status']);
                     
    switch(uiStatus) {
      case 'payment_pending': return 'Payment Pending';
      case 'active': return 'Active';
      case 'delivered': return 'Delivered';
      case 'cancelled': return 'Cancelled';
      default: return dbStatus.charAt(0).toUpperCase() + dbStatus.slice(1);
    }
  };

  const openCampaignAnalyzer = (campaign: Promotion) => {
    setSelectedCampaign(campaign);
    setAnalysisDialogOpen(true);
  };

  const showDebugInfo = process.env.NODE_ENV === 'development';

  const handleGenreEdit = (promotionId: string, currentGenre: string) => {
    setEditingGenre(promotionId);
    setGenreValue(currentGenre);
  };
  
  const saveGenre = async (promotionId: string) => {
    try {
      const { error } = await supabase
        .from("promotions")
        .update({ genre: genreValue })
        .eq("id", promotionId);
        
      if (error) {
        throw error;
      }
      
      toast({
        title: "Genre Updated",
        description: "The genre has been successfully updated.",
      });
      
      await refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to update genre: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setEditingGenre(null);
    }
  };

  const handleDurationEdit = (promotionId: string, currentDuration: number | null) => {
    setEditingDuration(promotionId);
    setDurationValue(currentDuration || 7);
  };

  const saveDuration = async (promotionId: string) => {
    try {
      const { error } = await supabase
        .from('promotions')
        .update({ 
          duration_days: durationValue 
        } as any)
        .eq('id', promotionId);
        
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Campaign duration updated successfully",
      });
      
      await refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to update duration: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setEditingDuration(null);
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
                  <TableHead>Created</TableHead>
                  <TableHead>Track</TableHead>
                  <TableHead>Artist</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Genre</TableHead>
                  <TableHead>Duration (days)</TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      Popularity
                      <Tooltip>
                        <TooltipTrigger>
                          <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          Spotify track popularity score (0-100)
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Submissions</TableHead>
                  <TableHead>Gross Total</TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      Net Total
                      <Tooltip>
                        <TooltipTrigger>
                          <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          After Stripe fees (2.9% + $0.30)
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-10">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      <div className="mt-2">Loading promotions...</div>
                    </TableCell>
                  </TableRow>
                ) : promotions?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-10">
                      No promotions found
                    </TableCell>
                  </TableRow>
                ) : (
                  promotions?.map((promo: Promotion) => (
                    <TableRow key={promo.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(promo.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="font-medium">
                        <a 
                          href={`https://open.spotify.com/track/${promo.spotify_track_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {promo.track_name}
                        </a>
                      </TableCell>
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
                            className={getStatusColor(dbToUiStatus(promo.status))}
                            variant="outline"
                          >
                            <span className="flex items-center gap-1">
                              {getStatusIcon(dbToUiStatus(promo.status))}
                              {getStatusDisplay(dbToUiStatus(promo.status))}
                            </span>
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {editingGenre === promo.id ? (
                          <div className="flex items-center gap-2">
                            <Input 
                              value={genreValue} 
                              onChange={(e) => setGenreValue(e.target.value)}
                              className="h-8 w-28"
                            />
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-6 w-6"
                              onClick={() => saveGenre(promo.id)}
                            >
                              <Save className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span>{promo.genre || 'Not specified'}</span>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-6 w-6"
                              onClick={() => handleGenreEdit(promo.id, promo.genre)}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingDuration === promo.id ? (
                          <div className="flex gap-2 items-center">
                            <Input
                              type="number" 
                              min={1}
                              max={30}
                              value={durationValue}
                              onChange={(e) => setDurationValue(Number(e.target.value))}
                              className="w-16"
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => saveDuration(promo.id)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingDuration(null)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div 
                            className="flex items-center gap-2 cursor-pointer" 
                            onClick={() => handleDurationEdit(promo.id, promo.duration_days)}
                          >
                            {promo.duration_days || 7}
                            <Pencil className="h-3 w-3 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {promo.popularity_score !== null ? (
                          <span className="font-mono">{promo.popularity_score}</span>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {promo.profiles?.country ? (
                          <div className="flex items-center gap-1">
                            <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{promo.profiles.country}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">Unknown</span>
                        )}
                      </TableCell>
                      <TableCell>{promo.submission_count}</TableCell>
                      <TableCell>${promo.total_cost}</TableCell>
                      <TableCell>${promo.net_total}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2">
                            <Select
                              disabled={updatingStatus === promo.id}
                              defaultValue={dbToUiStatus(promo.status)}
                              onValueChange={(value) => handleStatusChange(promo.id, value as UIPromotionStatus)}
                            >
                              <SelectTrigger className="w-[110px]">
                                <SelectValue placeholder="Change status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="payment_pending">Payment Pending</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="delivered">Delivered</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
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
              Campaign Results: 
              {selectedCampaign && (
                <>
                  <a 
                    href={`https://open.spotify.com/track/${selectedCampaign.spotify_track_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {selectedCampaign.track_name}
                  </a>
                  {" by "}
                  {selectedCampaign.track_artist}
                </>
              )}
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
