
# Components Directory

This directory contains shared UI components that are used across multiple features of the Soundraiser platform. These components are designed to be reusable, maintainable, and follow consistent design patterns.

## Component Categories

### UI Components (`/ui`)

Base UI components built on top of ShadCN UI library, including:
- Buttons, inputs, forms
- Cards, modals, dialogs
- Navigation elements
- Typography components
- Layout utilities

These components implement the Soundraiser design system and are the building blocks for all interfaces.

### Layout Components (`/layout`)

Components that define the overall structure of pages, including:
- Header and footer
- Sidebar navigation
- Page containers
- Grid systems

### Feature-Specific Components

Components that are associated with specific features but might be used across multiple pages:

- `/analytics` - Charts, statistics cards, and data visualization
- `/dashboard` - Dashboard-specific components
- `/smart-link` - Smart link rendering and interaction components

## Component Design Principles

1. **Composition over inheritance** - Build complex UIs by composing simpler components
2. **Single responsibility** - Each component should do one thing well
3. **Prop-driven configuration** - Components should be configurable via props
4. **Accessibility first** - All components should be accessible by default
5. **Responsive design** - Components should work on all screen sizes

## Guidelines for Creating New Components

When creating a new component:

1. Determine if it belongs in a feature directory or should be shared
2. For shared components, place it in the appropriate category
3. Use TypeScript for type safety
4. Implement responsive design using Tailwind CSS
5. Consider accessibility requirements
6. Document props and usage with comments
7. Keep components focused and small (under 150 lines of code)

## Using ShadCN UI

Most UI components are built on top of [ShadCN UI](https://ui.shadcn.com/), which provides unstyled, accessible components. When extending these components:

1. Maintain accessibility features
2. Preserve the component API
3. Apply Soundraiser's design system consistently
4. Add only what's necessary for your use case

