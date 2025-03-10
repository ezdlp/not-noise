
# Smart Links Feature

The Smart Links feature is a core functionality of Soundraiser that allows musicians to create customizable landing pages for their music releases. These pages simplify music promotion by providing a single link that directs fans to the artist's music across multiple streaming platforms.

## Components

### Creation and Management

- `DetailsStep` - Form for entering basic release information
- `PlatformsStep` - Interface for adding and organizing streaming links
- `MetaPixelStep` - Integration with Facebook Pixel for tracking
- `EmailCaptureStep` - Configuration for collecting fan emails
- `ReviewStep` - Final review before publishing

### Display Components

- `SmartLinkContainer` - Main wrapper for the public smart link view
- `SmartLinkHeader` - Displays artwork, title, and artist info
- `PlatformButtonList` - Renders buttons for all streaming platforms
- `PlatformButton` - Individual platform link button
- `EmailSubscribeForm` - Form for fans to subscribe to updates

## Services

- `smartLinkService` - Methods for creating, updating, and retrieving smart links
- `platformService` - Handles platform-specific operations

## Hooks

- `useSmartLink` - Hook for fetching and managing smart link data
- `useSmartLinkCreation` - Manages the multi-step creation flow
- `useSmartLinkTracking` - Tracks interactions with smart links
- `usePlatformState` - Manages platform link state during creation

## Models

- `SmartLink` - Core data structure for smart links
- `PlatformLink` - Represents a link to a specific streaming platform
- `SmartLinkSettings` - Configuration options for a smart link
- `SmartLinkAnalytics` - Analytics data specific to a smart link

## Features

- Multi-platform music links
- Customizable appearance and branding
- Pre-save functionality for upcoming releases
- Email capture for fan list building
- Meta Pixel integration for ad retargeting
- Detailed analytics on views and clicks
- Social media sharing cards
- QR code generation

## Workflow

1. Artist creates a new smart link
2. Searches for their release or enters details manually
3. Adds links to various streaming platforms
4. Configures optional features (email capture, pixel tracking)
5. Reviews and publishes the smart link
6. Shares the link with fans
7. Monitors performance through analytics

## Database Tables

The feature uses these Supabase tables:
- `smart_links` - Stores the main smart link data
- `platform_links` - Stores links to streaming platforms
- `link_views` - Tracks views of smart links
- `platform_clicks` - Tracks clicks on platform links
- `email_subscribers` - Stores email subscribers

## Integration Points

- Integrates with Spotify API for music search
- Uses Odesli API for automatic link generation
- Connects with analytics for tracking
- Integrates with Meta Pixel for ad retargeting

## Subscription Features

Some features are limited based on the user's subscription plan:
- Number of smart links
- Social card customization
- Email capture
- Meta Pixel integration
- Advanced analytics

