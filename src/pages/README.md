
# Pages Directory

This directory contains React components that represent the main routes of the Soundraiser application. Each page component is responsible for the layout and composition of a specific route in the application.

## Purpose

Page components:
- Correspond to specific routes in the application
- Compose feature components to create complete UIs
- Handle route-specific logic and state
- Connect with hooks and services to fetch and manage data

## Current Pages

- `Index.tsx` - Home/landing page
- `Dashboard.tsx` - User dashboard
- `CreateSmartLink.tsx` - Smart link creation flow
- `EditSmartLink.tsx` - Smart link editing
- `SmartLink.tsx` - Public smart link view
- `SmartLinkAnalytics.tsx` - Analytics for a specific smart link
- `Login.tsx` / `Register.tsx` - Authentication pages
- `AccountSettings.tsx` - User account management
- `Pricing.tsx` - Subscription plans
- `SpotifyPlaylistPromotion/` - Spotify promotion service pages
- `StreamingCalculator/` - Streaming revenue calculator
- `admin/` - Admin dashboard and features

## Page Structure

Pages typically follow this structure:

```tsx
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { analyticsService } from '@/services/analyticsService';
import { SomeFeatureComponent } from '@/features/some-feature';

export default function SomePage() {
  const { id } = useParams();
  
  useEffect(() => {
    // Track page view
    analyticsService.trackPageView('/some-page');
  }, []);
  
  return (
    <div className="container mx-auto py-6">
      <h1>Page Title</h1>
      <SomeFeatureComponent id={id} />
    </div>
  );
}
```

## Admin Pages

Admin pages are located in the `/admin` subdirectory and are only accessible to users with admin privileges. These pages provide management interfaces for platform administrators.

## Guidelines for Creating Pages

When creating a new page:

1. Create a new file with a descriptive name (PascalCase)
2. Import necessary components from features
3. Handle route parameters using React Router hooks
4. Track page views using analyticsService
5. Consider loading states and error handling
6. Implement responsive layouts
7. Add proper SEO metadata

## Best Practices

- Keep page components focused on layout and composition
- Extract business logic to hooks and services
- Use feature components rather than implementing UI directly
- Handle loading and error states appropriately
- Implement proper navigation between related pages
- Consider code splitting for large pages
- Add analytics tracking for all pages

