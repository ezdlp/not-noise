import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, CheckCircle, Lightbulb, ListTodo, ExternalLink, Music, Headphones } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface CampaignResultsDashboardProps {
  campaignId: string;
}

interface CampaignReport {
  curator_name: string;
  action: string;
  feedback: string;
  playlist_link?: string;
}

interface AiAnalysis {
  campaign_report: CampaignReport[];
  key_takeaways: string[];
  actionable_points: string[];
  error?: string;
  raw_response?: string;
}

interface ResultStats {
  totalSubmissions?: number;
  approvalRate?: number;
  approved?: number;
  declined?: number;
}

interface CampaignResult {
  stats?: ResultStats;
  ai_analysis?: AiAnalysis | Record<string, any>;
  raw_data?: any;
}

interface Campaign {
  id: string;
  track_name: string;
  track_artist: string;
  status: string;
  artwork_url?: string;
  package_tier?: string;
  submission_count?: number;
  spotify_track_id?: string;
  // ... other campaign fields
}

interface QueryResult {
  campaign: Campaign;
  results: CampaignResult | null;
}

export function CampaignResultsDashboard({ campaignId }: CampaignResultsDashboardProps) {
  const [trackArtwork, setTrackArtwork] = useState<string | null>(null);
  const [processedStats, setProcessedStats] = useState<ResultStats | null>(null);
  const [processedReports, setProcessedReports] = useState<CampaignReport[] | null>(null);

  // Fetch campaign data and results
  const { data, isLoading, error } = useQuery<QueryResult>({
    queryKey: ['campaign-results', campaignId],
    queryFn: async () => {
      const { data: campaign, error: campaignError } = await supabase
        .from('promotions')
        .select('*')
        .eq('id', campaignId)
        .single();
      
      if (campaignError) throw campaignError;
      
      const { data: resultData, error: resultError } = await supabase
        .from('campaign_result_data')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (resultError && !resultError.message.includes('No rows found')) {
        throw resultError;
      }
      
      return {
        campaign,
        results: resultData ? resultData as CampaignResult : null
      } as QueryResult;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false
  });

  // Process raw data to get accurate counts and unified reports
  useEffect(() => {
    if (data?.results?.raw_data) {
      try {
        const rawData = data.results.raw_data;
        
        // Process curator data from raw CSV
        if (Array.isArray(rawData.results)) {
          // Create a map to track processed curators (to avoid duplicates)
          const processedCurators = new Map();
          const validStatuses = ['approved', 'shared', 'declined'];
          
          // Count only valid submissions (approved, shared, declined)
          let approved = 0;
          let declined = 0;
          let totalValid = 0;
          
          // Process raw results to get accurate counts and deduplicated curators
          rawData.results.forEach((entry: any) => {
            const action = (entry.action || '').toLowerCase();
            const curatorName = entry.curator_name || '';
            
            // Only count entries with valid statuses
            if (validStatuses.includes(action) && curatorName) {
              totalValid++;
              
              if (action === 'approved' || action === 'shared') {
                approved++;
              } else if (action === 'declined') {
                declined++;
              }
              
              // Track curator by their name to avoid duplicates
              const curatorKey = curatorName.trim().toLowerCase();
              const existingCurator = processedCurators.get(curatorKey);
              
              if (existingCurator) {
                // If we already have this curator and current entry is approved/shared with playlist link
                if ((action === 'approved' || action === 'shared') && entry.playlist_url && !existingCurator.playlist_link) {
                  processedCurators.set(curatorKey, {
                    ...existingCurator,
                    action: 'Approved', // Normalize to "Approved"
                    playlist_link: entry.playlist_url
                  });
                }
              } else {
                // Add new curator
                processedCurators.set(curatorKey, {
                  curator_name: curatorName,
                  action: action === 'shared' ? 'Approved' : action.charAt(0).toUpperCase() + action.slice(1),
                  feedback: entry.feedback || '',
                  playlist_link: (action === 'approved' || action === 'shared') ? entry.playlist_url : undefined
                });
              }
            }
          });
          
          // Calculate approval rate
          const approvalRate = totalValid > 0 ? (approved / totalValid) * 100 : 0;
          
          // Update stats
          setProcessedStats({
            totalSubmissions: totalValid,
            approved: approved,
            declined: declined,
            approvalRate: approvalRate
          });
          
          // Convert map to array for reports
          setProcessedReports(Array.from(processedCurators.values()));
        }
      } catch (err) {
        console.error('Error processing raw CSV data:', err);
      }
    }
  }, [data]);

  // Fetch Spotify track artwork
  useEffect(() => {
    if (data?.campaign?.spotify_track_id) {
      const fetchSpotifyTrack = async () => {
        try {
          const { data: trackData, error } = await supabase.functions.invoke('spotify-search', {
            body: { url: data.campaign.spotify_track_id }
          });
          
          if (error) {
            console.error('Error fetching Spotify track:', error);
            return;
          }
          
          if (trackData && trackData.artworkUrl) {
            setTrackArtwork(trackData.artworkUrl);
          }
        } catch (err) {
          console.error('Failed to fetch track artwork:', err);
        }
      };
      
      fetchSpotifyTrack();
    }
  }, [data?.campaign?.spotify_track_id]);
  
  if (isLoading) {
    return <CampaignResultsSkeleton />;
  }
  
  if (error || !data) {
    return (
      <Card className="p-6">
        <div className="flex items-center space-x-2 text-red-600 mb-4">
          <AlertCircle size={20} />
          <h3 className="font-medium">Error Loading Results</h3>
        </div>
        <p className="text-muted-foreground">
          We couldn't load your campaign results. Please try again later or contact support.
        </p>
      </Card>
    );
  }
  
  const { campaign, results } = data || {};
  
  if (!results || !results.ai_analysis) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <div className="mx-auto h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center mb-4">
            <Lightbulb className="h-6 w-6 text-blue-500" />
          </div>
          <h3 className="text-lg font-medium mb-2">Results Coming Soon</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Your campaign results are being processed. Check back later to see detailed insights and feedback from playlist curators.
          </p>
        </div>
      </Card>
    );
  }
  
  // Safely access the AI analysis properties with proper type handling
  const aiAnalysis = results.ai_analysis;
  const key_takeaways = Array.isArray(aiAnalysis.key_takeaways) ? aiAnalysis.key_takeaways : [];
  const actionable_points = Array.isArray(aiAnalysis.actionable_points) ? aiAnalysis.actionable_points : [];
  
  // Use the processed campaign report if available, otherwise fall back to AI analysis
  const campaign_report = processedReports || 
    (Array.isArray(aiAnalysis.campaign_report) ? aiAnalysis.campaign_report : []);
  
  // Use processed stats if available, otherwise fall back to results stats
  const stats = processedStats || results.stats || {
    totalSubmissions: 0,
    approvalRate: 0,
    approved: 0,
    declined: 0
  };
  
  const defaultArtwork = "https://placehold.co/400x400/6851FB/FFFFFF?text=Track+Artwork";
  const artworkUrl = trackArtwork || campaign.artwork_url || defaultArtwork;
  const capitalizedTier = campaign.package_tier 
    ? campaign.package_tier.charAt(0).toUpperCase() + campaign.package_tier.slice(1) 
    : 'Standard';
  
  return (
    <div className="space-y-8">
      {/* Track Info with Artwork - Redesigned Header */}
      <Card className="overflow-hidden border-0 shadow-md">
        <div className="bg-gradient-to-r from-primary/5 to-primary/10 p-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative">
              <img 
                src={artworkUrl}
                alt={`${campaign.track_name} by ${campaign.track_artist}`}
                className="w-48 h-48 object-cover rounded-lg shadow-lg border-2 border-white"
              />
              <div className="absolute -bottom-3 -right-3 bg-primary text-white text-xs font-medium px-3 py-1 rounded-full shadow-md">
                {capitalizedTier} Campaign
              </div>
            </div>
            
            <div className="flex-1 md:ml-4">
              <h1 className="text-2xl font-bold mb-2">{campaign.track_name}</h1>
              <h2 className="text-lg text-muted-foreground mb-6">{campaign.track_artist}</h2>
              
              {/* Campaign stats in a sleek row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className="bg-white/60 p-3 rounded-lg shadow-sm flex flex-col items-center justify-center">
                  <span className="text-xs text-muted-foreground uppercase font-medium mb-1">Submissions</span>
                  <span className="text-2xl font-semibold">{stats.totalSubmissions || 0}</span>
                </div>
                <div className="bg-white/60 p-3 rounded-lg shadow-sm flex flex-col items-center justify-center">
                  <span className="text-xs text-muted-foreground uppercase font-medium mb-1">Approval Rate</span>
                  <span className="text-2xl font-semibold">{(stats.approvalRate || 0).toFixed(1)}%</span>
                </div>
                <div className="bg-white/60 p-3 rounded-lg shadow-sm flex flex-col items-center justify-center">
                  <span className="text-xs text-muted-foreground uppercase font-medium mb-1">Approved</span>
                  <span className="text-2xl font-semibold">{stats.approved || 0}</span>
                </div>
                <div className="bg-white/60 p-3 rounded-lg shadow-sm flex flex-col items-center justify-center">
                  <span className="text-xs text-muted-foreground uppercase font-medium mb-1">Est. Streams</span>
                  <span className="text-2xl font-semibold">{(stats.approved || 0) * 250}+</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
      
      {/* Key Takeaways and Actionable Suggestions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              <CardTitle className="text-base">Key Takeaways</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {key_takeaways && key_takeaways.map((takeaway, index) => (
                <li key={index} className="flex items-start">
                  <span className="mr-2 mt-1 text-primary">•</span>
                  <span>{takeaway}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <ListTodo className="h-5 w-5 text-blue-500" />
              <CardTitle className="text-base">Actionable Suggestions</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {actionable_points && actionable_points.map((point, index) => (
                <li key={index} className="flex items-start">
                  <span className="mr-2 mt-1 text-primary">•</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
      
      {/* Curator Feedback */}
      <Card>
        <CardHeader>
          <CardTitle>Curator Feedback</CardTitle>
          <CardDescription>
            Feedback and playlist placements from music curators
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Curator</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Feedback</TableHead>
                <TableHead className="text-right">Playlist</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaign_report && campaign_report.map((report, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{report.curator_name}</TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={report.action.toLowerCase() === 'approved' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                      }
                    >
                      <span className="flex items-center space-x-1">
                        {report.action.toLowerCase() === 'approved' ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <AlertCircle className="h-3 w-3 mr-1" />
                        )}
                        {report.action}
                      </span>
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-md">{report.feedback}</TableCell>
                  <TableCell className="text-right">
                    {report.action.toLowerCase() === 'approved' && report.playlist_link && (
                      <a 
                        href={report.playlist_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-primary hover:underline"
                      >
                        <span className="mr-1">View</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function CampaignResultsSkeleton() {
  return (
    <div className="space-y-8">
      {/* Track Info and Artwork Skeleton */}
      <Card className="overflow-hidden border-0 shadow-md">
        <div className="bg-gradient-to-r from-primary/5 to-primary/10 p-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <Skeleton className="h-48 w-48 rounded-lg" /> {/* Artwork skeleton */}
            <div className="flex-1 md:ml-4">
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-6 w-32 mb-6" />
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white/60 p-3 rounded-lg shadow-sm">
                    <Skeleton className="h-4 w-20 mx-auto mb-1" />
                    <Skeleton className="h-8 w-12 mx-auto" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>
      
      {/* Key Takeaways and Actionable Suggestions Skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Curator Feedback Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64 mt-1" />
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
