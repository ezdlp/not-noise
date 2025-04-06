import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { AlertCircle, Check, BarChart3, FileSpreadsheet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Promotion } from "@/types/database";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CampaignResultsAnalyzerProps {
  campaign: Promotion;
  onComplete: () => void;
}

interface ResultStats {
  totalSubmissions: number;
  approved: number;
  declined: number;
  pending: number;
  approvalRate: number;
  averageListenTime?: number;
  countryBreakdown?: Record<string, number>;
  outletTypeBreakdown?: Record<string, number>;
  feedbackSummary?: string;
  feedbackTopics?: Array<{topic: string, count: number}>;
}

export function CampaignResultsAnalyzer({ campaign, onComplete }: CampaignResultsAnalyzerProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<ResultStats | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState("");
  const [rawData, setRawData] = useState<any[]>([]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };
  
  const handleUpload = async () => {
    if (!file || !campaign?.id) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setUploading(true);
      
      // Upload file to storage
      const filePath = `campaign-results/${campaign.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('campaign-result-files')
        .upload(filePath, file);
      
      if (uploadError) {
        throw uploadError;
      }
      
      // Create record of the uploaded file
      const { error: recordError } = await supabase
        .from('campaign_result_files')
        .insert({
          promotion_id: campaign.id,
          file_path: filePath,
          uploaded_by: (await supabase.auth.getUser()).data.user?.id,
        });
      
      if (recordError) {
        throw recordError;
      }
      
      toast({
        title: "File uploaded successfully",
        description: "Processing campaign results...",
      });
      
      // Process the file
      await processFile(filePath);
      
    } catch (err: any) {
      toast({
        title: "Upload failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };
  
  const processFile = async (filePath: string) => {
    try {
      setProcessing(true);
      
      const response = await fetch('/api/admin/process-campaign-results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaignId: campaign.id,
          filePath,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Processing failed');
      }
      
      setResults(data.stats);
      setRawData(data.rawData || []);
      
      toast({
        title: "Results processed",
        description: "Campaign results processed successfully.",
      });
      
      // Now analyze the results with AI
      await analyzeWithAI(data.stats, data.rawData || []);
      
    } catch (err: any) {
      toast({
        title: "Processing failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };
  
  const analyzeWithAI = async (stats: ResultStats, rawData: any[]) => {
    try {
      setAnalyzing(true);
      
      // Extract all feedback from raw data
      const feedbackTexts = rawData
        .filter(item => item.feedback && item.feedback.trim() !== '')
        .map(item => item.feedback);
      
      // Prepare data for AI analysis
      const analysisData = {
        trackName: campaign.track_name,
        artistName: campaign.track_artist,
        genre: campaign.genre,
        stats,
        feedbackSamples: feedbackTexts.slice(0, 15) // Limit to 15 feedback items to avoid token limits
      };
      
      // Call OpenAI to analyze the campaign results
      const aiResponse = await fetch('/api/ai/analyze-campaign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(analysisData),
      });
      
      if (!aiResponse.ok) {
        const errorData = await aiResponse.json();
        throw new Error(errorData.message || 'AI analysis failed');
      }
      
      const aiResult = await aiResponse.json();
      setAiAnalysis(aiResult.analysis);
      
      toast({
        title: "AI Analysis Complete",
        description: "Campaign feedback analyzed successfully.",
      });
      
      // Update the campaign status if needed
      if (campaign.status === 'active') {
        await updateCampaignStatus('delivered');
      }
      
      onComplete();
      
    } catch (err: any) {
      console.error("AI analysis error:", err);
      toast({
        title: "AI Analysis Failed",
        description: "The statistical analysis was completed, but the AI feedback analysis failed.",
        variant: "destructive",
      });
      // Still mark the campaign as complete even if AI analysis fails
      if (campaign.status === 'active') {
        await updateCampaignStatus('delivered');
      }
      onComplete();
    } finally {
      setAnalyzing(false);
    }
  };
  
  const updateCampaignStatus = async (newStatus: 'payment_pending' | 'active' | 'delivered' | 'cancelled') => {
  try {
    const { error } = await supabase
      .from("promotions")
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString() 
      })
      .eq("id", campaign.id);
    
    if (error) throw error;
    
  } catch (err: any) {
    console.error("Error updating campaign status:", err);
  }
};
  
  const showFeedback = (feedback: string) => {
    setSelectedFeedback(feedback);
    setFeedbackModalOpen(true);
  };
  
  const countryData: Record<string, number> = rawData.reduce((acc: Record<string, number>, item) => {
    const country = item.outlet_country || 'Unknown';
    acc[country] = (acc[country] || 0) + 1;
    return acc;
  }, {});
  
  const getApprovedCount = (country: string) => {
    return rawData.filter(item => 
      (item.outlet_country === country) && 
      (item.action === 'approved' || item.action === 'shared')
    ).length;
  };
  
  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Campaign Results Analyzer</CardTitle>
        <CardDescription>
          Upload and analyze campaign results for {campaign.track_name} by {campaign.track_artist}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {!results ? (
          <div className="space-y-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="resultFile">CSV Results File</Label>
              <Input 
                id="resultFile" 
                type="file" 
                accept=".csv" 
                onChange={handleFileChange}
                disabled={uploading || processing}
              />
            </div>
            
            <Button 
              onClick={handleUpload}
              disabled={!file || uploading || processing}
            >
              {uploading ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Uploading...
                </>
              ) : processing ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Processing...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Upload & Process
                </>
              )}
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="summary">
            <TabsList className="mb-4">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="feedback">Feedback</TabsTrigger>
              {aiAnalysis && <TabsTrigger value="analysis">AI Analysis</TabsTrigger>}
            </TabsList>
            
            <TabsContent value="summary">
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Results Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{results.approvalRate.toFixed(1)}%</div>
                      <p className="text-xs text-muted-foreground">Approval Rate</p>
                      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
                        <div>
                          <div className="font-medium">{results.approved}</div>
                          <div className="text-xs text-muted-foreground">Approved</div>
                        </div>
                        <div>
                          <div className="font-medium">{results.declined}</div>
                          <div className="text-xs text-muted-foreground">Declined</div>
                        </div>
                        <div>
                          <div className="font-medium">{results.pending}</div>
                          <div className="text-xs text-muted-foreground">Pending</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Approval Progress</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <div>Progress</div>
                        <div className="font-medium">
                          {results.approved + results.declined}/{results.totalSubmissions}
                        </div>
                      </div>
                      <Progress 
                        value={((results.approved + results.declined) / results.totalSubmissions) * 100} 
                      />
                      {analyzing && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Spinner className="mr-2 h-4 w-4" />
                          Analyzing with AI...
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="details">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Geographic Breakdown</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2 text-left">Country</th>
                        <th className="py-2 text-right">Total</th>
                        <th className="py-2 text-right">Approved</th>
                        <th className="py-2 text-right">Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(countryData).map(([country, count]) => {
                        const approvedCount = getApprovedCount(country);
                        const approvalRate = Number(count) > 0 ? (approvedCount / Number(count)) * 100 : 0;
                        
                        return (
                          <tr key={country} className="border-b">
                            <td className="py-2">{country}</td>
                            <td className="py-2 text-right">{count}</td>
                            <td className="py-2 text-right">{approvedCount}</td>
                            <td className="py-2 text-right">{approvalRate.toFixed(1)}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="feedback">
              <div className="space-y-4">
                <div className="grid gap-4">
                  {rawData
                    .filter(item => item.feedback && item.feedback.trim() !== '')
                    .map((item, index) => (
                      <Card key={index}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-medium">
                              {item.outlet} ({item.outlet_country})
                            </CardTitle>
                            <div className="flex items-center">
                              {item.action === 'approved' || item.action === 'shared' ? (
                                <div className="flex items-center text-green-600">
                                  <Check className="mr-1 h-4 w-4" />
                                  Approved
                                </div>
                              ) : (
                                <div className="flex items-center text-amber-600">
                                  <AlertCircle className="mr-1 h-4 w-4" />
                                  Declined
                                </div>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm line-clamp-3">{item.feedback}</p>
                        </CardContent>
                        <CardFooter>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => showFeedback(item.feedback)}
                          >
                            Read Full Feedback
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                </div>
              </div>
            </TabsContent>
            
            {aiAnalysis && (
              <TabsContent value="analysis">
                <div className="space-y-4">
                  <div className="rounded-md bg-primary/10 p-4">
                    <h3 className="mb-2 text-lg font-medium">AI Analysis</h3>
                    <div className="prose max-w-none">
                      <div dangerouslySetInnerHTML={{ __html: aiAnalysis.replace(/\n/g, '<br/>') }} />
                    </div>
                  </div>
                </div>
              </TabsContent>
            )}
          </Tabs>
        )}
      </CardContent>
      
      <Dialog open={feedbackModalOpen} onOpenChange={setFeedbackModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Curator Feedback</DialogTitle>
            <DialogDescription>
              <div className="mt-4 whitespace-pre-wrap">{selectedFeedback}</div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
