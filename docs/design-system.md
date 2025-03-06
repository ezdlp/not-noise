# Soundraiser Design System

## 1. Guiding Principle

The foundation of our design system is ShadCN UI components, ensuring consistency, scalability, and maintainability while integrating a youthful, energetic identity for indie musicians.

Custom components should only be created when no ShadCN alternative exists, and they must strictly follow ShadCN's design philosophy.

## 2. Core Design Philosophy

- Bold and expressive – The platform should feel dynamic, energetic, and inspiring, just like the musicians it serves.
- Minimalist and modern – Clean layouts, high contrast, and structured white space create a timeless digital experience.
- Youthful and digital-first – A design that feels fresh, interactive, and aligned with Gen Z aesthetics.
- Fast and intuitive – Artists should be able to achieve their goals seamlessly, with an interface that gets out of their way.
- Unique yet functional – Striking the right balance between personality and usability, avoiding unnecessary complexity.

## 3. Fonts and Typography

### Primary Fonts

- Headings: Poppins (600 - Semi-Bold, 500 - Medium)
- Body Text: DM Sans (400 - Regular, 500 - Medium)

### Font Sizes

- Headings
  - H1 – 24px
  - H2 – 20px
  - H3 – 18px
- Body Text
  - Base – 16px
  - Small Text – 14px
  - Micro Text – 12px

### Usage Guidelines

- Headings should be bold and modern for a clean, structured hierarchy.
- Body text should prioritize readability.
- Proper color contrast is mandatory for accessibility.
- Use Tailwind's text utilities for consistency (text-lg, text-sm, etc.).

## 4. Color System

### Primary Color

- Majorelle Blue (#6851FB) – Used for CTAs, key interactions, and brand identity.

### Neutral Colors

- Background (L0): #FAFAFA (Seasalt – Soft white for page backgrounds)
- Containers (L1): #FFFFFF (White – Used for cards, modals, popovers)
- Borders and Inputs: #E6E6E6 (Light Gray – Used for form fields, dividers, and outlines)

### Text Colors

- Primary Text: #111827 (Black – Used for high-contrast text)
- Secondary Text: #374151 (Dark Gray – For subtext and secondary elements)
- Muted Text: #6B7280 (Light Gray – Used for disabled states or captions)

### States and Accents

- Hover State (Primary): #4A47A5 (Darker Majorelle Blue for hover effects)
- Active State: #271153 (Deep Majorelle Blue for pressed elements)
- Disabled State: #ECE9FF (Light desaturated blue for inactive elements)
- Ring and Focus State: #6851FB (Majorelle Blue outline for focus states)

## 5. Layout and Spacing System

- Mobile-first approach, fully responsive.
- Tailwind's responsive breakpoints: sm, md, lg, xl.
- Spacing system follows an 8px grid for clean alignment.

### Spacing and Grid System

- Tight: 8px (gap-2)
- Default: 16px (gap-4)
- Loose: 24px (gap-6)

## 6. Component-Specific Guidelines

### Buttons

- Primary
  - Background: #6851FB
  - Text: #FFFFFF
  - Hover: #4A47A5
  - Active: #271153
- Secondary
  - Background: #FFFFFF
  - Text: #0F0F0F
  - Hover: #F3F3F3
  - Active: #E6E6E6
- Ghost
  - Background: Transparent
  - Text: #333333
  - Hover: #F3F3F3
  - Active: #E6E6E6

### Button Sizes

- Small (sm): Height h-8, Padding px-3
- Default (md): Height h-10, Padding px-4
- Large (lg): Height h-12, Padding px-6

### Cards

- Background: #FFFFFF
- Border: 1px solid #E6E6E6
- Radius: rounded-lg
- Shadow: shadow-sm

## 7. Data Visualization

- Minimalist and clear – Data should be scannable at a glance.
- Consistent typographic hierarchy – Maintain readability across KPIs, charts, and tables.
- Neutral backgrounds and subtle contrast – Use soft background tints and subtle borders to separate sections.
- Optimized colors – Use light pastel fills with strong accent strokes for clarity.

### Data Display Guidelines

- Primary KPI Values: text-2xl font-semibold text-primary
- Metric Titles: text-sm font-medium text-muted
- Supporting Text (Change Indicators, Percentages): text-xs text-muted
- Card Background: #FFFFFF
- Card Border: 1px solid #E6E6E6
- Card Shadow: shadow-sm

### Progress Bars

- Base Track: h-6 rounded bg-primary-20
- Filled Progress: h-6 rounded bg-primary
- Opacity Adjustment: opacity-85

## 8. Final Rules

- No pure black (#000000) – Use neutral grays for a softer, more polished look.
- Gradients and textures – Use sparingly for depth, but avoid unnecessary visual noise.
- Smooth, engaging animations – Keep interactions fluid and responsive.
- Strict consistency – All color variants and gradients should be applied consistently across the UI. 