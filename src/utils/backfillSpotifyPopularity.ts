
import { supabase } from "@/integrations/supabase/client";

export interface BackfillResult {
  processed: number;
  updated: number;
  errors: number;
  message?: string;
}

export const runBackfillSpotifyPopularity = async (): Promise<BackfillResult> => {
  try {
    const { data, error } = await supabase.functions.invoke('backfill-spotify-popularity', {
      method: 'POST',
    });

    if (error) {
      console.error('Error running backfill:', error);
      return {
        processed: 0,
        updated: 0,
        errors: 1,
        message: error.message
      };
    }

    return data as BackfillResult;
  } catch (error) {
    console.error('Unexpected error in backfill operation:', error);
    return {
      processed: 0,
      updated: 0,
      errors: 1,
      message: error.message || 'Unknown error occurred'
    };
  }
};
