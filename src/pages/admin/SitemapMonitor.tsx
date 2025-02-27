
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { RefreshCw, CheckCircle, AlertCircle, AlertTriangle, Clock } from "lucide-react";

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

export default function SitemapMonitor() {
  const [isRegenerating, setIsRegenerating] = useState(false);

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
      </div>

      {/* Health Overview */}
      <Card className="mb-6">
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

              <Button 
                onClick={regenerateSitemap}
                disabled={isRegenerating}
                className="w-full md:w-auto md:self-end"
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
            </div>
          ) : (
            <div className="text-center p-4 text-gray-500">
              Failed to load health data
            </div>
          )}
        </CardContent>
      </Card>

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
    </div>
  );
}
