import { Link2, BarChart3, Globe2, Mail, Activity } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Mock data for the analytics chart
const mockData = Array.from({ length: 7 }, (_, i) => ({
  date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  views: Math.floor(Math.random() * 100) + 50,
  clicks: Math.floor(Math.random() * 50) + 20
}));

const Features = () => {
  return (
    <section className="py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 text-night font-heading">
          From One Link to Endless Plays
        </h2>
        
        {/* One Link Feature */}
        <div className="mt-24 flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Link2 className="w-6 h-6 text-[#6851FB]" />
              <h3 className="text-2xl font-semibold">One Link for All Platforms</h3>
            </div>
            <p className="text-lg text-gray-600">
              Create a single, powerful smart link that connects your fans to your music across all major streaming platforms.
            </p>
          </div>
          <div className="flex-1">
            <div className="bg-white rounded-xl shadow-lg p-6 max-w-md mx-auto">
              <div className="aspect-square bg-gradient-to-br from-purple-100 to-purple-50 rounded-lg mb-6 flex items-center justify-center">
                <img 
                  src="/lovable-uploads/soundraiser-logo/Iso A.svg"
                  alt="Album artwork"
                  className="w-48 h-48 object-contain"
                />
              </div>
              <div className="space-y-3">
                {['Spotify', 'Apple Music', 'YouTube Music', 'Amazon Music'].map((platform) => (
                  <div key={platform} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <img 
                        src={`/lovable-uploads/${platform.toLowerCase().replace(' ', '')}.png`}
                        alt={platform}
                        className="w-8 h-8 object-contain"
                      />
                      <span className="font-medium">{platform}</span>
                    </div>
                    <Button variant="default" className="bg-black hover:bg-black/90">
                      Listen
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Meta Pixel Feature */}
        <div className="mt-32 flex flex-col lg:flex-row-reverse items-center gap-12">
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-6 h-6 text-[#6851FB]" />
              <h3 className="text-2xl font-semibold">Meta Pixel Integration</h3>
            </div>
            <p className="text-lg text-gray-600">
              Track conversions and retarget your audience with built-in Meta Pixel support.
            </p>
          </div>
          <div className="flex-1">
            <div className="bg-white rounded-xl shadow-lg p-6 max-w-md mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Enable Meta Pixel</label>
                <Switch />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Meta Pixel ID</label>
                <Input placeholder="Enter your Meta Pixel ID" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">View Event Name</label>
                <Input defaultValue="PageView" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Click Event Name</label>
                <Input defaultValue="Click" />
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Feature */}
        <div className="mt-32 flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-6 h-6 text-[#6851FB]" />
              <h3 className="text-2xl font-semibold">Real-Time Analytics</h3>
            </div>
            <p className="text-lg text-gray-600">
              Make data-driven decisions with comprehensive analytics across platforms.
            </p>
          </div>
          <div className="flex-1">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="views" 
                      stackId="1" 
                      stroke="#6851FB" 
                      fill="#6851FB" 
                      fillOpacity={0.2}
                      name="Views"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="clicks" 
                      stackId="2" 
                      stroke="#37D299" 
                      fill="#37D299" 
                      fillOpacity={0.2}
                      name="Clicks"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Email Capture Feature */}
        <div className="mt-32 flex flex-col lg:flex-row-reverse items-center gap-12">
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Mail className="w-6 h-6 text-[#6851FB]" />
              <h3 className="text-2xl font-semibold">Email List Building</h3>
            </div>
            <p className="text-lg text-gray-600">
              Turn passive listeners into engaged fans with our email capture feature.
            </p>
          </div>
          <div className="flex-1">
            <div className="bg-white rounded-xl shadow-lg p-6 max-w-md mx-auto">
              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <h4 className="text-lg font-semibold mb-2">Subscribe to my newsletter</h4>
                <p className="text-gray-600 mb-4">Stay updated with my latest releases</p>
                <Input placeholder="Enter your email" className="mb-3" />
                <Button className="w-full">Subscribe</Button>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Form Title</label>
                  <Input defaultValue="Subscribe to my newsletter" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Input defaultValue="Stay updated with my latest releases" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Global Reach Feature */}
        <div className="mt-32 flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Globe2 className="w-6 h-6 text-[#6851FB]" />
              <h3 className="text-2xl font-semibold">Global Reach</h3>
            </div>
            <p className="text-lg text-gray-600">
              Automatically detect your fans' location and direct them to their preferred service.
            </p>
          </div>
          <div className="flex-1">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <img 
                src="/lovable-uploads/54d53ec6-a05d-4cf2-ae38-13515de09118.png"
                alt="Global reach visualization"
                className="w-full rounded-lg"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;