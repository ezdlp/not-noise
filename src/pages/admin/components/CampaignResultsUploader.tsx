
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
      
      // Process the file
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
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Processing failed');
      }
      
      setResults(data);
      toast.success("Campaign results processed successfully");
    } catch (err: any) {
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
          <CardTitle>Upload Campaign Results</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
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
                    campaigns.map(campaign => (
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
              <Input id="file" type="file" accept=".csv" onChange={handleFileChange} />
            </div>
            
            <Button 
              onClick={handleUpload} 
              disabled={uploading || processing || !file || !selectedCampaignId}
            >
              {uploading ? <><Spinner className="mr-2" /> Uploading...</> : 
               processing ? <><Spinner className="mr-2" /> Processing...</> : 
               'Upload & Process'}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {results && (
        <Card>
          <CardHeader>
            <CardTitle>Processing Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-medium">Campaign</h3>
                <p>{selectedCampaign?.track_name} by {selectedCampaign?.track_artist}</p>
              </div>
              <div>
                <h3 className="text-lg font-medium">Statistics</h3>
                <div className="space-y-2">
                  <p>Total Submissions: {results.stats.totalSubmissions}</p>
                  <p>Approved: {results.stats.approved} ({(results.stats.approvalRate).toFixed(1)}%)</p>
                  <p>Declined: {results.stats.declined}</p>
                  <p>Pending: {results.stats.pending}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
