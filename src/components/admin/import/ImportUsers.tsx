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
  email: "Email",
  name: "Name",
  artistName: "Artist Name",
  genre: "Genre",
  country: "Country",
  links: "Nr of Links",
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
  });
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [fieldMapping, setFieldMapping] = useState<FieldMapping>({
    email: "",
    name: "",
    artistName: "",
    genre: "",
    country: "",
    links: "",
  });

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validateUser = (user: CSVUser, rowIndex: number): string | null => {
    const email = user[fieldMapping.email];
    if (!email) {
      return `Row ${rowIndex}: Email is required`;
    }
    if (!validateEmail(email)) {
      return `Row ${rowIndex}: Invalid email format`;
    }
    
    const requiredFields = [
      { key: "name", label: "Name" },
      { key: "artistName", label: "Artist Name" },
      { key: "genre", label: "Genre" },
      { key: "country", label: "Country" },
    ];

    for (const field of requiredFields) {
      if (!user[fieldMapping[field.key as keyof FieldMapping]]) {
        return `Row ${rowIndex}: ${field.label} is required`;
      }
    }

    return null;
  };

  const processUsers = async (users: CSVUser[]): Promise<ImportStats> => {
    const stats: ImportStats = {
      total: users.length,
      success: 0,
      failed: 0,
      totalLinks: 0,
      errors: [],
    };

    for (const [index, user] of users.entries()) {
      try {
        const validationError = validateUser(user, index + 1);
        if (validationError) {
          throw new Error(validationError);
        }

        if (!isDryRun) {
          // Create auth user
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
                music_genre: user[fieldMapping.genre],
                country: user[fieldMapping.country],
              })
              .eq("id", authData.user.id);

            if (profileError) throw profileError;

            // Set user role
            const { error: roleError } = await supabase
              .from("user_roles")
              .insert({
                user_id: authData.user.id,
                role: "user",
              });

            if (roleError) throw roleError;

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
      // First pass: get headers and set up field mapping
      Papa.parse(file, {
        header: true,
        preview: 1,
        skipEmptyLines: true,
        complete: (results) => {
          const headers = results.meta.fields || [];
          setCsvHeaders(headers);
          
          // Try to auto-map fields based on common patterns
          const mapping: Partial<FieldMapping> = {};
          headers.forEach(header => {
            const headerLower = header.toLowerCase();
            if (headerLower.includes('email')) mapping.email = header;
            if (headerLower.includes('name') && !headerLower.includes('artist')) mapping.name = header;
            if (headerLower.includes('artist')) mapping.artistName = header;
            if (headerLower.includes('genre')) mapping.genre = header;
            if (headerLower.includes('country')) mapping.country = header;
            if (headerLower.includes('links')) mapping.links = header;
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
      setStats({ total: 0, success: 0, failed: 0, totalLinks: 0, errors: [] });

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