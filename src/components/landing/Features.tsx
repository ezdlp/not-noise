import React, { useState } from 'react';
import { Link2, Image as ImageIcon, Mail, Activity, BarChart3, Users, Percent, DollarSign } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInstagram, faTiktok, faXTwitter, faSnapchat, faFacebookF } from "@fortawesome/free-brands-svg-icons";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import type { CarouselApi } from "@/components/ui/carousel";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { SmartImage } from "@/components/ui/smart-image";

const generateMockData = () => {
  const baseViews = 80;
  const baseClicks = 20;
  const data = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000);
    const views = Math.floor(baseViews + Math.random() * 40 + i * 5);
    const clicks = Math.floor(baseClicks + Math.random() * 15 + i * 2);
    data.push({
      date: date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      }),
      views,
      clicks,
      viewsChange: i > 0 ? ((views - data[i - 1]?.views) / data[i - 1]?.views * 100).toFixed(1) : "0.0",
      clicksChange: i > 0 ? ((clicks - data[i - 1]?.clicks) / data[i - 1]?.clicks * 100).toFixed(1) : "0.0"
    });
  }
  return data;
};

const mockData = generateMockData();

const mockSubscribers = [{
  id: 1,
  email: "john.smith@example.com",
  date: "2024-03-25",
  platform: "Spotify"
}, {
  id: 2,
  email: "emma.wilson@example.com",
  date: "2024-03-24",
  platform: "Apple Music"
}, {
  id: 3,
  email: "michael.brown@example.com",
  date: "2024-03-24",
  platform: "YouTube Music"
}, {
  id: 4,
  email: "sophia.davis@example.com",
  date: "2024-03-23",
  platform: "Spotify"
}, {
  id: 5,
  email: "william.jones@example.com",
  date: "2024-03-23",
  platform: "Amazon Music"
}];

