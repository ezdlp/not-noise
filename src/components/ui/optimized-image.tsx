
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
  const sizes = [304, 760];
  const defaultWidth = 760;
  
  const generateSrcSet = () => {
    return sizes
      .map(size => `/_next/image?url=${encodeURIComponent(src)}&w=${size}&q=75 ${size}w`)
      .join(', ');
  };

  // If this is a priority image, add preload link
  React.useEffect(() => {
    if (priority) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = `/_next/image?url=${encodeURIComponent(src)}&w=${defaultWidth}&q=75`;
      link.type = 'image/webp';
      document.head.appendChild(link);
      return () => {
        document.head.removeChild(link);
      };
    }
  }, [src, priority]);

  return (
    <picture>
      <source
        type="image/webp"
        srcSet={generateSrcSet()}
        sizes="(max-width: 768px) 304px, 760px"
      />
      <img
        src={`/_next/image?url=${encodeURIComponent(src)}&w=${defaultWidth}&q=75`}
        alt={alt}
        className={cn("", className)}
        loading={priority ? "eager" : "lazy"}
        width={width || defaultWidth}
        height={height}
        onError={(e) => {
          console.error(`Failed to load image: ${src}`);
          const img = e.currentTarget;
          img.onerror = null; // Prevent infinite error loop
          img.src = "/placeholder.svg";
        }}
        {...props}
      />
    </picture>
  );
}
