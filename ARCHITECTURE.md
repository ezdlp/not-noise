
# Soundraiser Application Architecture

## Overview

Soundraiser is a platform built to empower independent musicians by providing them with cutting-edge digital tools to amplify their reach and get their music heard. This document outlines the high-level architecture of the application, its main features, and the organization of the codebase.

## Core Features

1. **Smart Links** – Customizable landing pages for music releases, making it easy for artists to share and promote their work across platforms.
2. **Spotify Playlisting Services** – A promotional service where artists can purchase packages to get their music pitched to independent playlist curators.
3. **Analytics** - Detailed tracking and reporting of smart link performance, including views, clicks, geographic distribution, and platform preferences.

## Application Structure

The application follows a feature-based organization pattern, where code is grouped by functionality rather than technical type. This makes the codebase more maintainable and easier to navigate.

### Key Directories

- `/src/features/` - Contains feature-specific code organized into sub-directories
- `/src/components/` - Shared UI components used across features
- `/src/models/` - Data models and TypeScript interfaces
- `/src/pages/` - Page components that define routes in the application
- `/src/services/` - Utility services for cross-cutting concerns
- `/src/hooks/` - Custom React hooks
- `/src/lib/` - Utility functions and constants
- `/src/integrations/` - Third-party service integrations

### Features Organization

Each feature directory contains:
- Components specific to the feature
- Hooks related to the feature
- Services that implement business logic
- Types specific to the feature
- Tests for the feature components and logic

## Data Flow

1. **User Interface Layer** - React components in `/src/components/` and `/src/pages/`
2. **Feature Layer** - Business logic in `/src/features/`
3. **Services Layer** - Cross-cutting concerns in `/src/services/`
4. **Data Access Layer** - Supabase integration in `/src/integrations/supabase/`

## State Management

The application uses a combination of:
- React's built-in state management (useState, useContext)
- TanStack Query (React Query) for server state management
- Local storage for persisting user preferences

## Authentication

Authentication is handled through Supabase Auth, which provides:
- Email/password authentication
- Social login options
- JWT token management
- User profile management

## Deployment

The application is deployed as a single-page application (SPA) with:
- Static assets served from a CDN
- API functions deployed as Supabase Edge Functions
- Database hosted on Supabase

## Testing Strategy

The application includes:
- Unit tests for business logic and utility functions
- Component tests for UI elements
- Integration tests for feature workflows
- End-to-end tests for critical user journeys

