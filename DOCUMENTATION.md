
# Soundraiser Documentation

## Overview

Soundraiser is a platform designed for independent musicians to promote their music and grow their audience. This document provides an overview of the platform's features, architecture, and technical implementation.

## Core Features

### Smart Links

Smart Links are customizable landing pages for music releases that allow artists to share their music across multiple streaming platforms with a single link. Features include:

- Multi-platform music links
- Customizable appearance
- Email capture for fan list building
- Meta Pixel integration for ad tracking
- Detailed analytics

### Spotify Playlist Promotion

A service where artists can purchase promotional packages to get their music pitched to independent playlist curators, including:

- Multiple promotional tiers
- Targeted playlist placements
- Performance tracking
- Guaranteed playlist placements

### Analytics

Comprehensive analytics to track the performance of smart links and promotional campaigns, featuring:

- View and click tracking
- Geographic distribution
- Platform preferences
- Spotify popularity tracking
- Trend analysis

## Technical Architecture

### Frontend

- React for UI components
- TypeScript for type safety
- Tailwind CSS for styling
- ShadCN UI for component library
- React Router for navigation
- TanStack Query for data fetching and caching

### Backend

- Supabase for database and authentication
- Supabase Edge Functions for serverless functions
- Stripe for payment processing
- Spotify API integration

### Data Flow

1. User creates an account and authenticates
2. User creates a smart link for their music
3. Fans visit the smart link and interact with it
4. Analytics data is collected and stored
5. User views analytics reports

## Directory Structure

```
src/
├── components/      # UI components
├── features/        # Feature-specific code
├── hooks/           # Custom React hooks
├── integrations/    # Third-party integrations
├── lib/             # Utility functions and constants
├── models/          # Data models and types
├── pages/           # Page components
└── services/        # Utility services
```

## Feature Organization

Each feature is organized in a feature directory with the following structure:

```
feature-name/
├── components/      # UI components for the feature
├── hooks/           # Custom hooks for the feature
├── services/        # Services for the feature
├── types/           # TypeScript types for the feature
└── index.ts         # Public API for the feature
```

## Authentication and Authorization

Authentication is handled through Supabase Auth, with:
- Email/password authentication
- JWT tokens for session management
- Role-based access control
- Subscription-based feature access

## Subscription Model

The platform offers several subscription tiers:
- Free: Basic smart links with limited analytics
- Pro: Advanced features including email capture, pixel tracking, and detailed analytics
- Enterprise: Custom solutions for labels and larger organizations

## Data Model

Key database entities:
- `users`: User accounts and profiles
- `smart_links`: Smart link data
- `platform_links`: Links to streaming platforms
- `link_views`: Tracking of smart link views
- `platform_clicks`: Tracking of platform link clicks
- `subscriptions`: User subscription data
- `promotions`: Playlist promotion campaigns

## Development Workflow

1. Feature requests and bug reports are tracked in the issue tracker
2. Development happens in feature branches
3. Pull requests are reviewed and merged into the main branch
4. Continuous integration tests are run on each pull request
5. Deployment happens automatically from the main branch

## Best Practices

- Feature-based organization for easier maintenance
- Small, focused components with clear responsibilities
- Custom hooks for reusable logic
- Service classes for business logic
- Comprehensive TypeScript types
- Documentation in README files for each section

## Additional Resources

- [Architecture Overview](./ARCHITECTURE.md)
- [Features Documentation](./src/features/README.md)
- [Components Documentation](./src/components/README.md)
- [Services Documentation](./src/services/README.md)
- [Models Documentation](./src/models/README.md)
