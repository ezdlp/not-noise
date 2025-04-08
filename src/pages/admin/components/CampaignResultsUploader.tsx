import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FileSpreadsheet, Upload, Brain, AlertCircle } from "lucide-react";
import { CampaignResults } from '@/types/database';

interface Campaign {
  id: string;
  track_name: string;
  track_artist: string;
  status: string;
  genre: string;
  created_at: string;
  total_cost: number;
  submission_count: number;
  // Add other fields that might be used
  end_date?: string;
  start_date?: string;
  estimated_additions?: number;
  final_streams?: number;
  initial_streams?: number;
  spotify_artist_id?: string;
  spotify_track_id?: string;
  success_rate?: number;
  user_id?: string;
}

interface CampaignResultsUploaderProps {
  campaigns: Campaign[];
  isLoading: boolean;
}

export function CampaignResultsUploader({ campaigns, isLoading }: CampaignResultsUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };
  
  const handleCampaignChange = (value: string) => {
    setSelectedCampaignId(value);
  };
  
  const handleUpload = async () => {
    if (!file || !selectedCampaignId) {
      toast.error("Please select a campaign and file to upload");
      return;
    }
    
    try {
      setUploading(true);
      setError(null);
      
      // Upload file to storage
      const filePath = `campaign-results/${selectedCampaignId}/${Date.now()}_${file.name}`;
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
          promotion_id: selectedCampaignId,
          file_path: filePath,
          uploaded_by: (await supabase.auth.getUser()).data.user?.id,
        });
      
      if (recordError) {
        throw recordError;
      }
      
      toast.success("File uploaded successfully");
      
      // Process the file with AI analysis
      await processFile(filePath);
      
    } catch (err: any) {
      setError(`Upload failed: ${err.message}`);
      toast.error(`Upload failed: ${err.message}`);
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
          campaignId: selectedCampaignId,
          filePath,
        }),
      });
      
      // Check for non-JSON responses
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        // Try to get response text for better error reporting
        const responseText = await response.text().catch(e => `Unable to get response text: ${e.message}`);
        console.error('Non-JSON response:', responseText.substring(0, 500)); // Log up to 500 chars
        throw new Error(`Invalid response format: ${responseText.substring(0, 200)}`);
      }
      
      let data;
      try {
        data = await response.json();
      } catch (jsonError: any) {
        console.error('JSON parsing error:', jsonError);
        throw new Error(`Failed to parse response: ${jsonError.message}`);
      }
      
      if (!response.ok) {
        const errorMessage = data?.message || data?.error || 'Unknown error';
        console.error('API error response:', data);
        throw new Error(`API error: ${errorMessage}`);
      }
      
      setResults(data);
      toast.success("Campaign results processed and analyzed successfully");
    } catch (err: any) {
      console.error('Processing error:', err);
      setError(`Processing failed: ${err.message}`);
      toast.error(`Processing failed: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };
  
  const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId);
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload & Process Campaign Results</CardTitle>
          <CardDescription>
            Upload CSV results files to process campaign feedback and generate AI insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4 mr-2" />
              <AlertTitle>Error Processing CSV</AlertTitle>
              <AlertDescription className="space-y-2">
                <p>{error}</p>
                <div className="mt-2 text-sm">
                  <p className="font-medium">Troubleshooting steps:</p>
                  <ul className="list-disc pl-5 space-y-1 mt-1">
                    <li>Check that your CSV has the required column headers (Action, Outlet, Feedback)</li>
                    <li>Ensure your CSV has at least one record with "approved" or "declined" in the Action column</li>
                    <li>Try simplifying your CSV file (remove extra columns, special characters, etc.)</li>
                    <li>If you're still having trouble, contact support with the error message above</li>
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="campaign">Select Campaign</Label>
              <Select value={selectedCampaignId} onValueChange={handleCampaignChange}>
                <SelectTrigger id="campaign">
                  <SelectValue placeholder="Select a campaign" />
                </SelectTrigger>
                <SelectContent>
                  {isLoading ? (
                    <div className="flex justify-center py-2">
                      <Spinner />
                    </div>
                  ) : campaigns.length === 0 ? (
                    <div className="py-2 text-center text-muted-foreground">
                      No campaigns available
                    </div>
                  ) : (
                    campaigns
                      .filter(campaign => campaign.status === 'active')
                      .map(campaign => (
                        <SelectItem key={campaign.id} value={campaign.id}>
                          {campaign.track_name} by {campaign.track_artist}
                        </SelectItem>
                      ))
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="file">Campaign CSV Results</Label>
              <Input 
                id="file" 
                type="file" 
                accept=".csv" 
                onChange={handleFileChange} 
              />
              <div className="text-sm text-muted-foreground mt-2 space-y-1">
                <p>CSV Requirements:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Must include columns: <strong>Action</strong>, <strong>Outlet</strong>, and <strong>Feedback</strong></li>
                  <li>Must have at least one row with "approved" or "declined" in the Action column</li>
                  <li>Optional columns: Country, Type, Listen Time (for additional data breakdowns)</li>
                </ul>
              </div>
            </div>
            
            <Button 
              onClick={handleUpload} 
              disabled={uploading || processing || !file || !selectedCampaignId}
              className="flex items-center"
            >
              {uploading ? (
                <>
                  <Spinner className="mr-2" /> 
                  Uploading...
                </>
              ) : processing ? (
                <>
                  <Brain className="h-4 w-4 mr-2 animate-pulse" /> 
                  Analyzing with AI...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload & Analyze
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {results && (
        <Card>
          <CardHeader>
            <CardTitle>Processing Results</CardTitle>
            <CardDescription>
              AI analysis has been generated for this campaign's feedback
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-base font-medium mb-2">Campaign</h3>
                <p className="text-sm">{selectedCampaign?.track_name} by {selectedCampaign?.track_artist}</p>
              </div>
              <div>
                <h3 className="text-base font-medium mb-2">Statistics</h3>
                <div className="space-y-1 text-sm">
                  <p>Total Submissions: {results.stats?.totalSubmissions || 0}</p>
                  <p>Approved: {results.stats?.approved || 0} ({(results.stats?.approvalRate || 0).toFixed(1)}%)</p>
                  <p>Declined: {results.stats?.declined || 0}</p>
                </div>
              </div>
            </div>
            
            {results.aiAnalysis && (
              <div className="mt-4 pt-4 border-t">
                <h3 className="text-base font-medium mb-3">AI Analysis Generated</h3>
                <div className="p-3 bg-blue-50 text-blue-800 rounded-md">
                  <p className="font-medium">Key Takeaways and Actionable Points have been generated.</p>
                  <p className="text-sm mt-1">
                    The user will see these insights in their campaign dashboard.
                  </p>
                </div>
                
                {results.aiAnalysis.key_takeaways && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Sample Key Takeaways:</h4>
                    <ul className="text-xs list-disc pl-5 space-y-1">
                      {results.aiAnalysis.key_takeaways.slice(0, 2).map((takeaway: string, index: number) => (
                        <li key={index}>{takeaway}</li>
                      ))}
                      {results.aiAnalysis.key_takeaways.length > 2 && (
                        <li className="text-muted-foreground">And {results.aiAnalysis.key_takeaways.length - 2} more...</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
