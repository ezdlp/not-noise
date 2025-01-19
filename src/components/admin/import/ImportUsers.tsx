import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import Papa from "papaparse";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

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

export function ImportUsers({ onComplete }: ImportUsersProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [isDryRun, setIsDryRun] = useState(true);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState<ImportStats>({
    total: 0,
    success: 0,
    failed: 0,
    totalLinks: 0,
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
    
    // Check email
    const email = user[fieldMapping.email];
    if (!email) {
      errors.push(`Row ${rowIndex}: Email is required`);
    } else if (!validateEmail(email)) {
      errors.push(`Row ${rowIndex}: Invalid email format`);
    }
    
    // Check other required fields
    const requiredFields = [
      { key: "name", label: "Name" },
      { key: "artistName", label: "Artist Name" },
      { key: "country", label: "Country" },
    ];

    for (const field of requiredFields) {
      if (!user[fieldMapping[field.key as keyof FieldMapping]]) {
        errors.push(`Row ${rowIndex}: ${field.label} is required`);
      }
    }

    // Special handling for genre
    if (!user[fieldMapping.genre]) {
      warnings.push(`Row ${rowIndex}: Genre is missing, will use "Unknown"`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  };

  const processUsers = async (users: CSVUser[]): Promise<ImportStats> => {
    const stats: ImportStats = {
      total: users.length,
      success: 0,
      failed: 0,
      totalLinks: 0,
      errors: [],
      warnings: [],
    };

    for (const [index, user] of users.entries()) {
      try {
        const validation = validateUser(user, index + 1);
        
        // Add warnings to stats
        validation.warnings.forEach(warning => {
          stats.warnings.push({ row: index + 1, warning });
          console.log(warning);
        });

        if (!validation.isValid) {
          validation.errors.forEach(error => {
            stats.errors.push({ row: index + 1, error });
            console.log(error);
          });
          stats.failed++;
          continue; // Skip this row but continue processing
        }

        if (!isDryRun) {
          // Create auth user with random password
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email: user[fieldMapping.email],
            password: crypto.randomUUID(),
            options: {
              data: {
                name: user[fieldMapping.name],
                email_confirm: true,
              },
            },
          });

          if (authError) throw authError;

          if (authData.user) {
            // Set user profile data
            const { error: profileError } = await supabase
              .from("profiles")
              .update({
                name: user[fieldMapping.name],
                artist_name: user[fieldMapping.artistName],
                music_genre: user[fieldMapping.genre] || "Unknown",
                country: user[fieldMapping.country],
              })
              .eq("id", authData.user.id);

            if (profileError) throw profileError;

            // Set user role as "user" (Free User)
            const { error: roleError } = await supabase
              .from("user_roles")
              .insert({
                user_id: authData.user.id,
                role: "user",
              });

            if (roleError) throw roleError;

            // Track link count if provided
            const linkCount = parseInt(user[fieldMapping.links] || "0", 10);
            stats.totalLinks += linkCount;
          }
        }
        stats.success++;
      } catch (error) {
        console.error("Error importing user:", error);
        stats.failed++;
        stats.errors.push({
          row: index + 1,
          error: error instanceof Error ? error.message : "Unknown error occurred",
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
      Papa.parse(file, {
        header: true,
        preview: 1,
        skipEmptyLines: true,
        complete: (results) => {
          const headers = results.meta.fields || [];
          setCsvHeaders(headers);
          
          // Try to auto-map fields based on default mapping
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
      setStats({ total: 0, success: 0, failed: 0, totalLinks: 0, errors: [], warnings: [] });

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
            
            if (stats.failed > 0) {
              console.error("Import errors:", stats.errors);
              toast.error(`${stats.failed} users had validation errors`);
            }

            // Log summary
            console.log("\nImport Summary:");
            console.log(`Total rows processed: ${stats.total}`);
            console.log(`Successfully imported: ${stats.success}`);
            console.log(`Failed/Skipped: ${stats.failed}`);
            console.log(`Total links: ${stats.totalLinks}`);
            
            if (stats.warnings.length > 0) {
              console.log("\nWarnings:");
              stats.warnings.forEach(({ row, warning }) => console.log(warning));
            }
            
            if (stats.errors.length > 0) {
              console.log("\nErrors:");
              stats.errors.forEach(({ row, error }) => console.log(error));
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