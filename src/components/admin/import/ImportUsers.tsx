
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import Papa from "papaparse";
import { useQueryClient } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AuthError, User } from "@supabase/supabase-js";

interface ImportUsersProps {
  onComplete?: () => void;
}

interface CSVUser {
  [key: string]: string;
}

interface ImportStats {
  total: number;
  success: number;
  failed: number;
  totalLinks: number;
  retried: number;
  errors: Array<{ row: number; error: string }>;
  warnings: Array<{ row: number; warning: string }>;
}

interface FieldMapping {
  email: string;
  name: string;
  artistName: string;
  genre: string;
  country: string;
  links: string;
}

const REQUIRED_FIELDS = {
  email: "E-mail",
  name: "Name",
  artistName: "Artist Name",
  genre: "Genre",
  country: "Country",
  links: "Nr of Links",
};

const DEFAULT_FIELD_MAPPING = {
  email: "user_email",
  name: "first_name",
  artistName: "nickname",
  genre: "music_genre",
  country: "country",
  links: "custom_links_count",
};

const BATCH_SIZE = 10;
const MAX_RETRIES = 3;
const INITIAL_RATE_LIMIT_DELAY = 2000;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function ImportUsers({ onComplete }: ImportUsersProps) {
  const queryClient = useQueryClient();
  const [isImporting, setIsImporting] = useState(false);
  const [isDryRun, setIsDryRun] = useState(true);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState<ImportStats>({
    total: 0,
    success: 0,
    failed: 0,
    totalLinks: 0,
    retried: 0,
    errors: [],
    warnings: [],
  });
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [fieldMapping, setFieldMapping] = useState<FieldMapping>({
    email: DEFAULT_FIELD_MAPPING.email,
    name: DEFAULT_FIELD_MAPPING.name,
    artistName: DEFAULT_FIELD_MAPPING.artistName,
    genre: DEFAULT_FIELD_MAPPING.genre,
    country: DEFAULT_FIELD_MAPPING.country,
    links: DEFAULT_FIELD_MAPPING.links,
  });

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validateUser = (user: CSVUser, rowIndex: number): { isValid: boolean; errors: string[]; warnings: string[] } => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    const email = user[fieldMapping.email];
    if (!email) {
      errors.push(`Row ${rowIndex}: Email is required (column: ${fieldMapping.email})`);
    } else if (!validateEmail(email)) {
      errors.push(`Row ${rowIndex}: Invalid email format (${email})`);
    }

    if (!user[fieldMapping.name]?.trim()) {
      warnings.push(`Row ${rowIndex}: Name is empty (column: ${fieldMapping.name}), will use "-"`);
    }
    if (!user[fieldMapping.artistName]?.trim()) {
      warnings.push(`Row ${rowIndex}: Artist Name is empty (column: ${fieldMapping.artistName}), will use "-"`);
    }
    if (!user[fieldMapping.country]?.trim()) {
      warnings.push(`Row ${rowIndex}: Country is empty (column: ${fieldMapping.country}), will use "-"`);
    }
    if (!user[fieldMapping.genre]?.trim()) {
      warnings.push(`Row ${rowIndex}: Genre is empty (column: ${fieldMapping.genre}), will use "Unknown"`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  };

  const processUserWithRetry = async (
    user: CSVUser,
    index: number,
    stats: ImportStats,
    processedEmails: Set<string>
  ): Promise<boolean> => {
    const email = user[fieldMapping.email];
    let retries = MAX_RETRIES;
    let currentDelay = INITIAL_RATE_LIMIT_DELAY;

    if (processedEmails.has(email)) {
      stats.warnings.push({
        row: index + 1,
        warning: `Duplicate email ${email}, skipping`,
      });
      return false;
    }

    // Check if user already exists using admin API
    const { data: existingUsers, error: existingUserError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 50
    });

    if (existingUserError) {
      console.error("Error checking existing user:", existingUserError);
      stats.errors.push({
        row: index + 1,
        error: `Error checking existing user: ${existingUserError.message}`,
      });
      return false;
    }

    // Filter users after fetching
    if (existingUsers?.users && existingUsers.users.some((u: User) => u.email === email)) {
      stats.warnings.push({
        row: index + 1,
        warning: `User with email ${email} already exists, skipping`,
      });
      return false;
    }

    while (retries > 0) {
      try {
        if (!isDryRun) {
          const userData = {
            email: email,
            password: crypto.randomUUID(),
            email_confirm: true,
            user_metadata: {
              name: user[fieldMapping.name]?.trim() || "-",
              artist_name: user[fieldMapping.artistName]?.trim() || "-",
              music_genre: user[fieldMapping.genre]?.trim() || "Unknown",
              country: user[fieldMapping.country]?.trim() || "-",
            },
          };

          console.log(`Creating user: ${email}`);
          const { data: authData, error: authError } = await supabase.auth.admin.createUser(userData);

          if (authError) {
            if (authError.status === 429) {
              console.warn(`Rate limit reached for ${email}. Retrying in ${currentDelay}ms... (${retries} retries left)`);
              stats.retried++;
              await delay(currentDelay);
              currentDelay = Math.min(currentDelay * 2, 5000);
              retries--;
              continue;
            }

            throw authError;
          }

          if (authData.user) {
            console.log(`Successfully created user: ${email}`);
            const { error: roleError } = await supabase
              .from("user_roles")
              .insert({
                user_id: authData.user.id,
                role: "user",
              });

            if (roleError) throw roleError;

            queryClient.invalidateQueries({ queryKey: ["adminUsers"] });

            const linkCount = parseInt(user[fieldMapping.links] || "0", 10);
            stats.totalLinks += linkCount;
          }
        }
        
        processedEmails.add(email);
        return true;
      } catch (error) {
        if (retries === 1 || !(error instanceof AuthError) || error.status !== 429) {
          console.error(`Error importing user ${email}:`, error);
          stats.errors.push({
            row: index + 1,
            error: error instanceof Error ? error.message : "Unknown error occurred",
          });
          return false;
        }
        retries--;
        await delay(currentDelay);
        currentDelay = Math.min(currentDelay * 2, 5000);
        stats.retried++;
      }
    }
    return false;
  };

  const processBatch = async (
    batch: CSVUser[],
    startIndex: number,
    stats: ImportStats,
    processedEmails: Set<string>
  ) => {
    const promises = batch.map((user, index) =>
      processUserWithRetry(user, startIndex + index, stats, processedEmails)
    );

    const results = await Promise.all(promises);
    
    results.forEach((success) => {
      if (success) {
        stats.success++;
      } else {
        stats.failed++;
      }
    });

    setProgress(((startIndex + batch.length) / stats.total) * 100);
  };

  const processUsers = async (users: CSVUser[]): Promise<ImportStats> => {
    const stats: ImportStats = {
      total: users.length,
      success: 0,
      failed: 0,
      totalLinks: 0,
      retried: 0,
      errors: [],
      warnings: [],
    };

    const processedEmails = new Set<string>();

    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      const batch = users.slice(i, i + BATCH_SIZE);
      await processBatch(batch, i, stats, processedEmails);
      
      if (!isDryRun) {
        queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      }
    }

    return stats;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      Papa.parse(file, {
        header: true,
        preview: 1,
        skipEmptyLines: true,
        complete: (results) => {
          const headers = results.meta.fields || [];
          setCsvHeaders(headers);
          
          const mapping: Partial<FieldMapping> = {};
          headers.forEach(header => {
            const headerLower = header.toLowerCase();
            Object.entries(DEFAULT_FIELD_MAPPING).forEach(([key, value]) => {
              if (headerLower === value.toLowerCase()) {
                mapping[key as keyof FieldMapping] = header;
              }
            });
          });
          
          setFieldMapping(prev => ({ ...prev, ...mapping }));
        },
      });
    } catch (error) {
      console.error("Error reading CSV headers:", error);
      toast.error("Failed to read CSV file");
      event.target.value = '';
      return;
    }
  };

  const handleImport = async (file: File) => {
    try {
      setIsImporting(true);
      setStats({ total: 0, success: 0, failed: 0, totalLinks: 0, retried: 0, errors: [], warnings: [] });

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          try {
            const stats = await processUsers(results.data as CSVUser[]);
            setStats(stats);

            if (!isDryRun) {
              if (stats.success > 0) {
                toast.success(
                  `Successfully imported ${stats.success} users with ${stats.totalLinks} total links`
                );
                if (onComplete) onComplete();
              }
            } else {
              toast.success(
                `Dry run completed. ${stats.success} users valid for import, ${stats.failed} with errors`
              );
            }

            console.log("\nImport Summary:");
            console.log(`Total rows processed: ${stats.total}`);
            console.log(`Successfully imported: ${stats.success}`);
            console.log(`Failed/Skipped: ${stats.failed}`);
            console.log(`Total links: ${stats.totalLinks}`);
            
            if (stats.warnings.length > 0) {
              console.log("\nWarnings:");
              stats.warnings.forEach(({ warning }) => console.log(warning));
            }
            
            if (stats.errors.length > 0) {
              console.log("\nErrors:");
              stats.errors.forEach(({ error }) => console.log(error));
              toast.error(`${stats.failed} users had validation errors`);
            }
          } catch (error) {
            console.error("Error processing users:", error);
            toast.error("Failed to process users");
          } finally {
            setIsImporting(false);
            setProgress(0);
          }
        },
        error: (error) => {
          console.error("Error parsing CSV:", error);
          toast.error("Failed to parse CSV file");
          setIsImporting(false);
        },
      });
    } catch (error) {
      console.error("Error handling file upload:", error);
      toast.error("Failed to handle file upload");
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="dry-run"
            checked={isDryRun}
            onCheckedChange={setIsDryRun}
          />
          <Label htmlFor="dry-run">
            Dry run (validate without importing)
          </Label>
        </div>

        <div className="flex items-center gap-2">
          <Input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            disabled={isImporting}
            className="max-w-[300px]"
          />
          <Button 
            disabled={isImporting || !csvHeaders.length} 
            variant="outline" 
            size="icon"
            onClick={() => {
              const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
              if (fileInput.files?.[0]) {
                handleImport(fileInput.files[0]);
              }
            }}
          >
            <Upload className="h-4 w-4" />
          </Button>
        </div>

        {csvHeaders.length > 0 && (
          <div className="space-y-4 border p-4 rounded-md">
            <h3 className="font-medium">Map CSV Fields</h3>
            <div className="grid gap-4">
              {Object.entries(REQUIRED_FIELDS).map(([key, label]) => (
                <div key={key} className="grid grid-cols-2 gap-2 items-center">
                  <Label>{label}</Label>
                  <Select
                    value={fieldMapping[key as keyof FieldMapping]}
                    onValueChange={(value) =>
                      setFieldMapping((prev) => ({
                        ...prev,
                        [key]: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select field" />
                    </SelectTrigger>
                    <SelectContent>
                      {csvHeaders.map((header) => (
                        <SelectItem key={header} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {isImporting && (
        <div className="space-y-2">
          <Progress value={progress} className="w-[300px]" />
          <p className="text-sm text-muted-foreground">
            {isDryRun ? "Validating" : "Importing"} users... {Math.round(progress)}%
            {stats.retried > 0 && ` (${stats.retried} retries due to rate limits)`}
          </p>
        </div>
      )}

      {(stats.errors.length > 0 || stats.warnings.length > 0) && (
        <div className="mt-4 space-y-4">
          {stats.warnings.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium">Import Warnings:</h3>
              <ul className="list-disc pl-5 space-y-1">
                {stats.warnings.map((warning, index) => (
                  <li key={index} className="text-sm text-yellow-600">
                    {warning.warning}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {stats.errors.length > 0 && (
            <div className="space-y-2">
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
      )}
    </div>
  );
}
