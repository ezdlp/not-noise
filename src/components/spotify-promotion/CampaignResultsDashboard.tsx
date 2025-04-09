import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, CheckCircle, Lightbulb, ListTodo, ExternalLink, Music } from "lucide-react";
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
  // ... other campaign fields
}

interface QueryResult {
  campaign: Campaign;
  results: CampaignResult | null;
}

export function CampaignResultsDashboard({ campaignId }: CampaignResultsDashboardProps) {
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
  
  // Process campaign report and add playlist links
  let campaign_report = Array.isArray(aiAnalysis.campaign_report) ? aiAnalysis.campaign_report : [];
  
  // Try to extract playlist links from raw_data if available
  if (results.raw_data && typeof results.raw_data === 'object') {
    const rawData = results.raw_data;
    
    // If raw_data contains entries with playlist_url, map them to the campaign_report
    if (Array.isArray(rawData.results)) {
      const playlistLinks = new Map();
      
      // First, collect all playlist links by curator name
      rawData.results.forEach((entry: any) => {
        if (entry.playlist_url && entry.curator_name) {
          playlistLinks.set(entry.curator_name.trim().toLowerCase(), entry.playlist_url);
        }
      });
      
      // Then, update the campaign_report with playlist links
      campaign_report = campaign_report.map(report => {
        const curatorKey = report.curator_name.trim().toLowerCase();
        const playlistLink = playlistLinks.get(curatorKey);
        
        if (playlistLink && report.action.toLowerCase() === 'approved') {
          return { ...report, playlist_link: playlistLink };
        }
        
        return report;
      });
    }
  }
  
  const defaultArtwork = "https://placehold.co/400x400/6851FB/FFFFFF?text=Track+Artwork";
  const capitalizedTier = campaign.package_tier 
    ? campaign.package_tier.charAt(0).toUpperCase() + campaign.package_tier.slice(1) 
    : 'Standard';
  
  return (
    <div className="space-y-6">
      {/* Track Info with Artwork */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="w-full md:w-auto">
          <img 
            src={campaign.artwork_url || defaultArtwork}
            alt={`${campaign.track_name} by ${campaign.track_artist}`}
            className="rounded-lg shadow-md h-48 w-48 object-cover"
          />
        </div>
        <div className="flex-1 space-y-4">
          {/* Campaign Package Info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center mb-3">
                <Music className="h-5 w-5 text-primary mr-2" />
                <h3 className="font-medium text-lg">Campaign Details</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Campaign Package</div>
                  <div className="font-medium">{capitalizedTier}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Outlets Pitched</div>
                  <div className="font-medium">{campaign.submission_count || results.stats?.totalSubmissions || '0'}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Campaign Statistics */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Campaign Statistics</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-muted/20 p-4 rounded-lg text-center">
                  <div className="text-sm text-muted-foreground mb-1">Submissions</div>
                  <div className="text-2xl font-semibold">{results.stats?.totalSubmissions || 0}</div>
                </div>
                <div className="bg-muted/20 p-4 rounded-lg text-center">
                  <div className="text-sm text-muted-foreground mb-1">Approval Rate</div>
                  <div className="text-2xl font-semibold">{(results.stats?.approvalRate || 0).toFixed(1)}%</div>
                </div>
                <div className="bg-muted/20 p-4 rounded-lg text-center">
                  <div className="text-sm text-muted-foreground mb-1">Approved</div>
                  <div className="text-2xl font-semibold">{results.stats?.approved || 0}</div>
                </div>
                <div className="bg-muted/20 p-4 rounded-lg text-center">
                  <div className="text-sm text-muted-foreground mb-1">Est. Streams</div>
                  <div className="text-2xl font-semibold">{(results.stats?.approved || 0) * 250}+</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
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
    <div className="space-y-6">
      {/* Track Info and Artwork Skeleton */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <Skeleton className="h-48 w-48 rounded-lg" /> {/* Artwork skeleton */}
        <div className="flex-1 space-y-4">
          <Card>
            <CardContent className="p-4">
              <Skeleton className="h-5 w-40 mb-3" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Skeleton className="h-4 w-28 mb-1" />
                  <Skeleton className="h-6 w-20" />
                </div>
                <div>
                  <Skeleton className="h-4 w-28 mb-1" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-36" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-muted/20 p-4 rounded-lg">
                    <Skeleton className="h-4 w-20 mx-auto mb-2" />
                    <Skeleton className="h-8 w-12 mx-auto" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
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
