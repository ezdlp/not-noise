import { useState } from 'react';
import Stripe from 'stripe';
import stripeService, { 
  StripeCustomer, 
  StripeSubscription,
  StripeProduct,
  StripePrice,
  StripeCharge,
  StripeInvoice
} from '@/lib/stripe';

// Define your state type
interface StripeState {
  isLoading: boolean;
  error: Error | null;
}

// Define hook return type
interface UseStripeHook extends StripeState {
  // Customers
  getCustomers: (limit?: number) => Promise<Stripe.ApiList<StripeCustomer>>;
  getCustomer: (customerId: string) => Promise<Stripe.Customer | Stripe.DeletedCustomer>;
  
  // Subscriptions
  getSubscriptions: (limit?: number) => Promise<Stripe.ApiList<StripeSubscription>>;
  getSubscription: (subscriptionId: string) => Promise<StripeSubscription>;
  
  // Products
  getProducts: (limit?: number) => Promise<Stripe.ApiList<StripeProduct>>;
  getProduct: (productId: string) => Promise<StripeProduct>;
  
  // Prices
  getPrices: (limit?: number) => Promise<Stripe.ApiList<StripePrice>>;
  getPrice: (priceId: string) => Promise<StripePrice>;
  
  // Charges
  getCharges: (limit?: number) => Promise<Stripe.ApiList<StripeCharge>>;
  getCharge: (chargeId: string) => Promise<StripeCharge>;
  
  // Invoices
  getInvoices: (limit?: number) => Promise<Stripe.ApiList<StripeInvoice>>;
  getInvoice: (invoiceId: string) => Promise<StripeInvoice>;
}

export const useStripe = (): UseStripeHook => {
  const [state, setState] = useState<StripeState>({
    isLoading: false,
    error: null
  });

  const setLoading = (isLoading: boolean) => {
    setState(prev => ({ ...prev, isLoading }));
  };

  const setError = (error: Error | null) => {
    setState(prev => ({ ...prev, error }));
  };

  // Generic wrapper for API calls
  const apiCall = async <T,>(
    fn: () => Promise<T>,
    successCallback?: (data: T) => void
  ): Promise<T> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await fn();
      successCallback?.(result);
      return result;
    } catch (error) {
      setError(error instanceof Error ? error : new Error(String(error)));
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Customers
  const getCustomers = (limit?: number) => 
    apiCall(() => stripeService.customers.list(limit));
  
  const getCustomer = (customerId: string) => 
    apiCall(() => stripeService.customers.get(customerId));

  // Subscriptions
  const getSubscriptions = (limit?: number) => 
    apiCall(() => stripeService.subscriptions.list(limit));
  
  const getSubscription = (subscriptionId: string) => 
    apiCall(() => stripeService.subscriptions.get(subscriptionId));

  // Products
  const getProducts = (limit?: number) => 
    apiCall(() => stripeService.products.list(limit));
  
  const getProduct = (productId: string) => 
    apiCall(() => stripeService.products.get(productId));

  // Prices
  const getPrices = (limit?: number) => 
    apiCall(() => stripeService.prices.list(limit));
  
  const getPrice = (priceId: string) => 
    apiCall(() => stripeService.prices.get(priceId));

  // Charges
  const getCharges = (limit?: number) => 
    apiCall(() => stripeService.charges.list(limit));
  
  const getCharge = (chargeId: string) => 
    apiCall(() => stripeService.charges.get(chargeId));

  // Invoices
  const getInvoices = (limit?: number) => 
    apiCall(() => stripeService.invoices.list(limit));
  
  const getInvoice = (invoiceId: string) => 
    apiCall(() => stripeService.invoices.get(invoiceId));

  return {
    isLoading: state.isLoading,
    error: state.error,
    getCustomers,
    getCustomer,
    getSubscriptions,
    getSubscription,
    getProducts,
    getProduct,
    getPrices,
    getPrice,
    getCharges,
    getCharge,
    getInvoices,
    getInvoice
  };
}; 