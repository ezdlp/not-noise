
import React from 'react';
import { AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface BackfillLogsProps {
  logs: string[];
  error: string | null;
  isComplete: boolean;
}

export function BackfillLogs({ logs, error, isComplete }: BackfillLogsProps) {
  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {isComplete && !error && (
        <Alert>
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertTitle className="text-green-800">Success</AlertTitle>
          <AlertDescription className="text-green-700">
            Backfill process completed successfully!
          </AlertDescription>
        </Alert>
      )}
      
      <div className="border rounded-md">
        <div className="bg-muted p-2 rounded-t-md border-b">
          <h3 className="text-sm font-medium">Logs</h3>
        </div>
        <div className="p-2 h-48 overflow-y-auto font-mono text-xs bg-black text-white">
          {logs.length === 0 ? (
            <p className="text-gray-500 italic">Logs will appear here...</p>
          ) : (
            logs.map((log, i) => <div key={i}>{log}</div>)
          )}
        </div>
      </div>
    </div>
  );
}
