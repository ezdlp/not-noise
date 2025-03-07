
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function BackfillSpotifyPopularity() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<{
    processed: number;
    updated: number;
    errors: number;
    message?: string;
  } | null>(null);

  const runBackfill = async () => {
    try {
      setIsLoading(true);
      setResults(null);

      // Call the Supabase Edge Function for backfilling
      const { data, error } = await supabase.functions.invoke('backfill-spotify-popularity', {
        method: 'POST',
      });

      if (error) {
        console.error('Error running backfill:', error);
        toast.error('Failed to run backfill operation');
        setResults({
          processed: 0,
          updated: 0,
          errors: 1,
          message: error.message
        });
        return;
      }

      // Show success and results
      console.log('Backfill results:', data);
      toast.success('Backfill operation completed');
      setResults(data);
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('An unexpected error occurred');
      setResults({
        processed: 0,
        updated: 0,
        errors: 1,
        message: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Backfill Spotify Popularity</CardTitle>
        <CardDescription>
          Run a backfill operation to fetch Spotify popularity data for historical smart links created by Pro users
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          This operation will fetch Spotify popularity data for all existing smart links created by Pro users that don't already have this data.
          It may take several minutes to complete depending on the number of tracks to process.
        </p>

        {results && (
          <div className="bg-muted p-4 rounded-md mt-4">
            <h4 className="font-medium mb-2">Backfill Results:</h4>
            <ul className="space-y-1 text-sm">
              <li>Links processed: {results.processed}</li>
              <li>Popularity data updated: {results.updated}</li>
              <li>Errors encountered: {results.errors}</li>
              {results.message && <li className="text-destructive">Error: {results.message}</li>}
            </ul>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={runBackfill} 
          disabled={isLoading}
          className="bg-[#6851FB] hover:bg-[#4A47A5] text-white"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running Backfill...
            </>
          ) : (
            'Run Backfill Operation'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
