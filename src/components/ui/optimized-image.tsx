
import React from 'react';
import { cn } from "@/lib/utils";

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}

export function OptimizedImage({ 
  src, 
  alt, 
  className, 
  priority = false,
  ...props 
}: OptimizedImageProps) {
  return (
    <picture>
      <source
        type="image/webp"
        srcSet={`/_next/image?url=${encodeURIComponent(src)}&w=1080&q=80`}
      />
      <img
        src={src}
        alt={alt}
        className={cn("", className)}
        loading={priority ? "eager" : "lazy"}
        {...props}
      />
    </picture>
  );
}
