
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
  const sizes = [400, 600, 800, 1080];
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
      link.href = `/_next/image?url=${encodeURIComponent(src)}&w=1080&q=75`;
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
        sizes="(max-width: 640px) 400px, (max-width: 768px) 600px, (max-width: 1024px) 800px, 1080px"
      />
      <img
        src={`/_next/image?url=${encodeURIComponent(src)}&w=1080&q=75`}
        alt={alt}
        className={cn("", className)}
        loading={priority ? "eager" : "lazy"}
        width={width}
        height={height}
        {...props}
      />
    </picture>
  );
}
