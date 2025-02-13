
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ResetResult {
  email: string;
  success: boolean;
  error?: string;
}

interface ResetSummary {
  total: number;
  successful: number;
  failed: number;
}

export function SendPasswordResetEmails() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [summary, setSummary] = useState<ResetSummary | null>(null);
  const [results, setResults] = useState<ResetResult[]>([]);

  const sendResetEmails = async () => {
    try {
      setIsProcessing(true);
      setSummary(null);
      setResults([]);

      const { data, error } = await supabase.functions.invoke('send-password-reset');

      if (error) throw error;

      setSummary(data.summary);
      setResults(data.results);

      toast.success(`Successfully sent ${data.summary.successful} password reset emails`);
      if (data.summary.failed > 0) {
        toast.error(`Failed to send ${data.summary.failed} emails`);
      }
    } catch (error) {
      console.error('Error sending password reset emails:', error);
      toast.error('Failed to send password reset emails');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Send Password Reset Emails</h3>
          <p className="text-sm text-muted-foreground">
            Send password reset emails to all users in the system
          </p>
        </div>
        <Button 
          onClick={sendResetEmails} 
          disabled={isProcessing}
        >
          {isProcessing ? 'Processing...' : 'Send Reset Emails'}
        </Button>
      </div>

      {isProcessing && (
        <div className="space-y-2">
          <Progress value={undefined} className="w-full" />
          <p className="text-sm text-muted-foreground">
            Sending password reset emails...
          </p>
        </div>
      )}

      {summary && (
        <div className="rounded-lg border p-4 space-y-4">
          <h4 className="font-medium">Summary</h4>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium">Total</p>
              <p className="text-2xl">{summary.total}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-green-600">Successful</p>
              <p className="text-2xl text-green-600">{summary.successful}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-red-600">Failed</p>
              <p className="text-2xl text-red-600">{summary.failed}</p>
            </div>
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div className="rounded-lg border">
          <div className="border-b px-4 py-2">
            <h4 className="font-medium">Detailed Results</h4>
          </div>
          <div className="divide-y max-h-96 overflow-auto">
            {results.map((result, index) => (
              <div 
                key={index} 
                className="px-4 py-2 flex items-center justify-between"
              >
                <span className="text-sm">{result.email}</span>
                {result.success ? (
                  <span className="text-sm text-green-600">Success</span>
                ) : (
                  <span className="text-sm text-red-600">{result.error}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
