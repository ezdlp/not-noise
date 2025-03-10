
import React from "react";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";

type AuthLayoutProps = {
  children: React.ReactNode;
};

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full py-12 flex items-center justify-center bg-neutral-seasalt">
      <div className="container max-w-md mx-auto space-y-6 px-4">
        <div className="flex justify-center mb-4">
          <Link to="/">
            <img
              src="/lovable-uploads/soundraiser-logo/Logo E.svg"
              alt="Soundraiser"
              className="h-8"
            />
          </Link>
        </div>
        <Card className="p-6 bg-white shadow-sm border-[#E6E6E6]">
          {children}
        </Card>
      </div>
    </div>
  );
}