const CustomTooltip = ({
  active,
  payload,
  label
}: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/50 p-3 md:p-4 border border-neutral-100/60 rounded-lg shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
        <p className="text-xs md:text-sm font-medium text-neutral-600 mb-2">{label}</p>
        {payload.map((pld: any, index: number) => (
          <div key={index} className="flex items-center gap-1.5 md:gap-2 mb-1">
            <div className={`w-1.5 md:w-2 h-1.5 md:h-2 rounded-full ${pld.name === 'views' ? 'bg-[#9b87f5]' : 'bg-[#37D299]'}`} />
            <span className="text-xs md:text-sm font-medium">{pld.name === 'views' ? 'Views' : 'Clicks'}</span>
            <span className="text-xs md:text-sm font-medium">{pld.value}</span>
            <span className={`text-[10px] md:text-xs ${Number(pld.payload[`${pld.name}Change`]) > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {Number(pld.payload[`${pld.name}Change`]) > 0 ? '+' : ''}{pld.payload[`${pld.name}Change`]}%
            </span>
          </div>
        ))}
      </div>
    );
  }

  return null;
};

const SmartLinkShowcase = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [api, setApi] = React.useState<CarouselApi>();
  const smartLinks = [{
    image: "/lovable-uploads/9209e373-783a-4f5b-8b40-569168616f6a.png"
  }, {
    image: "/lovable-uploads/1db201b2-4a78-4703-ac5d-3dde30fc2b65.png"
  }, {
    image: "/lovable-uploads/49bdc125-2fb6-44ad-ba5d-ef8efca7df5a.png"
  }, {
    image: "/lovable-uploads/97a73c26-6a75-4622-8548-019d36864f45.png"
  }, {
    image: "/lovable-uploads/de90434e-fe22-4dba-ba49-615f2e221fc8.png"
  }];

  const getRotation = (index: number) => {
    const rotations = [-10, -5, 0, 5, 10];
    return rotations[index];
  };

  React.useEffect(() => {
    if (!api) {
      return;
    }

    api.on("select", () => {
      setCurrentIndex(api.selectedScrollSnap());
    });
  }, [api]);

  return (
    <div className="mt-6 relative">
      {/* Mobile Layout */}
      <div className="md:hidden relative">
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent pointer-events-none z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none z-10" />
        
        <div className="overflow-hidden px-3">
          <Carousel opts={{
            align: 'center',
            loop: true
          }} setApi={setApi} className="w-full">
            <CarouselContent>
              {smartLinks.map((link, index) => (
                <CarouselItem key={index}>
                  <div className="relative py-4">
                    <SmartImage 
                      src={link.image} 
                      alt={`Smart Link Example ${index + 1}`} 
                      className="w-full shadow-sm border border-neutral-200/60 rounded-lg mx-auto max-w-[280px]" 
                      priority={index === 0}
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
          
          <div className="flex justify-center gap-1.5 mt-3">
            {smartLinks.map((_, index) => (
              <button 
                key={index} 
                onClick={() => api?.scrollTo(index)} 
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-colors",
                  index === currentIndex ? 'bg-primary' : 'bg-neutral-200'
                )} 
              />
            ))}
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block">
        <div className="flex justify-center relative py-4">
          {smartLinks.map((link, index) => (
            <div 
              key={index} 
              className="flex-none w-[200px] group relative" 
              style={{
                transform: `rotate(${getRotation(index)}deg)`,
                marginLeft: index === 0 ? '0' : '-48px',
                transition: 'all 0.3s ease-in-out',
                zIndex: index
              }}
            >
              <div className="relative transition-all duration-300 group-hover:rotate-0 group-hover:-translate-y-4 group-hover:z-50">
                <SmartImage 
                  src={link.image} 
                  alt={`Smart Link Example ${index + 1}`} 
                  className="w-full shadow-sm border border-neutral-200/60 rounded-lg" 
                  priority={index === 2}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const SocialAssetsShowcase = () => {
  const [activeFormat, setActiveFormat] = useState<'post' | 'story'>('post');

  return (
    <div className="flex-1 w-full">
      <div className="max-w-xl mx-auto">
        <div className="bg-[#fafafa] rounded-lg shadow-sm border border-[#eaeaea] overflow-hidden">
          <div className="flex justify-center gap-3 pt-4 pb-3">
            <Toggle 
              pressed={activeFormat === 'post'} 
              onPressedChange={() => setActiveFormat('post')} 
              className={`px-4 py-1.5 text-sm font-medium transition-all ${
                activeFormat === 'post' 
                  ? 'bg-primary text-white shadow-sm' 
                  : 'text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              Post
            </Toggle>
            <Toggle 
              pressed={activeFormat === 'story'} 
              onPressedChange={() => setActiveFormat('story')} 
              className={`px-4 py-1.5 text-sm font-medium transition-all ${
                activeFormat === 'story' 
                  ? 'bg-primary text-white shadow-sm' 
                  : 'text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              Story
            </Toggle>
          </div>

          <div className="h-[360px] flex items-center justify-center bg-neutral-50/50 p-4">
            <div className={`h-full ${activeFormat === 'post' ? 'w-full' : 'w-[200px]'}`}>
              <SmartImage 
                src={activeFormat === 'post' 
                  ? 'https://owtufhdsuuyrgmxytclj.supabase.co/storage/v1/object/public/media-library/taylor-post.jpg' 
                  : 'https://owtufhdsuuyrgmxytclj.supabase.co/storage/v1/object/public/media-library/taylor-story.jpg'
                } 
                alt="Social media preview" 
                className="w-full h-full object-contain rounded-lg shadow-sm border border-neutral-200/60" 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MetaPixelSection = () => {
  const COLORS = ['#6851FB', '#37D299', '#271153'];
  const deviceData = [{
    name: 'Desktop',
    value: 45
  }, {
    name: 'Mobile',
    value: 40
  }, {
    name: 'Tablet',
    value: 15
  }];

  return (
    <div className="mt-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="border-none bg-[#fafafa] shadow-none">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <Users className="w-4 h-4 text-primary" />
                </div>
                <span className="font-medium text-sm text-neutral-600">Ad Clicks</span>
              </div>
              <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700">+12.5%</Badge>
            </div>
            <p className="text-xl font-bold text-neutral-900">860</p>
          </CardContent>
        </Card>

        <Card className="border-none bg-[#fafafa] shadow-none">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <Percent className="w-4 h-4 text-primary" />
                </div>
                <span className="font-medium text-sm text-neutral-600">Conversion Rate</span>
              </div>
              <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700">+8.3%</Badge>
            </CardContent>
            <p className="text-xl font-bold text-neutral-900">24.2%</p>
          </CardContent>
        </Card>

        <Card className="border-none bg-[#fafafa] shadow-none">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <DollarSign className="w-4 h-4 text-primary" />
                </div>
                <span className="font-medium text-sm text-neutral-600">Cost per Conversion</span>
              </div>
              <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700">-5.2%</Badge>
            </CardContent>
            <p className="text-xl font-bold text-neutral-900">$2.15</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-none bg-[#fafafa] shadow-none">
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium text-neutral-900">Platform Distribution</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-2">
              {[
                { name: 'Spotify', value: 30 },
                { name: 'Apple Music', value: 22 },
                { name: 'YouTube Music', value: 18 },
                { name: 'Amazon Music', value: 10 },
                { name: 'Deezer', value: 8 },
                { name: 'Tidal', value: 6 },
                { name: 'Others', value: 6 }
              ].map(platform => (
                <div key={platform.name} className="flex items-center justify-between">
                  <span className="text-xs text-neutral-600">{platform.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${platform.value}%` }} />
                    </div>
                    <span className="text-xs font-medium text-neutral-900 min-w-[32px] text-right">{platform.value}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none bg-[#fafafa] shadow-none">
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium text-neutral-900">Geographic Data</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-2">
              {[
                { country: 'United States', value: 35 },
                { country: 'United Kingdom', value: 20 },
                { country: 'Germany', value: 15 },
                { country: 'Brazil', value: 12 },
                { country: 'Spain', value: 8 },
                { country: 'Argentina', value: 6 },
                { country: 'Others', value: 4 }
              ].map(geo => (
                <div key={geo.country} className="flex items-center justify-between">
                  <span className="text-xs text-neutral-600">{geo.country}</span>
                  <span className="text-xs font-medium text-neutral-900">{geo.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none bg-[#fafafa] shadow-none">
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium text-neutral-900">Device Types</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="h-[150px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={deviceData} cx="50%" cy="50%" innerRadius={35} outerRadius={50} paddingAngle={5} dataKey="value">
                    {deviceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-4">
              {deviceData.map((device, index) => (
                <div key={device.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                  <span className="text-xs text-neutral-600">{device.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const AnalyticsSection = () => {
  const [timeframe, setTimeframe] = useState('7d');

  return (
    <div className="mt-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h4 className="text-lg font-semibold text-neutral-900">Performance Overview</h4>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="border-none bg-[#fafafa] shadow-none">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <Users className="w-4 h-4 text-primary" />
                </div>
                <span className="font-medium text-sm text-neutral-600">Total Views</span>
              </div>
              <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700">+12.5%</Badge>
            </div>
            <p className="text-xl font-bold text-neutral-900">2,847</p>
          </CardContent>
        </Card>

        <Card className="border-none bg-[#fafafa] shadow-none">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <Activity className="w-4 h-4 text-primary" />
                </div>
                <span className="font-medium text-sm text-neutral-600">Total Clicks</span>
              </div>
              <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700">+8.3%</Badge>
            </CardContent>
            <p className="text-xl font-bold text-neutral-900">1,249</p>
          </CardContent>
        </Card>

        <Card className="border-none bg-[#fafafa] shadow-none">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <Percent className="w-4 h-4 text-primary" />
                </div>
                <span className="font-medium text-sm text-neutral-600">Click Rate</span>
              </div>
              <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700">+5.2%</Badge>
            </CardContent>
            <p className="text-xl font-bold text-neutral-900">43.9%</p>
          </CardContent>
        </Card>
      </div>

      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={mockData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-neutral-200/40" />
            <XAxis 
              dataKey="date" 
              className="text-xs text-neutral-600" 
              tick={{fontSize: 12}} 
              tickMargin={8} 
            />
            <YAxis 
              className="text-xs text-neutral-600" 
              tick={{fontSize: 12}} 
              tickMargin={8} 
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="views" 
              stroke="#6851FB" 
              strokeWidth={2} 
              dot={false} 
              activeDot={{r: 4, fill: "#6851FB"}} 
            />
            <Line 
              type="monotone" 
              dataKey="clicks" 
              stroke="#37D299" 
              strokeWidth={2} 
              dot={false} 
              activeDot={{r: 4, fill: "#37D299"}} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const Features: React.FC = () => {
  return (
    <div className="relative">
      <div className="mx-auto max-w-screen-xl px-3 md:px-6 lg:px-8">
        <div className="space-y-4">
          {/* Smart Links Section */}
          <section className="rounded-xl border border-[#eaeaea] bg-[#fafafa] overflow-hidden">
            <div className="p-6 md:p-8">
              <div className="max-w-2xl mx-auto text-center mb-6">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <div className="p-1.5 rounded-lg bg-primary/5">
                    <Link2 className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-neutral-500">Release Pages</span>
                </div>
                <h3 className="text-xl md:text-2xl font-semibold tracking-tight mb-3">One Link for All Platforms</h3>
                <p className="text-base text-neutral-600/90">
                  Connect your fans to their preferred streaming service instantly. No more juggling multiple links or losing potential listeners.
                </p>
              </div>

              <SmartLinkShowcase />
            </div>
          </section>

          {/* Analytics Section */}
          <section className="rounded-xl border border-[#eaeaea] bg-[#fafafa] overflow-hidden">
            <div className="p-6 md:p-8">
              <div className="max-w-2xl mx-auto text-center mb-6">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <div className="p-1.5 rounded-lg bg-primary/5">
                    <BarChart3 className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-neutral-500">Analytics Dashboard</span>
                </div>
                <h3 className="text-xl md:text-2xl font-semibold tracking-tight mb-3">Track Your Performance</h3>
                <p className="text-base text-neutral-600/90">
                  Get detailed insights into your smart link performance. Monitor views, clicks, and conversion rates in real-time.
                </p>
              </div>

              <div className="bg-white rounded-lg border border-[#eaeaea] shadow-sm">
                <div className="p-6">
                  <AnalyticsSection />
                </div>
              </div>
            </div>
          </section>

          {/* Meta Pixel Section */}
          <section className="rounded-xl border border-[#eaeaea] bg-[#fafafa] overflow-hidden">
            <div className="p-6 md:p-8">
              <div className="max-w-2xl mx-auto text-center mb-6">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <div className="p-1.5 rounded-lg bg-primary/5">
                    <Activity className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-neutral-500">Meta Pixel Integration</span>
                </div>
                <h3 className="text-xl md:text-2xl font-semibold tracking-tight mb-3">Target Your True Fans</h3>
                <p className="text-base text-neutral-600/90">
                  Track conversions and retarget your audience with built-in Meta Pixel support. Understand your audience better and optimize your marketing efforts.
                </p>
              </div>

              <div className="bg-white rounded-lg border border-[#eaeaea] shadow-sm">
                <div className="p-6">
                  <MetaPixelSection />
                </div>
              </div>
            </div>
          </section>

          {/* Social Media Section */}
          <section className="rounded-xl border border-[#eaeaea] bg-[#fafafa] overflow-hidden">
            <div className="p-6 md:p-8">
              <div className="flex flex-col lg:flex-row items-start gap-6">
                <div className="flex-1 lg:max-w-md">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 rounded-lg bg-primary/5">
                      <ImageIcon className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium text-neutral-500">Social Media Tools</span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-semibold tracking-tight mb-3">Stand Out on Social Media</h3>
                  <p className="text-base text-neutral-600/90">
                    Transform your music links into eye-catching social cards automatically. Perfect for Instagram, X, Facebook, and more - no design skills needed.
                  </p>

                  <div className="grid grid-cols-5 gap-2 sm:gap-4 mt-6">
                    {[
                      { icon: faInstagram, label: "Instagram" },
                      { icon: faTiktok, label: "TikTok" },
                      { icon: faXTwitter, label: "X" },
                      { icon: faSnapchat, label: "Snapchat" },
                      { icon: faFacebookF, label: "Facebook" }
                    ].map(platform => (
                      <div key={platform.label} className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-[#fafafa] hover:bg-neutral-100 flex items-center justify-center transition-colors">
                          <FontAwesomeIcon icon={platform.icon} className="w-4 h-4 text-neutral-500" />
                        </div>
                        <span className="text-xs font-medium text-neutral-600">{platform.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <SocialAssetsShowcase />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Features;
