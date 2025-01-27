import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { UseFormReturn } from 'react-hook-form';
import { PostFormValues } from './PostEditor';

interface AutoSaveProps {
  form: UseFormReturn<PostFormValues>;
  onSave: (data: PostFormValues) => Promise<void>;
}

export function AutoSave({ form, onSave }: AutoSaveProps) {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (form.formState.isDirty) {
        try {
          const data = form.getValues();
          await onSave(data);
          setLastSaved(new Date());
          toast.success("Content auto-saved");
        } catch (error) {
          console.error('Auto-save failed:', error);
          toast.error("Failed to auto-save");
        }
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [form, onSave]);

  return lastSaved ? (
    <div className="text-sm text-muted-foreground">
      Last saved: {lastSaved.toLocaleTimeString()}
    </div>
  ) : null;
}