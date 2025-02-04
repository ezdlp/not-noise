
import React, { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Calculator, Music, PlayCircle } from "lucide-react";

const Features: React.FC = () => {
  const [submissions, setSubmissions] = useState<number>(20);
  const successRate = 0.23; // 23% success rate
  const basePrice = 11; // $11 per submission
  
  const calculateDiscount = (submissions: number) => {
    // 2% discount for every 10 submissions
    const discountTiers = Math.floor((submissions - 20) / 10);
    return Math.min(discountTiers * 0.02, 0.1); // Cap at 10% discount
  };

  const calculateTotalCost = () => {
    const discount = calculateDiscount(submissions);
    const pricePerSubmission = basePrice * (1 - discount);
    return (submissions * pricePerSubmission).toFixed(2);
  };

  const estimatedAdditions = Math.round(submissions * successRate);
  const totalCost = calculateTotalCost();
  const discount = (calculateDiscount(submissions) * 100).toFixed(0);

  return (
    <section className="py-24 bg-background" id="features">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">
            Choose Your Promotion Plan
          </h2>
          
          <div className="bg-white rounded-xl p-8 shadow-sm border border-neutral-200">
            <div className="space-y-8">
              {/* Submission Slider */}
              <div className="space-y-4">
                <label className="block text-lg font-medium text-gray-900">
                  Number of Playlist Submissions
                </label>
                <Slider
                  value={[submissions]}
                  onValueChange={(value) => setSubmissions(value[0])}
                  min={20}
                  max={60}
                  step={5}
                  className="w-full"
                />
                <div className="text-2xl font-bold text-center">
                  {submissions} Submissions
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-neutral-50 rounded-lg p-6 text-center">
                  <div className="inline-flex justify-center items-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
                    <PlayCircle className="w-6 h-6" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{submissions}</div>
                  <div className="text-sm text-gray-600">Total Submissions</div>
                </div>

                <div className="bg-neutral-50 rounded-lg p-6 text-center">
                  <div className="inline-flex justify-center items-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
                    <Music className="w-6 h-6" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{estimatedAdditions}</div>
                  <div className="text-sm text-gray-600">Estimated Playlist Adds</div>
                </div>

                <div className="bg-neutral-50 rounded-lg p-6 text-center">
                  <div className="inline-flex justify-center items-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
                    <Calculator className="w-6 h-6" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">${totalCost}</div>
                  <div className="text-sm text-gray-600">Total Investment</div>
                </div>
              </div>

              {/* Price Details */}
              <div className="bg-neutral-50 rounded-lg p-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Base Price per Submission</span>
                    <span className="font-medium">${basePrice}.00</span>
                  </div>
                  {parseInt(discount) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Volume Discount</span>
                      <span className="font-medium text-emerald-600">-{discount}%</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm pt-2 border-t">
                    <span>Total Price</span>
                    <span className="font-bold">${totalCost}</span>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <Button className="w-full" size="lg">
                Start Your Promotion
              </Button>

              {/* Success Rate Note */}
              <p className="text-sm text-gray-500 text-center">
                * Estimated playlist adds based on our historical 23% success rate
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
