import { Link2, BarChart3, Globe2, Mail, Activity } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Mock data for the analytics chart
const mockData = Array.from({ length: 7 }, (_, i) => ({
  date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  views: Math.floor(Math.random() * 100) + 80,
  clicks: Math.floor(Math.random() * 40) + 20
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
    <section className="py-32 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 text-night font-heading">
          From One Link to Endless Plays
        </h2>
        
        {/* Connecting Lines */}
        <div className="absolute left-1/2 top-[25%] bottom-[75%] w-px border-l-2 border-dashed border-primary/20" />
        <div className="absolute left-1/2 top-[50%] bottom-[50%] w-px border-l-2 border-dashed border-primary/20" />
        <div className="absolute left-1/2 top-[75%] bottom-[25%] w-px border-l-2 border-dashed border-primary/20" />
        
        {/* One Link Feature */}
        <div className="mt-24 flex flex-col lg:flex-row items-center gap-12 px-4 md:px-0" data-scroll="parallax">
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-3 rounded-lg bg-primary-light">
                <Link2 className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold">One Link for All Platforms</h3>
            </div>
            <p className="text-lg text-gray-600">
              Create a single, powerful smart link that connects your fans to your music across all major streaming platforms.
            </p>
          </div>
          <div className="flex-1 w-full md:w-auto">
            <div className="max-w-sm mx-auto bg-white rounded-3xl shadow-lg overflow-hidden">
              <div className="aspect-square bg-[#271153] rounded-t-3xl p-8 flex items-center justify-center">
                <img 
                  src="/lovable-uploads/a26e1c6d-0929-49c7-a91f-ad7e1e7c4eff.png"
                  alt="Inside Out by Spoon"
                  className="w-full h-full object-cover rounded-2xl"
                />
              </div>
              <div className="p-6 space-y-4">
                <div className="text-center">
                  <h4 className="text-xl font-bold text-gray-900">Inside Out</h4>
                  <p className="text-gray-600">Spoon</p>
                </div>
                <div className="space-y-3">
                  {[
                    { name: "Spotify", icon: "/lovable-uploads/spotify.png" },
                    { name: "YouTube Music", icon: "/lovable-uploads/youtubemusic.png" },
                    { name: "Apple Music", icon: "/lovable-uploads/applemusic.png" },
                    { name: "Amazon Music", icon: "/lovable-uploads/amazonmusic.png" }
                  ].map((platform) => (
                    <div 
                      key={platform.name}
                      className="flex items-center justify-between py-3 border-b last:border-b-0"
                    >
                      <div className="flex items-center gap-3">
                        <img src={platform.icon} alt={platform.name} className="w-8 h-8" />
                        <span className="font-medium text-gray-900">{platform.name}</span>
                      </div>
                      <Button variant="default" size="sm" className="bg-black hover:bg-black/90 min-w-[80px]">
                        Play
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Meta Pixel Feature */}
        <div className="mt-32 flex flex-col lg:flex-row-reverse items-center gap-12 px-4 md:px-0" data-scroll="parallax">
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-3 rounded-lg bg-primary-light">
                <Activity className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold">Meta Pixel Integration</h3>
            </div>
            <p className="text-lg text-gray-600">
              Track conversions and retarget your audience with built-in Meta Pixel support.
            </p>
          </div>
          <div className="flex-1 w-full">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg p-8 max-w-md mx-auto">
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
        
        {/* Analytics Feature */}
        <div className="mt-32 flex flex-col lg:flex-row items-center gap-12 px-4 md:px-0" data-scroll="parallax">
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-3 rounded-lg bg-primary-light">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold">Real-Time Analytics</h3>
            </div>
            <p className="text-lg text-gray-600">
              Make data-driven decisions with comprehensive analytics across platforms.
            </p>
          </div>
          <div className="flex-1 w-full">
            <div className="bg-white rounded-xl shadow-lg p-2 sm:p-3 md:p-6">
              <div className="h-[300px] -mx-2 sm:mx-0">
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
        
        {/* Global Reach Feature */}
        <div className="mt-32 flex flex-col lg:flex-row-reverse items-center gap-12 px-4 md:px-0" data-scroll="parallax">
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-3 rounded-lg bg-primary-light">
                <Globe2 className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold">Global Reach</h3>
            </div>
            <p className="text-lg text-gray-600">
              Track and analyze your worldwide audience with real-time geographic insights.
            </p>
          </div>
          <div className="flex-1 w-full">
            <div className="bg-gradient-to-br from-[#ECE9FF] to-[#D0C7FF] rounded-xl shadow-lg p-6 max-w-md mx-auto h-[480px]">
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
        
        {/* Email List Building */}
        <div className="mt-32 flex flex-col lg:flex-row items-center gap-12 px-4 md:px-0" data-scroll="parallax">
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-3 rounded-lg bg-primary-light">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold">Email List Building</h3>
            </div>
            <p className="text-lg text-gray-600">
              Turn passive listeners into engaged fans with powerful email collection tools.
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
      </div>
    </section>
  );
};

export default Features;
