import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ImportUsersProps {
  onComplete?: () => void;
}

export function ImportUsers({ onComplete }: ImportUsersProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      const formData = new FormData();
      formData.append('file', file);

      const { data, error } = await supabase.functions.invoke('wordpress-import', {
        body: formData,
      });

      if (error) throw error;

      const { users } = data;
      
      if (users?.length > 0) {
        let successCount = 0;
        let errorCount = 0;
        const total = users.length;

        for (const [index, user] of users.entries()) {
          try {
            // Create auth user
            const { data: authData, error: authError } = await supabase.auth.signUp({
              email: user.email,
              password: crypto.randomUUID(), // Generate random password
              options: {
                data: {
                  name: `${user.first_name} ${user.last_name}`.trim() || user.display_name,
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
                  role: user.role || 'user'
                });

              if (roleError) throw roleError;
              successCount++;
            }
          } catch (error) {
            console.error("Error importing user:", error);
            errorCount++;
          }
          setProgress((index + 1) / total * 100);
        }

        if (successCount > 0) {
          toast.success(`Successfully imported ${successCount} users`);
          if (onComplete) onComplete();
        }
        if (errorCount > 0) {
          toast.error(`Failed to import ${errorCount} users`);
        }
      }
    } catch (error) {
      console.error("Error importing users:", error);
      toast.error("Failed to import users");
    } finally {
      setIsImporting(false);
      setProgress(0);
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          type="file"
          accept=".xml"
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
    </div>
  );
}