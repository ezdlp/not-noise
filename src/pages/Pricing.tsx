
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PageSEO } from "@/components/seo/PageSEO";
import { ComparisonTable } from "@/components/pricing/ComparisonTable";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/landing/Footer";

export default function Pricing() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [yearly, setYearly] = useState(() => {
    const initialBilling = searchParams.get("billing");
    return initialBilling === "yearly";
  });

  // Update URL when billing period changes
  useEffect(() => {
    const newParams = new URLSearchParams(searchParams);
    if (yearly) {
      newParams.set("billing", "yearly");
    } else {
      newParams.set("billing", "monthly");
    }
    setSearchParams(newParams, { replace: true });
  }, [yearly, searchParams, setSearchParams]);

  return (
    <>
      <PageSEO 
        title="Pricing | Soundraiser" 
        description="Flexible plans to help every musician get their music heard. Choose the plan that fits your needs and budget."
      />
      
      <div className="container px-4 py-12 mx-auto mb-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
          <p className="text-lg text-muted-foreground mb-8">
            Choose the plan that best fits your needs. All plans include core features.
          </p>
          
          <div className="flex items-center justify-center space-x-4 mb-8">
            <span className={yearly ? "text-muted-foreground" : "font-medium"}>Monthly</span>
            <button
              onClick={() => setYearly(!yearly)}
              type="button"
              role="switch"
              aria-checked={yearly}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                yearly ? "bg-primary" : "bg-input"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${
                  yearly ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <span className={!yearly ? "text-muted-foreground" : "font-medium"}>
              Yearly <span className="text-xs text-green-500 font-medium">Save 20%</span>
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {/* Free Plan */}
          <div className="border rounded-lg p-6 flex flex-col h-full">
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-2">Free</h2>
              <p className="text-muted-foreground">For musicians just getting started</p>
            </div>
            <div className="mb-6">
              <div className="text-3xl font-bold">$0</div>
              <div className="text-muted-foreground">Forever free</div>
            </div>
            <ul className="space-y-3 mb-8 flex-grow">
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>3 smart links</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>Basic analytics</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>Email support</span>
              </li>
            </ul>
            <Button variant="outline" className="w-full" href="/register">
              Get Started
            </Button>
          </div>

          {/* Pro Plan */}
          <div className="border border-primary rounded-lg p-6 flex flex-col h-full shadow-sm relative">
            <div className="absolute top-0 right-0 bg-primary text-white px-3 py-1 text-xs font-medium rounded-bl-lg rounded-tr-lg">
              POPULAR
            </div>
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-2">Pro</h2>
              <p className="text-muted-foreground">For growing musicians</p>
            </div>
            <div className="mb-6">
              <div className="text-3xl font-bold">
                {yearly ? "$7" : "$9"}
                <span className="text-base font-normal text-muted-foreground">
                  /{yearly ? "mo" : "mo"}
                </span>
              </div>
              <div className="text-muted-foreground">
                {yearly ? "Billed annually ($84/year)" : "Billed monthly"}
              </div>
            </div>
            <ul className="space-y-3 mb-8 flex-grow">
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>Unlimited smart links</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>Advanced analytics</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>Custom domains</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>Email capture</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>Priority support</span>
              </li>
            </ul>
            <Button className="w-full" href={`/register?plan=pro&billing=${yearly ? 'yearly' : 'monthly'}`}>
              Get Pro
            </Button>
          </div>

          {/* Business Plan */}
          <div className="border rounded-lg p-6 flex flex-col h-full">
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-2">Business</h2>
              <p className="text-muted-foreground">For labels and managers</p>
            </div>
            <div className="mb-6">
              <div className="text-3xl font-bold">
                {yearly ? "$19" : "$24"}
                <span className="text-base font-normal text-muted-foreground">
                  /{yearly ? "mo" : "mo"}
                </span>
              </div>
              <div className="text-muted-foreground">
                {yearly ? "Billed annually ($228/year)" : "Billed monthly"}
              </div>
            </div>
            <ul className="space-y-3 mb-8 flex-grow">
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>Everything in Pro</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>Team accounts (up to 5)</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>Bulk link creation</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>API access</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>Dedicated account manager</span>
              </li>
            </ul>
            <Button variant="outline" className="w-full" href={`/register?plan=business&billing=${yearly ? 'yearly' : 'monthly'}`}>
              Get Business
            </Button>
          </div>
        </div>

        <ComparisonTable yearly={yearly} />
      </div>
      <Footer />
    </>
  );
}
