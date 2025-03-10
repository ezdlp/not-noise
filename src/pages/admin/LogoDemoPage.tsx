
import React from "react";
import { SoundraiserLogo } from "@/components/ui/soundraiser-logo";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function LogoDemoPage() {
  const colors: ("primary" | "dark" | "light" | "white")[] = ["primary", "dark", "light", "white"];
  const sizes = [24, 40, 64, 96];

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-semibold mb-6">Soundraiser Logo Variants</h1>
      
      <h2 className="text-xl font-medium mb-4">Colors</h2>
      <Card className="p-6 mb-8">
        <div className="flex items-center gap-8 flex-wrap">
          {colors.map((color) => (
            <div key={color} className={`flex flex-col items-center ${color === "white" ? "bg-gray-800 p-4 rounded" : ""}`}>
              <SoundraiserLogo color={color} width={64} height={48} />
              <span className="mt-2 text-sm">{color}</span>
            </div>
          ))}
        </div>
      </Card>

      <h2 className="text-xl font-medium mb-4">Sizes</h2>
      <Card className="p-6 mb-8">
        <div className="flex items-end gap-8 flex-wrap">
          {sizes.map((size) => (
            <div key={size} className="flex flex-col items-center">
              <SoundraiserLogo width={size} height={Math.floor(size * 0.7)} />
              <span className="mt-2 text-sm">{size}px</span>
            </div>
          ))}
        </div>
      </Card>

      <h2 className="text-xl font-medium mb-4">Usage Examples</h2>
      <Card className="p-6 mb-8">
        <div className="space-y-8">
          <div className="flex items-center gap-2 bg-gray-900 text-white p-4 rounded">
            <SoundraiserLogo color="white" width={32} height={24} />
            <span className="text-lg font-semibold">Soundraiser on dark background</span>
          </div>
          
          <Separator />
          
          <div className="flex items-center gap-2 bg-primary/10 p-4 rounded">
            <SoundraiserLogo color="primary" width={32} height={24} />
            <span className="text-lg font-semibold">Soundraiser on light background</span>
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-center bg-white p-4 shadow rounded">
            <SoundraiserLogo color="primary" width={96} height={72} />
          </div>
        </div>
      </Card>
    </div>
  );
}
