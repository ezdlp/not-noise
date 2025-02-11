import React, { useState } from "react";
import { Link2, Image as ImageIcon, Globe2, Mail, Activity, BarChart3, Users, Percent, DollarSign, Laptop, Phone, MonitorSmartphone } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInstagram, faTiktok, faXTwitter, faSnapchat, faFacebookF } from "@fortawesome/free-brands-svg-icons";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Badge } from "@/components/ui/badge";

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

const SmartLinkShowcase = () => {
  const smartLinks = [
    { image: "/lovable-uploads/9209e373-783a-4f5b-8b40-569168616f6a.png" },
    { image: "/lovable-uploads/1db201b2-4a78-4703-ac5d-3dde30fc2b65.png" },
    { image: "/lovable-uploads/49bdc125-2fb6-44ad-ba5d-ef8efca7df5a.png" },
    { image: "/lovable-uploads/97a73c26-6a75-4622-8548-019d36864f45.png" },
    { image: "/lovable-uploads/de90434e-fe22-4dba-ba49-615f2e221fc8.png" },
  ];

  const getRotation = (index: number) => {
    const rotations = [-10, -5, 0, 5, 10];
    return rotations[index];
  };

  return (
    <div className="mt-12 relative">
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent pointer-events-none md:hidden z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none md:hidden z-10" />
      
      <div className="overflow-x-auto snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0">
        <div className="flex gap-2 md:gap-0 min-w-max md:min-w-0 md:justify-center relative py-8">
          {smartLinks.map((link, index) => (
            <div
              key={index}
              className="flex-none w-[280px] md:w-[220px] group relative"
              style={{
                transform: `rotate(${getRotation(index)}deg)`,
                marginLeft: index === 0 ? '0' : '-60px',
                transition: 'all 0.3s ease-in-out',
                zIndex: index,
              }}
            >
              <div className="relative transition-all duration-300 group-hover:rotate-0 group-hover:-translate-y-4 group-hover:z-50">
                <img
                  src={link.image}
                  alt={`Smart Link Example ${index + 1}`}
                  className="w-full shadow-md rounded-xl"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const SocialAssetsShowcase: React.FC = () => {
  const [activeFormat, setActiveFormat] = useState<'post' | 'story'>('post');
  
  return (
    <div className="mt-8 relative flex flex-col lg:flex-row items-start gap-12">
      <div className="flex-1 lg:max-w-md">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-3 rounded-lg bg-primary-light">
            <ImageIcon className="w-6 h-6 text-primary" />
          </div>
          <span className="text-sm font-medium text-primary">Social Promotion</span>
        </div>
        <h3 className="text-2xl md:text-3xl font-bold mb-4">Create Professional Social Assets Instantly</h3>
        <p className="text-lg text-gray-600 mb-8">
          Generate stunning social media cards automatically for every platform. Share your music professionally across Instagram, Twitter, Facebook, and more.
        </p>
        
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-6">
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-neutral-50 flex items-center justify-center transition-colors hover:bg-neutral-100">
              <FontAwesomeIcon icon={faInstagram} className="w-5 h-5 text-[#8E9196]" />
            </div>
            <span className="text-xs font-medium text-gray-600">Instagram</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-neutral-50 flex items-center justify-center transition-colors hover:bg-neutral-100">
              <FontAwesomeIcon icon={faTiktok} className="w-5 h-5 text-[#8E9196]" />
            </div>
            <span className="text-xs font-medium text-gray-600">TikTok</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-neutral-50 flex items-center justify-center transition-colors hover:bg-neutral-100">
              <FontAwesomeIcon icon={faXTwitter} className="w-5 h-5 text-[#8E9196]" />
            </div>
            <span className="text-xs font-medium text-gray-600">X</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-neutral-50 flex items-center justify-center transition-colors hover:bg-neutral-100">
              <FontAwesomeIcon icon={faSnapchat} className="w-5 h-5 text-[#8E9196]" />
            </div>
            <span className="text-xs font-medium text-gray-600">Snapchat</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-neutral-50 flex items-center justify-center transition-colors hover:bg-neutral-100">
              <FontAwesomeIcon icon={faFacebookF} className="w-5 h-5 text-[#8E9196]" />
            </div>
            <span className="text-xs font-medium text-gray-600">Facebook</span>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full">
        <div className="max-w-xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg border border-neutral-200 overflow-hidden">
            <div className="flex justify-center gap-4 pt-6 pb-4">
              <Toggle
                pressed={activeFormat === 'post'}
                onPressedChange={() => setActiveFormat('post')}
                className={`px-6 py-2 text-sm font-medium transition-all ${
                  activeFormat === 'post' 
                    ? 'bg-primary text-white shadow-md' 
                    : 'text-gray-600 hover:bg-neutral-50'
                }`}
              >
                Post
              </Toggle>
              <Toggle
                pressed={activeFormat === 'story'}
                onPressedChange={() => setActiveFormat('story')}
                className={`px-6 py-2 text-sm font-medium transition-all ${
                  activeFormat === 'story' 
                    ? 'bg-primary text-white shadow-md' 
                    : 'text-gray-600 hover:bg-neutral-50'
                }`}
              >
                Story
              </Toggle>
            </div>

            <div className="h-[480px] flex items-center justify-center bg-neutral-50 p-6">
              <div className={`h-full ${activeFormat === 'post' ? 'w-full' : 'w-[270px]'}`}>
                <img 
                  src={activeFormat === 'post' 
                    ? 'https://owtufhdsuuyrgmxytclj.supabase.co/storage/v1/object/public/media-library/taylor-post.jpg'
                    : 'https://owtufhdsuuyrgmxytclj.supabase.co/storage/v1/object/public/media-library/taylor-story.jpg'
                  }
                  alt="Social media preview"
                  className="w-full h-full object-contain rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const generateMetaPixelData = () => {
  const data = [];
  const baseClicks = 860;
  const baseConversions = 208;
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000);
    const clicks = Math.floor(baseClicks + Math.random() * 100);
    const conversions = Math.floor(baseConversions + Math.random() * 30);
    
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      clicks,
      conversions,
      conversionRate: ((conversions / clicks) * 100).toFixed(1),
      costPerConversion: ((clicks * 0.5) / conversions).toFixed(2)
    });
  }
  return data;
};

const deviceData = [
  { name: 'Desktop', value: 45 },
  { name: 'Mobile', value: 40 },
  { name: 'Tablet', value: 15 }
];

const MetaPixelTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border border-neutral-200 rounded-lg shadow-sm">
        <p className="text-sm font-medium text-gray-600 mb-2">{label}</p>
        {payload.map((pld: any, index: number) => (
          <div key={index} className="flex items-center gap-2 mb-1">
            <div className={`w-2 h-2 rounded-full ${pld.name === 'clicks' ? 'bg-[#6851FB]' : 'bg-[#37D299]'}`} />
            <span className="text-sm font-medium">{pld.name === 'clicks' ? 'Clicks' : 'Conversions'}</span>
            <span className="text-sm font-medium">{pld.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const MetaPixelSection = () => {
  const COLORS = ['#6851FB', '#37D299', '#271153'];
  const deviceData = [
    { name: 'Desktop', value: 45 },
    { name: 'Mobile', value: 40 },
    { name: 'Tablet', value: 15 }
  ];
  
  return (
    <div className="mt-32">
      <div className="text-center max-w-2xl mx-auto mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-primary-light">
            <Activity className="w-4 h-4 text-primary" />
          </div>
          <span className="text-sm font-medium text-gray-500">Meta Pixel Integration</span>
        </div>
        <h3 className="text-2xl md:text-3xl font-bold mb-4">Target Your True Fans</h3>
        <p className="text-lg text-gray-600">
          Track conversions and retarget your audience with built-in Meta Pixel support. Understand your audience better and optimize your marketing efforts.
        </p>
      </div>

      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg border border-neutral-200 overflow-hidden">
          <div className="p-8 md:p-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Card className="border-none bg-card/50 shadow-none">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Users className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-medium text-sm">Ad Clicks</span>
                    </div>
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">+12.5%</Badge>
                  </div>
                  <p className="text-2xl font-bold">860</p>
                </CardContent>
              </Card>

              <Card className="border-none bg-card/50 shadow-none">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Percent className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-medium text-sm">Conversion Rate</span>
                    </div>
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">+8.3%</Badge>
                  </div>
                  <p className="text-2xl font-bold">24.2%</p>
                </CardContent>
              </Card>

              <Card className="border-none bg-card/50 shadow-none">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <DollarSign className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-medium text-sm">Cost per Conversion</span>
                    </div>
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">-5.2%</Badge>
                  </div>
                  <p className="text-2xl font-bold">$2.15</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-none bg-card/50 shadow-none">
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Platform Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {[
                      { name: 'Spotify', value: 45 },
                      { name: 'Apple Music', value: 35 },
                      { name: 'Others', value: 20 }
                    ].map((platform) => (
                      <div key={platform.name} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{platform.name}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${platform.value}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{platform.value}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none bg-card/50 shadow-none">
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Geographic Data</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {[
                      { country: 'United States', value: 45 },
                      { country: 'United Kingdom', value: 25 },
                      { country: 'Germany', value: 15 },
                      { country: 'Others', value: 15 }
                    ].map((geo) => (
                      <div key={geo.country} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{geo.country}</span>
                        <span className="text-sm font-medium">{geo.value}%</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none bg-card/50 shadow-none">
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Device Types</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[150px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={deviceData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={60}
                          paddingAngle={5}
                          dataKey="value"
                        >
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
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[index] }}
                        />
                        <span className="text-sm text-gray-600">{device.name}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
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

        <div className="mt-12" data-scroll="parallax">
          <div className="text-center max-w-2xl mx-auto mb-8">
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

        <div className="mt-32">
          <SocialAssetsShowcase />
        </div>

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
          <MetaPixelSection />
        </div>

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
                      <div className="h-2.5 rounded-full transition-all duration-500 bg-[#6851FB]" style={{ width: `${region.percentage}%` }}></div>
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
