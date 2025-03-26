import React from 'react';
import { cn } from "@/lib/utils";

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  width?: number;
  height?: number;
}

export function OptimizedImage({ 
  src, 
  alt, 
  className, 
  priority = false,
  width,
  height,
  ...props 
}: OptimizedImageProps) {
  // Simple implementation that doesn't depend on Next.js
  return (
    <img
      src={src}
      alt={alt}
      className={cn("", className)}
      loading={priority ? "eager" : "lazy"}
      width={width || 760}
      height={height}
      onError={(e) => {
        console.error(`Failed to load image: ${src}`);
        const img = e.currentTarget;
        img.onerror = null; // Prevent infinite error loop
        img.src = "/placeholder.svg";
      }}
      {...props}
    />
  );
}
