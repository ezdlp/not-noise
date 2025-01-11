import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { ButtonProps } from "@/components/ui/button";

export interface CTAButtonProps extends ButtonProps {}

const CTAButton = React.forwardRef<HTMLButtonElement, CTAButtonProps>(
  ({ className, ...props }, ref) => {
    return (
      <Button
        className={cn(
          "px-6 py-3 h-auto text-lg font-medium bg-primary hover:bg-black text-white rounded-lg transition-colors duration-200",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
CTAButton.displayName = "CTAButton";

export { CTAButton };