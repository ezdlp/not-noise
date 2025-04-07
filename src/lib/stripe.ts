import Stripe from 'stripe';

// Initialize Stripe with your API key
// This should ideally come from environment variables
const stripeApiKey = import.meta.env.VITE_STRIPE_SECRET_KEY || '';
const stripe = new Stripe(stripeApiKey, {
  apiVersion: '2024-09-30.acacia' as any, // Use type assertion to bypass the TypeScript error
});

// Type definitions for better TypeScript support
export type StripeCustomer = Stripe.Customer;
export type StripeSubscription = Stripe.Subscription;
export type StripeProduct = Stripe.Product;
export type StripePrice = Stripe.Price;
export type StripeCharge = Stripe.Charge;
export type StripeInvoice = Stripe.Invoice;

/**
 * Customer-related functions
 */
export const customers = {
  // Get all customers
  list: async (limit = 100) => {
    try {
      return await stripe.customers.list({ limit });
    } catch (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }
  },

  // Get a specific customer
  get: async (customerId: string) => {
    try {
      return await stripe.customers.retrieve(customerId);
    } catch (error) {
      console.error(`Error fetching customer ${customerId}:`, error);
      throw error;
    }
  },

  // Create a new customer
  create: async (customerData: Stripe.CustomerCreateParams) => {
    try {
      return await stripe.customers.create(customerData);
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  },

  // Update a customer
  update: async (customerId: string, customerData: Stripe.CustomerUpdateParams) => {
    try {
      return await stripe.customers.update(customerId, customerData);
    } catch (error) {
      console.error(`Error updating customer ${customerId}:`, error);
      throw error;
    }
  },

  // Delete a customer
  delete: async (customerId: string) => {
    try {
      return await stripe.customers.del(customerId);
    } catch (error) {
      console.error(`Error deleting customer ${customerId}:`, error);
      throw error;
    }
  },
};

/**
 * Subscription-related functions
 */
export const subscriptions = {
  // Get all subscriptions
  list: async (limit = 100) => {
    try {
      return await stripe.subscriptions.list({ limit });
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      throw error;
    }
  },

  // Get a specific subscription
  get: async (subscriptionId: string) => {
    try {
      return await stripe.subscriptions.retrieve(subscriptionId);
    } catch (error) {
      console.error(`Error fetching subscription ${subscriptionId}:`, error);
      throw error;
    }
  },

  // Create a new subscription
  create: async (subscriptionData: Stripe.SubscriptionCreateParams) => {
    try {
      return await stripe.subscriptions.create(subscriptionData);
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  },

  // Update a subscription
  update: async (subscriptionId: string, subscriptionData: Stripe.SubscriptionUpdateParams) => {
    try {
      return await stripe.subscriptions.update(subscriptionId, subscriptionData);
    } catch (error) {
      console.error(`Error updating subscription ${subscriptionId}:`, error);
      throw error;
    }
  },

  // Cancel a subscription
  cancel: async (subscriptionId: string) => {
    try {
      return await stripe.subscriptions.cancel(subscriptionId);
    } catch (error) {
      console.error(`Error canceling subscription ${subscriptionId}:`, error);
      throw error;
    }
  },
};

/**
 * Product-related functions
 */
export const products = {
  // Get all products
  list: async (limit = 100) => {
    try {
      return await stripe.products.list({ limit, active: true });
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  },

  // Get a specific product
  get: async (productId: string) => {
    try {
      return await stripe.products.retrieve(productId);
    } catch (error) {
      console.error(`Error fetching product ${productId}:`, error);
      throw error;
    }
  },

  // Create a new product
  create: async (productData: Stripe.ProductCreateParams) => {
    try {
      return await stripe.products.create(productData);
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  },

  // Update a product
  update: async (productId: string, productData: Stripe.ProductUpdateParams) => {
    try {
      return await stripe.products.update(productId, productData);
    } catch (error) {
      console.error(`Error updating product ${productId}:`, error);
      throw error;
    }
  },
};

/**
 * Price-related functions
 */
export const prices = {
  // Get all prices
  list: async (limit = 100) => {
    try {
      return await stripe.prices.list({ limit, active: true });
    } catch (error) {
      console.error('Error fetching prices:', error);
      throw error;
    }
  },

  // Get a specific price
  get: async (priceId: string) => {
    try {
      return await stripe.prices.retrieve(priceId);
    } catch (error) {
      console.error(`Error fetching price ${priceId}:`, error);
      throw error;
    }
  },

  // Create a new price
  create: async (priceData: Stripe.PriceCreateParams) => {
    try {
      return await stripe.prices.create(priceData);
    } catch (error) {
      console.error('Error creating price:', error);
      throw error;
    }
  },

  // Update a price
  update: async (priceId: string, priceData: Stripe.PriceUpdateParams) => {
    try {
      return await stripe.prices.update(priceId, priceData);
    } catch (error) {
      console.error(`Error updating price ${priceId}:`, error);
      throw error;
    }
  },
};

/**
 * Charge-related functions
 */
export const charges = {
  // Get all charges
  list: async (limit = 100) => {
    try {
      return await stripe.charges.list({ limit });
    } catch (error) {
      console.error('Error fetching charges:', error);
      throw error;
    }
  },

  // Get a specific charge
  get: async (chargeId: string) => {
    try {
      return await stripe.charges.retrieve(chargeId);
    } catch (error) {
      console.error(`Error fetching charge ${chargeId}:`, error);
      throw error;
    }
  },

  // Create a new charge
  create: async (chargeData: Stripe.ChargeCreateParams) => {
    try {
      return await stripe.charges.create(chargeData);
    } catch (error) {
      console.error('Error creating charge:', error);
      throw error;
    }
  },
};

/**
 * Invoice-related functions
 */
export const invoices = {
  // Get all invoices
  list: async (limit = 100) => {
    try {
      return await stripe.invoices.list({ limit });
    } catch (error) {
      console.error('Error fetching invoices:', error);
      throw error;
    }
  },

  // Get a specific invoice
  get: async (invoiceId: string) => {
    try {
      return await stripe.invoices.retrieve(invoiceId);
    } catch (error) {
      console.error(`Error fetching invoice ${invoiceId}:`, error);
      throw error;
    }
  },

  // Create a new invoice
  create: async (invoiceData: Stripe.InvoiceCreateParams) => {
    try {
      return await stripe.invoices.create(invoiceData);
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  },
};

// Export default as a complete Stripe service
const stripeService = {
  customers,
  subscriptions,
  products,
  prices,
  charges,
  invoices,
  // Access to the raw Stripe instance if needed
  getInstance: () => stripe,
};

export default stripeService;
