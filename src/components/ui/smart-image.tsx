
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
  const isDevEnvironment = process.env.NODE_ENV === 'development' || 
                           window.location.hostname.includes('lovable');
  
  // For external URLs, use a regular img tag with error handling
  if (isExternalUrl) {
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

  // For internal URLs, use direct path in development, OptimizedImage in production
  if (isDevEnvironment) {
    // In development environment, use direct image paths
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
  } else {
    // In production, use the OptimizedImage component
    return (
      <picture>
        <source
          type="image/webp"
          srcSet={`/_next/image?url=${encodeURIComponent(src)}&w=304&q=75 304w, /_next/image?url=${encodeURIComponent(src)}&w=760&q=75 760w`}
          sizes="(max-width: 768px) 304px, 760px"
        />
        <img
          src={`/_next/image?url=${encodeURIComponent(src)}&w=${width || 760}&q=75`}
          alt={alt}
          className={cn("", className)}
          loading={priority ? "eager" : "lazy"}
          width={width || 760}
          height={height}
          onError={(e) => {
            console.error("Failed to load image:", src);
            const img = e.currentTarget;
            img.onerror = null; // Prevent infinite error loop
            img.src = "/placeholder.svg";
          }}
          {...props}
        />
      </picture>
    );
  }
}
