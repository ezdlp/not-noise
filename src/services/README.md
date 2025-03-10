
# Services Directory

This directory contains service classes and utility functions that handle business logic, external API communication, and other cross-cutting concerns in the Soundraiser application.

## Purpose

Services are responsible for:
- Implementing business logic separate from UI components
- Managing communication with external APIs and services
- Providing utility functions for common operations
- Handling cross-cutting concerns like analytics, authentication, and error handling

## Service Pattern

Services in Soundraiser follow a simple pattern:

1. **Service Class** - A class that encapsulates related functionality
2. **Singleton Export** - Exporting a single instance for use throughout the app
3. **Method-Based API** - Providing methods for specific operations

Example:
```typescript
class AnalyticsService {
  async trackPageView(url: string): Promise<void> {
    // Implementation
  }
  
  async trackEvent(event: AnalyticsEvent): Promise<void> {
    // Implementation
  }
}

export const analyticsService = new AnalyticsService();
```

## Current Services

- `analyticsService.ts` - Tracking user interactions and events
- `browserDetectionService.ts` - Detecting browser information
- `locationService.ts` - Getting user location data
- `sessionService.ts` - Managing user sessions
- `ga4.ts` - Google Analytics 4 integration

## Feature-Specific Services

Some services are specific to features and are located in the feature directories:
- `/src/features/analytics/services/`
- `/src/features/auth/services/`
- `/src/features/smart-links/services/`

## Guidelines for Creating Services

When creating a new service:

1. Determine if it belongs in the global services directory or a feature directory
2. Create a class that encapsulates the functionality
3. Export a singleton instance for use throughout the app
4. Implement methods for specific operations
5. Document the service methods with JSDoc comments
6. Handle errors appropriately
7. Add logging for debugging purposes

## Best Practices

- Keep services focused on a specific domain
- Separate UI logic from business logic
- Use dependency injection for service dependencies
- Write unit tests for service methods
- Handle errors and edge cases
- Document the API with comments

