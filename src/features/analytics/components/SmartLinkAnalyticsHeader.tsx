
import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SmartLinkAnalyticsHeaderProps {
  title: string;
}

export function SmartLinkAnalyticsHeader({ title }: SmartLinkAnalyticsHeaderProps) {
  const navigate = useNavigate();
  
  return (
    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-4 border-b border-neutral-border">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate("/dashboard")}
          className="hover:bg-neutral-seasalt transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold text-[#111827] font-poppins">{title} Analytics</h1>
      </div>
    </div>
  );
}
