
# Analytics Feature

The Analytics feature is responsible for tracking, collecting, and visualizing user interactions and engagement metrics throughout the Soundraiser platform. It provides insights into how users interact with smart links, which platforms they prefer, and geographic distribution of listeners.

## Components

### User-facing Components

- `StatCard` - Displays key metrics with trend indicators
- `GeoStatsTable` - Shows geographic distribution of listeners
- `TimeRangeSelect` - Allows users to select different time periods for data
- `SpotifyPopularityStat` - Displays Spotify popularity metrics
- `SpotifyPopularityChart` - Visualizes Spotify popularity trends

### Admin Components

- `DashboardStats` - Overview of platform-wide metrics
- `DailyStatsChart` - Time-series chart of daily performance
- `BackfillTools` - Admin tools for backfilling analytics data

## Services

- `analyticsService` - Core service for tracking events and page views
- `metricsService` - Service for processing and retrieving analytics data

## Hooks

- `useAnalytics` - Hook for accessing analytics data
- `useGeoStats` - Hook for geographic data
- `useSmartLinkTracking` - Hook for tracking smart link interactions

## Models

The feature uses these main data models:

- `PageViewData` - Structure for tracking page views
- `AnalyticsEvent` - Structure for custom events
- `PlatformClickData` - Structure for platform link clicks
- `GeoStats` - Geographic statistics data
- `DashboardStats` - Dashboard overview metrics

## Data Flow

1. User interactions are captured by tracking hooks and components
2. Events are sent to the analyticsService
3. Data is stored in Supabase tables
4. Analytics hooks query the data for visualization
5. Components render the data in charts and tables

## Database Tables

The feature uses these Supabase tables:
- `analytics_page_views` - Stores page view data
- `analytics_events` - Stores custom events
- `platform_clicks` - Stores platform link clicks
- `link_views` - Stores smart link views

## Key Metrics

The feature tracks and displays:
- Page views and unique visitors
- Click-through rates (CTR)
- Platform preferences
- Geographic distribution
- Time-based trends
- Spotify popularity metrics

## Integration Points

- Integrates with smart links for tracking views and clicks
- Uses browser detection for device information
- Uses location services for geographic data
- Connects with Spotify API for popularity metrics

## Future Enhancements

- Real-time analytics dashboard
- Advanced filtering and segmentation
- Custom report generation
- Export capabilities
- More visualization options

