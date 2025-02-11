import React, { useCallback, useEffect, useState } from "react";
import { Link2, Image as ImageIcon, Globe2, Mail, Activity, BarChart3 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import useEmblaCarousel from 'embla-carousel-react';

// Generate mock data for analytics
const generateMockData = () => {
  const baseViews = 80;
  const baseClicks = 20;
  const data = [];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000);
    const views = Math.floor(baseViews + Math.random() * 40 + (i * 5));
    const clicks = Math.floor(baseClicks + Math.random() * 15 + (i * 2));
    
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      views,
      clicks,
      viewsChange: i > 0 ? ((views - data[i-1]?.views) / data[i-1]?.views * 100).toFixed(1) : "0.0",
      clicksChange: i > 0 ? ((clicks - data[i-1]?.clicks) / data[i-1]?.clicks * 100).toFixed(1) : "0.0"
    });
  }
  return data;
};

const mockData = generateMockData();

// Mock data for email subscribers
const mockSubscribers = [
  { id: 1, email: "john.smith@example.com", date: "2024-03-25", platform: "Spotify" },
  { id: 2, email: "emma.wilson@example.com", date: "2024-03-24", platform: "Apple Music" },
  { id: 3, email: "michael.brown@example.com", date: "2024-03-24", platform: "YouTube Music" },
  { id: 4, email: "sophia.davis@example.com", date: "2024-03-23", platform: "Spotify" },
  { id: 5, email: "william.jones@example.com", date: "2024-03-23", platform: "Amazon Music" },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border border-neutral-200 rounded-lg shadow-sm">
        <p className="text-sm font-medium text-gray-600 mb-2">{label}</p>
        {payload.map((pld: any, index: number) => (
          <div key={index} className="flex items-center gap-2 mb-1">
            <div className={`w-2 h-2 rounded-full ${pld.name === 'views' ? 'bg-[#9b87f5]' : 'bg-[#37D299]'}`} />
            <span className="text-sm font-medium">{pld.name === 'views' ? 'Views' : 'Clicks'}</span>
            <span className="text-sm font-medium">{pld.value}</span>
            <span className={`text-xs ${Number(pld.payload[`${pld.name}Change`]) > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {Number(pld.payload[`${pld.name}Change`]) > 0 ? '+' : ''}{pld.payload[`${pld.name}Change`]}%
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const SmartLinkShowcase: React.FC = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true,
    align: 'center',
  });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollTo = useCallback((index: number) => {
    if (emblaApi) emblaApi.scrollTo(index);
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect]);

  const smartLinks = [
    {
      image: "/lovable-uploads/a26e1c6d-0929-49c7-a91f-ad7e1e7c4eff.png",
      gradient: "from-purple-500/20 to-purple-500",
    },
    {
      image: "/lovable-uploads/1312b6ce-b7d7-473c-8627-3a0fdb32da04.png",
      gradient: "from-pink-500/20 to-orange-500",
    },
    {
      image: "/lovable-uploads/4c9eb575-58f0-4d5e-9109-0fe49ff42c02.png",
      gradient: "from-blue-500/20 to-purple-500",
    },
    {
      image: "/lovable-uploads/28f75700-3d24-45a7-8bca-02635c910bf8.png",
      gradient: "from-emerald-500/20 to-sky-500",
    },
    {
      image: "/lovable-uploads/9e0bd143-b390-4507-95bb-4608c17e614a.png",
      gradient: "from-amber-500/20 to-red-500",
    },
  ];

  return (
    <div className="mt-12 overflow-hidden">
      <div className="overflow-hidden w-full" ref={emblaRef}>
        <div className="flex touch-pan-y">
          {smartLinks.map((link, index) => (
            <div
              key={index}
              className="relative flex-[0_0_100%] min-w-0 pl-4 md:flex-[0_0_80%] lg:flex-[0_0_60%]"
            >
              <div 
                className={`relative overflow-hidden rounded-xl transition-all duration-500 transform
                  ${selectedIndex === index ? 'scale-100 opacity-100' : 'scale-95 opacity-50'}`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${link.gradient} opacity-50`} />
                <img
                  src={link.image}
                  alt={`Smart Link Example ${index + 1}`}
                  className="w-full h-auto aspect-[4/3] object-cover rounded-xl"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex justify-center gap-2 mt-4">
        {smartLinks.map((_, index) => (
          <button
            key={index}
            onClick={() => scrollTo(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 
              ${selectedIndex === index ? 'bg-primary w-4' : 'bg-gray-300'}`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

const Features: React.FC = () => {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 text-night font-heading">
          From One Link to Endless Plays
        </h2>

        {/* One Link Feature - Modern Grid Layout */}
        <div className="mt-24" data-scroll="parallax">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-primary-light">
                <Link2 className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm font-medium text-gray-500">Smart Links</span>
            </div>
            <h3 className="text-2xl md:text-3xl font-bold mb-4">One Link for All Platforms</h3>
            <p className="text-lg text-gray-600">
              Create a single, powerful smart link that connects your fans to your music across all major streaming platforms.
            </p>
          </div>

          <SmartLinkShowcase />
        </div>

        {/* Social Media Assets - Full Width */}
        <div className="mt-32">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-start justify-between mb-8">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-3 rounded-lg bg-primary-light">
                    <ImageIcon className="w-6 h-6 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-primary">Social Promotion</span>
                </div>
                <h3 className="text-2xl md:text-3xl font-bold">Create Professional Social Assets Instantly</h3>
                <p className="text-lg text-gray-600 max-w-2xl">
                  Generate stunning social media cards automatically for every platform. Share your music professionally across Instagram, Twitter, Facebook, and more.
                </p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="p-6 hover:shadow-lg transition-all duration-300">
                <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary rounded-lg flex items-center justify-center mb-4">
                  <img 
                    src="/lovable-uploads/soundraiser-logo/Iso A.svg"
                    alt="Instagram post preview"
                    className="w-32 h-32"
                  />
                </div>
                <h4 className="text-lg font-semibold mb-2">Instagram Post</h4>
                <p className="text-gray-600">Perfect square format for Instagram feed posts</p>
              </Card>
              <Card className="p-6 hover:shadow-lg transition-all duration-300">
                <div className="aspect-video bg-gradient-to-br from-emerald-500/20 to-emerald-500 rounded-lg flex items-center justify-center mb-4">
                  <img 
                    src="/lovable-uploads/soundraiser-logo/Iso A.svg"
                    alt="Story preview"
                    className="w-32 h-32"
                  />
                </div>
                <h4 className="text-lg font-semibold mb-2">Instagram Story</h4>
                <p className="text-gray-600">Vertical format optimized for stories</p>
              </Card>
            </div>
          </div>
        </div>

        {/* Meta Pixel Integration - Two Column */}
        <div className="mt-32 flex flex-col lg:flex-row-reverse items-center gap-12">
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-3 rounded-lg bg-primary-light">
                <Activity className="w-6 h-6 text-primary" />
              </div>
              <span className="text-sm font-medium text-primary">Retargeting</span>
            </div>
            <h3 className="text-2xl md:text-3xl font-bold">Target Your True Fans</h3>
            <p className="text-lg text-gray-600">
              Track conversions and retarget your audience with built-in Meta Pixel support. Understand your audience better and optimize your marketing efforts.
            </p>
          </div>
          <div className="flex-1 w-full">
            <div className="bg-gradient-to-br from-[#E5DEFF] via-[#D3E4FD] to-[#ECE9FF] rounded-xl shadow-lg p-8 max-w-md mx-auto">
              <div className="flex items-center mb-8">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/7/7b/Meta_Platforms_Inc._logo.svg" 
                  alt="Meta logo" 
                  className="w-24 h-auto"
                />
              </div>
              <div className="space-y-6">
                <div className="bg-white/90 backdrop-blur-sm p-6 rounded-lg shadow-sm">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-medium text-lg">Ad Clicks</span>
                    <span className="text-[#6851FB] text-lg font-semibold">860</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2.5 rounded-full">
                    <div className="bg-[#6851FB] h-2.5 rounded-full" style={{ width: '80%' }}></div>
                  </div>
                </div>
                <div className="bg-white/90 backdrop-blur-sm p-6 rounded-lg shadow-sm">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-medium text-lg">Conversions</span>
                    <span className="text-emerald-500 text-lg font-semibold">208</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2.5 rounded-full">
                    <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: '24%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Feature - Full Width */}
        <div className="mt-32">
          <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg border border-neutral-200 overflow-hidden">
            <div className="p-8 md:p-10">
              <div className="mb-8">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                  <BarChart3 className="w-4 h-4" />
                  <span className="font-medium">Real-Time Analytics</span>
                </div>
                <h3 className="text-2xl md:text-3xl font-bold mb-2">Track Your Music's Performance</h3>
                <p className="text-gray-600 text-lg">
                  Make data-driven decisions with comprehensive analytics across platforms.
                </p>
              </div>
              
              <div className="h-[400px] -mx-2 sm:mx-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mockData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#666666', fontSize: 12 }}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#666666', fontSize: 12 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line 
                      type="monotone" 
                      dataKey="views" 
                      stroke="#9b87f5"
                      strokeWidth={2}
                      dot={{ r: 4, fill: "#9b87f5" }}
                      activeDot={{ r: 6, fill: "#9b87f5" }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="clicks" 
                      stroke="#37D299"
                      strokeWidth={2}
                      dot={{ r: 4, fill: "#37D299" }}
                      activeDot={{ r: 6, fill: "#37D299" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Email List Building - Two Column */}
        <div className="mt-32 flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-3 rounded-lg bg-primary-light">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <span className="text-sm font-medium text-primary">Fan Engagement</span>
            </div>
            <h3 className="text-2xl md:text-3xl font-bold">Build Your Email List</h3>
            <p className="text-lg text-gray-600">
              Turn passive listeners into engaged fans with powerful email collection tools. Build a direct connection with your audience.
            </p>
          </div>
          <div className="flex-1 w-full">
            <div className="bg-gradient-to-br from-[#E5DEFF] via-[#D3E4FD] to-[#ECE9FF] rounded-xl shadow-lg p-6 h-[400px] overflow-hidden">
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-lg font-semibold">Recent Subscribers</h4>
                <Button variant="secondary" size="sm" className="flex items-center gap-2 bg-white/80 hover:bg-white">
                  Export CSV
                </Button>
              </div>
              <div className="overflow-x-auto">
                <div className="min-w-[500px] md:min-w-0">
                  <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-sm">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-gray-50/50">
                          <TableHead>Email</TableHead>
                          <TableHead>Platform</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mockSubscribers.map((subscriber) => (
                          <TableRow key={subscriber.id} className="hover:bg-gray-50/50">
                            <TableCell className="font-medium">{subscriber.email}</TableCell>
                            <TableCell>{subscriber.platform}</TableCell>
                            <TableCell>{subscriber.date}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Global Reach Feature - Full Width */}
        <div className="mt-32">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-start justify-between mb-8">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-3 rounded-lg bg-primary-light">
                    <Globe2 className="w-6 h-6 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-primary">Global Impact</span>
                </div>
                <h3 className="text-2xl md:text-3xl font-bold mb-4">Reach Fans Worldwide</h3>
                <p className="text-lg text-gray-600 max-w-2xl">
                  Track and analyze your worldwide audience with real-time geographic insights.
                </p>
              </div>
            </div>
            <div className="bg-gradient-to-br from-[#ECE9FF] to-[#D0C7FF] rounded-xl shadow-lg p-6 max-w-full mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-xl font-semibold text-[#271153]">Global Listeners</h4>
                <span className="text-2xl font-bold text-[#6851FB]">2.4M</span>
              </div>
              <div className="space-y-3">
                {[
                  { name: "United States", percentage: 45 },
                  { name: "United Kingdom", percentage: 25 },
                  { name: "Brazil", percentage: 20 },
                  { name: "Mexico", percentage: 10 }
                ].map((region) => (
                  <div key={region.name} className="bg-white/90 backdrop-blur-sm rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-lg text-[#271153] truncate pr-4">{region.name}</span>
                      <span className="text-[#6851FB] text-lg font-semibold whitespace-nowrap">{region.percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2.5 rounded-full">
                      <div 
                        className="h-2.5 rounded-full transition-all duration-500 bg-[#6851FB]"
                        style={{ width: `${region.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
