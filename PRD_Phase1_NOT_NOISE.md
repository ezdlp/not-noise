# Product Requirements Document (PRD) for NOT NOISE Phase 1 Upgrades

## Overview
NOT NOISE is a music marketing platform empowering independent musicians with tools to optimize music promotion, analytics, and audience management. Phase 1 transitions the platform into a release-centric model, significantly enhancing usability, introducing playlist promotion automation, and improving analytics visibility.

## Features & Requirements

### 1. Dashboard Redesign

**Core Objective:**
Shift from smart-link-centric to releases-centric.

**Dashboard Components:**
- **Artist Switcher:** Dropdown at sidebar top, persists user selection across sessions.
- **Aggregated Metrics:** Total Views, Clicks, CTR prominently displayed at the top.
- **Release Cards:**
  - Cover Art
  - Release Title, Type (Single, EP, Album)
  - Release Date
  - Spotify Popularity Score
  - Actions: Create/View Smart Link, Generate Social Media Assets, Submit to Playlists

### 2. Sidebar Navigation Overhaul

**Sidebar Structure:**
- Dashboard (main hub)
- Smart Links (manage existing links)
- Music Promotion
  - Social Media Assets
  - Spotify Playlist Promotion
- Growth & Analytics
- Fans & Audience
- Settings

**Technical Implementation:**
- Shadcn collapsible components
- Responsive design (collapsible to icons on mobile)

### 3. Social Media Asset Generator Improvement

**Core Objective:**
Improve accessibility by relocating this feature to the sidebar under "Music Promotion."

**Functionality:**
- Users select a release, choose between Square or Story formats, preview, and download.
- No additional customizations needed at this stage.

### 4. Spotify Playlist Promotion Integration

**Initial Manual Workflow (Step 1):**
- Admin dashboard CSV upload of SubmitHub results.
- Parses CSV and extracts curator names, actions, and feedback.
- Presents results visually on the user's dashboard.

**CSV Upload User Flow (Admin):**
1. Admin selects campaign from the list.
2. Admin clicks "Upload CSV" and selects the SubmitHub CSV file.
3. Backend parses and saves curator responses:
   - Curator Name (string)
   - Status (enum: Accepted/Declined)
   - Feedback (text)

**Database Schema (Supabase example):**
```markdown
playlist_submissions
- id (uuid, PK)
- campaign_id (uuid, FK)
- curator_name (string)
- status (enum: accepted, declined)
- feedback (text)
- timestamp (timestamp)
```

**Future Automation (Phase 2):**
- Integration with ChatGPT API:
  - Automatically generates key insights, curator feedback summaries, and actionable recommendations.

**Dashboard Display (No PDF Export):**
- Status Indicators (Accepted/Declined)
- Curator details and feedback summaries in expandable cards
- Separate sections for Key Takeaways and Actionable Points

### 5. Analytics Dashboard Improvements

**Objective:**
Clearly segment analytics into two intuitive sections:

**Segmented Analytics:**
- **Streaming Analytics:** Spotify Popularity Score (current integration)
- **Link Analytics:** Smart link views, clicks, CTR, geography

### 6. Artist Management

**Artist Linking:**
- Artists linked via Spotify API upon account creation
- Subscription-based limits:
  - Free: 1 artist
  - Pro: up to 3 artists

### 7. Homepage Redesign

**Objective:**
Create a compelling new landing page clearly communicating NOT NOISE's value proposition.

**Components:**
- Showcase features: Releases-focused dashboard, playlist promotions, analytics, social media assets
- Clear CTA to start the signup process
- Visual emphasis on the user benefits and success stories

## Technical Considerations

- **Spotify API:**
  - Implement caching strategy to prevent hitting rate limits
  - Efficient management of artist data retrieval

- **Database (Supabase):**
  - Add new tables for managing playlist promotion CSV imports, curator feedback, and campaign reports (see schema above)

- **Future Integration:**
  - Setup for eventual ChatGPT API integration for playlist promotion report automation

## Persistent PRD Visibility in Lovable.dev

Given Lovable.dev's short-term memory constraints:
- Integrate this PRD as a markdown (`PRD_Phase1_NOT_NOISE.md`) file within the GitHub repo
- Regularly update this document to maintain project context during development cycles

## Implementation Roadmap

1. Sidebar Overhaul
2. Dashboard Redesign
3. Social Media Asset Generator Relocation
4. Playlist Promotion Manual Workflow Integration
5. Analytics Enhancements
6. Homepage Redesign
7. Preparation for Future ChatGPT API integration

This structured approach ensures clarity, usability, and scalability while providing an excellent foundation for future phases.
