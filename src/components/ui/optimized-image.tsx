
import React from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  objectFit?: "cover" | "contain";
}

export const OptimizedImage = ({
  src,
  alt,
  className,
  width,
  height,
  priority = false,
  objectFit = "cover",
  ...props
}: OptimizedImageProps) => {
  // Convert image URL to Vercel's Image Optimization URL
  const isAbsoluteUrl = src.startsWith('http') || src.startsWith('//');
  const imageUrl = isAbsoluteUrl ? src : `/_vercel/image?url=${encodeURIComponent(src)}&w=${width}&q=75`;
  
  return (
    <div 
      className={cn("relative overflow-hidden", className)} 
      style={{ 
        aspectRatio: width && height ? width / height : 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <img
        src={imageUrl}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        className={cn("w-full h-full", objectFit === "contain" ? "object-contain" : "object-cover")}
        {...props}
      />
    </div>
  );
};
