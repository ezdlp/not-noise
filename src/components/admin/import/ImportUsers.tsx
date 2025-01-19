import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import Papa from "papaparse";

interface ImportUsersProps {
  onComplete?: () => void;
}

interface CSVUser {
  username?: string;
  email?: string;
  role?: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
}

interface ImportStats {
  total: number;
  success: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
}

export function ImportUsers({ onComplete }: ImportUsersProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState<ImportStats>({
    total: 0,
    success: 0,
    failed: 0,
    errors: [],
  });

  const validateUser = (user: CSVUser, rowIndex: number): string | null => {
    if (!user.email) {
      return `Row ${rowIndex}: Email is required`;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
      return `Row ${rowIndex}: Invalid email format`;
    }
    return null;
  };

  const processUsers = async (users: CSVUser[]): Promise<ImportStats> => {
    const stats: ImportStats = {
      total: users.length,
      success: 0,
      failed: 0,
      errors: [],
    };

    for (const [index, user] of users.entries()) {
      try {
        const validationError = validateUser(user, index + 1);
        if (validationError) {
          throw new Error(validationError);
        }

        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: user.email,
          password: crypto.randomUUID(), // Generate random password
          options: {
            data: {
              name: `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.display_name,
              email_confirm: true
            }
          }
        });

        if (authError) throw authError;

        if (authData.user) {
          // Set user role
          const { error: roleError } = await supabase
            .from('user_roles')
            .insert({
              user_id: authData.user.id,
              role: user.role?.toLowerCase() === 'administrator' ? 'admin' : 'user'
            });

          if (roleError) throw roleError;
          stats.success++;
        }
      } catch (error) {
        console.error("Error importing user:", error);
        stats.failed++;
        stats.errors.push({
          row: index + 1,
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        });
      }
      setProgress(((index + 1) / users.length) * 100);
    }

    return stats;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      setStats({ total: 0, success: 0, failed: 0, errors: [] });

      // Parse CSV file
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          try {
            const stats = await processUsers(results.data as CSVUser[]);
            setStats(stats);

            if (stats.success > 0) {
              toast.success(`Successfully imported ${stats.success} users`);
              if (onComplete) onComplete();
            }
            if (stats.failed > 0) {
              toast.error(`Failed to import ${stats.failed} users`);
              console.error("Import errors:", stats.errors);
            }
          } catch (error) {
            console.error("Error processing users:", error);
            toast.error("Failed to process users");
          } finally {
            setIsImporting(false);
            setProgress(0);
            event.target.value = '';
          }
        },
        error: (error) => {
          console.error("Error parsing CSV:", error);
          toast.error("Failed to parse CSV file");
          setIsImporting(false);
          event.target.value = '';
        }
      });
    } catch (error) {
      console.error("Error handling file upload:", error);
      toast.error("Failed to handle file upload");
      setIsImporting(false);
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          disabled={isImporting}
          className="max-w-[300px]"
        />
        <Button disabled={isImporting} variant="outline" size="icon">
          <Upload className="h-4 w-4" />
        </Button>
      </div>

      {isImporting && (
        <div className="space-y-2">
          <Progress value={progress} className="w-[300px]" />
          <p className="text-sm text-muted-foreground">
            Importing users... {Math.round(progress)}%
          </p>
        </div>
      )}

      {stats.errors.length > 0 && (
        <div className="mt-4 space-y-2">
          <h3 className="font-medium">Import Errors:</h3>
          <ul className="list-disc pl-5 space-y-1">
            {stats.errors.map((error, index) => (
              <li key={index} className="text-sm text-destructive">
                {error.error}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}