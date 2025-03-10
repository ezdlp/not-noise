
# Features Directory

This directory contains feature-specific code organized into sub-directories. Each feature is a self-contained unit that implements a specific piece of functionality for the Soundraiser platform.

## Directory Structure

Each feature follows this structure:

```
feature-name/
  ├── components/    - UI components specific to this feature
  ├── hooks/         - React hooks used by this feature
  ├── services/      - Business logic services
  ├── types/         - TypeScript interfaces and types
  ├── utils/         - Utility functions specific to this feature
  └── index.ts       - Public API for the feature
```

## Current Features

### Analytics

The analytics feature handles tracking and reporting of user interactions with smart links, including:
- Page views and link clicks
- Geographic distribution of users
- Platform preference tracking
- Performance metrics and trends

### Smart Links

The smart links feature allows artists to create custom landing pages for their music releases, including:
- Multi-platform music links
- Customizable appearance
- Email capture functionality
- Analytics integration

### Auth

The authentication feature manages user identity and access, including:
- Login and registration
- Password reset
- Account management
- Session handling

## Adding New Features

When adding a new feature:

1. Create a new directory with the feature name
2. Follow the established directory structure
3. Implement the necessary components, hooks, and services
4. Export the public API through an index.ts file
5. Use the feature in pages by importing from the feature's public API

## Best Practices

- Keep features isolated from each other to maintain separation of concerns
- Use shared components from `/src/components/` for common UI elements
- Implement feature-specific business logic in services
- Define clear interfaces for the feature's public API
- Write tests for the feature's components and logic

