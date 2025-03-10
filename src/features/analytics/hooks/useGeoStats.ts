
import { useState, useEffect } from 'react';
import { metricsService, GeoStats } from '../services/metricsService';

/**
 * Hook to fetch geographic statistics data
 */
export function useGeoStats() {
  const [data, setData] = useState<GeoStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchGeoStats = async () => {
      try {
        setIsLoading(true);
        const stats = await metricsService.getGeoStats();
        setData(stats);
        setError(null);
      } catch (err) {
        console.error("Error fetching geo stats:", err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchGeoStats();
  }, []);

  return { data, isLoading, error };
}
