
import { Check, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface PasswordRequirementsProps {
  passwordRequirements: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
  };
  passwordStrength: number;
}

export function PasswordRequirements({ 
  passwordRequirements, 
  passwordStrength 
}: PasswordRequirementsProps) {
  return (
    <div className="space-y-2">
      <Progress 
        value={passwordStrength} 
        className="h-1" 
        style={{
          backgroundColor: '#ECE9FF',
          '--progress-background': '#6851FB'
        } as React.CSSProperties} 
      />
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        {[
          { key: 'minLength', label: 'At least 8 characters' },
          { key: 'hasUppercase', label: 'One uppercase letter' },
          { key: 'hasLowercase', label: 'One lowercase letter' },
          { key: 'hasNumber', label: 'One number' },
        ].map(({ key, label }) => (
          <div
            key={key}
            className={`flex items-center gap-2 ${
              passwordRequirements[key as keyof typeof passwordRequirements]
                ? "text-primary"
                : "text-muted-foreground"
            }`}
          >
            {passwordRequirements[key as keyof typeof passwordRequirements] ? (
              <Check className="h-4 w-4" />
            ) : (
              <X className="h-4 w-4" />
            )}
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
