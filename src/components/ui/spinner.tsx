
import * as React from "react";
import { cn } from "@/lib/utils";

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: string;
}

export const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size = "4", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(`animate-spin rounded-full border-2 border-current border-t-transparent size-${size}`, className)}
        {...props}
      />
    );
  }
);

Spinner.displayName = "Spinner";
