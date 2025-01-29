import { Link2, BarChart3, Globe2, Mail, Activity } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Mock data for the analytics chart
const mockData = Array.from({ length: 7 }, (_, i) => ({
  date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  views: Math.floor(Math.random() * 100) + 80, // Ensuring views are higher
  clicks: Math.floor(Math.random() * 40) + 20  // Lower click numbers
}));

// Mock data for email subscribers
const mockSubscribers = [
  { id: 1, email: "john.smith@example.com", date: "2024-03-25", platform: "Spotify" },
  { id: 2, email: "emma.wilson@example.com", date: "2024-03-24", platform: "Apple Music" },
  { id: 3, email: "michael.brown@example.com", date: "2024-03-24", platform: "YouTube Music" },
  { id: 4, email: "sophia.davis@example.com", date: "2024-03-23", platform: "Spotify" },
  { id: 5, email: "william.jones@example.com", date: "2024-03-23", platform: "Amazon Music" },
];

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
              <div className="h-[200px] bg-gradient-to-br from-purple-100 to-purple-50 rounded-lg mb-6 flex items-center justify-center">
                <img 
                  src="/lovable-uploads/4e092258-e3b5-4a09-bf43-c783bf998b95.png"
                  alt="Album artwork"
                  className="w-[200px] h-[200px] object-cover rounded-lg"
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
            <div className="bg-white rounded-xl shadow-lg p-6 max-w-md mx-auto">
              <div className="relative p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl mb-6">
                <div className="flex items-center mb-6">
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/7/7b/Meta_Platforms_Inc._logo.svg" 
                    alt="Meta logo" 
                    className="w-24 h-auto"
                  />
                </div>
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">Page Views</span>
                      <span className="text-[#6851FB]">+24%</span>
                    </div>
                    <div className="w-full bg-gray-200 h-2 rounded-full">
                      <div className="bg-[#6851FB] h-2 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">Conversions</span>
                      <span className="text-emerald-500">+12%</span>
                    </div>
                    <div className="w-full bg-gray-200 h-2 rounded-full">
                      <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Feature - Keeping unchanged */}
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

        {/* Email List Building */}
        <div className="mt-32 flex flex-col lg:flex-row-reverse items-center gap-12">
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Mail className="w-6 h-6 text-[#6851FB]" />
              <h3 className="text-2xl font-semibold">Email List Building</h3>
            </div>
            <p className="text-lg text-gray-600">
              Turn passive listeners into engaged fans with powerful email collection tools.
            </p>
          </div>
          <div className="flex-1">
            <div className="bg-gradient-to-br from-[#E5DEFF] via-[#D3E4FD] to-[#ECE9FF] rounded-xl shadow-lg p-6 backdrop-blur-sm">
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-lg font-semibold">Recent Subscribers</h4>
                <Button variant="secondary" size="sm" className="flex items-center gap-2 bg-white/80 hover:bg-white">
                  Export CSV
                </Button>
              </div>
              <div className="overflow-hidden rounded-lg bg-white/80 backdrop-blur-sm">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Platform</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockSubscribers.map((subscriber) => (
                      <TableRow key={subscriber.id}>
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

        {/* Global Reach Feature */}
        <div className="mt-32 flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Globe2 className="w-6 h-6 text-[#6851FB]" />
              <h3 className="text-2xl font-semibold">Global Reach</h3>
            </div>
            <p className="text-lg text-gray-600">
              Track and analyze your worldwide audience with real-time geographic insights.
            </p>
          </div>
          <div className="flex-1">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="relative h-[300px] bg-gradient-to-br from-[#E5DEFF] to-[#D3E4FD] rounded-lg overflow-hidden">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d60978881.06149194!2d-95.665!3d37.6!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sus!4v1710876233664!5m2!1sen!2sus"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="rounded-lg"
                />
                {[
                  { top: '30%', left: '20%', size: 'lg' },
                  { top: '40%', left: '45%', size: 'sm' },
                  { top: '25%', left: '70%', size: 'md' },
                ].map((point, index) => (
                  <div
                    key={index}
                    className={`absolute ${point.size === 'lg' ? 'w-4 h-4' : point.size === 'md' ? 'w-3 h-3' : 'w-2 h-2'} 
                              bg-[#6851FB] rounded-full animate-ping`}
                    style={{ top: point.top, left: point.left }}
                  />
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
