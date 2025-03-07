# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/833e19c2-c9f0-449e-9333-5d1b15903c50

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/833e19c2-c9f0-449e-9333-5d1b15903c50) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with .

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/833e19c2-c9f0-449e-9333-5d1b15903c50) and click on Share -> Publish.

## I want to use a custom domain - is that possible?

We don't support custom domains (yet). If you want to deploy your project under your own domain then we recommend using Netlify. Visit our docs for more details: [Custom domains](https://docs.lovable.dev/tips-tricks/custom-domain/)

## Stripe Integration

This project includes direct integration with the Stripe API as an alternative to using Stripe foreign tables in the database.

### Setup

1. Install the Stripe package:
   ```bash
   npm install stripe
   ```

2. Create a `.env.local` file with your Stripe API key:
   ```
   VITE_STRIPE_SECRET_KEY=your_stripe_secret_key_here
   ```

3. Use the Stripe service:
   ```typescript
   import stripeService from '@/lib/stripe';
   
   // Get customers
   const customers = await stripeService.customers.list();
   
   // Get subscriptions
   const subscriptions = await stripeService.subscriptions.list();
   ```

### Available Services

- `customers` - Manage Stripe customers
- `subscriptions` - Manage Stripe subscriptions
- `products` - Manage Stripe products
- `prices` - Manage Stripe prices
- `charges` - Manage Stripe charges
- `invoices` - Manage Stripe invoices

### React Hook

The `useStripe` hook provides a convenient way to access Stripe data in React components:

```typescript
import { useStripe } from '@/hooks/useStripe';

function MyComponent() {
  const { getCustomers, isLoading, error } = useStripe();
  
  const loadData = async () => {
    const result = await getCustomers();
    console.log(result.data);
  };
  
  return (
    <button onClick={loadData} disabled={isLoading}>
      Load Customers
    </button>
  );
}
```

### Security Considerations

For production use, **never expose your Stripe secret key in client-side code**. Instead:

1. Create a server API endpoint that uses the Stripe key securely on the server
2. Call this endpoint from your client-side code
3. Use Stripe's publishable key for front-end operations where appropriate
