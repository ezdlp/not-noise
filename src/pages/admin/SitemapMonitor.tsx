
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import {
  RefreshCw,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Clock,
  Globe,
  ExternalLink,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface SitemapLog {
  id: string;
  status: "success" | "error" | "warning";
  message: string;
  details: Record<string, any>;
  source: string;
  created_at: string;
}

interface SitemapHealth {
  status: "ok" | "warn" | "error";
  lastUpdated: string | null;
  age: number | null;
  urlCount: number | null;
  errors: string[];
  warnings: string[];
}

interface SearchEnginePingResult {
  engine: string;
  status: number;
  success: boolean;
  message: string;
}

export default function SitemapMonitor() {
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isPinging, setIsPinging] = useState(false);
  const [activeTab, setActiveTab] = useState("health");
  const [viewXml, setViewXml] = useState(false);
  const [sitemapXml, setSitemapXml] = useState("");
  const [isLoadingXml, setIsLoadingXml] = useState(false);

  // Fetch sitemap health
  const { 
    data: healthData, 
    isLoading: healthLoading,
    refetch: refetchHealth
  } = useQuery({
    queryKey: ["sitemap-health"],
    queryFn: async () => {
      const response = await fetch(
        "https://owtufhdsuuyrgmxytclj.supabase.co/functions/v1/sitemap-health",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch sitemap health");
      }

      return response.json() as Promise<SitemapHealth>;
    },
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch sitemap logs
  const { 
    data: logsData, 
    isLoading: logsLoading,
    refetch: refetchLogs
  } = useQuery({
    queryKey: ["sitemap-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sitemap_logs" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        throw error;
      }

      return data as unknown as SitemapLog[];
    },
  });

  // Function to regenerate sitemap
  const regenerateSitemap = async () => {
    setIsRegenerating(true);
    
    try {
      // Get API key from database (in real app, this would be handled securely)
      const { data: configData } = await supabase
        .from("app_config")
        .select("value")
        .eq("key", "sitemap_webhook_key")
        .single();
        
      const apiKey = configData?.value || "";
      
      // Call regenerate-sitemap edge function
      const response = await fetch(
        "https://owtufhdsuuyrgmxytclj.supabase.co/functions/v1/regenerate-sitemap",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
          },
          body: JSON.stringify({
            source: "admin",
            timestamp: new Date().toISOString(),
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        toast.success(`Sitemap regenerated with ${result.url_count} URLs`);
      } else {
        toast.error("Failed to regenerate sitemap");
      }
      
      // Refresh data
      refetchHealth();
      refetchLogs();
    } catch (error) {
      console.error("Error regenerating sitemap:", error);
      toast.error("Error regenerating sitemap");
    } finally {
      setIsRegenerating(false);
    }
  };

  // Function to ping search engines
  const pingSearchEngines = async () => {
    setIsPinging(true);
    
    try {
      // Get API key from database
      const { data: configData } = await supabase
        .from("app_config")
        .select("value")
        .eq("key", "sitemap_webhook_key")
        .single();
        
      const apiKey = configData?.value || "";
      
      // Call ping-search-engines edge function
      const response = await fetch(
        "https://owtufhdsuuyrgmxytclj.supabase.co/functions/v1/ping-search-engines",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
          },
          body: JSON.stringify({
            source: "admin",
            timestamp: new Date().toISOString(),
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        toast.success("Successfully pinged search engines");
        
        // Log successes
        result.results.forEach((engine: SearchEnginePingResult) => {
          if (engine.success) {
            toast.success(`${engine.engine} successfully pinged`);
          } else {
            toast.error(`${engine.engine} ping failed: ${engine.message}`);
          }
        });
      } else {
        toast.error("Failed to ping search engines");
      }
      
      // Refresh logs
      refetchLogs();
    } catch (error) {
      console.error("Error pinging search engines:", error);
      toast.error("Error pinging search engines");
    } finally {
      setIsPinging(false);
    }
  };

  // Function to fetch and view sitemap XML
  const viewSitemapXml = async () => {
    setIsLoadingXml(true);
    
    try {
      // Get sitemap from cache
      const { data, error } = await supabase
        .from("sitemap_cache")
        .select("content")
        .eq("key", "sitemap.xml")
        .single();
      
      if (error) {
        throw error;
      }
      
      setSitemapXml(data.content);
      setViewXml(true);
    } catch (error) {
      console.error("Error fetching sitemap XML:", error);
      toast.error("Error fetching sitemap XML");
    } finally {
      setIsLoadingXml(false);
    }
  };

  // Get status color
  const getStatusColor = (status: "success" | "error" | "warning" | "ok" | "warn") => {
    switch (status) {
      case "success":
      case "ok":
        return "bg-green-100 text-green-800";
      case "warning":
      case "warn":
        return "bg-yellow-100 text-yellow-800";
      case "error":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Format timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className="container py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Sitemap Monitor</h1>
        <div className="flex gap-2">
          <Button 
            onClick={() => {
              refetchHealth();
              refetchLogs();
            }}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <a 
            href="https://soundraiser.io/sitemap.xml" 
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm" className="gap-2">
              <ExternalLink className="h-4 w-4" />
              View Live Sitemap
            </Button>
          </a>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="health" className="flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            Health Status
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            Logs
          </TabsTrigger>
          <TabsTrigger value="tools" className="flex items-center gap-1">
            <Globe className="h-4 w-4" />
            Tools
          </TabsTrigger>
        </TabsList>

        <TabsContent value="health" className="space-y-4">
          {/* Health Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Sitemap Health
                {healthData?.status === "ok" && <CheckCircle className="h-5 w-5 text-green-500" />}
                {healthData?.status === "warn" && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
                {healthData?.status === "error" && <AlertCircle className="h-5 w-5 text-red-500" />}
              </CardTitle>
              <CardDescription>
                Overview of the current sitemap status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {healthLoading ? (
                <div className="flex justify-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : healthData ? (
                <div className="grid gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500 mb-1">Last Updated</div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-gray-400" />
                        {healthData.lastUpdated 
                          ? formatTime(healthData.lastUpdated)
                          : "Never"}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500 mb-1">Age</div>
                      <div className="font-medium">
                        {healthData.age !== null
                          ? `${healthData.age} hours`
                          : "Unknown"}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500 mb-1">URL Count</div>
                      <div className="font-medium">
                        {healthData.urlCount !== null
                          ? healthData.urlCount
                          : "Unknown"}
                      </div>
                    </div>
                  </div>

                  {/* Errors and Warnings */}
                  {healthData.errors.length > 0 && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Errors</AlertTitle>
                      <AlertDescription>
                        <ul className="list-disc list-inside">
                          {healthData.errors.map((error, i) => (
                            <li key={i}>{error}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}

                  {healthData.warnings.length > 0 && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Warnings</AlertTitle>
                      <AlertDescription>
                        <ul className="list-disc list-inside">
                          {healthData.warnings.map((warning, i) => (
                            <li key={i}>{warning}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : (
                <div className="text-center p-4 text-gray-500">
                  Failed to load health data
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button
                onClick={viewSitemapXml}
                variant="outline"
                disabled={isLoadingXml}
              >
                {isLoadingXml ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Loading XML...
                  </>
                ) : (
                  "View XML"
                )}
              </Button>
              <Button 
                onClick={regenerateSitemap}
                disabled={isRegenerating}
              >
                {isRegenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Regenerating...
                  </>
                ) : (
                  "Regenerate Sitemap"
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          {/* Logs Table */}
          <Card>
            <CardHeader>
              <CardTitle>Sitemap Logs</CardTitle>
              <CardDescription>
                Recent sitemap generation events and errors
              </CardDescription>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="flex justify-center p-6">
                  <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : logsData && logsData.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logsData.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="whitespace-nowrap">{formatTime(log.created_at)}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={getStatusColor(log.status)}
                            >
                              {log.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{log.message}</TableCell>
                          <TableCell>{log.source}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {Object.keys(log.details).length > 0 
                              ? JSON.stringify(log.details, null, 2) 
                              : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center p-6 text-gray-500">
                  No logs found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tools">
          <Card>
            <CardHeader>
              <CardTitle>Sitemap Tools</CardTitle>
              <CardDescription>
                Tools to manage and optimize your sitemap
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-2">Ping Search Engines</h3>
                <p className="text-gray-600 mb-4">
                  Notify search engines about your sitemap updates to help them discover your content faster.
                </p>
                <Button 
                  onClick={pingSearchEngines}
                  disabled={isPinging}
                  className="gap-2"
                >
                  {isPinging ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Pinging...
                    </>
                  ) : (
                    <>
                      <Globe className="h-4 w-4" />
                      Ping Google & Bing
                    </>
                  )}
                </Button>
              </div>

              <Separator />

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-2">Robots.txt</h3>
                <p className="text-gray-600 mb-4">
                  Your robots.txt file includes a reference to your sitemap, which helps search engines find it.
                </p>
                <div className="bg-gray-100 p-3 rounded text-sm font-mono">
                  Sitemap: https://soundraiser.io/sitemap.xml
                </div>
              </div>

              <Separator />

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-2">Search Console Links</h3>
                <p className="text-gray-600 mb-4">
                  Manage your site in search engine webmaster tools to improve visibility.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <a
                    href="https://search.google.com/search-console"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block"
                  >
                    <Button variant="outline" className="gap-2">
                      <ExternalLink className="h-4 w-4" />
                      Google Search Console
                    </Button>
                  </a>
                  <a
                    href="https://www.bing.com/webmasters/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block"
                  >
                    <Button variant="outline" className="gap-2">
                      <ExternalLink className="h-4 w-4" />
                      Bing Webmaster Tools
                    </Button>
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* XML Viewer Dialog */}
      <Dialog open={viewXml} onOpenChange={setViewXml}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Sitemap XML</DialogTitle>
            <DialogDescription>
              Raw XML content of your sitemap
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            <pre className="text-xs p-4 bg-gray-100 rounded-md overflow-auto max-h-full">
              {sitemapXml}
            </pre>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewXml(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
