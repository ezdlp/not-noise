
import React from "react";

interface AnalyticsLayoutProps {
  children: React.ReactNode;
}

export function AnalyticsLayout({ children }: AnalyticsLayoutProps) {
  return (
    <div className="container mx-auto py-6 px-4 space-y-6 animate-fade-in bg-[#FAFAFA] min-h-screen">
      {children}
    </div>
  );
}
