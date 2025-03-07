import { useState, useEffect } from 'react';
import { useStripe } from '@/hooks/useStripe';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

// Helper function to format dates
const formatDate = (dateString: number) => {
  return new Date(dateString * 1000).toLocaleDateString();
};

export function StripeExample() {
  const [activeTab, setActiveTab] = useState('customers');
  const { 
    isLoading,
    error,
    getCustomers,
    getSubscriptions,
    getProducts,
    getPrices,
    getCharges,
    getInvoices
  } = useStripe();

  const [customers, setCustomers] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [prices, setPrices] = useState<any[]>([]);
  const [charges, setCharges] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);

  const loadData = async () => {
    switch (activeTab) {
      case 'customers':
        const customersResponse = await getCustomers();
        setCustomers(customersResponse.data);
        break;
      case 'subscriptions':
        const subscriptionsResponse = await getSubscriptions();
        setSubscriptions(subscriptionsResponse.data);
        break;
      case 'products':
        const productsResponse = await getProducts();
        setProducts(productsResponse.data);
        break;
      case 'prices':
        const pricesResponse = await getPrices();
        setPrices(pricesResponse.data);
        break;
      case 'charges':
        const chargesResponse = await getCharges();
        setCharges(chargesResponse.data);
        break;
      case 'invoices':
        const invoicesResponse = await getInvoices();
        setInvoices(invoicesResponse.data);
        break;
    }
  };

  useEffect(() => {
    loadData().catch(console.error);
  }, [activeTab]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Stripe Data</CardTitle>
        <CardDescription>
          View your Stripe data directly using the Stripe API
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="customers" onValueChange={handleTabChange}>
          <TabsList className="grid grid-cols-6 mb-4">
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="prices">Prices</TabsTrigger>
            <TabsTrigger value="charges">Charges</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
          </TabsList>

          {error && (
            <div className="text-red-500 p-4 mb-4 bg-red-50 rounded">
              Error: {error.message}
            </div>
          )}

          <div className="mb-4">
            <Button onClick={loadData} disabled={isLoading}>
              {isLoading ? <Spinner className="mr-2" /> : null}
              Refresh Data
            </Button>
          </div>

          <TabsContent value="customers" className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center p-8">
                <Spinner size="lg" />
              </div>
            ) : (
              <div className="overflow-auto max-h-96">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="p-2 text-left">ID</th>
                      <th className="p-2 text-left">Email</th>
                      <th className="p-2 text-left">Name</th>
                      <th className="p-2 text-left">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((customer) => (
                      <tr key={customer.id} className="border-b hover:bg-gray-50">
                        <td className="p-2">{customer.id}</td>
                        <td className="p-2">{customer.email}</td>
                        <td className="p-2">{customer.name}</td>
                        <td className="p-2">{formatDate(customer.created)}</td>
                      </tr>
                    ))}
                    {customers.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-gray-500">
                          No customers found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="subscriptions" className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center p-8">
                <Spinner size="lg" />
              </div>
            ) : (
              <div className="overflow-auto max-h-96">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="p-2 text-left">ID</th>
                      <th className="p-2 text-left">Customer</th>
                      <th className="p-2 text-left">Status</th>
                      <th className="p-2 text-left">Start Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptions.map((subscription) => (
                      <tr key={subscription.id} className="border-b hover:bg-gray-50">
                        <td className="p-2">{subscription.id}</td>
                        <td className="p-2">{subscription.customer}</td>
                        <td className="p-2">{subscription.status}</td>
                        <td className="p-2">{formatDate(subscription.start_date)}</td>
                      </tr>
                    ))}
                    {subscriptions.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-gray-500">
                          No subscriptions found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="products" className="space-y-4">
            {/* Similar table structure for products */}
            {isLoading ? (
              <div className="flex justify-center p-8">
                <Spinner size="lg" />
              </div>
            ) : (
              <div className="overflow-auto max-h-96">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="p-2 text-left">ID</th>
                      <th className="p-2 text-left">Name</th>
                      <th className="p-2 text-left">Active</th>
                      <th className="p-2 text-left">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id} className="border-b hover:bg-gray-50">
                        <td className="p-2">{product.id}</td>
                        <td className="p-2">{product.name}</td>
                        <td className="p-2">{product.active ? 'Yes' : 'No'}</td>
                        <td className="p-2">{formatDate(product.created)}</td>
                      </tr>
                    ))}
                    {products.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-gray-500">
                          No products found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="prices" className="space-y-4">
            {/* Similar table for prices */}
            {isLoading ? (
              <div className="flex justify-center p-8">
                <Spinner size="lg" />
              </div>
            ) : (
              <div className="overflow-auto max-h-96">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="p-2 text-left">ID</th>
                      <th className="p-2 text-left">Product</th>
                      <th className="p-2 text-left">Unit Amount</th>
                      <th className="p-2 text-left">Currency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prices.map((price) => (
                      <tr key={price.id} className="border-b hover:bg-gray-50">
                        <td className="p-2">{price.id}</td>
                        <td className="p-2">{price.product}</td>
                        <td className="p-2">{price.unit_amount ? (price.unit_amount / 100).toFixed(2) : 'N/A'}</td>
                        <td className="p-2">{price.currency.toUpperCase()}</td>
                      </tr>
                    ))}
                    {prices.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-gray-500">
                          No prices found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="charges" className="space-y-4">
            {/* Similar table for charges */}
            {isLoading ? (
              <div className="flex justify-center p-8">
                <Spinner size="lg" />
              </div>
            ) : (
              <div className="overflow-auto max-h-96">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="p-2 text-left">ID</th>
                      <th className="p-2 text-left">Amount</th>
                      <th className="p-2 text-left">Status</th>
                      <th className="p-2 text-left">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {charges.map((charge) => (
                      <tr key={charge.id} className="border-b hover:bg-gray-50">
                        <td className="p-2">{charge.id}</td>
                        <td className="p-2">{(charge.amount / 100).toFixed(2)} {charge.currency.toUpperCase()}</td>
                        <td className="p-2">{charge.status}</td>
                        <td className="p-2">{formatDate(charge.created)}</td>
                      </tr>
                    ))}
                    {charges.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-gray-500">
                          No charges found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="invoices" className="space-y-4">
            {/* Similar table for invoices */}
            {isLoading ? (
              <div className="flex justify-center p-8">
                <Spinner size="lg" />
              </div>
            ) : (
              <div className="overflow-auto max-h-96">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="p-2 text-left">ID</th>
                      <th className="p-2 text-left">Customer</th>
                      <th className="p-2 text-left">Total</th>
                      <th className="p-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice) => (
                      <tr key={invoice.id} className="border-b hover:bg-gray-50">
                        <td className="p-2">{invoice.id}</td>
                        <td className="p-2">{invoice.customer}</td>
                        <td className="p-2">
                          {invoice.total ? (invoice.total / 100).toFixed(2) : '0.00'} {invoice.currency.toUpperCase()}
                        </td>
                        <td className="p-2">{invoice.status}</td>
                      </tr>
                    ))}
                    {invoices.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-gray-500">
                          No invoices found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 