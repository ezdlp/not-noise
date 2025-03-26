import React from 'react';
import { cn } from "@/lib/utils";

interface SmartImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  width?: number;
  height?: number;
}

export function SmartImage({ 
  src, 
  alt, 
  className, 
  priority = false,
  width,
  height,
  ...props 
}: SmartImageProps) {
  // Check if the URL is external (starts with http/https)
  const isExternalUrl = /^https?:\/\//.test(src);
  
  // Simple image component that works in both development and production
  return (
    <img
      src={src}
      alt={alt}
      className={cn("", className)}
      width={width}
      height={height}
      loading={priority ? "eager" : "lazy"}
      onError={(e) => {
        console.error("Failed to load image:", src);
        const img = e.currentTarget;
        img.onerror = null; // Prevent infinite error loop
        img.src = "/placeholder.svg";
      }}
      {...props}
    />
  );
}
