
# Hooks Directory

This directory contains custom React hooks that encapsulate reusable logic across the Soundraiser application. These hooks follow React's composition pattern and help separate concerns in component logic.

## Purpose

Custom hooks allow us to:
- Extract component logic into reusable functions
- Share stateful logic between components
- Separate concerns for better code organization
- Create composable pieces of functionality

## Current Hooks

- `useFeatureAccess.ts` - Check if a user has access to certain features
- `useLocalStorage.ts` - Handle localStorage with a React-friendly API
- `useMobile.ts` - Detect mobile devices and responsive behavior
- `useMetaPixel.ts` - Integrate with Facebook Pixel for tracking
- `useSmartLink.ts` - Fetch and manage smart link data
- `useSmartLinkCreation.ts` - Handle smart link creation flow
- `useSmartLinkTracking.ts` - Track smart link interactions
- `useStripe.ts` - Integrate with Stripe for payments
- `useToast.ts` - Display toast notifications

## Guidelines for Creating Hooks

When creating a new hook:

1. Name hooks with the `use` prefix following React conventions
2. Keep hooks focused on a single concern
3. Handle cleanup in useEffect returns to prevent memory leaks
4. Document parameters and return values
5. Consider dependencies carefully to avoid re-renders
6. Use TypeScript for type safety

## Hook Pattern

```typescript
import { useState, useEffect } from 'react';

export function useExample(param: string) {
  const [state, setState] = useState<string>('');
  
  useEffect(() => {
    // Setup logic
    
    return () => {
      // Cleanup logic
    };
  }, [param]);
  
  const doSomething = () => {
    // Method implementation
  };
  
  return {
    state,
    doSomething
  };
}
```

## Feature-Specific Hooks

Some hooks are specific to features and are located in the feature directories:
- `/src/features/analytics/hooks/`
- `/src/features/auth/hooks/`
- `/src/features/smart-links/hooks/`

For these hooks, remember to:
1. Keep implementation details within the feature
2. Export through the feature's public API (index.ts)
3. Document usage for other developers

## Best Practices

- Follow the rules of hooks (only call at the top level, only call from React functions)
- Keep hooks simple and focused
- Use composition to combine multiple hooks
- Handle errors appropriately
- Write tests for complex hook logic
- Document dependencies and side effects

