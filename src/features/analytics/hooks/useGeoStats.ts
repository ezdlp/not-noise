
import { useQuery } from '@tanstack/react-query';
import { metricsService } from '../services/metricsService';
import { GeoStats } from '../types/analyticsTypes';
import { AnalyticsPeriod } from '@/models/analytics';

/**
 * Hook to fetch geographic statistics for analytics
 */
export function useGeoStats(period: AnalyticsPeriod = '30d') {
  const {
    data,
    isLoading,
    error
  } = useQuery({
    queryKey: ['geoStats', period],
    queryFn: async () => {
      return await metricsService.getGeoStats(period);
    }
  });

  return {
    geoStats: data as GeoStats[] | undefined,
    isLoading,
    error
  };
}
