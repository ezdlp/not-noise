
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

export default function AnalyticsLogs() {
  const navigate = useNavigate();
  const [limit, setLimit] = useState<number>(100);

  const { data: logs, isLoading, refetch } = useQuery({
    queryKey: ["analytics-logs", limit],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_analytics_function_logs", {
        p_limit: limit
      });

      if (error) throw error;
      return data;
    },
  });

  const formatDate = (date: string) => {
    return format(new Date(date), "MMM d, yyyy HH:mm:ss");
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getBadgeColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-emerald-100 text-emerald-800 hover:bg-emerald-200";
      case "fallback":
        return "bg-amber-100 text-amber-800 hover:bg-amber-200";
      case "error":
        return "bg-red-100 text-red-800 hover:bg-red-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate("/control-room/analytics")}
        >
          <ArrowLeftIcon className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Analytics Function Logs</h1>
        <div className="flex-1"></div>
        <Button
          variant="outline"
          onClick={() => refetch()}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Card className="p-6">
        {isLoading ? (
          <div className="py-8 text-center">Loading logs...</div>
        ) : logs && logs.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Function</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log: any) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="font-medium">{formatDate(log.start_time)}</div>
                      {log.end_time && (
                        <div className="text-sm text-muted-foreground">
                          To: {formatDate(log.end_time)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{log.function_name}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-xs">
                        {JSON.stringify(log.parameters)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getBadgeColor(log.status)}>
                        {log.status || "pending"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {log.duration_ms ? formatDuration(log.duration_ms) : "-"}
                    </TableCell>
                    <TableCell>
                      {log.details && (
                        <Accordion type="single" collapsible className="w-full">
                          <AccordionItem value="details">
                            <AccordionTrigger className="text-sm">
                              View Details
                            </AccordionTrigger>
                            <AccordionContent>
                              <pre className="bg-slate-50 p-4 rounded text-xs overflow-auto max-h-96">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="py-8 text-center">No logs found</div>
        )}
      </Card>

      <div className="flex justify-center gap-4">
        <Button
          variant="outline"
          onClick={() => setLimit(Math.min(limit + 100, 1000))}
          disabled={logs && logs.length < limit}
        >
          Load More
        </Button>
      </div>
    </div>
  );
}
