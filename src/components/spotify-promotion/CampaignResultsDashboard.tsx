import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, CheckCircle, Lightbulb, ListTodo } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface CampaignResultsDashboardProps {
  campaignId: string;
}

interface CampaignReport {
  curator_name: string;
  action: string;
  feedback: string;
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
  const campaign_report = Array.isArray(aiAnalysis.campaign_report) ? aiAnalysis.campaign_report : [];
  const key_takeaways = Array.isArray(aiAnalysis.key_takeaways) ? aiAnalysis.key_takeaways : [];
  const actionable_points = Array.isArray(aiAnalysis.actionable_points) ? aiAnalysis.actionable_points : [];
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Campaign Results</CardTitle>
          <CardDescription>
            Curator feedback and insights for your track
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview">
            <TabsList className="mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="curators">Curator Feedback</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
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
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Campaign Statistics</CardTitle>
                </CardHeader>
                <CardContent>
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
            </TabsContent>
            
            <TabsContent value="curators">
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Curator</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Feedback</TableHead>
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
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function CampaignResultsSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full max-w-xs mb-6" /> {/* Tabs */}
            
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
            
            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-36" />
              </CardHeader>
              <CardContent>
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
        </CardContent>
      </Card>
    </div>
  );
}
