
# Models Directory

This directory contains TypeScript interfaces and types that define the data structures used throughout the Soundraiser application. These models provide a consistent type system that helps maintain data integrity across the codebase.

## Organization

The models are organized by domain:

- `analytics.ts` - Data structures for analytics tracking and reporting
- `browserInfo.ts` - Browser and device detection models
- `deviceInfo.ts` - Device capability and information models

## Guidelines for Models

When working with models:

1. **Keep models focused** - Each model file should contain related types for a specific domain
2. **Use descriptive names** - Type names should clearly indicate what data they represent
3. **Document properties** - Add JSDoc comments to explain non-obvious properties
4. **Be specific with types** - Avoid using `any` when possible
5. **Use unions and intersections** - Leverage TypeScript's type system for complex types
6. **Export all types** - Make types available for import throughout the application

## Example Model

```typescript
/**
 * Represents analytics data for a page view
 */
export interface PageViewData {
  url: string;
  user_agent?: string;
  country?: string;
  country_code?: string;
  ip_hash?: string;
  session_id?: string;
  browser_name?: string;
  browser_version?: string;
  os_name?: string;
  os_version?: string;
  device_type?: string;
  screen_width?: number;
  screen_height?: number;
}
```

## Database Types

Database-specific types that represent the Supabase schema are located in `src/types/database.ts`. These types are generated from the Supabase schema and should not be modified directly.

When creating models that correspond to database entities, it's recommended to define application-specific interfaces that may include additional properties or transformations needed by the frontend.

## Best Practices

- Define interfaces for API responses
- Create union types for state management
- Use enums for fixed sets of values
- Leverage utility types like Partial, Pick, and Omit
- Keep models in sync with backend data structures

