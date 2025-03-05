# Admin Users Component

This directory contains the admin components for the Control Room section of the application.

## NewUsers.tsx

The `NewUsers.tsx` file contains a rebuilt version of the Users component that addresses several issues with the original implementation:

1. **Proper Null Handling**: The component ensures that all nested relationships (user_roles, subscriptions, smart_links) are properly initialized as empty arrays if they are null.

2. **Improved Error Handling**: The component includes comprehensive error handling for all database operations.

3. **Responsive Design**: The UI is built with responsive design principles using shadcn/UI components.

4. **Performance Optimizations**: The component uses proper React Query caching and only fetches data when necessary.

## How to Use

The component is already integrated into the application's routing system in `AppContent.tsx`. It's loaded lazily when navigating to the `/control-room/users` route.

## Testing

You can test the component independently using the `test-users.tsx` file, which renders the component in isolation.

## Styling

The component follows the application's design system, using:
- shadcn/UI components
- Tailwind CSS for styling
- Lucide React for icons

## Data Structure

The component expects the following data structure from Supabase:

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  artist_name?: string;
  music_genre?: string;
  country?: string;
  created_at: string;
  user_roles: Array<{ id: string; role: string }>;
  subscriptions: Array<{
    tier: string;
    is_lifetime: boolean;
    is_early_adopter: boolean;
    current_period_end: string;
  }>;
  smart_links: Array<{
    id: string;
    title: string;
    artist_name: string;
    created_at: string;
    user_id: string;
    content_type: string;
  }>;
}
``` 