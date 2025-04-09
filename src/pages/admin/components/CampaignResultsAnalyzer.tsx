import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { FileText, Loader2, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CampaignResultsDashboard } from "@/components/spotify-promotion/CampaignResultsDashboard";

interface Campaign {
  id: string;
  track_name: string;
  track_artist: string;
  // ... other campaign properties
}

interface CampaignResultsAnalyzerProps {
  campaign: Campaign;
  onComplete?: () => void;
}

export function CampaignResultsAnalyzer({ campaign, onComplete }: CampaignResultsAnalyzerProps) {
  const [loading, setLoading] = useState(false);
  const [resultsExist, setResultsExist] = useState<boolean | null>(null);
  
  // Check if results already exist for this campaign
  React.useEffect(() => {
    const checkResults = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('campaign_result_data')
          .select('id')
          .eq('campaign_id', campaign.id)
          .limit(1);
        
        if (error) {
          console.error("Error checking results:", error);
          return;
        }
        
        setResultsExist(data && data.length > 0);
      } catch (err) {
        console.error("Error in checkResults:", err);
      } finally {
        setLoading(false);
      }
    };
    
    checkResults();
  }, [campaign.id]);
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Spinner size="lg" />
        <p className="mt-4 text-muted-foreground">Checking campaign results...</p>
      </div>
    );
  }
  
  if (resultsExist === null) {
    return null; // Still loading
  }
  
  if (resultsExist) {
    return <CampaignResultsDashboard campaignId={campaign.id} />;
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>No Results Available</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
          <h3 className="mt-4 text-lg font-medium">No results found for this campaign</h3>
          <p className="mt-2 text-muted-foreground mb-6">
            Upload a CSV file with curator feedback and results on the Campaign Results tab.
          </p>
          <Button
            variant="outline" 
            onClick={() => {
              if (onComplete) onComplete();
            }}
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Done
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
